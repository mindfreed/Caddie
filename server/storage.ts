import { users, gameIntel, offers, type User, type InsertUser, type GameIntel, type InsertGameIntel, type CaddieOffer, type InsertOffer } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllGameIntel(): Promise<GameIntel[]>;
  getGameIntelByPackage(packageName: string): Promise<GameIntel | undefined>;
  createGameIntel(intel: InsertGameIntel): Promise<GameIntel>;
  updateGameIntel(id: number, intel: Partial<InsertGameIntel>): Promise<GameIntel | undefined>;
  deleteGameIntel(id: number): Promise<boolean>;
  seedDefaultGames(): Promise<void>;
  
  getTopOffers(limit?: number): Promise<CaddieOffer[]>;
  createOffer(offer: InsertOffer): Promise<CaddieOffer>;
  seedDefaultOffers(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllGameIntel(): Promise<GameIntel[]> {
    return await db.select().from(gameIntel);
  }

  async getGameIntelByPackage(packageName: string): Promise<GameIntel | undefined> {
    const [intel] = await db.select().from(gameIntel).where(eq(gameIntel.packageName, packageName));
    return intel || undefined;
  }

  async createGameIntel(intel: InsertGameIntel): Promise<GameIntel> {
    const [created] = await db.insert(gameIntel).values(intel).returning();
    return created;
  }

  async updateGameIntel(id: number, intel: Partial<InsertGameIntel>): Promise<GameIntel | undefined> {
    const [updated] = await db.update(gameIntel).set(intel).where(eq(gameIntel.id, id)).returning();
    return updated || undefined;
  }

  async deleteGameIntel(id: number): Promise<boolean> {
    const result = await db.delete(gameIntel).where(eq(gameIntel.id, id)).returning();
    return result.length > 0;
  }

  async seedDefaultGames(): Promise<void> {
    const existing = await this.getAllGameIntel();
    if (existing.length === 0) {
      const defaultGames: InsertGameIntel[] = [
        {
          packageName: "com.moonactive.coinmaster",
          gameName: "Coin Master",
          isSanctioned: true,
          paceOfPlay: "25-30 Days (Level 100+)",
          realityCheck: "High probability. Linear progression until level 25.",
          sandTraps: JSON.stringify([
            { level: 26, type: "Cost-Spike", note: "Village costs double. Velocity drops 40%." },
            { level: 80, type: "Stall-Point", note: "High raid frequency. Shield maintenance required." }
          ]),
          suggestedClubs: JSON.stringify([
            { stage: "Early", club: "FB Daily Spin Link", cost: "Free" },
            { stage: "Mid", club: "Level 20 Starter Bundle", cost: "Winnings Re-investment" }
          ]),
          offers: JSON.stringify([
            { id: "cm-1", name: "Spin Bundle", resourceAmount: 100, priceCents: 499, grindAverage48h: 3.0 },
            { id: "cm-2", name: "Mega Coin Pack", resourceAmount: 500, priceCents: 1999, grindAverage48h: 2.5 },
            { id: "cm-3", name: "Premium Spins", resourceAmount: 50, priceCents: 999, grindAverage48h: 3.2 },
          ]),
          phases: JSON.stringify([
            { phase: "Early", levelRange: "1–25", expectedVelocity: "Fast", sanctioned: true },
            { phase: "Mid", levelRange: "26–60", expectedVelocity: "Moderate", sanctioned: true },
            { phase: "Late", levelRange: "61–100", expectedVelocity: "Slow", sanctioned: true },
            { phase: "Endgame", levelRange: "100+", expectedVelocity: "Slow", sanctioned: false },
          ]),
        },
        {
          packageName: "com.superplay.dicedreams",
          gameName: "Dice Dreams",
          isSanctioned: true,
          paceOfPlay: "10-15 Days (Kingdom 25)",
          realityCheck: "Medium-High. Event-dependent velocity.",
          sandTraps: JSON.stringify([
            { level: 17, type: "Resource-Drain", note: "Roll recovery slows. Mandatory event participation needed." }
          ]),
          suggestedClubs: JSON.stringify([
            { stage: "Level 10", club: "3x-10x Multiplier Strategy", cost: "Tactical" },
            { stage: "Level 25", club: "Shield Recharge Pack", cost: "$1.99" }
          ]),
          offers: JSON.stringify([
            { id: "dd-1", name: "Roll Pack", resourceAmount: 200, priceCents: 299, grindAverage48h: 1.2 },
            { id: "dd-2", name: "Kingdom Builder", resourceAmount: 1000, priceCents: 4999, grindAverage48h: 1.5 },
          ]),
          phases: JSON.stringify([
            { phase: "Early", levelRange: "1–10", expectedVelocity: "Fast", sanctioned: true },
            { phase: "Mid", levelRange: "11–20", expectedVelocity: "Moderate", sanctioned: true },
            { phase: "Late", levelRange: "21–25", expectedVelocity: "Slow", sanctioned: true },
          ]),
        },
        {
          packageName: "com.papaya.solitairecash",
          gameName: "Solitaire Cash",
          isSanctioned: false,
          paceOfPlay: "High Risk / Performance Based",
          realityCheck: "No Play Recommended for low-velocity earners.",
          sandTraps: JSON.stringify([
            { level: 0, type: "House-Rake", note: "30% fee on entries. AI-matching detected in non-sanctioned pools." },
            { level: 1, type: "Bonus-Lock", note: "Bonus cash is non-withdrawable. Only used for entry." }
          ]),
          suggestedClubs: JSON.stringify([]),
          offers: JSON.stringify([]),
          phases: JSON.stringify([
            { phase: "Early", levelRange: "1–10", expectedVelocity: "Slow", sanctioned: false },
          ]),
        },
      ];

      for (const game of defaultGames) {
        await this.createGameIntel(game);
      }
    }
  }

  async getTopOffers(limit: number = 3): Promise<CaddieOffer[]> {
    return await db.select().from(offers).limit(limit);
  }

  async createOffer(offer: InsertOffer): Promise<CaddieOffer> {
    const [created] = await db.insert(offers).values(offer).returning();
    return created;
  }

  async seedDefaultOffers(): Promise<void> {
    const existing = await this.getTopOffers(1);
    if (existing.length === 0) {
      const defaultOffers: InsertOffer[] = [
        {
          name: "Spin Bundle",
          juice: 130,
          avgTimeDays: 25,
          completionRate: 60,
          hazard: "Level 26 Cost-Spike",
          freeAlt: "FB Daily Spin Link",
          tpsMarkup: 25,
          investmentWorth: "Low",
          yieldPath: JSON.stringify(["Day 1-7: Fast grind", "Day 8-14: Monitor velocity", "Day 15+: Reassess strategy"]),
          isRipCord: false,
          ripCordMessage: "",
          strategy: "Fairway turns to ruff at Level 26. Option A: use FB Daily Spin Link to bypass. Option B: proceed carefully, monitor velocity."
        },
        {
          name: "Roll Pack",
          juice: 140,
          avgTimeDays: 30,
          completionRate: 75,
          hazard: null,
          freeAlt: "3x-10x Multiplier Strategy",
          tpsMarkup: 10,
          investmentWorth: "High",
          yieldPath: JSON.stringify(["Day 1-7: Standard grind", "Day 8-14: Monitor velocity", "Day 15+: Reassess strategy"]),
          isRipCord: false,
          ripCordMessage: "",
          strategy: "Low risk. Standard grind. Good for maintaining velocity without real-money spend."
        },
        {
          name: "Daily Bonus Bundle",
          juice: 200,
          avgTimeDays: 10,
          completionRate: 90,
          hazard: null,
          freeAlt: "Daily Spin",
          tpsMarkup: 5,
          investmentWorth: "High",
          yieldPath: JSON.stringify(["Day 1-5: Max daily spins", "Day 6-10: Maintain velocity"]),
          isRipCord: false,
          ripCordMessage: "",
          strategy: "Low risk. Max daily spins. Good for maintaining velocity without real-money spend."
        }
      ];

      for (const offer of defaultOffers) {
        await this.createOffer(offer);
      }
    }
  }
}

export const storage = new DatabaseStorage();
