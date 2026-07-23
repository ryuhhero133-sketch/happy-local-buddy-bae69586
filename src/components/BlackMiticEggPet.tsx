import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import eggSprite from "@/assets/black-mitic-egg.png";
import incubatorSprite from "@/assets/black-mitic-incubator.png";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";
import { getBlackEggSave, saveBlackEggSave } from "@/lib/blackEgg.functions";

// ============================================================================
// Black Mitic Plus Egg — sistema unificado
// - Suporta múltiplos ovos em UM único painel (seleção por ovo).
// - Cooldown de alimentação: 1h entre feeds.
// - Incubação: 20h (conta apenas depois de "ATIVAR INICIAÇÃO").
export const BLACK_EGG_ITEM_ID = "black_mitic_egg";
export const BLACK_MITIC_EGG_DESCRIPTION =
  "Black Mitic Plus Egg — coloque na incubadora e ative para começar a chocar (20h). Alimente com Elemental Stones (50 por vez, 1h de cooldown). O elemento dominante define o tipo do Pokémon que nascerá com 5 traits.";

const FEED_COOLDOWN_MS = 60 * 60 * 1000;         // 1h entre feeds
const HATCH_MS = 20 * 60 * 60 * 1000;            // 20h incubação
const FEED_COST = 50;
// --- Sistema BONUS (rompimento dos elementais) ---
const BONUS_UNLOCK_PCT = 0.70;                    // libera aos 70% de incubação
const BONUS_COOLDOWN_MS = 10 * 60 * 1000;         // 10min entre bônus
const BONUS_REJECT_CHANCE = 0.40;                 // 40% de recusa grosseira
const BONUS_MIN = 1;
const BONUS_MAX = 999;

export const ELEMENTS = [
  { id: "grass",    stone: "stone_grass",    label: "Planta",   color: "#3fd06b", emoji: "🌿", species: "venusaur",  role: "defense" as const },
  { id: "fire",     stone: "stone_fire",     label: "Fogo",     color: "#ff6b3d", emoji: "🔥", species: "charizard", role: "offense" as const },
  { id: "water",    stone: "stone_water",    label: "Água",     color: "#4fb8ff", emoji: "💧", species: "blastoise", role: "defense" as const },
  { id: "electric", stone: "stone_electric", label: "Elétrico", color: "#ffd84d", emoji: "⚡", species: "raichu",    role: "offense" as const },
  { id: "dark",     stone: "stone_dark",     label: "Sombrio",  color: "#a066ff", emoji: "🌑", species: "gengar",    role: "offense" as const },
  { id: "dragon",   stone: "stone_dragon",   label: "Dragão",   color: "#ff5aa8", emoji: "🐉", species: "dragonite", role: "offense" as const },
] as const;

type ElementId = typeof ELEMENTS[number]["id"];
type StoneId = typeof ELEMENTS[number]["stone"];

type FeedHistoryItem = { ts: number; element: ElementId; amount: number };

export type JournalMood =
  | "greeting" | "hungry" | "craving" | "happy" | "absorbing"
  | "obsession" | "worry" | "mystery" | "ready" | "hatch";

export type JournalEntry = {
  ts: number;
  mood: JournalMood;
  text: string;
  element?: ElementId;
};

export type EggInstance = {
  id: string;
  createdAt: number;
  activated: boolean;
  activatedAt: number;         // 0 se não ativado
  lastFedAt: number;           // 0 se nunca alimentado
  affinity: Record<ElementId, number>;
  totalFed: number;
  history: FeedHistoryItem[];
  // Personalidade / diário
  journal: JournalEntry[];
  cravingElement: ElementId | null;
  cravingSince: number;
  lastHungerNudgeAt: number;
  lastReadyNudgeAt: number;
  lastCravingNudgeAt: number;
  lastMysteryNudgeAt?: number;
  streakElement: ElementId | null;
  streakCount: number;
  // Novo: métricas de cuidado
  matchedCravings: number;     // vezes que o jogador acertou o desejo
  missedFeedings: number;      // feeds atrasados (>1h30 desde cooldown)
  lastMilestone: number;       // último marco de totalFed anunciado (excesso)
  recentFeedAt: Partial<Record<ElementId, number>>; // brilho recente por elemento
  // Bônus (rompimento dos elementais) — habilitado a partir de 70% de incubação
  bonusFed: Partial<Record<ElementId, number>>;   // total bônus por elemento
  bonusAttempts: number;                           // tentativas (aceitas + rejeitadas)
  bonusAccepted: number;                           // apenas aceitas
  bonusRejected: number;                           // apenas rejeitadas
  lastBonusFeedAt: number;                         // cooldown 10min
  ruptured: boolean;                               // true → nasce com 6 traits
  lastBonusResult?: { ts: number; kind: "accept" | "reject"; element: ElementId; amount: number; line: string } | null;
};

type CollectionState = {
  eggs: EggInstance[];
  selectedId: string | null;
  hatchedHistory?: string[]; // últimas ~10 espécies chocadas (evita duplicatas em série)
};

