// Sistema de Sinergias Elementais
// - Mapeia cada Species a um ou dois elementos.
// - Calcula o pacote de buffs total do time.
// - Calcula "Power" total de um pokémon.

import type { PetInstance, Species, Rarity } from "./systems";
import { SPECIES_BASE } from "./systems";
import { aggregateTraits } from "./traits";

export type Element =
  | "planta" | "fogo" | "agua" | "eletrico" | "pedra" | "veneno"
  | "psiquico" | "gelo" | "voador" | "inseto" | "lutador" | "fantasma"
  | "dragao" | "normal" | "fada";

export const ELEMENT_META: Record<Element, { label: string; color: string; emoji: string }> = {
  planta:   { label: "PLANTA",   color: "#5ec26a", emoji: "🌿" },
  fogo:     { label: "FOGO",     color: "#ff6b3d", emoji: "🔥" },
  agua:     { label: "ÁGUA",     color: "#4ea8ff", emoji: "💧" },
  eletrico: { label: "ELÉTRICO", color: "#f5cf6b", emoji: "⚡" },
  pedra:    { label: "PEDRA",    color: "#b0895c", emoji: "🪨" },
  veneno:   { label: "VENENO",   color: "#a55cff", emoji: "☠️" },
  psiquico: { label: "PSÍQUICO", color: "#ff5ec7", emoji: "🔮" },
  gelo:     { label: "GELO",     color: "#7ee6ff", emoji: "❄️" },
  voador:   { label: "VOADOR",   color: "#c9c1ff", emoji: "🐦" },
  inseto:   { label: "INSETO",   color: "#9dc94a", emoji: "🐛" },
  lutador:  { label: "LUTADOR",  color: "#ff9558", emoji: "👊" },
  fantasma: { label: "FANTASMA", color: "#7a5cff", emoji: "👻" },
  dragao:   { label: "DRAGÃO",   color: "#ffb84e", emoji: "🐉" },
  normal:   { label: "NORMAL",   color: "#c8b8d0", emoji: "✦" },
  fada:     { label: "FADA",     color: "#ff9de0", emoji: "🧚" },
};

