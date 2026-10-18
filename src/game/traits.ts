// Sistema de TRAITS (atributos bônus) que aparecem em Pokémon capturados.
// Cada trait pertence a uma "raridade própria", mas qualquer Pokémon pode
// rolar traits de qualquer raridade — só as chances mudam pela raridade do bicho.

import type { PetInstance, Rarity } from "./systems";

// "purple" (ROXO) e "gold" (DOURADO) são os tiers NOVOS do Ovo Selado Ancestral:
// nunca rolam em capturas normais (peso 0) — só via rollAncestralTraits().
export type TraitTier = "common" | "uncommon" | "rare" | "epic" | "purple" | "gold";

export interface TraitEffect {
  xpMult?: number;
  goldMult?: number;
  dmgMult?: number;
  defMult?: number;
  hpMult?: number;
  atkSpeedMult?: number;
  regenPct?: number;
  critChance?: number;
  dodgeChance?: number;
  lifeSteal?: number;
}

export interface TraitDef {
  id: string;
  name: string;
  icon: string;
  tier: TraitTier;
  desc: string;
  effect: TraitEffect;
}

export const TRAITS: Record<string, TraitDef> = {
  // ===== Comuns =====
  feroz:       { id: "feroz",       name: "Feroz",       icon: "🗡️", tier: "common", desc: "+8% dano",           effect: { dmgMult: 0.08 } },
  resistente:  { id: "resistente",  name: "Resistente",  icon: "🛡️", tier: "common", desc: "+10% HP máx",        effect: { hpMult: 0.10 } },
  agil:        { id: "agil",        name: "Ágil",        icon: "💨", tier: "common", desc: "+8% vel. de atk",    effect: { atkSpeedMult: 0.08 } },
  sortudo:     { id: "sortudo",     name: "Sortudo",     icon: "🍀", tier: "common", desc: "+6% ouro",           effect: { goldMult: 0.06 } },

  // ===== Incomuns =====
  sabio:       { id: "sabio",       name: "Sábio",       icon: "📚", tier: "uncommon", desc: "+10% XP",            effect: { xpMult: 0.10 } },
  curador:     { id: "curador",     name: "Curador",     icon: "🌿", tier: "uncommon", desc: "+1% regen/3s",       effect: { regenPct: 0.01 } },
  venenoso:    { id: "venenoso",    name: "Venenoso",    icon: "☠️", tier: "uncommon", desc: "+6% dano",           effect: { dmgMult: 0.06 } },
  brutal:      { id: "brutal",      name: "Brutal",      icon: "💥", tier: "uncommon", desc: "+5% crítico",        effect: { critChance: 0.05 } },
  guardiao:    { id: "guardiao",    name: "Guardião",    icon: "🛡️", tier: "uncommon", desc: "+10% def",           effect: { defMult: 0.10 } },

  // ===== Raros =====
  eletrizado:  { id: "eletrizado",  name: "Eletrizado",  icon: "⚡", tier: "rare", desc: "+12% vel. de atk",   effect: { atkSpeedMult: 0.12 } },
  precioso:    { id: "precioso",    name: "Precioso",    icon: "💎", tier: "rare", desc: "+12% ouro",          effect: { goldMult: 0.12 } },
  prodigio:    { id: "prodigio",    name: "Prodígio",    icon: "🌟", tier: "rare", desc: "+15% XP",            effect: { xpMult: 0.15 } },
  mistico:     { id: "mistico",     name: "Místico",     icon: "🔮", tier: "rare", desc: "+8% dano e +5% crit",effect: { dmgMult: 0.08, critChance: 0.05 } },
  esquivo:     { id: "esquivo",     name: "Esquivo",     icon: "🌀", tier: "rare", desc: "+8% esquiva",        effect: { dodgeChance: 0.08 } },
  vampirico:   { id: "vampirico",   name: "Vampírico",   icon: "🩸", tier: "rare", desc: "+6% roubo de vida",  effect: { lifeSteal: 0.06 } },
  colosso:     { id: "colosso",     name: "Colosso",     icon: "🗿", tier: "rare", desc: "+20% HP e +8% def",  effect: { hpMult: 0.20, defMult: 0.08 } },

  // ===== Épicos =====
  alpha:       { id: "alpha",       name: "Alpha",       icon: "👑", tier: "epic", desc: "+12% em XP, Ouro, Dano e Def", effect: { xpMult: 0.12, goldMult: 0.12, dmgMult: 0.12, defMult: 0.12 } },
  prismatico:  { id: "prismatico",  name: "Prismático",  icon: "🌈", tier: "epic", desc: "+10% crit e +10% esquiva",     effect: { critChance: 0.10, dodgeChance: 0.10 } },
  ceifador:    { id: "ceifador",    name: "Ceifador",    icon: "💀", tier: "epic", desc: "+20% dano e +5% roubo de vida", effect: { dmgMult: 0.20, lifeSteal: 0.05 } },
  eterno:      { id: "eterno",      name: "Eterno",      icon: "♾️", tier: "epic", desc: "+25% HP e +3% regen/3s",       effect: { hpMult: 0.25, regenPct: 0.03 } },
  dourado:     { id: "dourado",     name: "Dourado",     icon: "💰", tier: "epic", desc: "+25% ouro e +10% XP",          effect: { goldMult: 0.25, xpMult: 0.10 } },

  // ===== ROXO (tier novo — só Ovo Selado Ancestral) =====
  titanico:    { id: "titanico",    name: "Titânico",    icon: "🗿", tier: "purple", desc: "+30% HP e +15% def",                 effect: { hpMult: 0.30, defMult: 0.15 } },
  predador:    { id: "predador",    name: "Predador",    icon: "🐺", tier: "purple", desc: "+22% dano e +8% roubo de vida",       effect: { dmgMult: 0.22, lifeSteal: 0.08 } },
  tempestade:  { id: "tempestade",  name: "Tempestade",  icon: "🌩️", tier: "purple", desc: "+20% vel. de atk e +12% crítico",     effect: { atkSpeedMult: 0.20, critChance: 0.12 } },
  sombra:      { id: "sombra",      name: "Sombra",      icon: "🌑", tier: "purple", desc: "+15% esquiva e +15% dano",           effect: { dodgeChance: 0.15, dmgMult: 0.15 } },
  arcane:      { id: "arcane",      name: "Arcano",      icon: "🔮", tier: "purple", desc: "+20% XP e +15% ouro",                effect: { xpMult: 0.20, goldMult: 0.15 } },
  abissal:     { id: "abissal",     name: "Abissal",     icon: "🌊", tier: "purple", desc: "+25% HP e +18% def",                 effect: { hpMult: 0.25, defMult: 0.18 } },
  fulgurante:  { id: "fulgurante",  name: "Fulgurante",  icon: "⚡", tier: "purple", desc: "+22% vel. de atk e +12% dano",       effect: { atkSpeedMult: 0.22, dmgMult: 0.12 } },
  vitalicio:   { id: "vitalicio",   name: "Vitálico",    icon: "💚", tier: "purple", desc: "+35% HP e +5% regen/3s",             effect: { hpMult: 0.35, regenPct: 0.05 } },

  // ===== DOURADO (tier novo — só Ovo Selado Ancestral, pico de alimentação) =====
  soberano:    { id: "soberano",    name: "Soberano",    icon: "👑", tier: "gold", desc: "+20% XP, Ouro, Dano e Def",          effect: { xpMult: 0.20, goldMult: 0.20, dmgMult: 0.20, defMult: 0.20 } },
  aniquilador: { id: "aniquilador", name: "Aniquilador", icon: "💀", tier: "gold", desc: "+35% dano e +12% crítico",           effect: { dmgMult: 0.35, critChance: 0.12 } },
  primordial:  { id: "primordial",  name: "Primordial",  icon: "🌀", tier: "gold", desc: "+40% HP, +15% def e +5% regen/3s",   effect: { hpMult: 0.40, defMult: 0.15, regenPct: 0.05 } },
  temporal:    { id: "temporal",    name: "Temporal",    icon: "⏳", tier: "gold", desc: "+35% XP e +15% esquiva",             effect: { xpMult: 0.35, dodgeChance: 0.15 } },
  astral:      { id: "astral",      name: "Astral",      icon: "☄️", tier: "gold", desc: "+28% dano, +15% crítico e +10% vel.",effect: { dmgMult: 0.28, critChance: 0.15, atkSpeedMult: 0.10 } },
  perpetuo:    { id: "perpetuo",    name: "Perpétuo",    icon: "✨", tier: "gold", desc: "+35% HP, +12% roubo de vida e +8% regen", effect: { hpMult: 0.35, lifeSteal: 0.12, regenPct: 0.08 } },
  ourobranco:  { id: "ourobranco",  name: "Ouro Branco", icon: "💛", tier: "gold", desc: "+50% ouro e +25% XP",                effect: { goldMult: 0.50, xpMult: 0.25 } },
  divino:      { id: "divino",      name: "Divino",      icon: "🌟", tier: "gold", desc: "+25% XP, Ouro, Dano e Def e +10% HP",effect: { xpMult: 0.25, goldMult: 0.25, dmgMult: 0.25, defMult: 0.25, hpMult: 0.10 } },
};