function newEgg(): EggInstance {
  return {
    id: (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : `egg_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    createdAt: Date.now(),
    activated: false,
    activatedAt: 0,
    lastFedAt: 0,
    affinity: { grass: 0, fire: 0, water: 0, electric: 0, dark: 0, dragon: 0 },
    totalFed: 0,
    history: [],
    journal: [],
    cravingElement: null,
    cravingSince: 0,
    lastHungerNudgeAt: 0,
    lastReadyNudgeAt: 0,
    lastCravingNudgeAt: 0,
    streakElement: null,
    streakCount: 0,
    matchedCravings: 0,
    missedFeedings: 0,
    lastMilestone: 0,
    recentFeedAt: {},
    bonusFed: {},
    bonusAttempts: 0,
    bonusAccepted: 0,
    bonusRejected: 0,
    lastBonusFeedAt: 0,
    ruptured: false,
    lastBonusResult: null,
  };
}

function storageKey(uid: string) {
  return `rubym.blackMiticEgg.v2.${uid}`;
}

function loadState(uid: string): CollectionState {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return { eggs: [], selectedId: null };
    const p = JSON.parse(raw);
    const eggs: EggInstance[] = Array.isArray(p?.eggs)
      ? p.eggs.map((e: any) => ({
          id: String(e?.id ?? `egg_${Math.random()}`),
          createdAt: Number(e?.createdAt ?? Date.now()),
          activated: !!e?.activated,
          activatedAt: Number(e?.activatedAt ?? 0),
          lastFedAt: Number(e?.lastFedAt ?? 0),
          affinity: {
            grass: Number(e?.affinity?.grass ?? 0),
            fire: Number(e?.affinity?.fire ?? 0),
            water: Number(e?.affinity?.water ?? 0),
            electric: Number(e?.affinity?.electric ?? 0),
            dark: Number(e?.affinity?.dark ?? 0),
            dragon: Number(e?.affinity?.dragon ?? 0),
          },
          totalFed: Number(e?.totalFed ?? 0),
          history: Array.isArray(e?.history) ? e.history.slice(0, 20) : [],
          journal: Array.isArray(e?.journal) ? e.journal.slice(0, 60) : [],
          cravingElement: (e?.cravingElement ?? null) as ElementId | null,
          cravingSince: Number(e?.cravingSince ?? 0),
          lastHungerNudgeAt: Number(e?.lastHungerNudgeAt ?? 0),
          lastReadyNudgeAt: Number(e?.lastReadyNudgeAt ?? 0),
          lastCravingNudgeAt: Number(e?.lastCravingNudgeAt ?? 0),
          lastMysteryNudgeAt: Number(e?.lastMysteryNudgeAt ?? 0),
          streakElement: (e?.streakElement ?? null) as ElementId | null,
          streakCount: Number(e?.streakCount ?? 0),
          matchedCravings: Number(e?.matchedCravings ?? 0),
          missedFeedings: Number(e?.missedFeedings ?? 0),
          lastMilestone: Number(e?.lastMilestone ?? 0),
          recentFeedAt: (e?.recentFeedAt && typeof e.recentFeedAt === "object") ? e.recentFeedAt : {},
          bonusFed: (e?.bonusFed && typeof e.bonusFed === "object") ? e.bonusFed : {},
          bonusAttempts: Number(e?.bonusAttempts ?? 0),
          bonusAccepted: Number(e?.bonusAccepted ?? 0),
          bonusRejected: Number(e?.bonusRejected ?? 0),
          lastBonusFeedAt: Number(e?.lastBonusFeedAt ?? 0),
          ruptured: !!e?.ruptured,
          lastBonusResult: e?.lastBonusResult ?? null,
        }))
      : [];
    return {
      eggs,
      selectedId: typeof p?.selectedId === "string" ? p.selectedId : (eggs[0]?.id ?? null),
      hatchedHistory: Array.isArray(p?.hatchedHistory) ? p.hatchedHistory.slice(-10) : [],
    };
  } catch {
    return { eggs: [], selectedId: null };
  }
}

function saveState(uid: string, s: CollectionState) {
  try { localStorage.setItem(storageKey(uid), JSON.stringify(s)); } catch { /* ignore */ }
}

function dominantElement(affinity: Record<ElementId, number>): ElementId {
  let best: ElementId = "grass"; let bv = -1;
  for (const el of ELEMENTS) {
    const v = affinity[el.id] ?? 0;
    if (v > bv) { bv = v; best = el.id; }
  }
  return best;
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ================================================================
// Sistema de personalidade / diálogos
// ================================================================
const MOOD_META: Record<JournalMood, { color: string; label: string; icon: string }> = {
  greeting:  { color: "#c58bff", label: "Despertar",   icon: "✦" },
  hungry:    { color: "#ffb857", label: "Fome",        icon: "◇" },
  craving:   { color: "#ff9ad6", label: "Desejo",      icon: "❥" },
  happy:     { color: "#8affb0", label: "Alegria",     icon: "♡" },
  absorbing: { color: "#8ad0ff", label: "Absorvendo",  icon: "≋" },
  obsession: { color: "#ff6b8a", label: "Obsessão",    icon: "⚠" },
  worry:     { color: "#ff9090", label: "Inquietação", icon: "…" },
  mystery:   { color: "#d8a0ff", label: "Mistério",    icon: "☾" },
  ready:     { color: "#a0ffb0", label: "Pronto",      icon: "✧" },
  hatch:     { color: "#ffe0a0", label: "Nascimento",  icon: "★" },
};

const GREETINGS = [
  "Sinto sua presença... quem é você, treinador?",
  "Uma casca escura me protege... e você me observa.",
  "Ainda estou frágil... prometa que vai cuidar de mim.",
  "Posso ouvir seu coração pulsando através da casca.",
];
const HUNGRY_LINES = [
  "Ei... estou começando a sentir fome novamente...",
  "Sinto que preciso de mais energia...",
  "Meu interior está frio. Alimente-me, por favor.",
  "As stones... estou sonhando com elas.",
  "Preciso de poder para continuar crescendo...",
];
const ABANDON_LINES = [
  "Será que você ainda está comigo, treinador?",
  "Silêncio... só silêncio. Você me esqueceu?",
  "Fico esperando por você. Sempre esperando.",
  "Se me abandonar agora, o que será de mim?",
];
const READY_SOON_LINES = [
  "Acho que já posso absorver mais poder...",
  "Sinto que estou pronto para uma nova stone.",
  "Meu núcleo pulsou. É hora, treinador.",
];
const HAPPY_MATCH = [
  "SIM! Era exatamente disso que eu precisava!",
  "Este elemento... me deixa completo. Obrigado.",
  "Você me ouviu. Sabia que me entenderia.",
];
const ABSORB_LINES = [
  "Absorvendo bem... sinto essa energia se enraizar.",
  "Esta stone me aquece por dentro.",
  "Cada gota de poder está encontrando um lugar em mim.",
];
const OBSESSION_LINES = [
  "Treinador... tanta energia... estou mudando...",
  "Você está transformando algo dentro de mim...",
  "Esse poder está ficando incontrolável...",
  "Será que conseguirei conter toda essa força?",
  "Sinto meu núcleo se dobrar sob esse elemento...",
];
const MYSTERY_LINES = [
  "Vejo cores que ainda não têm nome...",
  "Algo está se formando aqui dentro. Algo raro.",
  "Sonhei com asas. Ou seriam garras?",
  "Meu tipo ainda está sendo decidido... por você.",
  "Ouço um coro de vozes ancestrais chamando meu nome...",
  "Minha sombra dança sozinha, treinador. Está te esperando.",
  "Um símbolo pulsa no fundo do meu núcleo. Você o reconheceria?",
  "Sinto que já vivi antes... em outra era.",
];
// Enigmas específicos por elemento dominante — plantam pistas de quem pode nascer.
const ENIGMATIC_LINES: Record<ElementId, string[]> = {
  grass:    ["Raízes profundas me chamam de irmão da floresta...", "Um perfume de pétalas antigas me envolve...", "Ouço o crescer silencioso da mata dentro de mim."],
  fire:     ["Chamas dançam nas paredes da minha casca... vejo asas em fogo.", "Uma rugida de brasa ecoa no meu peito.", "Sinto uma cauda quente serpenteando no escuro."],
  water:    ["Marés antigas me embalam. Sonho com a fúria de tsunamis.", "Sinto conchas de tempestade se fechando ao meu redor.", "Uma canção do fundo do oceano me chama para casa."],
  electric: ["Faíscas dançam ao meu redor... e trovões me respondem.", "Meu núcleo vibra como um raio guardado.", "Ouço um chamado do céu — como se pertencesse a ele."],
  dark:     ["Minhas sombras têm garras. E olhos.", "Um véu de eclipse me cobre. Vejo em quem me tornarei.", "Sinto o vazio me abraçar como um velho amigo."],
  dragon:   ["Uma força milenar bate em compasso comigo...", "Escamas prateadas se formam entre meus batimentos.", "Um rugido de dragão sopra através da minha casca."],
};
// Hint enigma quando o ovo é 'versátil' (5+ elementos alimentados).
const VERSATILE_HINTS = [
  "Todos os elementos falam em mim ao mesmo tempo... e nenhum manda.",
  "Vejo uma silhueta lendária mudando de forma dentro do meu ovo.",
  "Nem terra, nem céu — algo antigo entre eles se forma aqui.",
  "Sinto que serei... imprevisível. Nem eu sei o que virá.",
];
const CRAVING_LINES: Record<ElementId, string[]> = {
  grass:    ["Sinto falta do cheiro da terra úmida...", "Uma folha... eu queria sentir uma folha crescer em mim."],
  fire:     ["Preciso de calor. O frio está me consumindo.", "Um pouco de brasa... só um pouco, por favor."],
  water:    ["Minha casca está seca. Traga águas profundas.", "Sonho com marés puxando meu núcleo."],
  electric: ["Quero sentir um raio percorrer minha casca.", "Faíscas... me faltam faíscas."],
  dark:     ["Anseio pelo silêncio das sombras.", "A escuridão me chama. Alimente esse chamado."],
  dragon:   ["Sinto asas se formando... mas falta poder ancestral.", "Um sopro de dragão faria toda diferença agora."],
};
const EXCESS_LINES = [
  "Treinador... tanta energia... estou mudando...",
  "Esse poder está ficando difícil de controlar...",
  "Você está criando algo muito além do normal...",
  "Ainda consigo absorver mais... mas sinto que estou diferente.",
  "Meu núcleo pulsa como uma tempestade — o que serei?",
];

// =========================================================================
// Arquetipo (moldado pela alimentação) e pontuação de cuidado
// =========================================================================
export type Archetype = "tank" | "damage" | "versatile" | "balanced";
export const ARCHETYPE_META: Record<Archetype, { label: string; color: string; icon: string; desc: string }> = {
  tank:      { label: "Guardião",  color: "#4fb8ff", icon: "🛡", desc: "Alta defesa e HP." },
  damage:    { label: "Ofensivo",  color: "#ff6b3d", icon: "⚔", desc: "Dano bruto e crítico." },
  balanced:  { label: "Equilibrado", color: "#c58bff", icon: "⚖", desc: "Atributos gerais superiores." },
  versatile: { label: "Versátil", color: "#a0ffb0", icon: "✦", desc: "Distribuição rara — bônus mistos." },
};

export function computeArchetype(affinity: Record<ElementId, number>): Archetype {
  const total = Object.values(affinity).reduce((a, b) => a + b, 0);
  if (total <= 0) return "balanced";
  let off = 0, def = 0;
  for (const el of ELEMENTS) {
    const v = affinity[el.id] ?? 0;
    if (el.role === "offense") off += v; else def += v;
  }
  const usedElements = ELEMENTS.filter(e => (affinity[e.id] ?? 0) > 0).length;
  // Distribuição bem espalhada (>=5 elementos com peso) → versátil
  if (usedElements >= 5) return "versatile";
  const bias = (off - def) / total;
  if (bias > 0.35) return "damage";
  if (bias < -0.25) return "tank";
  return "balanced";
}

// Pontuação de cuidado: 0..100. Influencia a qualidade dos traits ao chocar.
export function computeCareScore(egg: EggInstance): number {
  const feedsCount = Math.floor(egg.totalFed / FEED_COST);
  if (feedsCount === 0) return 0;
  const targetFeeds = 10; // "cheio de cuidado" a partir de ~10 alimentações
  const consistency = Math.min(1, feedsCount / targetFeeds);           // 0..1
  const cravingRate = Math.min(1, egg.matchedCravings / Math.max(1, feedsCount)); // 0..1
  const missPenalty = Math.min(0.5, egg.missedFeedings * 0.06);        // 0..0.5
  // Balanceamento por variância baixa entre elementos
  const values = ELEMENTS.map(e => egg.affinity[e.id] ?? 0);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const shares = values.map(v => v / total);
  const mean = 1 / ELEMENTS.length;
  const variance = shares.reduce((a, s) => a + (s - mean) * (s - mean), 0) / ELEMENTS.length;
  const balance = Math.max(0, 1 - variance * 6); // menor variância = mais balanceado
  // Obsessão penaliza — streaks muito longos
  const obsessionPenalty = Math.min(0.3, Math.max(0, egg.streakCount - 3) * 0.05);
  const raw = (consistency * 0.4 + cravingRate * 0.3 + balance * 0.3) - missPenalty - obsessionPenalty;
  return Math.round(Math.max(0, Math.min(1, raw)) * 100);
}

// Traits divididos por tier para o hatch inteligente.
const TRAITS_EPIC   = ["alpha", "prismatico", "ceifador", "eterno", "dourado"];
const TRAITS_RARE   = ["eletrizado", "precioso", "prodigio", "mistico", "esquivo", "vampirico", "colosso"];
const TRAITS_STRONG = ["sabio", "curador", "brutal", "guardiao"];
const TRAITS_ARCHETYPE: Record<Archetype, string[]> = {
  tank:      ["colosso", "guardiao", "eterno", "curador"],
  damage:    ["ceifador", "brutal", "mistico", "vampirico", "eletrizado"],
  balanced:  ["alpha", "prodigio", "sabio", "dourado"],
  versatile: ["prismatico", "alpha", "esquivo", "dourado", "prodigio"],
};

const ALL_TRAITS_POOL = [...TRAITS_EPIC, ...TRAITS_RARE, ...TRAITS_STRONG];

export function rollBlackMiticTraits(egg: EggInstance, archetype: Archetype): string[] {
  const care = computeCareScore(egg); // 0..100
  // Prob de escolher épico por slot cresce com care (25% → 85%)
  const epicChance = 0.25 + (care / 100) * 0.6;
  const rareChance = 0.85; // se falhar épico, chance de raro
  const picked: string[] = [];
  const themed = TRAITS_ARCHETYPE[archetype];
  // Slot 1: garante um trait temático do arquétipo (o "sabor")
  const themeSeed = themed[Math.floor(Math.random() * themed.length)];
  picked.push(themeSeed);
  while (picked.length < 5) {
    let pool: string[];
    const r = Math.random();
    if (r < epicChance) pool = TRAITS_EPIC;
    else if (r < epicChance + (1 - epicChance) * rareChance) pool = TRAITS_RARE;
    else pool = TRAITS_STRONG;
    // Bias adicional: chance extra de puxar do pool temático quando care é alto
    if (Math.random() < 0.35 + care / 300) pool = [...pool, ...themed];
    let candidates = pool.filter(t => !picked.includes(t));
    // Fallback: se o pool escolhido esgotou, usa o pool global — Black Mitic
    // Plus SEMPRE tem que nascer com 5 traits.
    if (candidates.length === 0) candidates = ALL_TRAITS_POOL.filter(t => !picked.includes(t));
    if (candidates.length === 0) break;
    picked.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  return picked.slice(0, 5);
}


function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function pushJournal(egg: EggInstance, mood: JournalMood, text: string, element?: ElementId): EggInstance {
  const entry: JournalEntry = { ts: Date.now(), mood, text, element };
  return { ...egg, journal: [entry, ...egg.journal].slice(0, 60) };
}

function pickCraving(egg: EggInstance): ElementId {
  // Prefere elemento menos alimentado; evita repetir o desejo anterior.
  const sorted = [...ELEMENTS].sort((a, b) => (egg.affinity[a.id] ?? 0) - (egg.affinity[b.id] ?? 0));
  const candidates = sorted.filter(e => e.id !== egg.cravingElement).slice(0, 3);
  return (candidates[Math.floor(Math.random() * candidates.length)] ?? sorted[0]).id;
}

/**
 * Aplica atualizações passivas do diário (fome, saudade do desejo, aviso de pronto para comer).
 * Idempotente por cursores.
 */
function advanceJournal(egg: EggInstance, now: number): EggInstance {
  if (!egg.activated) return egg;
  let next = egg;

  // Fixa um desejo inicial se ainda não existe
  if (!next.cravingElement) {
    const craving = pickCraving(next);
    next = { ...next, cravingElement: craving, cravingSince: now };
    const el = ELEMENTS.find(e => e.id === craving)!;
    next = pushJournal(next, "craving", pick(CRAVING_LINES[craving]) + ` (${el.emoji} ${el.label})`, craving);
  }

  // Aviso "quase pronto" ~5 min antes do cooldown acabar
  if (next.lastFedAt > 0) {
    const cdEnd = next.lastFedAt + FEED_COOLDOWN_MS;
    const untilReady = cdEnd - now;
    if (untilReady > 0 && untilReady <= 5 * 60 * 1000 && next.lastReadyNudgeAt < cdEnd - 6 * 60 * 1000) {
      next = pushJournal(next, "ready", pick(READY_SOON_LINES));
      next = { ...next, lastReadyNudgeAt: now };
    }
  }

  // Fome: já passou 30 min do cooldown sem novo feed
  if (next.lastFedAt > 0) {
    const overdue = now - (next.lastFedAt + FEED_COOLDOWN_MS);
    if (overdue > 30 * 60 * 1000 && (now - next.lastHungerNudgeAt) > 60 * 60 * 1000) {
      const line = overdue > 3 * 60 * 60 * 1000 ? pick(ABANDON_LINES) : pick(HUNGRY_LINES);
      next = pushJournal(next, overdue > 3 * 60 * 60 * 1000 ? "worry" : "hungry", line);
      // Cada nudge que passa dos 90min conta como missedFeeding (penaliza care)
      const isMiss = overdue > 90 * 60 * 1000;
      next = { ...next, lastHungerNudgeAt: now, missedFeedings: next.missedFeedings + (isMiss ? 1 : 0) };
    }
  }

  // Saudade do desejo: 2h sem receber o elemento desejado
  if (next.cravingElement && (now - next.cravingSince) > 2 * 60 * 60 * 1000 &&
      (now - next.lastCravingNudgeAt) > 90 * 60 * 1000) {
    const el = next.cravingElement;
    next = pushJournal(next, "craving", pick(CRAVING_LINES[el]), el);
    next = { ...next, lastCravingNudgeAt: now };
  }

  // Enigma periódico: pistas do que ele pode virar (a cada ~25 min de sessão)
  if (next.lastFedAt > 0 && (now - next.lastFedAt) > 25 * 60 * 1000 &&
      (now - (next.lastMysteryNudgeAt ?? 0)) > 45 * 60 * 1000 &&
      Math.random() < 0.55) {
    const used = ELEMENTS.filter(e => (next.affinity[e.id] ?? 0) > 0).length;
    if (used >= 5) {
      next = pushJournal(next, "mystery", pick(VERSATILE_HINTS));
    } else {
      const dom = dominantElement(next.affinity);
      const hint = pick(ENIGMATIC_LINES[dom] ?? MYSTERY_LINES);
      next = pushJournal(next, "mystery", hint, dom);
    }
    next = { ...next, lastMysteryNudgeAt: now };
  }

  return next;
}

/** Reage a uma alimentação: felicidade, absorção, obsessão, mistério, excesso. */
function reactToFeed(egg: EggInstance, element: ElementId): EggInstance {
  let next = egg;
  const matchedCraving = next.cravingElement === element;

  if (matchedCraving) {
    next = pushJournal(next, "happy", pick(HAPPY_MATCH), element);
    next = { ...next, matchedCravings: next.matchedCravings + 1 };
    const newCraving = pickCraving({ ...next, cravingElement: element });
    next = { ...next, cravingElement: newCraving, cravingSince: Date.now(), lastCravingNudgeAt: Date.now() };
    const el = ELEMENTS.find(e => e.id === newCraving)!;
    next = pushJournal(next, "craving", `Agora... sinto falta de ${el.emoji} ${el.label}. ${pick(CRAVING_LINES[newCraving])}`, newCraving);
  } else {
    next = pushJournal(next, "absorbing", pick(ABSORB_LINES), element);
  }

  // Streak / obsessão
  const streakCount = next.streakElement === element ? next.streakCount + 1 : 1;
  next = { ...next, streakElement: element, streakCount };
  if (streakCount === 3 || streakCount === 5 || streakCount === 8) {
    next = pushJournal(next, "obsession", pick(OBSESSION_LINES), element);
  }

  // Excesso — anuncia em marcos de totalFed (500, 1000, 2000, 3500, 5000)
  const MILESTONES = [500, 1000, 2000, 3500, 5000];
  for (const m of MILESTONES) {
    if (next.totalFed >= m && next.lastMilestone < m) {
      next = pushJournal(next, "obsession", pick(EXCESS_LINES));
      next = { ...next, lastMilestone: m };
      break;
    }
  }

  // Mistério ocasional a cada ~4 feeds
  if (next.totalFed > 0 && Math.floor(next.totalFed / FEED_COST) % 4 === 0 && Math.random() < 0.6) {
    next = pushJournal(next, "mystery", pick(MYSTERY_LINES));
  }

  return next;
}


// ================================================================
// Sprite (pet flutuante único)
// ================================================================
export function BlackMiticEggSprite(props: {
  trainerX: number;
  trainerY: number;
  visible: boolean;
  onClick: () => void;
}) {
  const { trainerX, trainerY, visible, onClick } = props;
  const [pos, setPos] = useState({ x: trainerX - 42, y: trainerY - 8 });
  const posRef = useRef(pos);
  const targetRef = useRef({ x: trainerX - 42, y: trainerY - 8 });
  const rafRef = useRef<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => { targetRef.current = { x: trainerX - 46, y: trainerY - 10 }; }, [trainerX, trainerY]);

  useEffect(() => {
    if (!visible) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = targetRef.current; const cur = posRef.current;
      const nx = cur.x + (t.x - cur.x) * Math.min(1, dt * 5);
      const ny = cur.y + (t.y - cur.y) * Math.min(1, dt * 5);
      posRef.current = { x: nx, y: ny };
      setPos(posRef.current);
      setTick((v) => (v + 1) % 3600);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [visible]);

  if (!visible) return null;

  const bob = Math.sin(tick * 0.09) * 5;
  const rot = Math.sin(tick * 0.05) * 6;
  const auraPulse = 0.7 + Math.sin(tick * 0.08) * 0.3;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", left: pos.x, top: pos.y + bob,
        width: 46, height: 46,
        transform: "translate(-50%, -50%)",
        zIndex: Math.round(trainerY) + 1,
        cursor: "pointer", pointerEvents: "auto",
      }}
      title="Black Mitic Plus Egg — clique para abrir o painel"
    >
      <div style={{
        position: "absolute", inset: -18, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(160,80,255,${0.45 * auraPulse}) 0%, rgba(120,40,220,${0.25 * auraPulse}) 40%, transparent 70%)`,
        filter: "blur(4px)", pointerEvents: "none",
      }} />
      {[0, 1, 2, 3].map((i) => {
        const ang = (tick * 0.04 + i * (Math.PI / 2)) % (Math.PI * 2);
        const r = 22 + Math.sin(tick * 0.15 + i) * 4;
        const x = 23 + Math.cos(ang) * r;
        const y = 23 + Math.sin(ang) * r;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: 3, height: 3,
            background: "#c58bff", boxShadow: "0 0 6px #a066ff, 0 0 12px #7020c0",
            borderRadius: 1, transform: "translate(-50%,-50%)", pointerEvents: "none",
          }} />
        );
      })}
      <img
        src={eggSprite} alt="" draggable={false}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          imageRendering: "pixelated",
          transform: `rotate(${rot}deg)`,
          filter: "drop-shadow(0 3px 4px rgba(90,20,180,0.7)) drop-shadow(0 0 6px rgba(160,80,255,0.6))",
        }}
      />
    </div>
  );
}

