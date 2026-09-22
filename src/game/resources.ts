// ============================================================
// IDLEMON REVO — Sistema de Recursos (módulo centralizado)
// ============================================================
// FONTE ÚNICA para: timezone real, ciclos de alimentação 05/12/18,
// energia/fome do treinador, arremessos e cuidado dos Pokémon
// (fome + lealdade, ciclo de ~3h, bloqueio LOCKED_NEEDS_FEEDING).
//
// REGRAS:
// - Horários sempre no fuso LOCAL do jogador (IANA), nunca offset manual.
// - Relógio manipulado NÃO gera recurso (guarda monotônica + offset
//   de servidor quando o backend expuser; ver setServerClockOffset).
// - NENHUM número destes sistemas deve ser espalhado pelo código.
// ============================================================

import type { PetInstance } from "./systems";

// ==================== 1. TIMEZONE REAL ====================

/** Detecta o timezone IANA do jogador (ex.: "America/Sao_Paulo"). */
export function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch { /* ignore */ }
  return "UTC";
}

// Offset do relógio do servidor (ms) — aplicado sobre Date.now().
// Quando o backend/Supabase expuser timestamp confiável, chamar
// setServerClockOffset(serverMs - Date.now()) uma vez por sessão.
// Frontend usa SOMENTE para exibição/cálculo visual; validações
// críticas usam a guarda monotônica abaixo.
let serverClockOffsetMs = 0;
export function setServerClockOffset(offsetMs: number) {
  if (Number.isFinite(offsetMs)) serverClockOffsetMs = offsetMs;
}
export function getServerClockOffset(): number {
  return serverClockOffsetMs;
}

const CLOCK_GUARD_KEY = "idlemon.clock.v1";
function loadLastSeen(): number {
  try {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(CLOCK_GUARD_KEY) || 0);
  } catch { return 0; }
}
function saveLastSeen(ms: number) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(CLOCK_GUARD_KEY, String(ms));
  } catch { /* ignore */ }
}

/**
 * Hora confiável para regras do jogo.
 * - Aplica offset do servidor quando disponível.
 * - Se o relógio local voltou para trás além da tolerância, TRAVA no
 *   último instante visto (manipulação não gera recurso nem pula ciclo).
 */
export function trustedNow(): { now: number; manipulated: boolean } {
  const raw = Date.now() + serverClockOffsetMs;
  const last = loadLastSeen();
  if (raw < last - 60_000) {
    return { now: last, manipulated: true };
  }
  const now = Math.max(raw, last);
  if (now > last) saveLastSeen(now);
  return { now, manipulated: raw < last - 60_000 };
}

// ==================== 2. CICLOS 05:00 / 12:00 / 18:00 ====================

/** Slots de refeição do dia (hora local). */
export const MEAL_SLOTS = [5, 12, 18] as const;

/** Offset do timezone (ms) para um instante — acompanha DST automaticamente via IANA. */
function tzOffsetMs(tz: string, ms: number): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const parts = Object.fromEntries(
      dtf.formatToParts(ms).map((p) => [p.type, p.value]),
    );
    const asUTC = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour) === 24 ? 0 : Number(parts.hour),
      Number(parts.minute), Number(parts.second),
    );
    return asUTC - ms;
  } catch {
    return 0;
  }
}

/** Converte horário de parede (no tz) em timestamp absoluto. */
function wallToMs(tz: string, y: number, mo: number, d: number, h: number, mi: number): number {
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  guess -= tzOffsetMs(tz, guess);
  guess -= tzOffsetMs(tz, guess);
  return guess;
}

/** Partes locais (no tz) de um timestamp. */
function tzParts(ms: number, tz: string): { y: number; mo: number; d: number } {
  try {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    });
    const parts = Object.fromEntries(
      dtf.formatToParts(ms).map((p) => [p.type, p.value]),
    );
    return { y: Number(parts.year), mo: Number(parts.month), d: Number(parts.day) };
  } catch {
    const d = new Date(ms);
    return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate() };
  }
}