const POOL_BY_TIER: Record<TraitTier, string[]> = {
  common:   Object.values(TRAITS).filter((t) => t.tier === "common").map((t) => t.id),
  uncommon: Object.values(TRAITS).filter((t) => t.tier === "uncommon").map((t) => t.id),
  rare:     Object.values(TRAITS).filter((t) => t.tier === "rare").map((t) => t.id),
  epic:     Object.values(TRAITS).filter((t) => t.tier === "epic").map((t) => t.id),
  purple:   Object.values(TRAITS).filter((t) => t.tier === "purple").map((t) => t.id),
  gold:     Object.values(TRAITS).filter((t) => t.tier === "gold").map((t) => t.id),
};

// Peso do POOL a sortear por raridade do pokémon.
// (Qualquer pokémn PODE ganhar qualquer tier — só muda a chance.
//  purple/gold = 0 em TODAS as raridades: nunca rolam em capturas normais.)
const TIER_WEIGHTS: Record<Rarity, Record<TraitTier, number>> = {
  common:       { common: 70, uncommon: 22, rare: 7,  epic: 1,   purple: 0, gold: 0 },
  uncommon:     { common: 55, uncommon: 28, rare: 13, epic: 4,   purple: 0, gold: 0 },
  rare:         { common: 40, uncommon: 32, rare: 20, epic: 8,   purple: 0, gold: 0 },
  epic:         { common: 25, uncommon: 32, rare: 28, epic: 15,  purple: 0, gold: 0 },
  legendary:    { common: 12, uncommon: 25, rare: 35, epic: 28,  purple: 0, gold: 0 },
  mythic:       { common: 5,  uncommon: 20, rare: 35, epic: 40,  purple: 0, gold: 0 },
  mythic_shiny: { common: 0,  uncommon: 10, rare: 30, epic: 60,  purple: 0, gold: 0 },
};