// ================================================================
// Ícone de acesso rápido (HUD, perto do troféu)
// ================================================================
export function BlackMiticEggQuickIcon(props: {
  count: number;
  onOpen: () => void;
  ready?: boolean;
}) {
  const { count, onOpen, ready } = props;
  if (count <= 0) return null;
  return (
    <button
      onClick={onOpen}
      title={`Black Mitic Plus Egg (${count})${ready ? " — pronto para chocar!" : ""}`}
      style={{
        position: "relative", width: 40, height: 40, padding: 0,
        background: "transparent", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        position: "absolute", inset: -4, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(160,80,255,0.55), transparent 70%)",
        animation: "blackEggIconPulse 2s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <img
        src={eggSprite}
        alt="Black Mitic Plus Egg"
        width={32}
        height={32}
        style={{
          imageRendering: "pixelated",
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.7)) drop-shadow(0 0 4px rgba(160,80,255,0.8))",
          position: "relative",
        }}
        draggable={false}
      />
      {count > 1 && (
        <span style={{
          position: "absolute", right: -2, bottom: -2,
          background: "#a066ff", color: "#fff",
          fontSize: 9, fontWeight: 700,
          padding: "1px 5px", borderRadius: 8,
          border: "1px solid #1a0a30",
          fontFamily: "'Press Start 2P', monospace",
        }}>{count}</span>
      )}
      {ready && (
        <span style={{
          position: "absolute", top: -4, left: -4,
          width: 10, height: 10, borderRadius: "50%",
          background: "#3fd06b", boxShadow: "0 0 6px #3fd06b",
          animation: "blackEggIconPulse 1s ease-in-out infinite",
        }} />
      )}
      <style>{`@keyframes blackEggIconPulse { 0%,100%{opacity:.6;transform:scale(1);} 50%{opacity:1;transform:scale(1.15);} }`}</style>
    </button>
  );
}

