// Server-only fonte da verdade do balanceamento.
// Este arquivo NUNCA é importado pelo cliente (extensão .server.ts é bloqueada).
// Toda tabela de raridade, preço, loot, XP vive aqui.

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "mythic_shiny";

export const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "mythic_shiny",
];

// Base rewards por raridade — servidor multiplica por level e nerf.
export const RARITY_REWARDS: Record<Rarity, { gold: number; xp: number }> = {
  common:        { gold: 4,  xp: 6 },
  uncommon:      { gold: 8,  xp: 10 },
  rare:          { gold: 18, xp: 22 },
  epic:          { gold: 40, xp: 48 },
  legendary:     { gold: 90, xp: 110 },
  mythic:        { gold: 180, xp: 220 },
  mythic_shiny:  { gold: 360, xp: 450 },
};

// Chance de dropar Ultra Ball ao matar (só rare+).
export const ULTRA_BALL_DROP_CHANCE: Partial<Record<Rarity, number>> = {
  rare: 0.30,
  epic: 0.30,
  legendary: 0.30,
  mythic: 0.30,
  mythic_shiny: 0.30,
};

// Chance base de captura por raridade × tipo de bola.
export const CAPTURE_RATES: Record<Rarity, Record<string, number>> = {
  common:       { pokeball: 0.55, greatball: 0.75, ultraball: 0.90, masterball: 1.0 },
  uncommon:     { pokeball: 0.35, greatball: 0.55, ultraball: 0.75, masterball: 1.0 },
  rare:         { pokeball: 0.18, greatball: 0.35, ultraball: 0.55, masterball: 1.0 },
  epic:         { pokeball: 0.08, greatball: 0.18, ultraball: 0.35, masterball: 1.0 },
  legendary:    { pokeball: 0.03, greatball: 0.08, ultraball: 0.18, masterball: 1.0 },
  mythic:       { pokeball: 0.002, greatball: 0.008, ultraball: 0.028, masterball: 1.0 },
  mythic_shiny: { pokeball: 0.001, greatball: 0.003, ultraball: 0.018, masterball: 1.0 },
};

// Level cap por mapa — servidor valida.
export const MAP_LEVEL_CAP: Record<string, { min: number; max: number }> = {
  verdejante: { min: 1, max: 30 },
  marimbondo: { min: 10, max: 35 },
  pedreira:   { min: 1, max: 55 },
};

// Nerf progressivo quando o lider está muito acima do cap.
export function levelGapMultiplier(leaderLevel: number, targetLevel: number): number {
  const gap = leaderLevel - targetLevel;
  if (gap < 15) return 1.0;
  if (gap < 25) return 0.4;
  if (gap < 35) return 0.15;
  return 0.02;
}

// XP para chegar em level N (curva do treinador).
export function xpForTrainerLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.6));
}

// Loot table de baús. Server sorteia.
export type ChestLootEntry =
  | { kind: "gold"; min: number; max: number; weight: number }
  | { kind: "crystal"; min: number; max: number; weight: number }
  | { kind: "ball"; ball_type: "pokeball" | "greatball" | "ultraball"; qty: number; weight: number }
  | { kind: "nothing"; weight: number };

export const CHEST_LOOT: ChestLootEntry[] = [
  { kind: "nothing", weight: 20 },
  { kind: "gold", min: 50, max: 200, weight: 30 },
  { kind: "gold", min: 200, max: 500, weight: 15 },
  { kind: "ball", ball_type: "pokeball", qty: 1, weight: 15 },
  { kind: "ball", ball_type: "greatball", qty: 1, weight: 8 },
  { kind: "ball", ball_type: "ultraball", qty: 1, weight: 2 },
  { kind: "crystal", min: 1, max: 3, weight: 10 },
];

export function pickWeighted<T extends { weight: number }>(entries: T[]): T {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return entries[entries.length - 1];
}

// Bônus de matar 100 mobs = 10 pokébolas.
export const KILL_MILESTONE = 100;
export const KILL_MILESTONE_REWARD_BALLS = 10;