// Chance de PREENCHER cada slot (probabilidade independente por slot).
const SLOT_CHANCES: Record<Rarity, number[]> = {
  common:       [0.25],
  uncommon:     [0.45],
  rare:         [0.65, 0.15],
  epic:         [0.80, 0.30],
  legendary:    [1.00, 0.55, 0.10],
  mythic:       [1.00, 0.75, 0.30],
  mythic_shiny: [1.00, 0.90, 0.55, 0.20],
};

function pickWeighted<T>(entries: Array<[T, number]>): T {
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of entries) {
    r -= w;
    if (r <= 0) return v;
  }
  return entries[entries.length - 1][0];
}

export function rollTraits(rarity: Rarity): string[] {
  const slots = SLOT_CHANCES[rarity] ?? [0];
  const weights = TIER_WEIGHTS[rarity];
  const out: string[] = [];
  for (const chance of slots) {
    if (Math.random() > chance) continue;
    const tier = pickWeighted<TraitTier>([
      ["common",   weights.common],
      ["uncommon", weights.uncommon],
      ["rare",     weights.rare],
      ["epic",     weights.epic],
    ]);
    const pool = POOL_BY_TIER[tier].filter((id) => !out.includes(id));
    if (pool.length === 0) continue;
    const id = pool[Math.floor(Math.random() * pool.length)];
    out.push(id);
  }
  return out;
}