// Mapeamento species -> elementos (1 ou 2). Mantém default "normal" se não listado.
export const SPECIES_ELEMENTS: Partial<Record<Species, Element[]>> = {
  // Grama
  bulbasaur: ["planta","veneno"], ivysaur: ["planta","veneno"], venusaur: ["planta","veneno"],
  bulbasaur_hat: ["planta"], oddish: ["planta","veneno"], gloom: ["planta","veneno"],
  bellsprout: ["planta","veneno"], vileplume: ["planta","veneno"], tangela: ["planta"],
  paras: ["inseto","planta"], parasect: ["inseto","planta"], virizion: ["planta","lutador"],
  // Fogo
  charmander: ["fogo"], charmeleon: ["fogo"], charizard: ["fogo","voador"],
  charizard_shiny: ["fogo","voador"], charizard_alt: ["fogo","voador"],
  vulpix: ["fogo"], ninetales: ["fogo"], growlithe: ["fogo"], arcanine: ["fogo"],
  moltres: ["fogo","voador"], magmar: ["fogo"], flareon: ["fogo"], flareon_shiny: ["fogo"],
  blaziken: ["fogo","lutador"],
  magmortar: ["fogo"],
  ho_oh: ["fogo","voador"],
  darkrai: ["fantasma","psiquico"],
  // Água
  squirtle: ["agua"], wartortle: ["agua"], wartortle_shiny: ["agua"],
  blastoise: ["agua"], blastoise_shiny: ["agua"],
  psyduck: ["agua"], poliwag: ["agua"], poliwhirl: ["agua"], poliwrath: ["agua","lutador"],
  gyarados: ["agua","voador"],
  lapras: ["agua","gelo"], lapras_shiny: ["agua","gelo"],
  vaporeon: ["agua"], vaporeon_shiny: ["agua"], kabutops: ["pedra","agua"],
  suicune: ["agua"], suicune_shiny: ["agua"],
  // Elétrico
  pikachu: ["eletrico"], raichu: ["eletrico"], magnemite: ["eletrico"],
  jolteon: ["eletrico"], jolteon_shiny: ["eletrico"],
  zapdos: ["eletrico","voador"], raikou: ["eletrico"], luxray_f: ["eletrico"],
  // Pedra/Terra
  onix: ["pedra"], sandshrew: ["pedra"], sandslash: ["pedra"], sandshrew_shiny: ["pedra"],
  sandslash_shiny: ["pedra"], golem: ["pedra"], aerodactyl: ["pedra","voador"],
  diglett: ["pedra"], cubone: ["pedra"], groudon: ["pedra","fogo"],
  // Veneno
  ekans: ["veneno"], arbok: ["veneno"], zubat: ["veneno","voador"],
  weedle: ["inseto","veneno"], weedle_shiny: ["inseto","veneno"],
  kakuna: ["inseto","veneno"], kakuna_shiny: ["inseto","veneno"],
  beedrill: ["inseto","veneno"], venonat: ["inseto","veneno"], venomoth: ["inseto","veneno"],
  nidoran_f: ["veneno"], nidorina: ["veneno"], nidoking: ["veneno","pedra"],
  // Psíquico
  abra: ["psiquico"], kadabra: ["psiquico"], mewtwo: ["psiquico"],
  mew: ["psiquico"], mew_alt: ["psiquico"], deoxys: ["psiquico"],
  // Gelo
  articuno: ["gelo","voador"],
  // Voador
  pidgey: ["voador","normal"], pidgeotto: ["voador","normal"], pidgeot: ["voador","normal"],
  fearow: ["voador","normal"], butterfree: ["inseto","voador"], butterfree_shiny: ["inseto","voador"],
  // Inseto
  caterpie: ["inseto"], metapod: ["inseto"], metapod_shiny: ["inseto"], pinsir: ["inseto"],
  // Lutador
  machop: ["lutador"], machoke: ["lutador"], machamp: ["lutador"],
  mankey: ["lutador"], primeape: ["lutador"], hitmonchan: ["lutador"],
  // Normal
  jigglypuff: ["fada","normal"], clefairy: ["fada"], clefable: ["fada"],
  meowth: ["normal"], persian: ["normal"], rattata_f: ["normal"], raticate_f: ["normal"],
  snorlax: ["normal"], snorlax_mythic: ["normal"],
  // Dragão
  dragonair: ["dragao"], dragonite: ["dragao","voador"], dragonite_shiny: ["dragao","voador"],
  // Aura / especial
  lucario: ["lutador"],
  lugia: ["psiquico","voador"],
  hariyama: ["lutador"],
  ursaring: ["normal"],
  // Guardiões Anti-Paralisia
  ditto: ["normal"],
  ditto_shiny: ["normal"],
  electabuzz: ["eletrico"],
  gengar: ["fantasma","veneno"],
  hitmontop: ["lutador"],
  magneton: ["eletrico"],
  scizor: ["inseto","lutador"],
  umbreon: ["psiquico"],
};

export function elementsOf(sp: Species): Element[] {
  return SPECIES_ELEMENTS[sp] ?? ["normal"];
}

// ===== Cálculo de Power =====
export function computePower(pet: PetInstance): number {
  const base = SPECIES_BASE[pet.species];
  if (!base) return pet.level * 10;
  const rarityMult: Record<Rarity, number> = {
    common: 1.0, uncommon: 1.15, rare: 1.35, epic: 1.6,
    legendary: 1.9, mythic: 2.3, mythic_shiny: 3.0,
  };
  const rm = rarityMult[pet.rarity] ?? 1;
  const bst = base.hp + base.atk * 2 + base.def * 1.5 + base.spa + base.spd + base.spe;
  const lvFactor = 1 + pet.level / 12;
  const boost = pet.statBoost ?? 1;
  return Math.floor(bst * lvFactor * rm * boost);
}

// ===== Sinergias =====
export interface SynergyPack {
  xpMult: number;       // +% xp
  goldMult: number;     // +% gold
  dmgMult: number;      // +% dano
  defMult: number;      // +% defesa
  hpMult: number;       // +% hp máximo
  atkSpeedMult: number; // +% velocidade de atk
  regenPct: number;     // % do maxHp regenerado por tick (3s)
  critChance: number;   // 0..1
  dodgeChance: number;  // 0..1
  lifeSteal: number;    // 0..1
  paraResist: number;   // 0..1 — chance de resistir a paralisia inimiga
  effects: string[];    // labels legíveis
  byElement: Partial<Record<Element, number>>; // contagem por elemento
  combos: string[];     // combos ativos
}

const STEP = [0, 1, 2, 3, 4, 5];

