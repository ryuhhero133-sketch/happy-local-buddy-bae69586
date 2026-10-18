// ===== PERFIL DE TREINADOR — regras centralizadas =====
// Única fonte de verdade para VIP, Espiritualidade e Patentes da aba PERFIL.
// Princípios:
//  - Nada aqui grava estado direto: eventos espirituais só vêm do registro
//    abaixo, aplicados por funções puras em pontos reais de conclusão.
//  - Patentes são DERIVADAS (nível + missões + feitos) — nunca setadas por UI.
//  - Sprites num registro único: trocar a arte não mexe em componente.
//  - Os três sistemas são independentes (nenhum exige outro para evoluir).

// Arte vinda de src/ambiente (PNGs novos fornecidos pelo jogador).
import emeraldUrl from "@/ambiente/Emerald.png";
import purpuraUrl from "@/ambiente/Purpura.png";
import diamanteUrl from "@/ambiente/Diamante.png";
import lendarioUrl from "@/ambiente/Lendario.png";
import vipEpicUrl from "@/ambiente/Vip Epic.png";
import vipCristalUrl from "@/ambiente/Vip Cristal.png";
import vipGoldUrl from "@/ambiente/Vip Gold.png";

// ============================ SPRITES ============================
export type VipBookId = "book_vip" | "book_vip_30" | "book_vip_60";
export type SpiritStateId = "luz" | "equilibrio" | "sombras";
/** Nova cadeia de patentes: EMERALD (inicial) → PÚRPURA → DIAMANTE → LENDÁRIO. */
export type PatenteId = "emerald" | "purpura" | "diamante" | "lendario";

/** Registro central de arte do perfil. "" = usa fallback procedural/SVG. */
export const PROFILE_SPRITES: {
  books: Record<VipBookId, string>;
  wings: Record<SpiritStateId, string>;
  crowns: Record<PatenteId, string>;
} = {
  // Tiers VIP: EPIC (20%) / CRISTAL (30%) / GOLD (40%) — PNGs de src/ambiente.
  books: { book_vip: vipEpicUrl, book_vip_30: vipCristalUrl, book_vip_60: vipGoldUrl },
  // Asas: nenhuma arte existe no projeto → SVG inline (anjo/demônio/equilíbrio).
  wings: { luz: "", equilibrio: "", sombras: "" },
  // Coroas: PNGs Emerald/Purpura/Diamante/Lendario de src/ambiente.
  crowns: { emerald: emeraldUrl, purpura: purpuraUrl, diamante: diamanteUrl, lendario: lendarioUrl },
};

// ============================== VIP ==============================
// Fonte real: buffs.goldMult (fração: 0.20/0.30/0.40) + buffs.goldMultUntil
// aplicados pelos itens book_vip / book_vip_30 / book_vip_60 (idle.tsx).
// Não existe hierarquia de planos: o tier é derivado do bônus ativo.
export type VipTierId = "vip" | "vip30" | "vip60";

export type VipTierInfo = {
  active: boolean;
  tier: VipTierId | null;
  label: string;
  stars: string;
  bonusPct: number;
  bookId: VipBookId | null;
  until: number;
  remainingLabel: string;
  benefits: string[];
};

export const VIP_BOOK_BY_TIER: Record<VipTierId, VipBookId> = {
  vip: "book_vip",
  vip30: "book_vip_30",
  vip60: "book_vip_60",
};

export function vipTierOf(goldMult: number | undefined, until: number | undefined): VipTierInfo {
  const now = Date.now();
  const validUntil = until ?? 0;
  const pct = validUntil > now ? Math.round((goldMult ?? 0) * 100) : 0;
  const tier: VipTierId | null = pct >= 40 ? "vip60" : pct >= 30 ? "vip30" : pct >= 20 ? "vip" : null;
  const meta: Record<VipTierId, { label: string; stars: string }> = {
    vip: { label: "VIP EPIC", stars: "✦" },
    vip30: { label: "VIP CRISTAL", stars: "✦✦" },
    vip60: { label: "VIP GOLD", stars: "✦✦✦" },
  };
  const remainingLabel =
    validUntil > now ? `${Math.ceil((validUntil - now) / 86400000)} dia(s)` : "—";
  const benefits = tier
    ? [
        `+${pct}% Ouro em batalhas e +${pct}% EXP (ativo até acabar o livro)`,
        "Venda de Pokémon por Cristais no Mercado",
        "Missão diária Coleta Dourada (quest VIP)",
        "Distinção ✦ dourada no seu nome",
      ]
    : [];
  return {
    active: !!tier,
    tier,
    label: tier ? meta[tier].label : "INATIVO",
    stars: tier ? meta[tier].stars : "",
    bonusPct: pct,
    bookId: tier ? VIP_BOOK_BY_TIER[tier] : null,
    until: validUntil,
    remainingLabel: tier ? remainingLabel : "—",
    benefits,
  };
}

