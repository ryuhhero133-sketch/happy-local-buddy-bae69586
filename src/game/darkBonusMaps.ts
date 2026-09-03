// ============================================================
// MAPAS BÔNUS DARK — 3 variações sombrias do Vale Verdejante
// ============================================================
// • Entrada: 5 stones de CADA elemento (6 tipos = 30 stones).
// • Abre de 4 em 4 horas e fica aberto por até 2 horas.
// • Pokémon escalam pelo nível do treinador + nível do time.
// • Qualquer captura feita nesses mapas nasce NÍVEL 1.
// ============================================================

export const DARK_BONUS_MAP_IDS = ["dark_vale1", "dark_vale2", "dark_vale3"] as const;
export type DarkBonusMapId = typeof DARK_BONUS_MAP_IDS[number];

export function isDarkBonusMap(id: string | undefined | null): boolean {
  return !!id && (DARK_BONUS_MAP_IDS as readonly string[]).includes(id);
}

/** Custo de entrada: 5 de cada stone elemental. */
export const DARK_ENTRY_STONES = [
  "stone_grass",
  "stone_fire",
  "stone_water",
  "stone_electric",
  "stone_dark",
  "stone_dragon",
] as const;
export const DARK_ENTRY_STONE_QTY = 5;

export const DARK_STONE_LABEL: Record<string, string> = {
  stone_grass: "Stone Verdejante 🌿",
  stone_fire: "Stone Ígnea 🔥",
  stone_water: "Stone Aquática 💧",
  stone_electric: "Stone Elétrica ⚡",
  stone_dark: "Stone Sombria 🌑",
  stone_dragon: "Stone Dracônica 🐉",
};

/** Ciclo: 4h de ciclo, 2h aberto. */
export const DARK_CYCLE_MS = 4 * 60 * 60 * 1000;
export const DARK_OPEN_MS = 2 * 60 * 60 * 1000;

export function darkBonusWindow(now: number = Date.now()): { open: boolean; msUntilChange: number } {
  const t = now % DARK_CYCLE_MS;
  if (t < DARK_OPEN_MS) return { open: true, msUntilChange: DARK_OPEN_MS - t };
  return { open: false, msUntilChange: DARK_CYCLE_MS - t };
}

/** Verifica se o jogador tem as stones exigidas. */
export function hasDarkEntryStones(items: Record<string, number> | undefined): boolean {
  if (!items) return false;
  return DARK_ENTRY_STONES.every((k) => (items[k] ?? 0) >= DARK_ENTRY_STONE_QTY);
}

/** Lista de stones faltando (para mensagem de erro). */
export function missingDarkEntryStones(items: Record<string, number> | undefined): string[] {
  return DARK_ENTRY_STONES.filter((k) => (items?.[k] ?? 0) < DARK_ENTRY_STONE_QTY).map(
    (k) => `${DARK_STONE_LABEL[k]} (${items?.[k] ?? 0}/${DARK_ENTRY_STONE_QTY})`,
  );
}

/** Debita as stones de entrada. */
export function payDarkEntryStones(items: Record<string, number>): Record<string, number> {
  const out = { ...items };
  for (const k of DARK_ENTRY_STONES) out[k] = Math.max(0, (out[k] ?? 0) - DARK_ENTRY_STONE_QTY);
  return out;
}

/** Faixa de nível dos inimigos: baseada no treinador e no time. */
export function darkBonusLevelRange(trainerLevel: number, maxTeamLevel: number, mapId: DarkBonusMapId): [number, number] {
  const base = Math.max(1, Math.max(trainerLevel, maxTeamLevel));
  const tier = mapId === "dark_vale1" ? 0 : mapId === "dark_vale2" ? 0.15 : 0.3;
  const lo = Math.max(1, Math.floor(base * (0.75 + tier)));
  const hi = Math.max(lo + 5, Math.floor(base * (1.25 + tier)) + 10);
  return [lo, hi];
}

/** Rosters sombrios de cada mapa. */
export const DARK_BONUS_POOLS: Record<DarkBonusMapId, string[]> = {
  dark_vale1: ["gengar", "haunter", "gastly", "umbreon", "arbok", "venomoth", "zubat", "gloom", "oddish", "ekans"],
  dark_vale2: ["gengar", "umbreon", "krookodile", "tyranitar", "nidoking", "arbok", "persian", "kadabra", "venomoth", "murkrow"],
  dark_vale3: ["darkrai", "gengar", "umbreon", "tyranitar", "krookodile", "dragonite", "nidoking_shiny", "gyarados", "scizor", "skarmory"],
};
