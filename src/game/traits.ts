// Sistema de TRAITS (atributos bônus) que aparecem em Pokémon capturados.
// Cada trait pertence a uma "raridade própria", mas qualquer Pokémon pode
// rolar traits de qualquer raridade — só as chances mudam pela raridade do bicho.

import type { PetInstance, Rarity } from "./systems";

export type TraitTier = "common" | "uncommon" | "rare" | "epic";

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
};

const POOL_BY_TIER: Record<TraitTier, string[]> = {
  common:   Object.values(TRAITS).filter((t) => t.tier === "common").map((t) => t.id),
  uncommon: Object.values(TRAITS).filter((t) => t.tier === "uncommon").map((t) => t.id),
  rare:     Object.values(TRAITS).filter((t) => t.tier === "rare").map((t) => t.id),
  epic:     Object.values(TRAITS).filter((t) => t.tier === "epic").map((t) => t.id),
};

// Peso do POOL a sortear por raridade do pokémon.
// (Qualquer pokémon PODE ganhar qualquer tier — só muda a chance.)
const TIER_WEIGHTS: Record<Rarity, Record<TraitTier, number>> = {
  common:       { common: 70, uncommon: 22, rare: 7,  epic: 1 },
  uncommon:     { common: 55, uncommon: 28, rare: 13, epic: 4 },
  rare:         { common: 40, uncommon: 32, rare: 20, epic: 8 },
  epic:         { common: 25, uncommon: 32, rare: 28, epic: 15 },
  legendary:    { common: 12, uncommon: 25, rare: 35, epic: 28 },
  mythic:       { common: 5,  uncommon: 20, rare: 35, epic: 40 },
  mythic_shiny: { common: 0,  uncommon: 10, rare: 30, epic: 60 },
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
};

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
