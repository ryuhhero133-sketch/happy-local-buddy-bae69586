// Evento "Gelius" — abre a cada 2 horas, dura 10 minutos.
// Aos 5 minutos troca da fase 1 (nv 50-200) para fase 2 (nv 400-1000).
// Jogador tem 3 entradas por dia. Ao sair do mapa consome uma entrada.
// Pokémons do evento não podem ser capturados exceto ditto/gengar/magmar.

const CYCLE_MS = 2 * 60 * 60 * 1000; // 2h
const DURATION_MS = 10 * 60 * 1000;  // 10min
const PHASE_SWITCH_MS = 5 * 60 * 1000; // 5min

// Fase 1 abre em X, dura 5min; fase 2 abre em X+5min, dura 5min.
// Epoch alinha o ciclo em relógio absoluto para todos os jogadores.
const EPOCH = 0; // ms — usa 0 (Unix epoch) — todos veem o mesmo horário.

export type GeliusPhase = "closed" | "phase1" | "phase2";

export function currentGeliusInfo(now: number = Date.now()) {
  const t = ((now - EPOCH) % CYCLE_MS + CYCLE_MS) % CYCLE_MS;
  let phase: GeliusPhase = "closed";
  let msUntilChange = 0;
  if (t < PHASE_SWITCH_MS) {
    phase = "phase1";
    msUntilChange = PHASE_SWITCH_MS - t;
  } else if (t < DURATION_MS) {
    phase = "phase2";
    msUntilChange = DURATION_MS - t;
  } else {
    phase = "closed";
    msUntilChange = CYCLE_MS - t;
  }
  const msSinceStart = t < DURATION_MS ? t : 0;
  const msUntilNextStart = t < DURATION_MS ? (CYCLE_MS - t) : (CYCLE_MS - t);
  return { phase, msUntilChange, msSinceStart, msUntilNextStart };
}

export function isGeliusActive(now: number = Date.now()) {
  return currentGeliusInfo(now).phase !== "closed";
}

// ─── Entradas diárias ───────────────────────────────────────────
const KEY = "rubym.gelius.entries.v1";
type EntryState = { day: string; count: number };

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getGeliusEntries(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const s = JSON.parse(raw) as EntryState;
    return s.day === today() ? s.count : 0;
  } catch { return 0; }
}

export function canEnterGelius(): boolean {
  return getGeliusEntries() < 3 && isGeliusActive();
}

export function consumeGeliusEntry() {
  if (typeof window === "undefined") return;
  try {
    const cur = getGeliusEntries();
    localStorage.setItem(KEY, JSON.stringify({ day: today(), count: cur + 1 }));
  } catch { /* ignore */ }
}

export const GELIUS_CAPTURABLE = new Set<string>(["ditto", "ditto_shiny", "gengar", "magmar"]);

// Rosters
export const GELIUS_PHASE1_POOL = [
  "ditto", "gengar", "magmar", "electabuzz", "magneton",
  "arcanine", "growlithe", "sandshrew", "sandslash", "primeape",
  "kadabra", "poliwhirl", "raichu", "jolteon", "flareon", "vaporeon",
] as const;

export const GELIUS_PHASE2_POOL = [
  "gengar", "magmar", "ditto_shiny", "tyranitar", "infernape",
  "krookodile", "machamp", "nidoking_shiny", "hariyama",
  "ursaring", "gyarados", "dragonite", "blaziken", "magmortar",
  "rapidash_shiny", "skarmory",
] as const;
