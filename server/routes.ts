import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameIntelSchema, insertOfferSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed default data on startup
  await storage.seedDefaultGames();
  await storage.seedDefaultOffers();

  // ============ GRIND AVERAGES ============
  const grindAverages: Record<string, Record<string, number>> = {
    "Coin Master": { spins: 3.0 },
    "Dice Dreams": { rolls: 2.2 },
  };

  // ============ ANALYZE OFFER ENDPOINT ============
  app.post("/api/analyze-offer", (req, res) => {
    const { game, offer, session } = req.body;

    if (!grindAverages[game] || !grindAverages[game][offer.resourceType]) {
      res.status(400).json({ error: "Unsupported game or resource" });
      return;
    }

    const grindAverage = grindAverages[game][offer.resourceType];
    const totalAmount = offer.baseAmount + (offer.bonusAmount || 0);
    const costPerResource = offer.priceCents / totalAmount;
    const markupPercent = ((costPerResource - grindAverage) / grindAverage) * 100;
    const isHazard = markupPercent > 20;

    const analysis = {
      costPerUnit: parseFloat(costPerResource.toFixed(2)),
      grindAverageCost: grindAverage,
      markupPercent: parseFloat(markupPercent.toFixed(1)),
      isHazard,
      classification: isHazard ? "HAZARD" : "CLEAR"
    };

    const strategy = isHazard
      ? {
          decision: "REJECT",
          reason: `${analysis.markupPercent}% markup vs grind`,
          action: "Execute free resource loop",
          exitCondition: `Reassess after phase: ${session.phase}`
        }
      : {
          decision: "OPTIONAL",
          reason: "Within acceptable grind range",
          action: "Purchase only if time-constrained",
          exitCondition: "Stop on velocity drop"
        };

    res.json({ analysis, strategy });
  });

  // ============ TOP OFFERS ENDPOINT ============
  app.get("/api/top-offers", async (_req, res) => {
    try {
      const dbOffers = await storage.getTopOffers(3);
      
      const topOffers = dbOffers.map(offer => ({
        id: offer.id,
        name: offer.name,
        juice: offer.juice / 100,
        avgTimeDays: offer.avgTimeDays,
        completionRate: offer.completionRate,
        hazard: offer.hazard,
        freeAlt: offer.freeAlt,
        TPSMarkup: offer.tpsMarkup,
        investmentWorth: offer.investmentWorth,
        yieldPath: JSON.parse(offer.yieldPath || "[]"),
        isRipCord: offer.isRipCord,
        ripCordMessage: offer.ripCordMessage,
        strategy: offer.strategy
      }));
      
      res.json(topOffers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top offers" });
    }
  });

  // POST new offer
  app.post("/api/offers", async (req, res) => {
    try {
      const parsed = insertOfferSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors });
        return;
      }

      const offer = await storage.createOffer(parsed.data);
      res.status(201).json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  // ============ PUBLIC API ENDPOINTS ============
  // These endpoints are designed for external consumption
  
  // GET /api/public/game-intel - List all sanctioned games (public)
  app.get("/api/public/game-intel", async (_req, res) => {
    try {
      const games = await storage.getAllGameIntel();
      const publicGames = games.map(game => ({
        packageName: game.packageName,
        gameName: game.gameName,
        isSanctioned: game.isSanctioned,
        paceOfPlay: game.paceOfPlay,
        realityCheck: game.realityCheck,
        phases: JSON.parse(game.phases || "[]"),
      }));
      res.json(publicGames);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game intel" });
    }
  });

  // GET /api/public/game-intel/:packageName - Get specific game intel (public)
  app.get("/api/public/game-intel/:packageName", async (req, res) => {
    try {
      const { packageName } = req.params;
      const intel = await storage.getGameIntelByPackage(decodeURIComponent(packageName));
      
      if (intel) {
        res.json({
          packageName: intel.packageName,
          gameName: intel.gameName,
          isSanctioned: intel.isSanctioned,
          paceOfPlay: intel.paceOfPlay,
          realityCheck: intel.realityCheck,
          sandTraps: JSON.parse(intel.sandTraps || "[]"),
          suggestedClubs: JSON.parse(intel.suggestedClubs || "[]"),
          offers: JSON.parse(intel.offers || "[]"),
          phases: JSON.parse(intel.phases || "[]"),
        });
      } else {
        res.status(404).json({
          error: "Game not found",
          packageName,
          recommendation: "NO PLAY - Not in alliance vault"
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game intel" });
    }
  });

  // ============ INTERNAL API ENDPOINTS ============
  
  // Get all game intel records
  app.get("/api/game-intel", async (_req, res) => {
    try {
      const games = await storage.getAllGameIntel();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game intel" });
    }
  });

  // Get game intel by package name (the core lookup for Detection Service)
  app.get("/api/game-intel/:packageName", async (req, res) => {
    try {
      const { packageName } = req.params;
      const intel = await storage.getGameIntelByPackage(decodeURIComponent(packageName));
      
      if (intel) {
        res.json(intel);
      } else {
        // LOGIC ENGINE LOCKDOWN: Deterministic response for unknown packages
        // Do NOT guess or infer game quality - return strict "No Play" response
        res.json({
          id: 0,
          packageName,
          gameName: "Unknown",
          isSanctioned: false,
          paceOfPlay: "N/A",
          realityCheck: "ALLIANCE STATS: No Play Recommended",
          sandTraps: "[]",
          suggestedClubs: "[]",
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game intel" });
    }
  });

  // Create new game intel entry
  app.post("/api/game-intel", async (req, res) => {
    try {
      const parsed = insertGameIntelSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors });
        return;
      }

      const intel = await storage.createGameIntel(parsed.data);
      res.status(201).json(intel);
    } catch (error: any) {
      if (error?.code === "23505") {
        res.status(409).json({ error: "Package name already exists" });
      } else {
        res.status(500).json({ error: "Failed to create game intel" });
      }
    }
  });

  // Update game intel
  app.patch("/api/game-intel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }

      const intel = await storage.updateGameIntel(id, req.body);
      if (intel) {
        res.json(intel);
      } else {
        res.status(404).json({ error: "Game intel not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update game intel" });
    }
  });

  // Delete game intel
  app.delete("/api/game-intel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }

      const deleted = await storage.deleteGameIntel(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Game intel not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete game intel" });
    }
  });

  return httpServer;
}
