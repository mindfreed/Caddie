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

export function evaluateOffer(offer: Offer): OfferEvaluation {
  const costPerResource = offer.priceCents / offer.resourceAmount;
  const grindAverageCost = offer.grindAverage48h;
  const markupPercent = ((costPerResource - grindAverageCost) / grindAverageCost) * 100;
  const isHazard = markupPercent > 20;
  const hazardReason = isHazard 
    ? `Offer exceeds 48-hour grind value by ${markupPercent.toFixed(1)}%` 
    : null;
  
  return {
    offer,
    costPerResource,
    grindAverageCost,
    markupPercent,
    isHazard,
    hazardReason,
  };
}

export interface AllianceStat {
  id: number;
  packageName: string;
  gameName: string;
  isSanctioned: boolean;
  paceOfPlay: string;
  realityCheck: string;
  sandTraps: string;
  suggestedClubs: string;
  offers: string;
  phases: string;
}

export interface ParsedAllianceStat extends Omit<AllianceStat, 'sandTraps' | 'suggestedClubs' | 'offers' | 'phases'> {
  sandTraps: SandTrap[];
  suggestedClubs: SuggestedClub[];
  offers: Offer[];
  offerEvaluations: OfferEvaluation[];
  phases: GamePhase[];
}

export function parseGameIntel(stat: AllianceStat): ParsedAllianceStat {
  const offers: Offer[] = JSON.parse(stat.offers || "[]");
  const offerEvaluations = offers.map(evaluateOffer);
  const phases: GamePhase[] = JSON.parse(stat.phases || "[]");
  
  return {
    ...stat,
    sandTraps: JSON.parse(stat.sandTraps || "[]"),
    suggestedClubs: JSON.parse(stat.suggestedClubs || "[]"),
    offers,
    offerEvaluations,
    phases,
  };
}

export async function getGameIntelFromAPI(packageName: string): Promise<AllianceStat> {
  const response = await fetch(`/api/game-intel/${encodeURIComponent(packageName)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch game intel");
  }
  return response.json();
}

export async function getAllGameIntel(): Promise<AllianceStat[]> {
  const response = await fetch("/api/game-intel");
  if (!response.ok) {
    throw new Error("Failed to fetch game intel list");
  }
  return response.json();
}

export async function addGameIntel(game: Omit<AllianceStat, "id">): Promise<AllianceStat> {
  const response = await fetch("/api/game-intel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add game");
  }
  return response.json();
}

export async function updateGameIntel(id: number, updates: Partial<Omit<AllianceStat, "id">>): Promise<AllianceStat> {
  const response = await fetch(`/api/game-intel/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("Failed to update game intel");
  }
  return response.json();
}

export async function deleteGameIntel(id: number): Promise<void> {
  const response = await fetch(`/api/game-intel/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete game intel");
  }
}
