// ============================================================
// EVENTO ODDISH ODYSSEY
// ============================================================
// Ativação controlada por flag global. Enquanto `enabled = false`, o card
// da sidebar mostra "Em breve" e o portal fica inativo. Quando o dono
// mandar "abra", basta trocar `enabled = true` e o portal libera para
// todos os jogadores respeitando o ciclo de 2h / 30min.
//
// Duração total: 48h a partir de startedAt.
// Janela aberta: 30 min a cada 2h.
// Fila de entrada: 5 min (client-side, cancelável).
// ============================================================

export const ODDISH_EVENT: {
  enabled: boolean;
  startedAt: number;
  durationHours: number;
  cycleHours: number;
  windowMinutes: number;
  queueSeconds: number;
} = {
  /** Evento ATIVO — rotação a cada 2h. */
  enabled: true,
  /** Âncora fixa (referência de rotação de mapas/roster). */
  startedAt: 1784686000000,
  /** Nunca encerra automaticamente. */
  durationHours: 24 * 365,
  /** Ciclo de rotação = 2h (novo mapa + novos pokémon). */
  cycleHours: 2,
  /** Janela aberta = ciclo inteiro (sempre aberto). */
  windowMinutes: 2 * 60,
  /** Fila de entrada (mantida por compatibilidade). */
  queueSeconds: 5 * 60,
};

/** Stones elementais dropadas no mapa do evento. Alimentam ovos Black Mítico. */
export const ELEMENTAL_STONES = [
  "stone_grass",
  "stone_fire",
  "stone_water",
  "stone_electric",
  "stone_dark",
  "stone_dragon",
] as const;
export type ElementalStoneId = typeof ELEMENTAL_STONES[number];

export type OddishPhase =
  | "disabled"     // evento não ligado
  | "finished"     // 48h passaram
  | "open"         // janela aberta
  | "closed";      // janela fechada, aguardando próximo ciclo

export type OddishStatus = {
  phase: OddishPhase;
  /** ms até o próximo evento (fechar se aberto, abrir se fechado). */
  msUntilChange: number;
  /** ms desde a abertura oficial. */
  elapsedMs: number;
};

export function oddishEventStatus(now: number = Date.now()): OddishStatus {
  if (!ODDISH_EVENT.enabled || ODDISH_EVENT.startedAt === 0) {
    return { phase: "disabled", msUntilChange: 0, elapsedMs: 0 };
  }
  const elapsed = now - ODDISH_EVENT.startedAt;
  const totalMs = ODDISH_EVENT.durationHours * 60 * 60 * 1000;
  if (elapsed >= totalMs) {
    return { phase: "finished", msUntilChange: 0, elapsedMs: elapsed };
  }
  const cycleMs = ODDISH_EVENT.cycleHours * 60 * 60 * 1000;
  const openMs = ODDISH_EVENT.windowMinutes * 60 * 1000;
  const t = elapsed % cycleMs;
  if (t < openMs) {
    return { phase: "open", msUntilChange: openMs - t, elapsedMs: elapsed };
  }
  return { phase: "closed", msUntilChange: cycleMs - t, elapsedMs: elapsed };
}

/** Rotaciona entre os três mapas do evento (bosque → clareira → caverna). */
export function oddishMapForCycle(now: number = Date.now()): "oddish_o1" | "oddish_o2" | "oddish_o3" {
  if (ODDISH_EVENT.startedAt === 0) return "oddish_o1";
  const cycleMs = ODDISH_EVENT.cycleHours * 60 * 60 * 1000;
  const idx = Math.floor((now - ODDISH_EVENT.startedAt) / cycleMs) % 3;
  return idx === 0 ? "oddish_o1" : idx === 1 ? "oddish_o2" : "oddish_o3";
}

/** XP extra do evento — é o ÚNICO benefício (sem stones, sem captura). */
export const ODDISH_EVENT_XP_MULT = 5;

/** Rosters rotativos: a cada ciclo de 2h o evento troca os pokémon. */
export const ODDISH_ROSTERS: { label: string; species: string[] }[] = [
  { label: "Bosque Folhoso",    species: ["oddish", "gloom", "vileplume", "bellsprout", "weepinbell", "victreebel", "paras", "parasect"] },
  { label: "Chamas Errantes",   species: ["magmar", "growlithe", "arcanine", "ninetales", "vulpix", "flareon", "charmeleon", "rapidash"] },
  { label: "Maré Profunda",     species: ["gyarados", "vaporeon", "lapras", "poliwhirl", "golduck", "wartortle", "magikarp", "blastoise"] },
  { label: "Tempestade Viva",   species: ["raichu", "jolteon", "electabuzz", "magneton", "pikachu", "magnemite", "luxray_f", "zapdos"] },
  { label: "Véu Sombrio",       species: ["gengar", "umbreon", "haunter", "arbok", "venomoth", "krookodile", "darkrai", "nidoking"] },
  { label: "Ninhada Dracônica", species: ["dragonair", "dragonite", "charizard", "scizor", "tyranitar", "onix", "skarmory", "rayquaza"] },
];

/** Roster do ciclo atual (rotaciona a cada `cycleHours`). */
export function oddishRosterForCycle(now: number = Date.now()) {
  const cycleMs = ODDISH_EVENT.cycleHours * 60 * 60 * 1000;
  const n = ODDISH_ROSTERS.length;
  const idx = Math.floor((now - ODDISH_EVENT.startedAt) / cycleMs) % n;
  return ODDISH_ROSTERS[((idx % n) + n) % n];
}

/** Espécies do pool de spawn base — épicos, escala com o nível do treinador.
 *  Lickitung/lickitung_shiny entram no pool com peso reduzido (sonífero).
 *  Mewtwo é rolado à parte com chance ~0.5% e regras próprias. */
export const ODDISH_EVENT_POOL = ["oddish", "gloom", "vileplume", "lickitung", "lickitung_shiny"] as const;
export type OddishEventSpecies = typeof ODDISH_EVENT_POOL[number];

/** Chance de spawnar Mewtwo (evento) a cada tentativa de spawn no mapa do evento. */
export const MEWTWO_EVENT_CHANCE = 0.006;
/** Mínimo de bolas necessárias antes de o Mewtwo do evento poder ser capturado. */
export const MEWTWO_MIN_BALLS = 767;

/** Safira Verde ganha ao FRAGMENTAR um pokémon capturado no evento. */
export const SAFIRA_VERDE_BY_RARITY: Record<string, number> = {
  common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16, mythic: 32, mythic_shiny: 64,
};

/** Formata contador mm:ss para HUD. */
export function fmtMs(ms: number): string {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
