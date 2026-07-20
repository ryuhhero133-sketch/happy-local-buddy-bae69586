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
  /** Evento ATIVO — 48h a partir de startedAt. */
  enabled: true,
  /** Timestamp de abertura oficial (ms) — ABERTURA IMEDIATA PRA GERAL. */
  startedAt: 1784591072789,
  /** Encerra após 48h desde startedAt. */
  durationHours: 48,
  /** Ciclo entre aberturas (2h). */
  cycleHours: 2,
  /** Duração da janela aberta (30 min). */
  windowMinutes: 30,
  /** Fila de entrada em segundos (5 min). */
  queueSeconds: 5 * 60,
};

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

/** Alterna entre os dois mapas a cada abertura. */
export function oddishMapForCycle(now: number = Date.now()): "oddish_o1" | "oddish_o2" {
  if (ODDISH_EVENT.startedAt === 0) return "oddish_o1";
  const cycleMs = ODDISH_EVENT.cycleHours * 60 * 60 * 1000;
  const idx = Math.floor((now - ODDISH_EVENT.startedAt) / cycleMs);
  return idx % 2 === 0 ? "oddish_o1" : "oddish_o2";
}

/** Espécies do pool de spawn base — épicos, escala com o nível do treinador.
 *  Lickitung/lickitung_shiny entram no pool com peso reduzido (sonífero).
 *  Mewtwo é rolado à parte com chance ~0.5% e regras próprias. */
export const ODDISH_EVENT_POOL = ["oddish", "gloom", "vileplume", "lickitung", "lickitung_shiny"] as const;
export type OddishEventSpecies = typeof ODDISH_EVENT_POOL[number];

/** Chance de spawnar Mewtwo (evento) a cada tentativa de spawn no mapa do evento. */
export const MEWTWO_EVENT_CHANCE = 0.006;
/** Mínimo de bolas necessárias antes de o Mewtwo do evento poder ser capturado. */
export const MEWTWO_MIN_BALLS = 1500;

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