// ================================================================
// HUD Modal — painel único de todos os ovos
// ================================================================
export function BlackMiticEggHud(props: {
  open: boolean;
  onClose: () => void;
  uid: string;
  itemCount: number;                                   // quantidade em items[black_mitic_egg]
  stones: Partial<Record<StoneId, number>>;
  onConsumeStone: (stoneId: StoneId, qty: number) => boolean;
  onHatched: (species: string, element: ElementId, traits: string[]) => void;   // parent grants pokemon + decrementa item
  onNotify?: (msg: string) => void;
  hasIncubatorCard?: boolean;                          // gate para "ATIVAR INICIAÇÃO"
  onActivateEgg?: () => void;                          // primeira ativação — parent consome carta / marca unlock permanente
}) {
  const { open, onClose, uid, itemCount, stones, onConsumeStone, onHatched, onNotify, hasIncubatorCard = false, onActivateEgg } = props;
  const [state, setState] = useState<CollectionState>(() => loadState(uid));
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState<"journal" | "feeds">("journal");

  // ---- Cloud sync (Supabase) --------------------------------------------
  // Nenhum jogador perde progresso: puxamos o snapshot do servidor ao abrir
  // (fonte da verdade) e empurramos, com debounce, sempre que o estado muda.
  const fetchCloud = useServerFn(getBlackEggSave);
  const pushCloud = useServerFn(saveBlackEggSave);
  const cloudReadyRef = useRef(false);
  const cloudUidRef = useRef<string | null>(null);
  const pushInFlightRef = useRef(false);
  const pushPendingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reseta o gate de sync se o uid mudar (troca de conta).
  useEffect(() => {
    if (cloudUidRef.current !== uid) {
      cloudReadyRef.current = false;
      cloudUidRef.current = uid;
    }
  }, [uid]);

  // Pull inicial ao abrir o painel: cloud manda no local (garante que ao
  // abrir em outra máquina/limpar cache o progresso volta do banco).
  useEffect(() => {
    if (!open) return;
    if (!uid || uid === "guest" || uid.startsWith("guest")) {
      cloudReadyRef.current = true; // convidado: só local
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = (await fetchCloud({} as any)) as { data: any; updated_at: string | null };
        if (cancelled) return;
        // Aceita formato novo { eggs, selectedId } e legado { data: { eggs, selectedId } }
        // (push antigo envolvia o estado duas vezes; sem isso a nuvem "somia" no reload).
        let remote: any = res?.data;
        if (remote && !Array.isArray(remote.eggs) && remote.data && Array.isArray(remote.data.eggs)) {
          remote = remote.data;
        }
        if (remote && Array.isArray(remote.eggs)) {
          const merged: CollectionState = {
            eggs: remote.eggs as EggInstance[],
            selectedId: typeof remote.selectedId === "string" ? remote.selectedId : (remote.eggs[0]?.id ?? null),
            hatchedHistory: Array.isArray(remote.hatchedHistory) ? remote.hatchedHistory.slice(-10) : [],
          };
          setState(merged);
          saveState(uid, merged);
        }
        // Só libera push depois de um pull bem-sucedido: se a leitura falhar,
        // NÃO empurramos o local por cima da nuvem (isso zerava o progresso).
        cloudReadyRef.current = true;
      } catch (e) {
        console.warn("[BlackEgg] pull cloud falhou (push bloqueado até próxima abertura):", e);
      } finally {
        // noop — cloudReadyRef só vira true no caminho de sucesso acima.
      }
    })();
    return () => { cancelled = true; };
  }, [open, uid, fetchCloud]);

  // Push debounced sempre que o estado muda (depois que o pull terminou).
  useEffect(() => {
    if (!cloudReadyRef.current) return;
    if (!uid || uid === "guest" || uid.startsWith("guest")) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      if (pushInFlightRef.current) { pushPendingRef.current = true; return; }
      pushInFlightRef.current = true;
      try {
        await pushCloud({ data: { data: state as any } as any } as any);
      } catch (e) {
        console.warn("[BlackEgg] push cloud falhou:", e);
      } finally {
        pushInFlightRef.current = false;
        if (pushPendingRef.current) {
          pushPendingRef.current = false;
          // dispara outro ciclo curto pra não segurar mudanças recentes
          if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
          pushTimerRef.current = setTimeout(() => {
            pushCloud({ data: { data: state as any } as any } as any).catch(() => { /* ignore */ });
          }, 800);
        }
      }
    }, 1500);
    return () => { if (pushTimerRef.current) clearTimeout(pushTimerRef.current); };
  }, [state, uid, pushCloud]);

  // Flush final ao fechar o painel / desmontar / esconder aba.
  useEffect(() => {
    const flush = () => {
      if (!cloudReadyRef.current) return;
      if (!uid || uid === "guest" || uid.startsWith("guest")) return;
      try { pushCloud({ data: { data: state as any } } as any).catch(() => {}); } catch { /* ignore */ }
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [state, uid, pushCloud]);


  // Sincroniza número de ovos com itemCount (adiciona novos inativos, ou remove excesso do fim entre os NÃO ativados)
  useEffect(() => {
    setState((prev) => {
      let eggs = [...prev.eggs];
      if (eggs.length < itemCount) {
        while (eggs.length < itemCount) eggs.push(newEgg());
      } else if (eggs.length > itemCount) {
        const toRemove = eggs.length - itemCount;
        // remove primeiro os inativos e mais recentes
        const removable = [...eggs].map((e, i) => ({ e, i })).filter(x => !x.e.activated);
        const removeIdx = new Set(removable.slice(-toRemove).map(x => x.i));
        eggs = eggs.filter((_, i) => !removeIdx.has(i));
        // se ainda sobrou, remove os ativados mais recentes
        while (eggs.length > itemCount) eggs.pop();
      }
      let selectedId = prev.selectedId;
      if (!selectedId || !eggs.some(e => e.id === selectedId)) selectedId = eggs[0]?.id ?? null;
      const next = { eggs, selectedId };
      saveState(uid, next);
      return next;
    });
  }, [itemCount, uid]);

  useEffect(() => { if (open) setState(loadState(uid)); }, [open, uid]);

  useEffect(() => {
    if (!open) return;
    const idNow = setInterval(() => setNow(Date.now()), 500);
    const advance = () => {
      setState((prev) => {
        let changed = false;
        const eggs = prev.eggs.map(e => {
          const ne = advanceJournal(e, Date.now());
          if (ne !== e) changed = true;
          return ne;
        });
        if (!changed) return prev;
        const next = { ...prev, eggs };
        saveState(uid, next);
        return next;
      });
    };
    advance();
    const idAdv = setInterval(advance, 10000);
    return () => { clearInterval(idNow); clearInterval(idAdv); };
  }, [open, uid]);

  const selected = useMemo(
    () => state.eggs.find(e => e.id === state.selectedId) ?? state.eggs[0] ?? null,
    [state]
  );

  const persist = (updater: (s: CollectionState) => CollectionState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(uid, next);
      return next;
    });
  };

  const activate = () => {
    if (!selected) return;
    if (!hasIncubatorCard) {
      onNotify?.("Você precisa da Carta da Incubadora Lendária para ativar este ovo.");
      return;
    }
    persist((s) => ({
      ...s,
      eggs: s.eggs.map(e => {
        if (e.id !== selected.id) return e;
        let ne: EggInstance = { ...e, activated: true, activatedAt: Date.now() };
        ne = pushJournal(ne, "greeting", pick(GREETINGS));
        const craving = pickCraving(ne);
        ne = { ...ne, cravingElement: craving, cravingSince: Date.now() };
        const el = ELEMENTS.find(x => x.id === craving)!;
        ne = pushJournal(ne, "craving", pick(CRAVING_LINES[craving]) + ` (${el.emoji} ${el.label})`, craving);
        return ne;
      }),
    }));
    onActivateEgg?.();
    onNotify?.("Incubação iniciada! 10 horas para chocar.");
  };

  const feed = (el: typeof ELEMENTS[number]) => {
    if (!selected) return;
    if (!selected.activated) { onNotify?.("Ative a incubação antes de alimentar."); return; }
    const cdRemain = Math.max(0, (selected.lastFedAt + FEED_COOLDOWN_MS) - Date.now());
    if (cdRemain > 0) { onNotify?.(`Aguarde ${fmt(cdRemain)} para alimentar novamente.`); return; }
    const have = stones[el.stone] ?? 0;
    if (have < FEED_COST) { onNotify?.(`Você precisa de ${FEED_COST}× ${el.label} Stone.`); return; }
    if (!onConsumeStone(el.stone, FEED_COST)) { onNotify?.("Falha ao consumir a Stone."); return; }
    persist((s) => ({
      ...s,
      eggs: s.eggs.map(e => {
        if (e.id !== selected.id) return e;
        let ne: EggInstance = {
          ...e,
          affinity: { ...e.affinity, [el.id]: (e.affinity[el.id] ?? 0) + FEED_COST },
          totalFed: e.totalFed + FEED_COST,
          lastFedAt: Date.now(),
          history: [{ ts: Date.now(), element: el.id, amount: FEED_COST }, ...e.history].slice(0, 20),
          lastHungerNudgeAt: Date.now(),
          lastReadyNudgeAt: 0,
          recentFeedAt: { ...e.recentFeedAt, [el.id]: Date.now() },
        };
        ne = reactToFeed(ne, el.id);
        return ne;
      }),
    }));
    onNotify?.(`+${FEED_COST} ${el.label} → afinidade aumentada.`);
  };

  // Pool aleatório usado quando o ovo atinge "Versátil" (5+ elementos alimentados).
  // Nesse caso o Pokémon nasce sorteado dentre lendários/míticos fortes.
  const VERSATILE_POOL: string[] = [
    "mewtwo", "mew", "groudon", "lugia", "ho_oh",
    "moltres", "zapdos", "articuno", "raikou", "suicune",
    "dialga", "darkrai",
    "snorlax", "snorlax_mythic", "tyranitar",
    "lucario", "scizor", "machamp",
    "dragonite_shiny", "charizard_shiny", "blastoise_shiny",
    "venusaur", "charizard", "blastoise",
  ];

  const hatch = () => {
    if (!selected) return;
    if (!selected.activated) return;
    const remain = Math.max(0, (selected.activatedAt + HATCH_MS) - Date.now());
    if (remain > 0) { onNotify?.(`Ainda faltam ${fmt(remain)} para chocar.`); return; }
    const el = ELEMENTS.find(e => e.id === dominantElement(selected.affinity))!;
    const arch = computeArchetype(selected.affinity);
    const care = computeCareScore(selected);
    const traits = rollBlackMiticTraits(selected, arch);
    // Anti-duplicata: para players com múltiplos eggs, evitamos repetir a mesma
    // espécie da pool versátil enquanto houver alternativas.
    const recent = new Set(state.hatchedHistory ?? []);
    let species: string;
    if (arch === "versatile") {
      const unused = VERSATILE_POOL.filter(s => !recent.has(s));
      const pool = unused.length > 0 ? unused : VERSATILE_POOL;
      species = pool[Math.floor(Math.random() * pool.length)];
    } else {
      species = el.species;
    }
    onHatched(species, el.id, traits);
    persist((s) => {
      const eggs = s.eggs.filter(e => e.id !== selected.id);
      const hist = [...(s.hatchedHistory ?? []), species].slice(-10);
      return { eggs, selectedId: eggs[0]?.id ?? null, hatchedHistory: hist };
    });
    onNotify?.(`✦ Nasceu ${species.toUpperCase()} (${el.label}) — ${ARCHETYPE_META[arch].label} · Cuidado ${care}/100!`);
  };

  if (!open) return null;

  const dominant = selected ? dominantElement(selected.affinity) : "grass";
  const totalAffinity = selected ? Math.max(1, Object.values(selected.affinity).reduce((a, b) => a + b, 0)) : 1;
  const hatchElapsed = selected && selected.activated ? Math.min(HATCH_MS, now - selected.activatedAt) : 0;
  const hatchRemain = selected && selected.activated ? Math.max(0, HATCH_MS - hatchElapsed) : HATCH_MS;
  const hatchPct = selected && selected.activated ? hatchElapsed / HATCH_MS : 0;
  const readyToHatch = selected?.activated && hatchRemain <= 0;
  const feedCdRemain = selected ? Math.max(0, (selected.lastFedAt + FEED_COOLDOWN_MS) - now) : 0;
  const feedReady = selected?.activated && feedCdRemain <= 0;

  const node = (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(30,10,60,0.65), rgba(0,0,0,0.9))",
        zIndex: 999998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 96vw)", maxHeight: "94vh", overflowY: "auto",
          background: "linear-gradient(180deg, #1a0a30 0%, #0f0620 100%)",
          border: "2px solid #7d3fd6",
          boxShadow: "0 0 32px rgba(160,80,255,0.55), inset 0 0 24px rgba(60,20,120,0.4)",
          borderRadius: 14, color: "#f0e6ff",
          fontFamily: "'Press Start 2P', monospace, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 18px",
          background: "linear-gradient(90deg, rgba(120,40,220,0.35), rgba(60,15,120,0.1))",
          borderBottom: "1px solid rgba(160,80,255,0.4)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 14, color: "#e0b8ff", letterSpacing: 2 }}>✦ BLACK MITIC PLUS EGG ✦</div>
            <div style={{ fontSize: 9, color: "#a888c8", marginTop: 4 }}>
              Ovos: <b>{state.eggs.length}</b> · Selecione um ovo abaixo para gerenciar
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(120,40,220,0.3)", color: "#fff",
            border: "1px solid #a066ff", borderRadius: 6,
            padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11,
          }}>FECHAR ✕</button>
        </div>

        {/* Seletor de ovos */}
        {state.eggs.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#a888c8", fontSize: 11 }}>
            Nenhum Black Mitic Plus Egg em sua posse.
          </div>
        ) : (
          <>
            <div style={{
              padding: "10px 14px", borderBottom: "1px solid rgba(160,80,255,0.25)",
              display: "flex", gap: 8, flexWrap: "wrap", background: "rgba(0,0,0,0.2)",
            }}>
              {state.eggs.map((e, i) => {
                const isSel = e.id === selected?.id;
                const done = e.activated && (Date.now() - e.activatedAt) >= HATCH_MS;
                return (
                  <button
                    key={e.id}
                    onClick={() => persist((s) => ({ ...s, selectedId: e.id }))}
                    style={{
                      padding: "6px 10px",
                      background: isSel
                        ? "linear-gradient(180deg, rgba(160,80,255,0.4), rgba(120,40,220,0.2))"
                        : "rgba(30,10,60,0.5)",
                      border: `1px solid ${isSel ? "#c58bff" : "rgba(160,80,255,0.3)"}`,
                      borderRadius: 6, color: "#fff", cursor: "pointer",
                      fontSize: 9, display: "flex", alignItems: "center", gap: 6,
                      boxShadow: isSel ? "0 0 8px rgba(160,80,255,0.6)" : "none",
                    }}
                  >
                    <img src={eggSprite} alt="" width={16} height={16} style={{ imageRendering: "pixelated" }} />
                    Ovo #{i + 1}
                    {done && <span style={{ color: "#3fd06b" }}>✓</span>}
                    {!e.activated && <span style={{ color: "#ffb857" }}>◇</span>}
                  </button>
                );
              })}
            </div>

            {/* Corpo */}
            {selected && (
              <div style={{ padding: 18, display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
                {/* Esquerda: incubadora / sprite + status */}
                <div style={{
                  background: "rgba(30,10,60,0.6)",
                  border: "1px solid rgba(160,80,255,0.35)",
                  borderRadius: 10, padding: 12,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                }}>
                  <div style={{ position: "relative", width: 200, height: 200 }}>
                    {/* Incubadora sempre visível */}
                    <img src={incubatorSprite} alt="" style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      imageRendering: "pixelated",
                      filter: selected.activated
                        ? "drop-shadow(0 0 10px rgba(160,80,255,0.9))"
                        : "drop-shadow(0 0 6px rgba(60,20,120,0.5)) grayscale(0.3)",
                      opacity: selected.activated ? 1 : 0.85,
                    }} />
                    {/* Aura extra quando ativado */}
                    {selected.activated && (
                      <div style={{
                        position: "absolute", inset: -8, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(160,80,255,0.4), transparent 70%)",
                        animation: "blackEggPulse 2s ease-in-out infinite", pointerEvents: "none",
                      }} />
                    )}
                    {/* Marca de pronto */}
                    {readyToHatch && (
                      <div style={{
                        position: "absolute", top: -6, right: -6,
                        background: "#3fd06b", color: "#0a2010",
                        fontSize: 8, fontWeight: 700, padding: "3px 6px",
                        borderRadius: 6, border: "1px solid #0a2010",
                        animation: "blackEggPulse 1s ease-in-out infinite",
                      }}>PRONTO!</div>
                    )}
                  </div>

                  {!selected.activated ? (
                    <>
                      <button
                        onClick={activate}
                        disabled={!hasIncubatorCard}
                        title={hasIncubatorCard ? "Ativar a incubação (10h)" : "Requer Carta da Incubadora Lendária"}
                        style={{
                          width: "100%", padding: "10px 8px",
                          background: hasIncubatorCard
                            ? "linear-gradient(180deg, #a066ff, #6b28c8)"
                            : "linear-gradient(180deg, #3a2050, #1e0f30)",
                          border: `1px solid ${hasIncubatorCard ? "#c58bff" : "#5a3a7a"}`,
                          borderRadius: 8,
                          color: hasIncubatorCard ? "#fff" : "#8a6ab0",
                          fontWeight: 700, fontSize: 11,
                          cursor: hasIncubatorCard ? "pointer" : "not-allowed", letterSpacing: 1,
                          boxShadow: hasIncubatorCard ? "0 0 12px rgba(160,80,255,0.7)" : "none",
                        }}
                      >⚡ ATIVAR INICIAÇÃO</button>
                      {!hasIncubatorCard && (
                        <div style={{
                          fontSize: 8, color: "#ffb857", textAlign: "center", lineHeight: 1.5,
                          padding: "6px 4px", background: "rgba(80,40,10,0.35)",
                          border: "1px dashed #a06010", borderRadius: 6, width: "100%",
                        }}>
                          🔒 Requer <b style={{ color: "#ffd88a" }}>Carta da Incubadora Lendária</b> no inventário.
                        </div>
                      )}
                    </>
                  ) : readyToHatch ? (
                    <button
                      onClick={hatch}
                      style={{
                        width: "100%", padding: "10px 8px",
                        background: "linear-gradient(180deg, #4fd66b, #2a8a3f)",
                        border: "1px solid #a0ff8f", borderRadius: 8,
                        color: "#0a2010", fontWeight: 700, fontSize: 11,
                        cursor: "pointer", letterSpacing: 1,
                        boxShadow: "0 0 12px rgba(80,220,110,0.8)",
                        animation: "blackEggPulse 1.4s ease-in-out infinite",
                      }}>✦ CHOCAR AGORA</button>
                  ) : (
                    <div style={{ width: "100%", fontSize: 9, color: "#c8a0e8" }}>
                      <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                        <span>🥚 Incubação</span>
                        <span>{Math.round(hatchPct * 100)}%</span>
                      </div>
                      <div style={{ height: 12, background: "rgba(0,0,0,0.5)", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(160,80,255,0.4)" }}>
                        <div style={{
                          height: "100%", width: `${hatchPct * 100}%`,
                          background: "linear-gradient(90deg, #7d3fd6, #c58bff)",
                          transition: "width 0.4s ease",
                          boxShadow: "0 0 8px rgba(160,80,255,0.7)",
                        }} />
                      </div>
                      <div style={{ marginTop: 4, textAlign: "center", color: "#e0b8ff" }}>{fmt(hatchRemain)} restante</div>
                    </div>
                  )}

                  <div style={{ fontSize: 9, color: "#d8bfff", textAlign: "center", width: "100%" }}>
                    Total alimentado: <b>{selected.totalFed}</b><br />
                    Elemento dominante: <b style={{ color: ELEMENTS.find(e => e.id === dominant)?.color }}>
                      {ELEMENTS.find(e => e.id === dominant)?.label}
                    </b>
                  </div>
                </div>

                {/* Direita: afinidade + alimentação + histórico */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Card de Arquetipo + Cuidado */}
                  {(() => {
                    const arch = computeArchetype(selected.affinity);
                    const meta = ARCHETYPE_META[arch];
                    const care = computeCareScore(selected);
                    return (
                      <div style={{
                        background: `linear-gradient(135deg, ${meta.color}22, rgba(30,10,60,0.6))`,
                        border: `1px solid ${meta.color}77`,
                        borderRadius: 10, padding: 12,
                        display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center",
                        boxShadow: `0 0 12px ${meta.color}33`,
                      }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: `radial-gradient(circle, ${meta.color}66, ${meta.color}11)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 22, border: `1px solid ${meta.color}`,
                        }}>{meta.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: meta.color, letterSpacing: 1 }}>ARQUÉTIPO</div>
                          <div style={{ fontSize: 12, color: "#fff", marginTop: 2 }}>{meta.label}</div>
                          <div style={{ fontSize: 8, color: "#c8a0e8", marginTop: 3, fontFamily: "ui-monospace, monospace", fontStyle: "italic" }}>{meta.desc}</div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 70 }}>
                          <div style={{ fontSize: 8, color: "#a888c8", letterSpacing: 1 }}>CUIDADO</div>
                          <div style={{ fontSize: 16, color: care >= 70 ? "#a0ffb0" : care >= 40 ? "#ffd84d" : "#ff9090", fontWeight: 700 }}>{care}<span style={{ fontSize: 9, color: "#a888c8" }}>/100</span></div>
                          <div style={{ height: 4, marginTop: 3, background: "rgba(0,0,0,0.5)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${care}%`, background: `linear-gradient(90deg, #ff6b3d, #ffd84d, #a0ffb0)`, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{
                    background: "rgba(30,10,60,0.5)",
                    border: "1px solid rgba(160,80,255,0.3)",
                    borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ fontSize: 11, color: "#e0b8ff", marginBottom: 10, letterSpacing: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>◆ AFINIDADE & ALIMENTAÇÃO</span>
                      <span style={{
                        fontSize: 8,
                        color: !selected.activated ? "#ff9090" : feedReady ? "#a0ffb0" : "#ffb857",
                      }}>
                        {!selected.activated ? (hasIncubatorCard ? "Ative primeiro" : "Aguarda carta") : feedReady ? `Pronto · ${FEED_COST}/feed` : `⏱ ${fmt(feedCdRemain)}`}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ELEMENTS.map((el) => {
                        const val = selected.affinity[el.id] ?? 0;
                        const pct = Math.round((val / totalAffinity) * 100);
                        const recent = selected.recentFeedAt?.[el.id] ?? 0;
                        const isRecent = recent > 0 && (now - recent) < 4000;
                        const isDominant = el.id === dominant && val > 0;
                        const have = stones[el.stone] ?? 0;
                        const canFeed = selected.activated && feedReady && have >= FEED_COST;
                        const craving = selected.cravingElement === el.id;
                        return (
                          <div key={el.id} style={{
                            display: "grid", gridTemplateColumns: "40px 1fr auto", gap: 10, alignItems: "center",
                            padding: "8px 10px",
                            background: isDominant
                              ? `linear-gradient(90deg, ${el.color}22, rgba(0,0,0,0.25))`
                              : "rgba(0,0,0,0.25)",
                            border: `1px solid ${isDominant ? el.color + "77" : "rgba(160,80,255,0.18)"}`,
                            borderRadius: 8,
                            transform: isRecent ? "scale(1.02)" : "scale(1)",
                            transition: "transform 0.3s ease",
                            boxShadow: isRecent ? `0 0 14px ${el.color}` : "none",
                          }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 8,
                              background: `radial-gradient(circle, ${el.color}44, ${el.color}11)`,
                              border: `1px solid ${el.color}88`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: isRecent ? `0 0 12px ${el.color}` : "none",
                              animation: isRecent ? "blackEggStoneFlash 0.6s ease-out" : undefined,
                            }}>
                              <ItemPixelIcon id={el.stone} size={28} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 9, color: el.color, letterSpacing: 1, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                <span>{el.label.toUpperCase()}</span>
                                <span style={{ fontSize: 8, color: have >= FEED_COST ? "#c8ffd0" : "#ff9a9a", background: "rgba(0,0,0,0.4)", padding: "1px 5px", borderRadius: 3 }}>
                                  x{have}
                                </span>
                                {isDominant && <span style={{ fontSize: 7, color: "#fff", background: el.color, padding: "1px 4px", borderRadius: 3 }}>DOM</span>}
                                {craving && <span style={{ fontSize: 8, color: "#ff9ad6" }}>❥ desejo</span>}
                              </div>
                              <div style={{ position: "relative", height: 10, marginTop: 5, background: "rgba(0,0,0,0.55)", borderRadius: 5, overflow: "hidden", border: `1px solid ${el.color}44` }}>
                                <div style={{
                                  height: "100%", width: `${pct}%`,
                                  background: `linear-gradient(90deg, ${el.color}, ${el.color}dd)`,
                                  boxShadow: `0 0 8px ${el.color}`,
                                  transition: "width 0.5s ease",
                                  position: "relative",
                                }}>
                                  <div style={{
                                    position: "absolute", inset: 0,
                                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                                    animation: "blackEggShine 2.5s linear infinite",
                                  }} />
                                </div>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#a888c8", marginTop: 3 }}>
                                <span>{val} pts</span>
                                <span style={{ color: "#fff", fontWeight: 700 }}>{pct}%</span>
                              </div>
                            </div>
                            <button
                              onClick={() => feed(el)}
                              disabled={!canFeed}
                              title={
                                !selected.activated ? "Ative a incubação primeiro"
                                : !feedReady ? `Aguarde ${fmt(feedCdRemain)}`
                                : have < FEED_COST ? `Faltam ${FEED_COST - have} stones`
                                : `Alimentar (${FEED_COST}× ${el.label})`
                              }
                              style={{
                                minWidth: 62, padding: "8px 6px",
                                background: canFeed
                                  ? `linear-gradient(180deg, ${el.color}66, ${el.color}22)`
                                  : "rgba(40,20,60,0.5)",
                                border: `1px solid ${canFeed ? el.color : "#4a2a6a"}`,
                                color: canFeed ? "#fff" : "#7a5a9a",
                                borderRadius: 7,
                                cursor: canFeed ? "pointer" : "not-allowed",
                                fontSize: 9, fontWeight: 700, letterSpacing: 1,
                                boxShadow: canFeed ? `0 0 10px ${el.color}66` : "none",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                              }}
                            >
                              <span>ALIMENTAR</span>
                              <span style={{ fontSize: 8, opacity: 0.85 }}>{FEED_COST}×</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{
                    background: "rgba(30,10,60,0.5)",
                    border: "1px solid rgba(160,80,255,0.3)",
                    borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                      {([
                        { id: "journal", label: `◆ DIÁRIO (${selected.journal.length})` },
                        { id: "feeds",   label: `◆ ALIMENTAÇÕES (${selected.history.length})` },
                      ] as const).map((t) => {
                        const active = tab === t.id;
                        return (
                          <button key={t.id} onClick={() => setTab(t.id)} style={{
                            flex: 1, padding: "6px 8px", fontSize: 9, letterSpacing: 1,
                            background: active
                              ? "linear-gradient(180deg, rgba(160,80,255,0.45), rgba(120,40,220,0.2))"
                              : "rgba(20,8,40,0.6)",
                            border: `1px solid ${active ? "#c58bff" : "rgba(160,80,255,0.3)"}`,
                            color: active ? "#fff" : "#a888c8",
                            borderRadius: 6, cursor: "pointer",
                            boxShadow: active ? "0 0 8px rgba(160,80,255,0.5)" : "none",
                          }}>{t.label}</button>
                        );
                      })}
                    </div>

                    {tab === "journal" ? (
                      selected.journal.length === 0 ? (
                        <div style={{ fontSize: 9, color: "#8a6ab0", textAlign: "center", padding: 10, lineHeight: 1.6 }}>
                          O ovo ainda dorme.<br />Ative a incubação para ouvi-lo.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                          {selected.journal.map((j, i) => {
                            const meta = MOOD_META[j.mood];
                            const el = j.element ? ELEMENTS.find(x => x.id === j.element) : null;
                            const ago = Math.floor((now - j.ts) / 60000);
                            const when = ago < 1 ? "agora mesmo" : ago < 60 ? `há ${ago} min` : ago < 60 * 24 ? `há ${Math.floor(ago / 60)}h` : `há ${Math.floor(ago / (60 * 24))}d`;
                            return (
                              <div key={i} style={{
                                display: "flex", gap: 8, alignItems: "flex-start",
                                padding: "8px 10px",
                                background: `linear-gradient(180deg, ${meta.color}18, rgba(0,0,0,0.35))`,
                                border: `1px solid ${meta.color}55`,
                                borderLeft: `3px solid ${meta.color}`,
                                borderRadius: 6,
                              }}>
                                <div style={{
                                  fontSize: 14, color: meta.color, lineHeight: 1,
                                  textShadow: `0 0 6px ${meta.color}`,
                                }}>{meta.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 8, color: meta.color, letterSpacing: 1, marginBottom: 3 }}>
                                    {meta.label.toUpperCase()}{el ? ` · ${el.emoji} ${el.label}` : ""} · <span style={{ color: "#8a6ab0" }}>{when}</span>
                                  </div>
                                  <div style={{ fontSize: 10, color: "#f0e6ff", lineHeight: 1.55, fontFamily: "ui-monospace, monospace", fontStyle: "italic" }}>
                                    “{j.text}”
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      selected.history.length === 0 ? (
                        <div style={{ fontSize: 9, color: "#8a6ab0", textAlign: "center", padding: 8 }}>Nenhuma alimentação ainda.</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                          {selected.history.map((h, i) => {
                            const el = ELEMENTS.find(e => e.id === h.element)!;
                            const ago = Math.floor((now - h.ts) / 60000);
                            return (
                              <div key={i} style={{ fontSize: 9, color: "#c8a0e8", display: "flex", justifyContent: "space-between", padding: "4px 6px", background: "rgba(0,0,0,0.25)", borderRadius: 4 }}>
                                <span><span style={{ color: el.color }}>{el.emoji} {el.label}</span> +{h.amount}</span>
                                <span>{ago < 1 ? "agora" : ago < 60 ? `${ago}min` : `${Math.floor(ago/60)}h`}</span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <style>{`
          @keyframes blackEggFloat {
            0%,100% { transform: translateY(0) rotate(-4deg); }
            50% { transform: translateY(-10px) rotate(4deg); }
          }
          @keyframes blackEggPulse {
            0%,100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.1); }
          }
          @keyframes blackEggShine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes blackEggStoneFlash {
            0% { transform: scale(1); filter: brightness(1); }
            40% { transform: scale(1.25); filter: brightness(1.8); }
            100% { transform: scale(1); filter: brightness(1); }
          }
        `}</style>
      </div>
    </div>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}

// Helper para o pai saber se algum ovo está pronto (para badge no ícone HUD)
export function hasReadyEgg(uid: string): boolean {
  try {
    const s = loadState(uid);
    return s.eggs.some(e => e.activated && (Date.now() - e.activatedAt) >= HATCH_MS);
  } catch { return false; }
}
