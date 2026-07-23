import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import eggSprite from "@/assets/black-mitic-egg.png";
import incubatorSprite from "@/assets/black-mitic-incubator.png";
import eggMusicAsset from "@/assets/egg-transitus.mp3.asset.json";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";
import { getBlackEggSave, saveBlackEggSave } from "@/lib/blackEgg.functions";
import { getMusicState, setMusicSuspended, subscribeMusic } from "@/lib/musicControl";

// ============================================================================
// Black Mitic Plus Egg — sistema unificado
// - Suporta múltiplos ovos em UM único painel (seleção por ovo).
// - Cooldown de alimentação: 1h entre feeds.
// - Incubação: 20h (conta apenas depois de "ATIVAR INICIAÇÃO").
export const BLACK_EGG_ITEM_ID = "black_mitic_egg";
export const BLACK_MITIC_EGG_DESCRIPTION =
  "Black Mitic Plus Egg — coloque na incubadora e ative para começar a chocar (20h). Alimente com Elemental Stones (50 por vez, 1h de cooldown). O elemento dominante define o tipo do Pokémon que nascerá com 5 traits.";

const FEED_COOLDOWN_MS = 0;                      // sem cooldown — alimentação ilimitada
const HATCH_MS = 20 * 60 * 60 * 1000;            // 20h incubação
const FEED_COST = 50;
// --- Sistema BONUS (rompimento dos elementais) ---
const BONUS_UNLOCK_PCT = 0.70;                    // libera aos 70% de incubação
const BONUS_COOLDOWN_MS = 0;                      // sem cooldown de bônus
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
  forcePlus?: boolean;                             // true → Black Mitic Plus (Governante) → arquétipo VERSÁTIL forçado + 6 traits
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
          forcePlus: !!e?.forcePlus,
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