// ========================= ESPIRITUALIDADE =========================
// Score -100..+100, derivado só de eventos registrados. Estados:
//   LUZ >= +20 · EQUILÍBIO -19..+19 · SOMBRAS <= -20
// Eventos negativos ainda não existem na jogabilidade real (o registro
// aceita delta < 0 — pendente de uma escolha moral real no jogo).
export const SPIRIT_BOUNDS = { min: -100, max: 100, luz: 20, sombras: -20 } as const;

export type SpiritRuleKind = "prof" | "side" | "saga";

export type SpiritRule = {
  kind: SpiritRuleKind;
  delta: number;
  once: boolean;
  label: string;
  hint: string;
};

export const SPIRIT_RULES: Record<SpiritRuleKind, SpiritRule> = {
  prof: {
    kind: "prof",
    delta: 3,
    once: true,
    label: "Missão do Professor",
    hint: "Concluir uma missão de pesquisa do Prof. Carvalho.",
  },
  side: {
    kind: "side",
    delta: 1,
    once: true,
    label: "Ajuda a um Morador",
    hint: "Concluir um pedido secundário de um NPC (1x por pedido).",
  },
  saga: {
    kind: "saga",
    delta: 1,
    once: true,
    label: "Etapa da Saga",
    hint: "Resgatar a recompensa de uma etapa da Saga (1x por etapa).",
  },
};

export type SpiritLogEntry = { at: number; delta: number; label: string };

export type SpiritState = {
  id: SpiritStateId;
  name: string;
  desc: string;
  color: string;
};

export function spiritStateOf(score: number): SpiritState {
  if (score >= SPIRIT_BOUNDS.luz) {
    return { id: "luz", name: "LUZ", desc: "Suas escolhas iluminam a jornada.", color: "#ffe9a3" };
  }
  if (score <= SPIRIT_BOUNDS.sombras) {
    return { id: "sombras", name: "SOMBRAS", desc: "A escuridão marca seus passos.", color: "#b48cff" };
  }
  return { id: "equilibrio", name: "EQUILÍBRIO", desc: "Caminho sereno entre luz e sombra.", color: "#7ee6ff" };
}

export function spiritEventId(kind: SpiritRuleKind, subId: string): string {
  return `${kind}:${subId}`;
}

type SpiritFields = {
  spiritScore?: number;
  spiritDone?: string[];
  spiritLog?: SpiritLogEntry[];
};

/**
 * Aplica UM evento espiritual registrado. Retorna o MESMO objeto quando o
 * evento é desconhecido/duplicado/fora do registro — a UI jamais soma pontos.
 * Puro: seguro para chamar dentro de atualizações de estado (idempotente).
 */
export function applySpiritEvent<T extends SpiritFields>(state: T, eventId: string): T {
  const sep = eventId.indexOf(":");
  if (sep <= 0) return state;
  const rule = SPIRIT_RULES[eventId.slice(0, sep) as SpiritRuleKind];
  if (!rule) return state;
  const done = state.spiritDone ?? [];
  if (rule.once && done.includes(eventId)) return state;
  const prev = state.spiritScore ?? 0;
  const score = Math.max(SPIRIT_BOUNDS.min, Math.min(SPIRIT_BOUNDS.max, prev + rule.delta));
  if (score === prev) return state;
  const log: SpiritLogEntry[] = [{ at: Date.now(), delta: rule.delta, label: rule.label }, ...(state.spiritLog ?? [])].slice(0, 10);
  return {
    ...state,
    spiritScore: score,
    spiritDone: rule.once ? [...done, eventId] : done,
    spiritLog: log,
  };
}

// ============================ PATENTES ============================
// NOVA cadeia (spec do jogador): EMERALD (inicial) → PÚRPURA → DIAMANTE → LENDÁRIO.
// Derivadas de dados reais do save (nível, missões, derrotas, capturas).
// Nenhum campo é gravado: recalcular é barato e à prova de edit.
// Limite conhecido: progresso é client-side (mesma confiança do resto do save).
export type PatenteReq = {
  minLevel: number;
  minQuests: number;
  minKills: number;
  minCaught: number;
  /** Mínimo de missões do Professor concluídas (das N existentes). */
  minProf?: number;
  /** Exige TODAS as missões do Professor concluídas. */
  profAll?: boolean;
  /** Exige a Saga finalizada (a escolha final). */
  sagaEnd?: boolean;
};

/** Prêmio do ciclo de 7 dias ao alcançar a patente. */
export type PatentePrize = {
  gold?: number;
  crystals?: number;
  items?: Record<string, number>;
};

export type PatenteDef = {
  id: PatenteId;
  name: string;
  color: string;
  desc: string;
  req: PatenteReq;
  prize: PatentePrize;
};