/**
 * Ocorrências (ms absoluto) dos slots de refeição em (lastMs, nowMs],
 * calculadas no timezone local. Funciona offline e após horas ausente.
 * Troca de timezone NÃO duplica: comparação é por timestamp absoluto.
 */
export function mealOccurrencesSince(lastMs: number, nowMs: number, tz: string): number[] {
  if (!(nowMs > lastMs)) return [];
  const out: number[] = [];
  // Varre os dias do intervalo (limitado a 8 dias por segurança).
  const startDay = tzParts(lastMs - 36 * 3_600_000, tz);
  let cursor = Date.UTC(startDay.y, startDay.mo - 1, startDay.d);
  for (let i = 0; i < 8; i++) {
    const dp = tzParts(cursor + 12 * 3_600_000, tz);
    for (const h of MEAL_SLOTS) {
      const occ = wallToMs(tz, dp.y, dp.mo, dp.d, h, 0);
      if (occ > lastMs && occ <= nowMs) out.push(occ);
    }
    cursor += 24 * 3_600_000;
    if (cursor - 24 * 3_600_000 > nowMs + 24 * 3_600_000) break;
  }
  return out.sort((a, b) => a - b);
}

/** Rótulo "05:00"/"12:00"/"18:00" da ocorrência (hora local). */
export function mealLabel(ms: number, tz: string): string {
  try {
    const s = new Intl.DateTimeFormat("pt-BR", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(ms);
    return s;
  } catch {
    return "refeição";
  }
}

/** Próxima ocorrência de slot após `nowMs` (para HUD). */
export function nextMealIn(nowMs: number, tz: string): { ms: number; label: string } {
  const occ = mealOccurrencesSince(nowMs - 1, nowMs + 36 * 3_600_000, tz);
  const next = occ.find((o) => o > nowMs) ?? nowMs + 3_600_000;
  return { ms: next, label: mealLabel(next, tz) };
}

// ==================== 3. ENERGIA DO TREINADOR ====================

export const TRAINER_ENERGY_MAX = 100;
/** ~5 horas de exploração contínua por barra cheia. */
export const TRAINER_ENERGY_DRAIN_PER_HOUR = 20;
export const TRAINER_ENERGY_DRAIN_PER_SEC = TRAINER_ENERGY_DRAIN_PER_HOUR / 3600;
export const TELEPORT_ENERGY_COST = 5;
/** Retornar para Revoland (mapinha6, cidade inicial) custa 1 energia. */
export const TELEPORT_ENERGY_HOME_COST = 1;
export const TELEPORT_HOME_MAP_ID = "mapinha6";
/** Custo de energia por destino: Revoland = 1, demais mapas = 5. */
export function teleportEnergyCostFor(mapId: string): number {
  return mapId === TELEPORT_HOME_MAP_ID ? TELEPORT_ENERGY_HOME_COST : TELEPORT_ENERGY_COST;
}

/** Velocidade de movimento por faixa de energia (0 NÃO trava — fica a 10%). */
export function energySpeedMult(energy: number): number {
  const e = Math.max(0, Math.min(100, energy));
  if (e >= 51) return 1.0;
  if (e >= 31) return 0.9;
  if (e >= 16) return 0.75;
  if (e >= 6) return 0.5;
  if (e >= 1) return 0.25;
  return 0.1;
}

export type EnergyBand = "normal" | "atencao" | "baixa" | "critica" | "exausto";
export function energyBand(energy: number): EnergyBand {
  const e = Math.max(0, Math.min(100, energy));
  if (e >= 51) return "normal";
  if (e >= 31) return "atencao";
  if (e >= 16) return "baixa";
  if (e >= 1) return "critica";
  return "exausto";
}

// ==================== 4. FOME DO TREINADOR + CICLOS ====================

export const TRAINER_HUNGER_MAX = 100;
/** Penalidade por ciclo não atendido. */
export const MISSED_CYCLE_HUNGER = 30;
export const MISSED_CYCLE_ENERGY = 25;

export const TRAINER_FOOD_VALUES: Record<string, { hunger: number; energy: number; label: string }> = {
  fruta:     { hunger: 20,  energy: 10,  label: "🍎 Fruta" },
  suco:      { hunger: 40,  energy: 25,  label: "🥤 Suco" },
  energetico:{ hunger: 10,  energy: 50,  label: "⚡ Energético" },
  refeicao:  { hunger: 100, energy: 100, label: "🍱 Refeição Completa" },
  // ===== Doces & bebidas da Nanizinha (sprites em src/assets/comida) =====
  maca:        { hunger: 25, energy: 15, label: "🍎 Maçã" },
  laranja:     { hunger: 25, energy: 15, label: "🍊 Laranja" },
  picole:      { hunger: 25, energy: 20, label: "🍧 Picolé" },
  refrigerante:{ hunger: 20, energy: 35, label: "🥤 Refrigerante" },
  cafe:        { hunger: 15, energy: 45, label: "☕ Café Expresso" },
  cha_verde:   { hunger: 15, energy: 30, label: "🍵 Chá Verde" },
  bolo_morango:{ hunger: 60, energy: 40, label: "🍰 Bolo de Morango" },
  leite_manga: { hunger: 35, energy: 25, label: "🧋 Leite de Manga" },
};

export type MealCycleResult = {
  hunger: number;
  energy: number;
  lastProcessed: number;
  missed: { at: number; label: string }[];
};

/**
 * Processa ciclos 05/12/18 entre lastProcessed e now.
 * Slot S (com slot anterior P) é ATENDIDO se lastFedAt ∈ (P, S].
 * Nunca debita o mesmo ciclo 2x (lastProcessed só avança).
 */
export function processMealCycles(
  state: { hunger: number; energy: number; lastProcessed: number; lastFedAt: number | null },
  nowMs: number,
  tz: string,
): MealCycleResult {
  const occ = mealOccurrencesSince(state.lastProcessed, nowMs, tz);
  if (occ.length === 0) {
    return { hunger: state.hunger, energy: state.energy, lastProcessed: state.lastProcessed, missed: [] };
  }
  // Ocorrência anterior a cada slot (para a janela de atendimento).
  const prevOf = new Map<number, number>();
  const extended = mealOccurrencesSince(state.lastProcessed - 72 * 3_600_000, nowMs, tz);
  for (let i = 0; i < extended.length; i++) {
    prevOf.set(extended[i], i > 0 ? extended[i - 1] : extended[i] - 12 * 3_600_000);
  }
  let hunger = state.hunger;
  let energy = state.energy;
  const missed: { at: number; label: string }[] = [];
  for (const slot of occ) {
    const prev = prevOf.get(slot) ?? slot - 12 * 3_600_000;
    const fed = state.lastFedAt ?? 0;
    const attended = fed > prev && fed <= slot;
    if (!attended) {
      hunger = Math.max(0, hunger - MISSED_CYCLE_HUNGER);
      energy = Math.max(0, energy - MISSED_CYCLE_ENERGY);
      missed.push({ at: slot, label: mealLabel(slot, tz) });
    }
  }
  return { hunger, energy, lastProcessed: nowMs, missed };
}

// ==================== 5. ARREMESSOS ====================

export const MAX_THROW_COUNT = 100;
/** Recupera +1 arremesso a cada 3 min (teto 100). */
export const THROW_REGEN_MS = 3 * 60 * 1000;

// ==================== 6. POKÉMON: FOME + LEALDADE ====================

/** Ciclo de cuidado: ~3h após alimentado começa a necessidade. */
export const PET_CARE_MS = 3 * 60 * 60 * 1000;
/** Fatia de negligência: a cada 30 min após as 3h. */
export const PET_NEGLECT_TICK_MS = 30 * 60 * 1000;
export const PET_LOYALTY_DECAY_PER_TICK = 2;
export const PET_HUNGER_DECAY_PER_TICK = 5;
/** Lealdade crítica: 0 → LOCKED_NEEDS_FEEDING. */
export const PET_LOYALTY_CRITICAL = 0;
/** Fome mínima para desbloquear (junto de lealdade > 0). */
export const PET_UNLOCK_MIN_HUNGER = 30;

export const PET_FOOD_VALUES: Record<string, { hunger: number; loyalty: number; label: string }> = {
  morango: { hunger: 30, loyalty: 10, label: "🍓 Morango" },
  limao:   { hunger: 20, loyalty: 5,  label: "🍋 Limão" },
};

/** Pet com campos de cuidado (cast local — sem alterar o tipo global). */
export type CaredPet = PetInstance & { lastFedAt?: number; needFeeding?: boolean };

export type HungerState = "cheio" | "normal" | "fome" | "faminto" | "critica";
export function petHungerState(fome: number): HungerState {
  const f = Math.max(0, Math.min(100, fome ?? 100));
  if (f >= 71) return "cheio";
  if (f >= 51) return "normal";
  if (f >= 31) return "fome";
  if (f >= 11) return "faminto";
  return "critica";
}
export const PET_HUNGER_LABEL: Record<HungerState, string> = {
  cheio: "Bem alimentado",
  normal: "Normal",
  fome: "Com fome",
  faminto: "Muito faminto",
  critica: "Fome crítica",
};

export type PetCareEvent = "locked";
export type PetCareResult = { pet: CaredPet; locked: boolean };

/**
 * Processa o cuidado de UM pokémon (puro — sem side effects).
 * - 1ª vez: adota lealdade cheia (avô dos pets existentes) e marca lastFedAt.
 * - Após ~3h sem alimento: a cada 30 min, -2 lealdade e -5 fome.
 * - Lealdade 0 → needFeeding (LOCKED_NEEDS_FEEDING). Nada é apagado.
 */
export function processPetCare<T extends CaredPet>(pet: T, nowMs: number): PetCareResult {
  const p: CaredPet = { ...pet };
  if (p.lastFedAt == null) {
    p.lastFedAt = nowMs;
    p.lealdade = 100;
    return { pet: p, locked: false };
  }
  const overdue = nowMs - p.lastFedAt;
  if (overdue > PET_CARE_MS) {
    const slices = Math.floor((overdue - PET_CARE_MS) / PET_NEGLECT_TICK_MS);
    if (slices > 0) {
      const targetLoyalty = Math.max(0, 100 - PET_LOYALTY_DECAY_PER_TICK * slices);
      p.lealdade = Math.min(p.lealdade ?? 100, targetLoyalty);
      p.fome = Math.max(0, (p.fome ?? 100) - PET_HUNGER_DECAY_PER_TICK * slices);
    }
  }
  const locked = (p.lealdade ?? 100) <= PET_LOYALTY_CRITICAL;
  if (locked) p.needFeeding = true;
  return { pet: p, locked };
}

/** Alimenta um pokémon (morango/limão). Desbloqueia se fome ≥ 30 e lealdade > 0. */
export function feedPet<T extends CaredPet>(pet: T, kind: keyof typeof PET_FOOD_VALUES, nowMs: number): { pet: CaredPet; unlocked: boolean } {
  const v = PET_FOOD_VALUES[kind];
  const p: CaredPet = {
    ...pet,
    fome: Math.max(0, Math.min(100, (pet.fome ?? 100) + v.hunger)),
    lealdade: Math.max(0, Math.min(100, (pet.lealdade ?? 100) + v.loyalty)),
    lastFedAt: nowMs,
  };
  const unlocked = (p.fome ?? 0) >= PET_UNLOCK_MIN_HUNGER && (p.lealdade ?? 0) > PET_LOYALTY_CRITICAL;
  if (unlocked) p.needFeeding = false;
  return { pet: p, unlocked };
}