export function rollBlackMiticTraits(egg: EggInstance, archetype: Archetype, slots: number = 5): string[] {
  const care = computeCareScore(egg); // 0..100
  // Prob de escolher épico por slot cresce com care (25% → 85%)
  // Ovos "rompidos" (ruptured) ganham +15% de chance de épico
  const rupturedBonus = egg.ruptured ? 0.15 : 0;
  const epicChance = Math.min(0.95, 0.25 + (care / 100) * 0.6 + rupturedBonus);
  const rareChance = 0.85; // se falhar épico, chance de raro
  const picked: string[] = [];
  const themed = TRAITS_ARCHETYPE[archetype];
  // Slot 1: garante um trait temático do arquétipo (o "sabor")
  const themeSeed = themed[Math.floor(Math.random() * themed.length)];
  picked.push(themeSeed);
  while (picked.length < slots) {
    let pool: string[];
    const r = Math.random();
    if (r < epicChance) pool = TRAITS_EPIC;
    else if (r < epicChance + (1 - epicChance) * rareChance) pool = TRAITS_RARE;
    else pool = TRAITS_STRONG;
    // Bias adicional: chance extra de puxar do pool temático quando care é alto
    if (Math.random() < 0.35 + care / 300) pool = [...pool, ...themed];
    let candidates = pool.filter(t => !picked.includes(t));
    // Fallback: usa o pool global se o específico esgotou.
    if (candidates.length === 0) candidates = ALL_TRAITS_POOL.filter(t => !picked.includes(t));
    if (candidates.length === 0) break;
    picked.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  return picked.slice(0, slots);
}

// Linhas grosseiras usadas quando o ovo rejeita um bônus (40%)
const RUDE_LINES = [
  "NÃO! Guarde suas pedras, treinador... elas me irritam agora.",
  "Ugh. Você acha mesmo que sou algum saco de energia?",
  "Chega. Já disse que estou cheio!",
  "Seus dedos gordos deixaram cair de novo... rejeitado.",
  "Não. Não estou com fome. Você não me escuta?",
  "Você me alimenta como se eu fosse um lixo comum. Fora daqui.",
  "Silêncio... a stone está errada. Quer me quebrar?",
  "Se insistir, vou dormir e te ignorar pela próxima hora.",
];
const BONUS_ACCEPT_LINES = [
  "Sim! MAIS! Continue e sentirá o que estou me tornando!",
  "Absorvido... você está me despertando algo perigoso.",
  "Isso... isso me completa. Continue, treinador!",
  "Sinto meu núcleo se partindo em algo maior.",
  "Um véu se rasga... você está me libertando.",
];
const RUPTURE_LINE =
  "✦✦✦ ROMPI OS ELEMENTAIS! Sinto seis correntes de poder me atravessando... NASCEREI DIFERENTE! ✦✦✦";

// ================================================================
// Caixa de diálogo VIVA — mensagens digitando (typewriter)
// ================================================================
const LIVE_LINES_EARLY = [
  "Sinto sua presença... cuide de mim.",
  "Ainda sou fraco... mas você está aqui.",
  "Cada stone me molda por dentro...",
  "Continue... eu cresço com você.",
  "Meu núcleo pulsa devagar. Alimente-o.",
];
const LIVE_LINES_70 = [
  "Consigo sentir algo despertando...",
  "Ainda posso ficar mais forte...",
  "Minha casca está mudando...",
  "Existe um grande poder dentro de mim.",
  "Continue alimentando minha energia.",
];
const LIVE_LINES_80 = [
  "Minha energia está aumentando...",
  "Novos Traits estão surgindo...",
  "Meu destino está mudando...",
  "Consigo sentir um enorme poder...",
  "Minha força continua crescendo.",
];
const LIVE_LINES_90 = [
  "Estou quase rompendo minha casca.",
  "Meu verdadeiro poder quer despertar.",
  "Nunca estive tão forte.",
  "Minha energia está transbordando.",
  "Meu nascimento será inesquecível.",
];
const LIVE_LINES_95 = [
  "Posso sentir minha verdadeira forma.",
  "Falta muito pouco...",
  "Continue...",
  "Estou quase pronto.",
];
const LIVE_LINES_100 = [
  "Chegou a hora...",
  "Obrigado por cuidar de mim.",
  "Estou preparado.",
  "Agora descubra quem eu realmente sou.",
];
const LIVE_REACT_LINES = [
  "Essa Stone aumentou minha energia...",
  "Posso sentir meu corpo mudando...",
  "Minha verdadeira forma está despertando...",
  "Continue...",
  "Estou absorvendo tudo...",
  "Meu nascimento será ainda mais forte...",
  "Cada Stone fortalece minha alma.",
  "Sim... mais! Meu poder cresce.",
  "Sinto essa energia se enraizar em mim.",
];

function pickLiveLine(pct: number): string {
  let pool: string[];
  if (pct >= 1) pool = LIVE_LINES_100;
  else if (pct >= 0.95) pool = LIVE_LINES_95;
  else if (pct >= 0.9) pool = LIVE_LINES_90;
  else if (pct >= 0.8) pool = LIVE_LINES_80;
  else if (pct >= 0.7) pool = LIVE_LINES_70;
  else pool = LIVE_LINES_EARLY;
  return pool[Math.floor(Math.random() * pool.length)];
}

function LivingEggDialog({ pct, feedTick }: { pct: number; feedTick: number }) {
  const [line, setLine] = useState<string>(() => pickLiveLine(pct));
  const [shown, setShown] = useState<string>("");
  const [visible, setVisible] = useState(true);
  const lastLineRef = useRef<string>("");
  const idxRef = useRef(0);

  const startLine = (react: boolean, curPct: number) => {
    let candidate = react ? LIVE_REACT_LINES[Math.floor(Math.random() * LIVE_REACT_LINES.length)] : pickLiveLine(curPct);
    // não repetir imediatamente
    let guard = 0;
    while (candidate === lastLineRef.current && guard < 5) {
      candidate = react ? LIVE_REACT_LINES[Math.floor(Math.random() * LIVE_REACT_LINES.length)] : pickLiveLine(curPct);
      guard++;
    }
    lastLineRef.current = candidate;
    setLine(candidate);
    setShown("");
    idxRef.current = 0;
    setVisible(true);
  };

  // Reage a cada alimentação
  const feedTickRef = useRef(feedTick);
  useEffect(() => {
    if (feedTick !== feedTickRef.current && feedTick > 0) {
      feedTickRef.current = feedTick;
      startLine(true, pct);
    }
  }, [feedTick, pct]);

  // Typewriter
  useEffect(() => {
    if (!line) return;
    if (shown.length >= line.length) return;
    const t = setTimeout(() => {
      idxRef.current = Math.min(line.length, idxRef.current + 1);
      setShown(line.slice(0, idxRef.current));
    }, 42);
    return () => clearTimeout(t);
  }, [line, shown]);

  // Cicla nova linha entre 10-20s após terminar
  useEffect(() => {
    if (shown.length < line.length) return;
    const delay = 10000 + Math.random() * 10000;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => startLine(false, pct), 420);
    }, delay);
    return () => clearTimeout(t);
  }, [shown, line, pct]);

  return (
    <div style={{
      width: "100%",
      padding: "10px 12px",
      background: "linear-gradient(180deg, rgba(60,20,120,0.35), rgba(20,5,50,0.6))",
      border: "1px solid rgba(197,139,255,0.55)",
      borderRadius: 10,
      boxShadow: "0 0 14px rgba(160,80,255,0.45), inset 0 0 10px rgba(120,40,220,0.3)",
      color: "#e6c8ff",
      minHeight: 58,
      fontSize: 9,
      lineHeight: 1.65,
      textShadow: "0 0 6px rgba(197,139,255,0.85)",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.4s ease",
      fontFamily: "'Press Start 2P', monospace",
      position: "relative",
    }}>
      <span>{shown}</span>
      <span style={{
        display: "inline-block", width: 5, height: 10, marginLeft: 3,
        background: "#c58bff", verticalAlign: "middle", borderRadius: 1,
        boxShadow: "0 0 6px #a066ff",
        animation: "blackEggCursor 1s steps(2) infinite",
      }} />
    </div>
  );
}

// ================================================================
// InstabilityFX — camada de "medo/instabilidade" da Transcendência
// Cresce a partir de 70% (hatchPct). Adiciona partículas, ondas,
// piscadas, pulsos, avisos e um pouco de áudio ambiente aleatório.
// ================================================================
type InstWarn = { id: number; text: string };
const INST_WARN_LINES = [
  "⚠ Energia acima do normal.",
  "⚠ Instabilidade detectada.",
  "⚠ A criatura está reagindo.",
  "⚠ A casca não consegue conter essa energia.",
  "⚠ Recomenda-se preparar a Transcendência.",
  "⚠ Fluxo elemental instável.",
  "⚠ Pulso vital acelerando.",
];

function useInstabilityAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (ctxRef.current) return ctxRef.current;
    try {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    } catch { return null; }
    return ctxRef.current;
  };
  const boom = (freq: number, dur: number, vol = 0.05, type: OscillatorType = "sine") => {
    const ctx = getCtx(); if (!ctx) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = 0;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime;
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.05);
    } catch {}
  };
  return {
    heartbeat: () => { boom(55, 0.35, 0.08, "sine"); setTimeout(() => boom(70, 0.28, 0.06, "sine"), 180); },
    knock: () => boom(90 + Math.random() * 40, 0.15, 0.07, "square"),
    crack: () => boom(2200 + Math.random() * 800, 0.06, 0.03, "sawtooth"),
    breath: () => boom(180, 0.5, 0.02, "triangle"),
  };
}

function InstabilityFX({ pct, feedTick, totalFed }: { pct: number; feedTick: number; totalFed: number }) {
  // Instabilidade base (0..1) — cresce depois de 70%, satura em 100%.
  const base = Math.max(0, Math.min(1, (pct - 0.7) / 0.3));
  // Nível dinâmico com "picos" após feeds e decaimento suave.
  const [spike, setSpike] = useState(0);
  const [warns, setWarns] = useState<InstWarn[]>([]);
  const [tremor, setTremor] = useState(false);
  const [dim, setDim] = useState(false);
  const [wave, setWave] = useState(0);
  const feedRef = useRef(feedTick);
  const audio = useInstabilityAudio();

  const level = Math.min(1, base + spike);

  // Reage a cada feed
  useEffect(() => {
    if (feedTick !== feedRef.current && feedTick > 0) {
      feedRef.current = feedTick;
      setSpike((s) => Math.min(0.6, s + 0.25));
      setWave((w) => w + 1);
      if (base >= 0.5 && Math.random() < 0.6) audio.knock();
    }
  }, [feedTick, base, audio]);

  // Decaimento do pico
  useEffect(() => {
    if (spike <= 0) return;
    const t = setInterval(() => setSpike((s) => Math.max(0, s - 0.04)), 400);
    return () => clearInterval(t);
  }, [spike]);

  // Fenômenos aleatórios (mais frequentes com nível alto)
  useEffect(() => {
    if (base <= 0) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const chanceInterval = Math.max(1400, 6000 - level * 5000);
      const kind = Math.random();
      if (kind < 0.28) { setTremor(true); setTimeout(() => setTremor(false), 480); if (level > 0.4) audio.knock(); }
      else if (kind < 0.5) { setDim(true); setTimeout(() => setDim(false), 900); }
      else if (kind < 0.72) { setWave((w) => w + 1); }
      else if (kind < 0.9) {
        const id = Date.now() + Math.random();
        const text = INST_WARN_LINES[Math.floor(Math.random() * INST_WARN_LINES.length)];
        setWarns((ws) => [...ws.slice(-2), { id, text }]);
        setTimeout(() => setWarns((ws) => ws.filter((w) => w.id !== id)), 2600);
      } else {
        if (Math.random() < 0.5) audio.heartbeat(); else audio.breath();
      }
      setTimeout(tick, chanceInterval + Math.random() * 2000);
    };
    const start = setTimeout(tick, 1500 + Math.random() * 1500);
    return () => { alive = false; clearTimeout(start); };
  }, [base, level, audio]);

  // Batidas / estalos periódicos
  useEffect(() => {
    if (base < 0.4) return;
    let alive = true;
    const beat = () => {
      if (!alive) return;
      if (Math.random() < 0.7) audio.heartbeat();
      setTimeout(beat, 6000 + Math.random() * 8000);
    };
    const t = setTimeout(beat, 5000);
    return () => { alive = false; clearTimeout(t); };
  }, [base, audio]);

  useEffect(() => {
    if (base < 0.3) return;
    let alive = true;
    const cr = () => {
      if (!alive) return;
      if (Math.random() < 0.5) audio.crack();
      setTimeout(cr, 3500 + Math.random() * 5000);
    };
    const t = setTimeout(cr, 3000);
    return () => { alive = false; clearTimeout(t); };
  }, [base, audio]);

  if (base <= 0) return null;

  const particles = 6 + Math.round(level * 22);
  const critical = pct >= 0.95;
  const maxed = pct >= 1;

  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20,
      overflow: "hidden", borderRadius: 14,
      animation: tremor ? "instShake 0.45s ease-in-out" : undefined,
    }}>
      {/* Escurecimento pulsante */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 40%, transparent 30%, rgba(10,0,25,${(0.15 + level * 0.35) * (dim ? 1.4 : 1)}) 100%)`,
        transition: "background 0.6s ease",
        mixBlendMode: "multiply",
      }} />

      {/* Pulso do painel (coração) */}
      <div style={{
        position: "absolute", inset: 0,
        boxShadow: `inset 0 0 ${40 + level * 80}px rgba(160,80,255,${0.25 + level * 0.45})`,
        animation: `instHeart ${Math.max(1.1, 2.4 - level * 1.4).toFixed(2)}s ease-in-out infinite`,
        borderRadius: 14,
      }} />

      {/* Bordas piscando */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 14,
        border: `1px solid rgba(197,139,255,${0.4 + level * 0.5})`,
        boxShadow: `0 0 ${12 + level * 30}px rgba(197,139,255,${0.35 + level * 0.5}), inset 0 0 ${8 + level * 22}px rgba(255,90,180,${level * 0.5})`,
        animation: `instEdge ${(1.4 - level * 0.9).toFixed(2)}s ease-in-out infinite`,
      }} />

      {/* Onda de energia */}
      <div key={wave} style={{
        position: "absolute", top: 0, bottom: 0, width: "40%",
        background: "linear-gradient(90deg, transparent, rgba(197,139,255,0.35), rgba(255,90,180,0.25), transparent)",
        filter: "blur(6px)",
        animation: "instWave 1.4s ease-out forwards",
      }} />

      {/* Partículas roxas (e douradas em nível alto) */}
      {Array.from({ length: particles }).map((_, i) => {
        const gold = level > 0.6 && Math.random() < 0.35;
        const size = 2 + Math.random() * (gold ? 3 : 2.5);
        const dur = 3 + Math.random() * 4;
        const delay = Math.random() * 4;
        const left = 40 + Math.random() * 20;
        const drift = -20 + Math.random() * 40;
        return (
          <span key={i} style={{
            position: "absolute", left: `${left}%`, bottom: -6,
            width: size, height: size, borderRadius: "50%",
            background: gold ? "#ffd84d" : "#c58bff",
            boxShadow: gold ? "0 0 8px #ffd84d" : "0 0 8px #a066ff",
            opacity: 0, ["--drift" as any]: `${drift}px`,
            animation: `instParticle ${dur}s linear ${delay}s infinite`,
          }} />
        );
      })}

      {/* Avisos do sistema */}
      <div style={{
        position: "absolute", top: 60, right: 14, display: "flex", flexDirection: "column", gap: 6,
        alignItems: "flex-end", maxWidth: "60%",
      }}>
        {warns.map((w) => (
          <div key={w.id} style={{
            padding: "6px 10px", fontSize: 8, letterSpacing: 1,
            color: "#ffe0a0",
            background: "linear-gradient(90deg, rgba(80,20,20,0.7), rgba(40,10,60,0.7))",
            border: "1px solid rgba(255,200,80,0.7)",
            boxShadow: "0 0 10px rgba(255,180,60,0.5)",
            borderRadius: 6,
            fontFamily: "'Press Start 2P', monospace",
            animation: "instWarnIn 0.35s ease-out",
          }}>{w.text}</div>
        ))}
      </div>

      {/* Banner crítico ≥95% */}
      {critical && (
        <div style={{
          position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)",
          padding: "8px 14px", borderRadius: 8,
          background: "linear-gradient(90deg, rgba(120,10,30,0.85), rgba(60,10,90,0.85))",
          border: "1px solid #ff5aa8",
          boxShadow: "0 0 22px rgba(255,90,180,0.75)",
          color: "#ffd8ea", fontSize: 10, letterSpacing: 1.5, textAlign: "center",
          fontFamily: "'Press Start 2P', monospace",
          animation: "instCritical 1.1s ease-in-out infinite",
          maxWidth: "80%",
        }}>
          {maxed
            ? <>⚠ ENERGIA CRÍTICA<br /><span style={{ fontSize: 8, color: "#ffb0d6" }}>Uma criatura de poder imensurável está prestes a nascer.<br />Continue alimentando ou realize a Transcendência agora.</span></>
            : <>⚠ A CASCA ESTÁ NO LIMITE<br /><span style={{ fontSize: 8, color: "#ffb0d6" }}>A energia pode romper a qualquer instante.</span></>}
        </div>
      )}
    </div>
  );
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
  onHatched: (species: string, element: ElementId, traits: string[], plus?: boolean) => void;   // parent grants pokemon + decrementa item
  onNotify?: (msg: string) => void;
  hasIncubatorCard?: boolean;                          // gate para "ATIVAR INICIAÇÃO"
  onActivateEgg?: () => void;                          // primeira ativação — parent consome carta / marca unlock permanente
  boostCount?: number;                                 // Cristais do Despertar disponíveis na mochila
  onConsumeBoost?: () => boolean;                      // consome 1 boost; devolve false se não houver
  musicControlledExternally?: boolean;                 // usado pelo mapa idle, que tem BGM próprio
  plusPending?: number;                                // ovos Plus (Governante) pendentes de marcação
  onConsumePlus?: (count: number) => void;             // parent decrementa fila de Plus quando o egg é marcado
}) {
  const { open, onClose, uid, itemCount, stones, onConsumeStone, onHatched, onNotify, hasIncubatorCard = false, onActivateEgg, boostCount = 0, onConsumeBoost, musicControlledExternally = false, plusPending = 0, onConsumePlus } = props;
  const [state, setState] = useState<CollectionState>(() => loadState(uid));
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState<"journal" | "feeds">("journal");
  const [bonusAmount, setBonusAmount] = useState<Partial<Record<ElementId, number>>>({});

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
    let plusToApply = 0;
    setState((prev) => {
      let eggs = [...prev.eggs];
      if (eggs.length < itemCount) {
        while (eggs.length < itemCount) {
          const ne = newEgg();
          // Marca como Plus os primeiros novos ovos até esgotar fila
          const already = eggs.filter(e => e.forcePlus).length;
          if (already + plusToApply < plusPending) {
            ne.forcePlus = true;
            plusToApply += 1;
          }
          eggs.push(ne);
        }
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
    if (plusToApply > 0) onConsumePlus?.(plusToApply);
  }, [itemCount, uid, plusPending, onConsumePlus]);

  useEffect(() => { if (open) setState(loadState(uid)); }, [open, uid]);

  // 🎵 Trilha exclusiva do painel: toca ao abrir, para ao fechar,
  // e suspende a música principal enquanto o painel estiver visível.
  useEffect(() => {
    if (!open || musicControlledExternally) return;
    // 1) Suspende a trilha principal PRIMEIRO e força pausa em qualquer <audio>
    //    que ainda esteja tocando (garante que só a Transitus soará).
    setMusicSuspended(true);
    const pauseOthers = (except?: HTMLAudioElement) => {
      document.querySelectorAll("audio").forEach((el) => {
        const a = el as HTMLAudioElement;
        if (a !== except && !a.paused) { try { a.pause(); } catch { /* ignore */ } }
      });
    };
    pauseOthers();

    // 2) Cria e toca a Transitus.
    const audio = new Audio(eggMusicAsset.url);
    audio.loop = true;
    audio.preload = "auto";
    const applyVol = () => {
      const st = getMusicState();
      audio.volume = st.muted ? 0 : Math.min(1, st.volume * 1.1);
    };
    applyVol();
    const unsub = subscribeMusic(() => { applyVol(); pauseOthers(audio); });
    audio.play().catch(() => { /* aguarda gesto */ });
    const retry = () => {
      pauseOthers(audio);
      if (audio.paused) audio.play().catch(() => { /* ignore */ });
    };
    window.addEventListener("pointerdown", retry);
    window.addEventListener("keydown", retry);
    // Reforço: se algo tentar retomar a música principal, silencia novamente.
    const guard = setInterval(() => pauseOthers(audio), 500);
    return () => {
      clearInterval(guard);
      unsub();
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      try { audio.pause(); audio.currentTime = 0; } catch { /* ignore */ }
      setMusicSuspended(false);
    };
  }, [open, musicControlledExternally]);


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
    // Fallback robusto: se o flag `forcePlus` não foi gravado no ovo por
    // qualquer motivo, ainda consumimos da fila `plusPending` do parent.
    // Isso garante que TODO ovo entregue pelo Governante nasça como
    // Black Mitic Plus e o Pokémon caia direto na Coleção.
    const isPlusFromEgg = !!selected.forcePlus;
    const isPlusFromQueue = !isPlusFromEgg && plusPending > 0;
    const isPlus = isPlusFromEgg || isPlusFromQueue;
    const arch = isPlus ? "versatile" : computeArchetype(selected.affinity);
    const care = computeCareScore(selected);
    const slots = isPlus ? 6 : (selected.ruptured ? 6 : 5);
    const traits = rollBlackMiticTraits(selected, arch, slots);
    // Anti-duplicata para pool versátil.
    const recent = new Set(state.hatchedHistory ?? []);
    let species: string;
    if (arch === "versatile") {
      const unused = VERSATILE_POOL.filter(s => !recent.has(s));
      const pool = unused.length > 0 ? unused : VERSATILE_POOL;
      species = pool[Math.floor(Math.random() * pool.length)];
    } else {
      species = el.species;
    }
    onHatched(species, el.id, traits, isPlus);
    if (isPlusFromQueue) onConsumePlus?.(1);
    persist((s) => {
      const eggs = s.eggs.filter(e => e.id !== selected.id);
      const hist = [...(s.hatchedHistory ?? []), species].slice(-10);
      return { eggs, selectedId: eggs[0]?.id ?? null, hatchedHistory: hist };
    });
    const rupTag = isPlus ? " ✦ PLUS VERSÁTIL (6 traits)" : (selected.ruptured ? " ✦ ROMPIDO (6 traits)" : "");
    onNotify?.(`✦ Nasceu ${species.toUpperCase()} (${el.label}) — ${ARCHETYPE_META[arch].label} · Cuidado ${care}/100${rupTag}!`);
  };

  // ------------------------------------------------------------------
  // BÔNUS: rompimento dos elementais (libera aos 70% de incubação)
  // - A cada 10 min pode empurrar qualquer quantidade de qualquer stone.
  // - 40% de chance do ovo REJEITAR (grosseiro). Stones NÃO consumidas.
  // - Alimentar TODOS os 6 elementos no modo bônus → ROMPE (ruptured=true)
  //   → o Pokémon nasce com 6 traits ao invés de 5.
  // ------------------------------------------------------------------
  const bonusFeed = (el: typeof ELEMENTS[number], amountRaw: number) => {
    if (!selected) return;
    if (!selected.activated) { onNotify?.("Ative a incubação antes."); return; }
    const pct = (Date.now() - selected.activatedAt) / HATCH_MS;
    if (pct < BONUS_UNLOCK_PCT) { onNotify?.("Bônus liberado somente aos 70% de incubação."); return; }
    // sem cooldown — alimentação bônus ilimitada

    const amount = Math.max(BONUS_MIN, Math.min(BONUS_MAX, Math.floor(amountRaw || 0)));
    if (amount < BONUS_MIN) { onNotify?.("Quantidade inválida."); return; }
    const have = stones[el.stone] ?? 0;
    if (have < amount) { onNotify?.(`Você só tem ${have}× ${el.label} Stone.`); return; }

    const rejected = Math.random() < BONUS_REJECT_CHANCE;
    if (rejected) {
      // Não consome stones — apenas registra tentativa e cooldown.
      const line = pick(RUDE_LINES);
      persist((s) => ({
        ...s,
        eggs: s.eggs.map(e => {
          if (e.id !== selected.id) return e;
          let ne: EggInstance = {
            ...e,
            bonusAttempts: e.bonusAttempts + 1,
            bonusRejected: e.bonusRejected + 1,
            lastBonusFeedAt: Date.now(),
            lastBonusResult: { ts: Date.now(), kind: "reject", element: el.id, amount, line },
          };
          ne = pushJournal(ne, "obsession", line, el.id);
          return ne;
        }),
      }));
      onNotify?.(`✗ ${el.label} rejeitado! O ovo está grosseiro hoje.`);
      return;
    }

    // Aceito: consome as stones e aplica bônus na afinidade.
    if (!onConsumeStone(el.stone, amount)) { onNotify?.("Falha ao consumir a Stone."); return; }
    const line = pick(BONUS_ACCEPT_LINES);
    persist((s) => ({
      ...s,
      eggs: s.eggs.map(e => {
        if (e.id !== selected.id) return e;
        const newBonusFed = { ...e.bonusFed, [el.id]: (e.bonusFed[el.id] ?? 0) + amount };
        const distinctBonusEls = ELEMENTS.filter(x => (newBonusFed[x.id] ?? 0) > 0).length;
        const willRupture = !e.ruptured && distinctBonusEls >= ELEMENTS.length;
        let ne: EggInstance = {
          ...e,
          affinity: { ...e.affinity, [el.id]: (e.affinity[el.id] ?? 0) + amount },
          totalFed: e.totalFed + amount,
          bonusFed: newBonusFed,
          bonusAttempts: e.bonusAttempts + 1,
          bonusAccepted: e.bonusAccepted + 1,
          lastBonusFeedAt: Date.now(),
          ruptured: e.ruptured || willRupture,
          lastBonusResult: { ts: Date.now(), kind: "accept", element: el.id, amount, line },
          recentFeedAt: { ...e.recentFeedAt, [el.id]: Date.now() },
          history: [{ ts: Date.now(), element: el.id, amount }, ...e.history].slice(0, 20),
        };
        ne = pushJournal(ne, "absorbing", line, el.id);
        if (willRupture) {
          ne = pushJournal(ne, "hatch", RUPTURE_LINE);
        }
        return ne;
      }),
    }));
    onNotify?.(`✓ +${amount} ${el.label} (BÔNUS) absorvido!`);
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
          boxShadow: `0 0 ${32 + Math.round(hatchPct * 40)}px rgba(160,80,255,${0.55 + hatchPct * 0.35}), inset 0 0 24px rgba(60,20,120,0.4)`,
          borderRadius: 14, color: "#f0e6ff",
          fontFamily: "'Press Start 2P', monospace, sans-serif",
          position: "relative",
          animation: hatchPct >= 0.7
            ? `instShake ${Math.max(0.25, 1.6 - hatchPct).toFixed(2)}s ease-in-out infinite`
            : undefined,
        }}
      >
        {selected?.activated && <InstabilityFX pct={hatchPct} feedTick={(selected.history[0]?.ts ?? 0) + (selected.lastBonusResult?.ts ?? 0)} totalFed={selected.totalFed} /> }
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
                  <div style={{
                    position: "relative", width: 200, height: 200,
                    animation: selected.activated && (Date.now() - selected.activatedAt) / HATCH_MS >= 0.7
                      ? `eggWobble ${Math.max(0.5, 1.8 - ((Date.now() - selected.activatedAt) / HATCH_MS)).toFixed(2)}s ease-in-out infinite`
                      : undefined,
                  }}>
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
                        background: selected.ruptured
                          ? "linear-gradient(180deg, #ffd84d, #b8860b)"
                          : "linear-gradient(180deg, #4fd66b, #2a8a3f)",
                        border: `1px solid ${selected.ruptured ? "#fff2a0" : "#a0ff8f"}`,
                        borderRadius: 8,
                        color: "#0a2010", fontWeight: 700, fontSize: 11,
                        cursor: "pointer", letterSpacing: 1,
                        boxShadow: selected.ruptured
                          ? "0 0 18px rgba(255,215,80,0.95)"
                          : "0 0 12px rgba(80,220,110,0.8)",
                        animation: "blackEggPulse 1.4s ease-in-out infinite",
                      }}>{selected.ruptured ? "✦ TRANSCENDER E CHOCAR ✦" : "✦ CHOCAR AGORA"}</button>

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
                      {selected.activated && hatchPct < 0.69 && (
                        <button
                          onClick={() => {
                            if (!selected) return;
                            if (hatchPct >= 0.69) { onNotify?.("Este ovo já passou dos 69%."); return; }
                            if ((boostCount ?? 0) <= 0) { onNotify?.("Você não tem Cristal do Despertar na mochila."); return; }
                            if (!onConsumeBoost || !onConsumeBoost()) { onNotify?.("Falha ao consumir o Cristal do Despertar."); return; }
                            const target = Date.now() - 0.69 * HATCH_MS;
                            persist((s) => ({
                              ...s,
                              eggs: s.eggs.map(e => e.id === selected.id ? { ...e, activatedAt: Math.min(e.activatedAt, target) } : e),
                            }));
                            onNotify?.("✦ Cristal do Despertar usado — progresso adiantado para 69%.");
                          }}
                          style={{
                            marginTop: 8, width: "100%", padding: "8px 6px",
                            background: (boostCount ?? 0) > 0
                              ? "linear-gradient(180deg, #ff97e1, #a03fd6)"
                              : "linear-gradient(180deg, #3a2050, #1e0f30)",
                            border: `1px solid ${(boostCount ?? 0) > 0 ? "#ffb8f0" : "#5a3a7a"}`,
                            borderRadius: 8,
                            color: (boostCount ?? 0) > 0 ? "#fff" : "#8a6ab0",
                            fontWeight: 700, fontSize: 10,
                            cursor: (boostCount ?? 0) > 0 ? "pointer" : "not-allowed", letterSpacing: 1,
                            boxShadow: (boostCount ?? 0) > 0 ? "0 0 12px rgba(255,150,225,0.7)" : "none",
                          }}
                          title={(boostCount ?? 0) > 0 ? "Consome 1 Cristal do Despertar e adianta o progresso para 69%" : "Requer Cristal do Despertar na mochila"}
                        >
                          ✦ ADIANTAR PARA 69% {(boostCount ?? 0) > 0 ? `(${boostCount})` : "(0)"}
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 9, color: "#d8bfff", textAlign: "center", width: "100%" }}>
                    Total alimentado: <b>{selected.totalFed}</b><br />
                    Elemento dominante: <b style={{ color: ELEMENTS.find(e => e.id === dominant)?.color }}>
                      {ELEMENTS.find(e => e.id === dominant)?.label}
                    </b>
                  </div>

                  {/* ===================== CAIXA DE DIÁLOGO VIVA ===================== */}
                  {selected.activated && (
                    <>
                      <div style={{ width: "100%", fontSize: 8, color: "#c58bff", letterSpacing: 1, marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>◈ ENERGIA DE TRANSCENDÊNCIA</span>
                        <span style={{ color: "#e0b8ff" }}>{Math.min(999, Math.round(hatchPct * 100 + selected.totalFed / 50))}</span>
                      </div>
                      <div style={{ width: "100%", height: 8, background: "rgba(0,0,0,0.55)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(160,80,255,0.4)" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(100, hatchPct * 100)}%`,
                          background: "linear-gradient(90deg, #7d3fd6, #ff5aa8, #ffd84d)",
                          boxShadow: "0 0 10px rgba(255,90,180,0.7)",
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                      <LivingEggDialog
                        pct={hatchPct}
                        feedTick={(selected.history[0]?.ts ?? 0) + (selected.lastBonusResult?.ts ?? 0)}
                      />
                    </>
                  )}


                  {/* ===================== BÔNUS: ROMPIMENTO DOS ELEMENTAIS ===================== */}
                  {(() => {
                    const unlocked = hatchPct >= BONUS_UNLOCK_PCT;
                    const cd = Math.max(0, (selected.lastBonusFeedAt + BONUS_COOLDOWN_MS) - now);
                    const ready = unlocked && cd <= 0;
                    const distinctBonus = ELEMENTS.filter(x => (selected.bonusFed[x.id] ?? 0) > 0).length;
                    const rupPct = Math.round((distinctBonus / ELEMENTS.length) * 100);
                    const lbr = selected.lastBonusResult;
                    const fxRecent = lbr && (now - lbr.ts) < 5000;
                    return (
                      <div style={{
                        width: "100%",
                        background: selected.ruptured
                          ? "linear-gradient(135deg, rgba(255,215,80,0.15), rgba(30,10,60,0.65))"
                          : unlocked
                            ? "linear-gradient(135deg, rgba(255,90,180,0.15), rgba(30,10,60,0.65))"
                            : "rgba(20,8,40,0.5)",
                        border: `1px solid ${selected.ruptured ? "#ffd84d" : unlocked ? "#ff5aa8" : "#4a2a6a"}`,
                        borderRadius: 10, padding: 10,
                        boxShadow: selected.ruptured
                          ? "0 0 16px rgba(255,215,80,0.45)"
                          : unlocked ? "0 0 12px rgba(255,90,180,0.35)" : "none",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ fontSize: 10, letterSpacing: 1, color: selected.ruptured ? "#ffd84d" : "#ff9ad6" }}>
                            ✦ ROMPIMENTO ELEMENTAL {selected.ruptured ? "· ROMPIDO!" : ""}
                          </div>
                          <div style={{ fontSize: 8, color: unlocked ? (ready ? "#a0ffb0" : "#ffb857") : "#a888c8" }}>
                            {!unlocked ? `🔒 Libera aos ${Math.round(BONUS_UNLOCK_PCT * 100)}%`
                              : selected.ruptured ? "6 traits garantidos"
                              : ready ? "Pronto" : `⏱ ${fmt(cd)}`}
                          </div>
                        </div>
                        <div style={{ fontSize: 8, color: "#c8a0e8", lineHeight: 1.5, marginBottom: 8 }}>
                          {selected.ruptured
                            ? "O ovo rompeu os elementais. Nascerá com 6 traits!"
                            : "A cada 10 min você força qualquer quantidade de stones. Alimente TODOS os 6 elementos aqui para ROMPER — 40% de chance do ovo recusar."}
                        </div>

                        {/* Progresso rompimento */}
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#e0b8ff" }}>
                            <span>Elementos rompidos</span>
                            <span>{distinctBonus}/{ELEMENTS.length}</span>
                          </div>
                          <div style={{ height: 8, background: "rgba(0,0,0,0.55)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,90,180,0.35)", marginTop: 3 }}>
                            <div style={{
                              height: "100%", width: `${rupPct}%`,
                              background: selected.ruptured
                                ? "linear-gradient(90deg, #ffd84d, #ff9ad6, #ffd84d)"
                                : "linear-gradient(90deg, #ff5aa8, #ffd84d)",
                              boxShadow: `0 0 8px ${selected.ruptured ? "#ffd84d" : "#ff5aa8"}`,
                              transition: "width 0.4s",
                            }} />
                          </div>
                        </div>

                        {/* Feedback última tentativa */}
                        {lbr && fxRecent && (
                          <div style={{
                            padding: "6px 8px", borderRadius: 6, marginBottom: 8,
                            background: lbr.kind === "accept" ? "rgba(80,220,110,0.18)" : "rgba(255,90,90,0.22)",
                            border: `1px solid ${lbr.kind === "accept" ? "#4fd66b" : "#ff6b6b"}`,
                            color: lbr.kind === "accept" ? "#c8ffd0" : "#ffc8c8",
                            fontSize: 8, lineHeight: 1.5,
                            animation: "blackEggShine 0.9s ease-out",
                          }}>
                            <b>{lbr.kind === "accept" ? "✓ ACEITO" : "✗ REJEITADO"}</b> — {lbr.line}
                          </div>
                        )}

                        {/* Inputs por elemento */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {ELEMENTS.map(el => {
                            const have = stones[el.stone] ?? 0;
                            const amt = bonusAmount[el.id] ?? 10;
                            const already = selected.bonusFed[el.id] ?? 0;
                            const canPush = ready && have >= amt && amt >= BONUS_MIN;
                            return (
                              <div key={el.id} style={{
                                display: "flex", flexDirection: "column", gap: 3,
                                padding: 6, borderRadius: 6,
                                background: already > 0 ? `${el.color}15` : "rgba(0,0,0,0.25)",
                                border: `1px solid ${already > 0 ? el.color + "88" : "rgba(160,80,255,0.25)"}`,
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8, color: el.color, letterSpacing: 1 }}>
                                  <span>{el.emoji}</span>
                                  <span style={{ flex: 1 }}>{el.label.toUpperCase()}</span>
                                  <span style={{ color: "#c8a0e8", fontSize: 7 }}>x{have}</span>
                                  {already > 0 && <span style={{ color: "#a0ffb0", fontSize: 7 }}>✓{already}</span>}
                                </div>
                                <div style={{ display: "flex", gap: 3 }}>
                                  <input
                                    type="number"
                                    min={BONUS_MIN}
                                    max={BONUS_MAX}
                                    value={amt}
                                    onChange={(ev) => {
                                      const v = Math.max(BONUS_MIN, Math.min(BONUS_MAX, Math.floor(Number(ev.target.value) || 0)));
                                      setBonusAmount(s => ({ ...s, [el.id]: v }));
                                    }}
                                    style={{
                                      width: 56, padding: "3px 5px", fontSize: 9,
                                      background: "#0f0620", color: "#fff",
                                      border: `1px solid ${el.color}66`, borderRadius: 4,
                                      fontFamily: "inherit",
                                    }}
                                  />
                                  <button
                                    onClick={() => { bonusFeed(el, amt); }}
                                    disabled={!canPush}
                                    style={{
                                      flex: 1, fontSize: 8, padding: "3px 4px", letterSpacing: 1,
                                      background: canPush
                                        ? `linear-gradient(180deg, ${el.color}88, ${el.color}33)`
                                        : "rgba(40,20,60,0.5)",
                                      color: canPush ? "#fff" : "#7a5a9a",
                                      border: `1px solid ${canPush ? el.color : "#4a2a6a"}`,
                                      borderRadius: 4,
                                      cursor: canPush ? "pointer" : "not-allowed",
                                      fontWeight: 700,
                                      boxShadow: canPush ? `0 0 6px ${el.color}66` : "none",
                                    }}
                                  >
                                    {!unlocked ? "🔒" : !ready ? "⏱" : "ROMPER"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {(selected.bonusAttempts > 0) && (
                          <div style={{ marginTop: 8, fontSize: 8, color: "#a888c8", textAlign: "center" }}>
                            Tentativas: <b>{selected.bonusAttempts}</b> · Aceitas: <b style={{ color: "#a0ffb0" }}>{selected.bonusAccepted}</b> · Rejeitadas: <b style={{ color: "#ff9090" }}>{selected.bonusRejected}</b>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
          @keyframes blackEggCursor {
            0%, 50% { opacity: 1; }
            50.01%, 100% { opacity: 0; }
          }
          @keyframes instShake {
            0%,100% { transform: translate(0,0); }
            20% { transform: translate(-1.5px, 1px); }
            40% { transform: translate(2px, -1px); }
            60% { transform: translate(-2px, -1.5px); }
            80% { transform: translate(1.5px, 2px); }
          }
          @keyframes instHeart {
            0%,100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
          @keyframes instEdge {
            0%,100% { filter: brightness(1); opacity: 0.6; }
            50% { filter: brightness(1.6); opacity: 1; }
          }
          @keyframes instWave {
            0% { left: -40%; opacity: 0; transform: skewX(-8deg); }
            25% { opacity: 1; }
            100% { left: 100%; opacity: 0; transform: skewX(-8deg); }
          }
          @keyframes instParticle {
            0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translate(var(--drift, 0px), -260px) scale(1.2); opacity: 0; }
          }
          @keyframes instWarnIn {
            0% { opacity: 0; transform: translateX(20px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes instCritical {
            0%,100% { transform: translateX(-50%) scale(1); box-shadow: 0 0 22px rgba(255,90,180,0.7); }
            50% { transform: translateX(-50%) scale(1.04); box-shadow: 0 0 34px rgba(255,90,180,1); }
          }
          @keyframes eggWobble {
            0%,100% { transform: translate(0,0) rotate(0deg); }
            20% { transform: translate(-2px, -1px) rotate(-2deg); }
            40% { transform: translate(2px, 1px) rotate(2deg); }
            60% { transform: translate(-2px, 1px) rotate(-1deg); }
            80% { transform: translate(1px, -2px) rotate(1deg); }
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