export const PATENTES: readonly PatenteDef[] = [
  {
    id: "emerald",
    name: "EMERALD",
    color: "#5fe6a5",
    desc: "Patente inicial da nova jornada.",
    req: { minLevel: 1, minQuests: 0, minKills: 0, minCaught: 0 },
    prize: { gold: 5_000, crystals: 5 },
  },
  {
    id: "purpura",
    name: "PÚRPURA",
    color: "#b14bff",
    desc: "Treinador em ascensão.",
    req: { minLevel: 10, minQuests: 4, minKills: 50, minCaught: 5 },
    prize: { gold: 15_000, crystals: 15, items: { esfera_safira: 1 } },
  },
  {
    id: "diamante",
    name: "DIAMANTE",
    color: "#e8f7ff",
    desc: "Elite dos treinadores.",
    req: { minLevel: 60, minQuests: 20, minKills: 600, minCaught: 35, minProf: 6 },
    prize: { gold: 40_000, crystals: 40, items: { esfera_safira: 5 } },
  },
  {
    id: "lendario",
    name: "LENDÁRIO",
    color: "#ffd94d",
    desc: "O topo absoluto — tudo conquistado.",
    req: { minLevel: 100, minQuests: 30, minKills: 2500, minCaught: 60, profAll: true, sagaEnd: true },
      prize: { gold: 100_000, crystals: 100, items: { esfera_safira: 10 } },
  },
];

// ====================== PRÊMIO SEMANAL DAS PATENTES ======================
// Ao atingir uma patente, ela rende um prêmio a cada 7 dias (spec: "chegou
// nas patentes elas te dão um prêmio a cada 7 dias").
export const PATENTE_PRIZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/** Pode resgatar o prêmio de 7 dias? (sem histórico = pode) */
export function patentePrizeReady(lastClaimAt: number | undefined, now = Date.now()): boolean {
  const t = lastClaimAt ?? 0;
  return t <= 0 || now - t >= PATENTE_PRIZE_MS;
}

/** Tempo até o próximo prêmio (0 = pronto). */
export function patentePrizeRemaining(lastClaimAt: number | undefined, now = Date.now()): number {
  const t = lastClaimAt ?? 0;
  if (t <= 0) return 0;
  return Math.max(0, PATENTE_PRIZE_MS - (now - t));
}

/** Label legível do restante (ex.: "3d 4h", "5h 20min"). */
export function patentePrizeLabel(lastClaimAt: number | undefined, now = Date.now()): string {
  const rem = patentePrizeRemaining(lastClaimAt, now);
  if (rem <= 0) return "PRONTO";
  const d = Math.floor(rem / 86_400_000);
  const h = Math.floor((rem % 86_400_000) / 3_600_000);
  const m = Math.floor((rem % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export type PatenteInput = {
  level: number;
  quests: number;
  kills: number;
  caught: number;
  profDone: number;
  profTotal: number;
  sagaFinished: boolean;
};

export type PatenteCheck = { label: string; have: number; need: number; ok: boolean };

export type PatenteInfo = {
  current: PatenteDef;
  next: PatenteDef | null;
  isMax: boolean;
  checks: PatenteCheck[];
  /** 0..100 — progresso em direção à PRÓXIMA patente (100 se máxima). */
  progressPct: number;
};

function meets(input: PatenteInput, req: PatenteReq): boolean {
  return (
    input.level >= req.minLevel &&
    input.quests >= req.minQuests &&
    input.kills >= req.minKills &&
    input.caught >= req.minCaught &&
    (!req.minProf || input.profDone >= req.minProf) &&
    (!req.profAll || input.profDone >= input.profTotal) &&
    (!req.sagaEnd || input.sagaFinished)
  );
}

function checksFor(input: PatenteInput, req: PatenteReq): PatenteCheck[] {
  const out: PatenteCheck[] = [
    { label: "Nível", have: input.level, need: req.minLevel, ok: input.level >= req.minLevel },
    { label: "Missões", have: input.quests, need: req.minQuests, ok: input.quests >= req.minQuests },
    { label: "Derrotas", have: input.kills, need: req.minKills, ok: input.kills >= req.minKills },
    { label: "Capturas", have: input.caught, need: req.minCaught, ok: input.caught >= req.minCaught },
  ];
  if (req.minProf) {
    out.push({
      label: "Missões do Prof.",
      have: input.profDone,
      need: req.minProf,
      ok: input.profDone >= req.minProf,
    });
  }
  if (req.profAll) {
    out.push({
      label: "Missões do Prof.",
      have: input.profDone,
      need: input.profTotal,
      ok: input.profDone >= input.profTotal,
    });
  }
  if (req.sagaEnd) {
    out.push({ label: "Saga final", have: input.sagaFinished ? 1 : 0, need: 1, ok: input.sagaFinished });
  }
  return out;
}

export function patenteOf(input: PatenteInput): PatenteInfo {
  let idx = 0;
  for (let i = 0; i < PATENTES.length; i++) {
    if (meets(input, PATENTES[i].req)) idx = i;
  }
  const current = PATENTES[idx];
  const next = idx + 1 < PATENTES.length ? PATENTES[idx + 1] : null;
  if (!next) return { current, next: null, isMax: true, checks: [], progressPct: 100 };
  const checks = checksFor(input, next.req);
  const ratios = checks.map((c) => (c.need <= 0 ? 1 : Math.min(1, c.have / c.need)));
  const progressPct = Math.round((ratios.reduce((a, b) => a + b, 0) / Math.max(1, ratios.length)) * 100);
  return { current, next, isMax: false, checks, progressPct };
}