export function computeTeamSynergies(team: PetInstance[]): SynergyPack {
  const byElement: Partial<Record<Element, number>> = {};
  for (const p of team) {
    for (const e of elementsOf(p.species)) {
      byElement[e] = (byElement[e] ?? 0) + 1;
    }
  }
  const pack: SynergyPack = {
    xpMult: 0, goldMult: 0, dmgMult: 0, defMult: 0, hpMult: 0,
    atkSpeedMult: 0, regenPct: 0, critChance: 0, dodgeChance: 0, lifeSteal: 0,
    paraResist: 0,
    effects: [], byElement, combos: [],
  };

  const c = (e: Element) => Math.min(5, byElement[e] ?? 0);
  const tier = (n: number, arr: number[]) => (n <= 0 ? 0 : arr[Math.min(n, arr.length) - 1] ?? 0);
  void STEP;

  // Planta — regen + xp
  if (c("planta") > 0) {
    pack.regenPct += tier(c("planta"), [0.01, 0.02, 0.03, 0.04, 0.06]);
    pack.xpMult   += tier(c("planta"), [0.05, 0.10, 0.15, 0.20, 0.30]);
    pack.effects.push(`🌿 Planta ×${c("planta")} — regen ${Math.round(pack.regenPct*100)}%/3s`);
  }
  // Fogo — dano
  if (c("fogo") > 0) {
    pack.dmgMult += tier(c("fogo"), [0.10, 0.20, 0.35, 0.50, 0.70]);
    pack.effects.push(`🔥 Fogo ×${c("fogo")} — +${Math.round(tier(c("fogo"),[10,20,35,50,70]))}% dano`);
  }
  // Água — defesa
  if (c("agua") > 0) {
    pack.defMult += tier(c("agua"), [0.08, 0.16, 0.25, 0.35, 0.50]);
    pack.effects.push(`💧 Água ×${c("agua")} — +${Math.round(tier(c("agua"),[8,16,25,35,50]))}% def`);
  }
  // Elétrico — atk speed + crit + resistência a paralisia (aterramento)
  if (c("eletrico") > 0) {
    pack.atkSpeedMult += tier(c("eletrico"), [0.15, 0.25, 0.40, 0.55, 0.75]);
    pack.critChance   += tier(c("eletrico"), [0.03, 0.06, 0.10, 0.15, 0.22]);
    pack.paraResist   += tier(c("eletrico"), [0.15, 0.30, 0.50, 0.70, 0.90]);
    pack.effects.push(`⚡ Elétrico ×${c("eletrico")} — +${Math.round(tier(c("eletrico"),[15,25,40,55,75]))}% vel · ${Math.round(tier(c("eletrico"),[15,30,50,70,90]))}% resist. paralisia`);
  }
  // Pedra — hp + resistência a paralisia (aterramento)
  if (c("pedra") > 0) {
    pack.hpMult += tier(c("pedra"), [0.20, 0.40, 0.60, 0.80, 1.20]);
    pack.paraResist += tier(c("pedra"), [0.05, 0.10, 0.18, 0.28, 0.40]);
    pack.effects.push(`🪨 Pedra ×${c("pedra")} — +${Math.round(tier(c("pedra"),[20,40,60,80,120]))}% HP · aterramento`);
  }
  // Veneno — dano crescente
  if (c("veneno") > 0) {
    pack.dmgMult += tier(c("veneno"), [0.05, 0.10, 0.20, 0.30, 0.45]);
    pack.effects.push(`☠️ Veneno ×${c("veneno")} — +${Math.round(tier(c("veneno"),[5,10,20,30,45]))}% dano tóxico`);
  }
  // Psíquico — ouro + crit
  if (c("psiquico") > 0) {
    pack.goldMult   += tier(c("psiquico"), [0.05, 0.10, 0.15, 0.20, 0.30]);
    pack.critChance += tier(c("psiquico"), [0.02, 0.05, 0.08, 0.12, 0.18]);
    pack.effects.push(`🔮 Psíquico ×${c("psiquico")} — +${Math.round(tier(c("psiquico"),[5,10,15,20,30]))}% ouro`);
  }
  // Gelo — dodge
  if (c("gelo") > 0) {
    pack.dodgeChance += tier(c("gelo"), [0.05, 0.10, 0.15, 0.20, 0.28]);
    pack.effects.push(`❄️ Gelo ×${c("gelo")} — ${Math.round(tier(c("gelo"),[5,10,15,20,28]))}% congelar`);
  }
  // Voador — dodge + xp
  if (c("voador") > 0) {
    pack.dodgeChance += tier(c("voador"), [0.03, 0.06, 0.10, 0.15, 0.20]);
    pack.xpMult      += tier(c("voador"), [0.03, 0.06, 0.10, 0.15, 0.20]);
    pack.effects.push(`🐦 Voador ×${c("voador")} — +esquiva & +XP`);
  }
  // Inseto — lifesteal
  if (c("inseto") > 0) {
    pack.lifeSteal += tier(c("inseto"), [0.03, 0.05, 0.08, 0.12, 0.18]);
    pack.effects.push(`🐛 Inseto ×${c("inseto")} — ${Math.round(tier(c("inseto"),[3,5,8,12,18]))}% roubo de vida`);
  }
  // Lutador — crit
  if (c("lutador") > 0) {
    pack.critChance += tier(c("lutador"), [0.08, 0.15, 0.22, 0.30, 0.42]);
    pack.effects.push(`👊 Lutador ×${c("lutador")} — +${Math.round(tier(c("lutador"),[8,15,22,30,42]))}% crítico`);
  }
  // Fantasma — dodge + xp em mítico
  if (c("fantasma") > 0) {
    pack.dodgeChance += tier(c("fantasma"), [0.08, 0.15, 0.22, 0.30, 0.40]);
    pack.effects.push(`👻 Fantasma ×${c("fantasma")} — ${Math.round(tier(c("fantasma"),[8,15,22,30,40]))}% esquiva`);
  }
  // Dragão — bônus universal
  if (c("dragao") > 0) {
    const u = tier(c("dragao"), [0.05, 0.10, 0.15, 0.20, 0.30]);
    pack.xpMult += u; pack.goldMult += u; pack.dmgMult += u; pack.defMult += u;
    pack.effects.push(`🐉 Dragão ×${c("dragao")} — +${Math.round(u*100)}% em tudo`);
  }
  // Fada — regen + def + pequena resistência a paralisia
  if (c("fada") > 0) {
    pack.regenPct += tier(c("fada"), [0.005, 0.01, 0.02, 0.03, 0.04]);
    pack.defMult  += tier(c("fada"), [0.05, 0.10, 0.15, 0.20, 0.30]);
    pack.paraResist += tier(c("fada"), [0.03, 0.07, 0.12, 0.18, 0.25]);
    pack.effects.push(`🧚 Fada ×${c("fada")} — proteção mágica · anti-paralisia`);
  }

  // ===== Combos cruzados =====
  if (c("planta") >= 1 && c("agua") >= 1) {
    pack.regenPct += 0.02; pack.combos.push("🌸 Jardim Sagrado (+50% cura)");
  }
  if (c("fogo") >= 1 && c("voador") >= 1) {
    pack.critChance += 0.10; pack.combos.push("🔥 Fênix (+10% crit)");
  }
  if (c("pedra") >= 2) {
    pack.defMult += 0.15; pack.combos.push("🛡️ Fortaleza (+15% def)");
  }
  if (c("veneno") >= 1 && c("inseto") >= 1) {
    pack.dmgMult += 0.15; pack.combos.push("🐝 Enxame Tóxico (+15% dano)");
  }
  if (c("eletrico") >= 1 && c("voador") >= 1) {
    pack.atkSpeedMult += 0.15; pack.combos.push("⛈ Tempestade (+15% vel)");
  }
  if (c("eletrico") >= 1 && c("pedra") >= 1) {
    pack.paraResist += 0.25; pack.combos.push("🧲 Aterramento Total (+25% resist. paralisia)");
  }
  if (c("fada") >= 2 && c("psiquico") >= 1) {
    pack.paraResist += 0.20; pack.combos.push("🌟 Bênção Encantada (+20% resist. paralisia)");
  }
  if (c("gelo") >= 1 && c("agua") >= 1) {
    pack.dodgeChance += 0.05; pack.combos.push("🌊 Abismo Gélido");
  }
  if (c("psiquico") >= 1 && c("fada") >= 1) {
    pack.goldMult += 0.10; pack.combos.push("✨ Encanto Arcano (+10% ouro)");
  }
  if (c("lutador") >= 1 && c("pedra") >= 1) {
    pack.dmgMult += 0.10; pack.combos.push("💥 Punho Rochoso (+10% dano)");
  }
  if (c("dragao") >= 1 && c("fogo") >= 1) {
    pack.dmgMult += 0.15; pack.goldMult += 0.05; pack.combos.push("🐲 Fúria Dracônica");
  }

  // ===== GUARDIÕES ANTI-PARALISIA — squad especial =====
  // Ditto, Electabuzz, Gengar, Hitmontop e Magneton dão paraResist massivo,
  // escalando por raridade. Com os 5 no time, imunidade quase total.
  const GUARDIANS: Species[] = ["ditto","ditto_shiny","electabuzz","gengar","hitmontop","magneton","scizor","umbreon"];
  const rarityParaBoost: Record<Rarity, number> = {
    common: 0.08, uncommon: 0.10, rare: 0.18, epic: 0.28,
    legendary: 0.40, mythic: 0.55, mythic_shiny: 0.75,
  };
  let guardiansIn = 0;
  let guardParaAdd = 0;
  const guardianLabels: string[] = [];
  for (const p of team) {
    if (GUARDIANS.includes(p.species)) {
      guardiansIn++;
      const boost = rarityParaBoost[p.rarity] ?? 0.10;
      guardParaAdd += boost;
      guardianLabels.push(`${p.species.toUpperCase()} (+${Math.round(boost*100)}%)`);
    }
  }
  if (guardiansIn > 0) {
    // bônus escalonado extra por quantidade no time
    const stack = [0, 0.05, 0.12, 0.20, 0.30, 0.45][Math.min(5, guardiansIn)];
    pack.paraResist += guardParaAdd + stack;
    pack.effects.push(`🧲 Guardiões Anti-Paralisia ×${guardiansIn} — ${guardianLabels.join(" · ")}`);
    if (guardiansIn >= 5) {
      pack.paraResist += 0.20;
      pack.combos.push("🛡️✨ Escudo Inquebrável (Guardiões ×5) — imunidade quase total à paralisia");
    } else if (guardiansIn >= 3) {
      pack.combos.push(`🧲 Muralha Elétrica (Guardiões ×${guardiansIn})`);
    }
  }

  // ===== GACHA — bônus por raridade dos membros do time =====

  // Não altera stats base; só some no pacote de sinergia (XP/Ouro/Dano).
  // Escala: rare/epic/legendary/mythic/mythic_shiny.
  const gachaWeight: Partial<Record<Rarity, { xp: number; gold: number; dmg: number; label: string }>> = {
    rare:         { xp: 0.02, gold: 0.02, dmg: 0.02, label: "Raro" },
    epic:         { xp: 0.04, gold: 0.05, dmg: 0.04, label: "Épico" },
    legendary:    { xp: 0.07, gold: 0.08, dmg: 0.06, label: "Lendário" },
    mythic:       { xp: 0.10, gold: 0.12, dmg: 0.09, label: "Mítico" },
    mythic_shiny: { xp: 0.15, gold: 0.18, dmg: 0.14, label: "Mítico ✦" },
  };
  const gachaCounts: Partial<Record<Rarity, number>> = {};
  let gachaXp = 0, gachaGold = 0, gachaDmg = 0;
  for (const p of team) {
    const w = gachaWeight[p.rarity];
    if (!w) continue;
    gachaCounts[p.rarity] = (gachaCounts[p.rarity] ?? 0) + 1;
    gachaXp += w.xp; gachaGold += w.gold; gachaDmg += w.dmg;
  }
  if (gachaXp > 0 || gachaGold > 0 || gachaDmg > 0) {
    pack.xpMult += gachaXp;
    pack.goldMult += gachaGold;
    pack.dmgMult += gachaDmg;
    const parts = Object.entries(gachaCounts)
      .map(([r, n]) => `${gachaWeight[r as Rarity]?.label} ×${n}`)
      .join(" · ");
    pack.effects.push(`🎰 Gacha — ${parts} · +${Math.round(gachaXp*100)}% XP · +${Math.round(gachaGold*100)}% ouro · +${Math.round(gachaDmg*100)}% dano`);
  }

  // ===== TRAITS — atributos bônus dos pokémon capturados =====
  const traitAgg = aggregateTraits(team);
  if (traitAgg.count > 0) {
    pack.xpMult       += traitAgg.xpMult;
    pack.goldMult     += traitAgg.goldMult;
    pack.dmgMult      += traitAgg.dmgMult;
    pack.defMult      += traitAgg.defMult;
    pack.hpMult       += traitAgg.hpMult;
    pack.atkSpeedMult += traitAgg.atkSpeedMult;
    pack.regenPct     += traitAgg.regenPct;
    pack.critChance   += traitAgg.critChance;
    pack.dodgeChance  += traitAgg.dodgeChance;
    pack.lifeSteal    += traitAgg.lifeSteal;
    pack.effects.push(`✨ Traits ×${traitAgg.count} — ${traitAgg.labels.slice(0, 6).join(" · ")}${traitAgg.labels.length > 6 ? " …" : ""}`);
  }

  return pack;
}


export function primaryElement(sp: Species): Element {
  return elementsOf(sp)[0];
}
