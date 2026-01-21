import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameIntelSchema, insertOfferSchema } from "@shared/schema";
import { runAllianceHunter, getLatestAllianceStats } from "./alliance-hunter";
import { scoutEngine } from "./scout-engine";
import * as fs from "fs";
import * as path from "path";

const defaultAllianceStats: Record<string, { hours: number; cliff: string; ev: number; risk: string }> = {
  "coin master": { hours: 45, cliff: "Level 12", ev: 0.88, risk: "med" },
  "dice dreams": { hours: 22, cliff: "Level 17", ev: 1.12, risk: "low" },
  "royal match": { hours: 38, cliff: "Level 50", ev: 0.65, risk: "high" },
  "board kings": { hours: 30, cliff: "Level 15", ev: 0.95, risk: "med" },
  "monopoly go": { hours: 55, cliff: "Level 30", ev: 0.72, risk: "high" },
  "township": { hours: 60, cliff: "Level 25", ev: 0.55, risk: "high" },
  "state of survival": { hours: 80, cliff: "Day 20", ev: 0.42, risk: "high" },
  "rise of kingdoms": { hours: 90, cliff: "CH 15", ev: 0.38, risk: "high" },
  "evony": { hours: 70, cliff: "Keep 15", ev: 0.48, risk: "high" },
  "raid shadow legends": { hours: 50, cliff: "Day 30", ev: 0.62, risk: "med" },
  "merge dragons": { hours: 25, cliff: "Level 10", ev: 1.25, risk: "low" },
  "wordscapes": { hours: 15, cliff: "Level 500", ev: 1.80, risk: "low" },
  "solitaire grand harvest": { hours: 20, cliff: "Level 100", ev: 1.45, risk: "low" },
  "bingo blitz": { hours: 18, cliff: "Level 50", ev: 1.55, risk: "low" },
  "pop slots": { hours: 12, cliff: "Level 35", ev: 2.10, risk: "low" },
  "myvegas slots": { hours: 14, cliff: "Level 40", ev: 1.92, risk: "low" }
};

let allianceStats = { ...defaultAllianceStats };

const possiblePaths = [
  path.join(process.cwd(), "server", "data", "alliance_stats.json"),
  path.join(process.cwd(), "data", "alliance_stats.json"),
  path.join(process.cwd(), "alliance_stats.json"),
];

for (const allianceStatsPath of possiblePaths) {
  try {
    if (fs.existsSync(allianceStatsPath)) {
      const loaded = JSON.parse(fs.readFileSync(allianceStatsPath, "utf-8"));
      allianceStats = { ...defaultAllianceStats, ...loaded };
      console.log(`[Alliance Stats] Loaded ${Object.keys(allianceStats).length} games from ${allianceStatsPath}`);
      break;
    }
  } catch (err) {
    console.error("[Alliance Stats] Failed to load from", allianceStatsPath, err);
  }
}
console.log(`[Alliance Stats] Using ${Object.keys(allianceStats).length} games total`);

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

  // Get alliance stats playbook
  app.get("/api/alliance-stats", (_req, res) => {
    res.json(allianceStats);
  });

  // Search game intel by name (with alliance stats fallback)
  app.get("/api/game-intel/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({ error: "Search query required" });
        return;
      }
      
      const cleanQuery = query.toLowerCase().trim();
      
      const allIntel = await storage.getAllGameIntel();
      const matches = allIntel.filter(intel => 
        intel.gameName.toLowerCase().includes(cleanQuery) ||
        intel.packageName.toLowerCase().includes(cleanQuery)
      );
      
      if (matches.length > 0) {
        res.json(matches);
        return;
      }
      
      const allianceMatch = Object.entries(allianceStats).find(([name]) => 
        name.includes(cleanQuery) || cleanQuery.includes(name)
      );
      
      if (allianceMatch) {
        const [name, stats] = allianceMatch;
        res.json([{
          id: 0,
          packageName: name.replace(/\s+/g, '.'),
          gameName: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          avgCompletionHours: stats.hours,
          completionRate: stats.ev > 2 ? 70 : stats.ev > 1 ? 50 : 30,
          sandTraps: JSON.stringify([stats.cliff]),
          risk: stats.risk,
          ev: stats.ev,
          source: "alliance_playbook"
        }]);
        return;
      }
      
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to search game intel" });
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

  // ============ ALLIANCE HUNTER ENDPOINTS ============
  app.post("/api/alliance-hunter/run", async (req, res) => {
    try {
      console.log("[API] Alliance Hunter triggered");
      const result = await runAllianceHunter();
      res.json({
        success: result.success,
        message: `Alliance Hunter completed. Found ${result.count} verified offers.`,
        count: result.count
      });
    } catch (error: any) {
      console.error("[API] Alliance Hunter error:", error);
      res.status(500).json({ error: "Alliance Hunter failed", details: error.message });
    }
  });

  app.get("/api/alliance-hunter/stats", async (req, res) => {
    try {
      const stats = await getLatestAllianceStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch alliance stats" });
    }
  });

  // ============ CODE DOWNLOAD ENDPOINTS ============
  const projectRoot = process.cwd();
  const codeFiles: Record<string, string> = {
    "floating-caddie": path.join(projectRoot, "client", "src", "components", "floating-caddie.tsx"),
    "index-css": path.join(projectRoot, "client", "src", "index.css"),
    "routes": path.join(projectRoot, "server", "routes.ts"),
    "alliance-stats": path.join(projectRoot, "server", "data", "alliance_stats.json"),
    "manifest": path.join(projectRoot, "client", "public", "manifest.json"),
    "caddy-core": path.join(projectRoot, "client", "public", "caddy-core.js"),
    "readme": path.join(projectRoot, "freedmind-caddy-package", "README.md"),
  };

  app.get("/api/code/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = codeFiles[filename];
    
    if (!filePath) {
      res.status(404).send("File not found");
      return;
    }
    
    try {
      if (!fs.existsSync(filePath)) {
        res.status(404).send("File not available in this environment");
        return;
      }
      const content = fs.readFileSync(filePath, "utf-8");
      res.type("text/plain").send(content);
    } catch (err) {
      res.status(500).send("Error reading file");
    }
  });

  // ============ SCOUT ENGINE - TRIPLE PILLAR ============
  app.get("/api/scout/:gameName", async (req, res) => {
    try {
      const gameName = req.params.gameName;
      const result = await scoutEngine.triangulate(gameName);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Scout engine failed", message: error.message });
    }
  });

  return httpServer;
}