export const TIER_COLOR: Record<TraitTier, string> = {
  common:   "#c8b8d0",
  uncommon: "#7ef2a2",
  rare:     "#6bd4ff",
  epic:     "#c084fc",
  purple:   "#b14bff",
  gold:     "#ffd94d",
};

/** Tipos de ovo do sistema ancestral. */
export type AncestralEggKind = "selado" | "plus" | "luck";

const ANCESTRAL_EGG_TRAITS: Record<AncestralEggKind, number> = {
  selado: 12,
  plus: 16,
  luck: 12,
};

const GIFT_GOLD_POOL = POOL_BY_TIER.gold;
const GIFT_PURPLE_POOL = POOL_BY_TIER.purple;

/**
 * Sorteio dos traits de um ancestral recém-liberado do Ovo Selado.
 * Regras duras (spec do jogador):
 *  - NUNCA menos que 12 traits (Plus = 16);
 *  - NUNCA abaixo do tier ROXO (todos os slots são purple/gold);
 *  - DOURADO escala com a alimentação (Esfera de Safira): +1 gold a cada 2
 *    esferas, teto 5; o ovo "Luck" parte de +3 gold.
 */
export function rollAncestralTraits(kind: AncestralEggKind, fed: number): string[] {
  const total = ANCESTRAL_EGG_TRAITS[kind] ?? 12;
  const fedGold = Math.max(0, Math.floor((fed ?? 0) / 2));
  const bonus = kind === "luck" ? 3 : 0;
  // Sempre sobra pelo menos 4 slots roxos — gold nunca vira maioria absoluta.
  const goldCount = Math.min(5 + bonus, Math.max(0, total - 4), fedGold + bonus);
  const purpleCount = total - goldCount;

  const goldPool = [...GIFT_GOLD_POOL];
  const purplePool = [...GIFT_PURPLE_POOL];
  const out: string[] = [];
  const takeFrom = (pool: string[]) => {
    if (pool.length === 0) return;
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool[i]);
    pool.splice(i, 1);
  };
  for (let i = 0; i < goldCount; i++) takeFrom(goldPool);
  for (let i = 0; i < purpleCount; i++) takeFrom(purplePool);
  return out;
}

// Soma os efeitos de todos os traits do time em um pacote parcial.
export interface TraitAggregate {
  xpMult: number; goldMult: number; dmgMult: number; defMult: number;
  hpMult: number; atkSpeedMult: number; regenPct: number;
  critChance: number; dodgeChance: number; lifeSteal: number;
  count: number;
  labels: string[];
}

export function aggregateTraits(team: Array<Pick<PetInstance, "traits"> & { traits?: string[] }>): TraitAggregate {
  const agg: TraitAggregate = {
    xpMult: 0, goldMult: 0, dmgMult: 0, defMult: 0, hpMult: 0,
    atkSpeedMult: 0, regenPct: 0, critChance: 0, dodgeChance: 0, lifeSteal: 0,
    count: 0, labels: [],
  };
  for (const p of team) {
    const ts = p.traits ?? [];
    for (const id of ts) {
      const t = TRAITS[id];
      if (!t) continue;
      agg.count += 1;
      agg.labels.push(`${t.icon} ${t.name}`);
      const e = t.effect;
      if (e.xpMult)       agg.xpMult       += e.xpMult;
      if (e.goldMult)     agg.goldMult     += e.goldMult;
      if (e.dmgMult)      agg.dmgMult      += e.dmgMult;
      if (e.defMult)      agg.defMult      += e.defMult;
      if (e.hpMult)       agg.hpMult       += e.hpMult;
      if (e.atkSpeedMult) agg.atkSpeedMult += e.atkSpeedMult;
      if (e.regenPct)     agg.regenPct     += e.regenPct;
      if (e.critChance)   agg.critChance   += e.critChance;
      if (e.dodgeChance)  agg.dodgeChance  += e.dodgeChance;
      if (e.lifeSteal)    agg.lifeSteal    += e.lifeSteal;
    }
  }
  return agg;
}
