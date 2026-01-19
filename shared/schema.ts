import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const gameIntel = pgTable("game_intel", {
  id: serial("id").primaryKey(),
  packageName: text("package_name").notNull().unique(),
  gameName: text("game_name").notNull(),
  isSanctioned: boolean("is_sanctioned").notNull().default(false),
  paceOfPlay: text("pace_of_play").notNull(),
  realityCheck: text("reality_check").notNull(),
  sandTraps: text("sand_traps").notNull().default("[]"),
  suggestedClubs: text("suggested_clubs").notNull().default("[]"),
  offers: text("offers").notNull().default("[]"),
  phases: text("phases").notNull().default("[]"),
});

export const insertGameIntelSchema = createInsertSchema(gameIntel).omit({
  id: true,
});

export type InsertGameIntel = z.infer<typeof insertGameIntelSchema>;
export type GameIntel = typeof gameIntel.$inferSelect;

export interface SandTrap {
  level: number;
  type: string;
  note: string;
}

export interface SuggestedClub {
  stage: string;
  club: string;
  cost: string;
}

export interface Offer {
  id: string;
  name: string;
  resourceAmount: number;
  priceCents: number;
  grindAverage48h: number;
}

export interface OfferEvaluation {
  offer: Offer;
  costPerResource: number;
  grindAverageCost: number;
  markupPercent: number;
  isHazard: boolean;
  hazardReason: string | null;
}

export interface GamePhase {
  phase: "Early" | "Mid" | "Late" | "Endgame";
  levelRange: string;
  expectedVelocity: "Fast" | "Moderate" | "Slow";
  sanctioned: boolean;
}

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  juice: integer("juice").notNull().default(100),
  avgTimeDays: integer("avg_time_days").notNull().default(30),
  completionRate: integer("completion_rate").notNull().default(80),
  hazard: text("hazard"),
  freeAlt: text("free_alt"),
  tpsMarkup: integer("tps_markup").notNull().default(0),
  investmentWorth: text("investment_worth").notNull().default("Medium"),
  yieldPath: text("yield_path").notNull().default("[]"),
  isRipCord: boolean("is_ripcord").notNull().default(false),
  ripCordMessage: text("ripcord_message").notNull().default(""),
  strategy: text("strategy").notNull().default(""),
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
});

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type CaddieOffer = typeof offers.$inferSelect;
