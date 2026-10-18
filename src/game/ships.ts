// Barcos da Jornada dos Navegantes — dados, corte do spritesheet e regras.
// Módulo de dados (sem JSX) para não acionar a regra react-refresh dos componentes.
//
// O sheet "Barco spritemovimento.png" é uma grade 4x4 de células 192x192 com
// origem em (216, 24) — medido por análise de pixels, não por palpite. A
// artoria não tem linha "baixo": DOWN usa a linha 0 espelhada em Y.
import boatSheetUrl from "@/ambiente/EFECT AGUA/Barco spritemovimento.png";
import boatBrokenUrl from "@/ambiente/EFECT AGUA/barco quebrado.png";
import boatShopUrl from "@/ambiente/EFECT AGUA/modelinho barco loja.png";
import oilUrl from "@/ambiente/EFECT AGUA/oleo.png";
import waterFxUrl from "@/ambiente/EFECT AGUA/Efeito nas aguas..png";
import whirlFxUrl from "@/ambiente/EFECT AGUA/Efeito Redemoinho.png";
import whirlBigUrl from "@/ambiente/EFECT AGUA/Redemoinho.png";

export const BOAT_SHEET_URL = boatSheetUrl;
export const BOAT_BROKEN_URL = boatBrokenUrl;
export const BOAT_SHOP_ICON = boatShopUrl;
export const OIL_ICON = oilUrl;
export const WATER_FX_URL = waterFxUrl;
export const WHIRL_FX_URL = whirlFxUrl;
export const WHIRL_BIG_URL = whirlBigUrl;

/** Geometria do corte — medida, não estimada. */
export const BOAT_SHEET = {
  cell: 192,
  originX: 216,
  originY: 24,
  cols: 4,
  rows: 4,
  sheetW: 1229,
  sheetH: 773,
} as const;

/**
 * background-position do frame (linha, coluna) dentro do sheet.
 * CSS: pos% = offsetPx / (container - imagem) * 100. Com
 * backgroundSize = (sheet/cell)*100%, o container se cancela e sobra
 * -(origem + indice*cell) / (sheet - cell) * 100.
 */
export function boatFrameStyle(row: number, col: number): { backgroundSize: string; backgroundPosition: string } {
  const { cell, originX, originY, sheetW, sheetH } = BOAT_SHEET;
  const x = -((originX + col * cell) / (sheetW - cell)) * 100;
  const y = -((originY + row * cell) / (sheetH - cell)) * 100;
  return {
    backgroundSize: `${(sheetW / cell) * 100}% ${(sheetH / cell) * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
  };
}

/**
 * Versão em PIXELS EXATOS — não usa a semântica percentual de
 * background-position do CSS. A imagem é desenhada no tamanho natural
 * escalado por (size / cell) e deslocada em px, então o recorte bate
 * certo independente do tamanho do elemento.
 */
export function boatFrameStylePx(
  row: number,
  col: number,
  size: number,
): { backgroundSize: string; backgroundPosition: string } {
  const { cell, originX, originY, sheetW, sheetH } = BOAT_SHEET;
  const k = size / cell;
  return {
    backgroundSize: `${sheetW * k}px ${sheetH * k}px`,
    backgroundPosition: `${-(originX + col * cell) * k}px ${-(originY + row * cell) * k}px`,
  };
}

export type BoatDir = "up" | "down" | "left" | "right";
/** Linha do sheet por direção. DOWN espelha a linha 0 no CSS. */
export const BOAT_DIR_ROW: Record<BoatDir, number> = { up: 0, down: 0, left: 3, right: 2 };
export const BOAT_DIR_FLIP_Y: Record<BoatDir, boolean> = { up: false, down: true, left: false, right: false };

/** Frames de animação por direção (0..3). */
export const BOAT_FRAMES = 4;
export const BOAT_FRAME_MS = 190;

// ---- Grade dos efeitos (medida por análise de pixels do alfa) ----
// "Efeito nas aguas..png"  1530x113 -> 7 quadros de ~218,6x113 (manchas de água)
// "Efeito Redemoinho.png" 1526x98  -> 7 quadros de 218x98 (anéis de redemoinho)
// "Redemoinho.png"        1505x190 -> 7 quadros de 215x190 (redemoinho grande)
export const WATER_FX = { frameW: 1530 / 7, frameH: 113, frames: 7 } as const;
export const WHIRL_FX = { frameW: 218, frameH: 98, frames: 7 } as const;
export const WHIRL_BIG = { frameW: 215, frameH: 190, frames: 7 } as const;

/** Recorte em pixels exatos (sem a semântica percentual do CSS). */
export function stripStylePx(
  frameW: number,
  frameH: number,
  frames: number,
  sheetW: number,
  sheetH: number,
  index: number,
  size: number,
) {
  const i = ((index % frames) + frames) % frames;
  const kx = size / frameW;
  const ky = size / frameH;
  return {
    backgroundSize: `${sheetW * kx}px ${sheetH * ky}px`,
    backgroundPosition: `${-(i * frameW) * kx}px ${0}px`,
    width: "100%",
    height: "100%",
  } as const;
}

export function stripStyle(
  frameW: number,
  frameH: number,
  frames: number,
  sheetW: number,
  sheetH: number,
  index: number,
) {
  const i = ((index % frames) + frames) % frames;
  const x = -((i * frameW) / (sheetW - frameW)) * 100;
  const y = -((0 * frameH) / (sheetH - frameH)) * 100;
  return {
    backgroundSize: `${(sheetW / frameW) * 100}% ${(sheetH / frameH) * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
    width: "100%",
    height: "100%",
  } as const;
}

// ---- Raridades ----
export type BoatTier = "comum" | "raro" | "epico" | "lendario";

export const BOAT_TIER_META: Record<BoatTier, { label: string; wood: string; neon: string; glow: string }> = {
  comum: { label: "COMUM", wood: "#8a5a2b", neon: "#c98a4b", glow: "rgba(201,138,75,0.5)" },
  raro: { label: "RARO", wood: "#2f6f8f", neon: "#5ec8f0", glow: "rgba(94,200,240,0.5)" },
  epico: { label: "ÉPICO", wood: "#6b3fa0", neon: "#c07dff", glow: "rgba(192,125,255,0.55)" },
  lendario: { label: "LENDÁRIO", wood: "#a8761c", neon: "#ffd94d", glow: "rgba(255,217,77,0.65)" },
};

export type BoatDef = {
  id: BoatTier;
  name: string;
  tier: BoatTier;
  /** Preço base em ouro. */
  priceGold: number;
  /** Pepitas de ouro exigidas (0 = só ouro). */
  pricePepitas: number;
  /** Resistência (HP do casco). */
  hp: number;
  /** Combustível em segundos de navegação. */
  fuelSec: number;
  /** Óleo (unidades) para encher um tanque cheio. */
  oilPerTank: number;
  /** Velocidade de navegação (multiplicador da velocidade a pé). */
  speed: number;
  desc: string;
  /** Multiplicador de dano recebido por redemoinho. */
  whirlDamage: number;
};

/**
 * Preços (pedido do admin): 2º barco (Raro) = 300 pepitas,
 * Épico = 1.000 pepitas, Lendário = 2.000 pepitas. O Comum é só ouro.
 */
export const BOATS: BoatDef[] = [
  {
    id: "comum",
    name: "Bote de madeira",
    tier: "comum",
    priceGold: 5_000,
    pricePepitas: 0,
    hp: 100,
    fuelSec: 120,
    speed: 0.85,
    oilPerTank: 1,
    desc: "Tábuas de madeira e um remo. Serve para aprender o mar.",
    whirlDamage: 14,
  },
  {
    id: "raro",
    name: "Baleeira de patrulha",
    tier: "raro",
    priceGold: 25_000,
    pricePepitas: 300,
    hp: 220,
    fuelSec: 300,
    speed: 1.0,
    oilPerTank: 2,
    desc: "Casco reforçado e leme firme. Aguenta mar aberto por mais tempo.",
    whirlDamage: 10,
  },
  {
    id: "epico",
    name: "Fragata do Navegante",
    tier: "epico",
    priceGold: 90_000,
    pricePepitas: 1_000,
    hp: 450,
    fuelSec: 720,
    speed: 1.15,
    oilPerTank: 4,
    desc: "Mastro triplo e casco de carvalho. Feita para atravessar a Jornada.",
    whirlDamage: 7,
  },
  {
    id: "lendario",
    name: "Aurora Ancestral",
    tier: "lendario",
    priceGold: 10_000,
    pricePepitas: 2_000,
    hp: 1_000,
    fuelSec: 1_800,
    speed: 1.3,
    oilPerTank: 8,
    desc: "Tábuas de éter e lâmina de luz. A peça mais rara da Jornada dos Navegantes.",
    whirlDamage: 4,
  },
];

export const BOAT_BY_TIER: Record<BoatTier, BoatDef> = Object.fromEntries(
  BOATS.map((b) => [b.id, b]),
) as Record<BoatTier, BoatDef>;

/** Mapas de água — só são acessíveis a bordo. */
export const WATER_MAPS = ["azulante", "margrande", "navegante"] as const;
export type WaterMapId = (typeof WATER_MAPS)[number];

export function isWaterMap(mapId: string): boolean {
  return (WATER_MAPS as readonly string[]).includes(mapId);
}

// ---- Estado do barco no save ----
export type ShipState = {
  tier?: BoatTier;
  hp?: number;
  fuel?: number;
  /** Espécie do Pokémon aquático de bordo (tripulante). */
  crew?: string;
  /** HP restante dos Tentacool por id — persiste, não reseta no F5. */
  tentaHp?: Record<string, number>;
};

export const OIL_ITEM = "oleo";

/** Consome 1s de combustível por segundo navegando. Fuel 0 = sem casco = naufrágio. */
export const FUEL_PER_SEC = 1;

export function maxFuelOf(tier: BoatTier): number {
  return BOAT_BY_TIER[tier].fuelSec;
}

export function maxHpOf(tier: BoatTier): number {
  return BOAT_BY_TIER[tier].hp;
}

/** Redemoinhos por mapa — se o barco passar por cima, toma dano. */
export const WHIRLPOOLS: Record<string, { x: number; y: number; r: number }[]> = {
  azulante: [
    { x: 640, y: 520, r: 70 },
    { x: 300, y: 880, r: 70 },
    { x: 900, y: 240, r: 64 },
    { x: 430, y: 700, r: 64 },
    { x: 1150, y: 950, r: 64 },
  ],
  margrande: [
    { x: 840, y: 470, r: 80 },
    { x: 420, y: 640, r: 80 },
    { x: 1300, y: 780, r: 72 },
    { x: 1050, y: 180, r: 72 },
    { x: 260, y: 300, r: 72 },
  ],
  navegante: [
    { x: 560, y: 300, r: 70 },
    { x: 880, y: 760, r: 70 },
    { x: 1180, y: 520, r: 64 },
    { x: 340, y: 980, r: 64 },
    { x: 760, y: 1080, r: 64 },
  ],
};

/** Manchas de água (Efeito nas aguas..png) espalhadas pelo mapa. */
export const WATER_PATCHES: Record<string, { x: number; y: number; s: number }[]> = {
  azulante: [
    { x: 260, y: 300, s: 150 }, { x: 520, y: 180, s: 130 }, { x: 760, y: 380, s: 165 },
    { x: 400, y: 560, s: 140 }, { x: 980, y: 620, s: 155 }, { x: 180, y: 820, s: 130 },
    { x: 700, y: 900, s: 170 }, { x: 1080, y: 1080, s: 145 },
  ],
  margrande: [
    { x: 300, y: 200, s: 155 }, { x: 640, y: 160, s: 135 }, { x: 1000, y: 280, s: 165 },
    { x: 480, y: 460, s: 150 }, { x: 1240, y: 520, s: 140 }, { x: 200, y: 700, s: 160 },
    { x: 760, y: 780, s: 145 }, { x: 1400, y: 850, s: 155 },
  ],
  navegante: [
    { x: 240, y: 260, s: 150 }, { x: 600, y: 200, s: 135 }, { x: 960, y: 340, s: 165 },
    { x: 420, y: 620, s: 145 }, { x: 1020, y: 660, s: 160 }, { x: 200, y: 940, s: 135 },
    { x: 720, y: 1000, s: 170 }, { x: 1160, y: 1120, s: 150 },
  ],
};

// Tentacool / Tentacool Shiny — sprites em grade 4x4 de 64x64 (256x256).
import tentacoolUrl from "@/ambiente/EFECT AGUA/Tentacool.png";
import tentacoolShinyUrl from "@/ambiente/EFECT AGUA/Tentacool Shiny.png";
import waterSkillUrl from "@/ambiente/EFECT AGUA/Skill atak pokemon Aquatico.png";

export const TENTACOOL_URL = tentacoolUrl;
export const TENTACOOL_SHINY_URL = tentacoolShinyUrl;
export const WATER_SKILL_URL = waterSkillUrl;

/** Skill de água: 7 quadros de 218x154 (medido). */
export const WATER_SKILL = { frameW: 218, frameH: 154, frames: 7, sheetW: 1526, sheetH: 154 } as const;

/** Sheet do Tentacool: 4x4 de 64px. */
export const TENTA_SHEET = { cell: 64, cols: 4, rows: 4, sheetW: 256, sheetH: 256 } as const;

/** Trainer só pode capturar acima deste nível. */
export const TENTA_CAPTURE_TRAINER_LEVEL = 200;

export type TentacoolDef = {
  id: string;
  x: number;
  y: number;
  shiny: boolean;
  level: number;
  rarity: "RARO" | "ÉPICO";
  name: string;
  /** Dano por golpe de água no casco. */
  damage: number;
  /** Alcance de ataque a partir do centro. */
  range: number;
};

/** Espalhados no Azulante: se o barco entrar no raio, atacam o casco. */
export const TENTACOOLS: Record<string, TentacoolDef[]> = {
  azulante: [
    { id: "tenta-1", x: 330, y: 420, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 9, range: 150 },
    { id: "tenta-2", x: 760, y: 620, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 9, range: 150 },
    { id: "tenta-3", x: 980, y: 240, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 9, range: 150 },
    { id: "tenta-sh-1", x: 520, y: 900, shiny: true, level: 99, rarity: "ÉPICO", name: "Tentacool Shiny", damage: 17, range: 190 },
  ],
  margrande: [],
  navegante: [],
};

/** Recorte em pixels de um frame do sheet do Tentacool (grade 4x4 de 64). */
export function tentFrameStylePx(row: number, col: number, size: number) {
  const { cell, sheetW, sheetH } = TENTA_SHEET;
  const k = size / cell;
  return {
    backgroundSize: `${(sheetW / cell) * 100}% ${(sheetH / cell) * 100}%`,
    backgroundPosition: `${-(col * cell) * k}px ${-(row * cell) * k}px`,
    width: "100%",
    height: "100%",
  };
}

// ============ SUCATA FLUTUANTE ============
import sucataUrl from "@/ambiente/EFECT AGUA/sucata.png";
import fxWaterUrl from "@/assets/fx/fx-water.png";

export const SUCATA_URL = sucataUrl;
export const FX_WATER_URL = fxWaterUrl;

export type ScrapRarity = "comum" | "rara" | "epica" | "lendaria";

export const SCRAP_META: Record<ScrapRarity, { label: string; color: string; points: number; items: number }> = {
  comum: { label: "COMUM", color: "#9fb3c8", points: 1, items: 1 },
  rara: { label: "RARA", color: "#5ec8f0", points: 3, items: 2 },
  epica: { label: "ÉPICA", color: "#c07dff", points: 8, items: 4 },
  lendaria: { label: "LENDÁRIA", color: "#ffd94d", points: 20, items: 10 },
};

export type ScrapCrate = {
  id: string;
  x: number;
  y: number;
  rarity: ScrapRarity;
};

/** Espalhadas longe uma da outra (distância mínima respeitada). */
export const SCRAP_CRATES: Record<string, ScrapCrate[]> = {
  azulante: [
    { id: "sc-1", x: 150, y: 200, rarity: "comum" },
    { id: "sc-2", x: 620, y: 170, rarity: "comum" },
    { id: "sc-3", x: 1120, y: 240, rarity: "comum" },
    { id: "sc-4", x: 330, y: 620, rarity: "comum" },
    { id: "sc-5", x: 880, y: 700, rarity: "comum" },
    { id: "sc-6", x: 540, y: 1000, rarity: "rara" },
    { id: "sc-7", x: 1180, y: 980, rarity: "rara" },
    { id: "sc-8", x: 200, y: 1100, rarity: "epica" },
    { id: "sc-9", x: 780, y: 420, rarity: "epica" },
    { id: "sc-10", x: 1240, y: 560, rarity: "lendaria" },
  ],
  margrande: [
    { id: "sc-20", x: 180, y: 180, rarity: "comum" },
    { id: "sc-21", x: 780, y: 200, rarity: "comum" },
    { id: "sc-22", x: 1450, y: 230, rarity: "comum" },
    { id: "sc-23", x: 400, y: 520, rarity: "comum" },
    { id: "sc-24", x: 1180, y: 600, rarity: "comum" },
    { id: "sc-25", x: 650, y: 760, rarity: "rara" },
    { id: "sc-26", x: 1500, y: 800, rarity: "rara" },
    { id: "sc-27", x: 260, y: 860, rarity: "epica" },
    { id: "sc-28", x: 1000, y: 880, rarity: "epica" },
    { id: "sc-29", x: 620, y: 1420, rarity: "lendaria" },
  ],
  navegante: [
    { id: "sc-40", x: 160, y: 190, rarity: "comum" },
    { id: "sc-41", x: 700, y: 170, rarity: "comum" },
    { id: "sc-42", x: 1250, y: 220, rarity: "comum" },
    { id: "sc-43", x: 340, y: 560, rarity: "comum" },
    { id: "sc-44", x: 1000, y: 620, rarity: "comum" },
    { id: "sc-45", x: 560, y: 900, rarity: "rara" },
    { id: "sc-46", x: 1180, y: 940, rarity: "rara" },
    { id: "sc-47", x: 220, y: 1100, rarity: "epica" },
    { id: "sc-48", x: 820, y: 1150, rarity: "epica" },
    { id: "sc-49", x: 1300, y: 460, rarity: "lendaria" },
  ],
};

/** Distância para coletar uma caixa de sucata (o barco tem 128px de lado). */
export const SCRAP_PICKUP_R = 66;

/** Pontos perdidos quando o barco é destruído. */
export const SCRAP_WRECK_PENALTY = 20;

/** PRNG determinístico (mulberry32) — mesma seed, mesmo resultado. */
function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sorteia as caixas de cada corrida. `seed` muda a cada entrada no mapa,
 * então a mecânica nunca é a mesma duas vezes seguidas. Usa rejeição para
 * garantir distância mínima entre as caixas.
 */
export function rollScrap(
  mapId: string,
  seed: number,
  worldW: number,
  worldH: number,
  count = 10,
): ScrapCrate[] {
  const rnd = rngFrom(seed + mapId.length * 7919);
  const order: ScrapRarity[] = [];
  const nLend = 1, nEpi = 2, nRara = 2;
  const nCom = Math.max(0, count - nLend - nEpi - nRara);
  for (let i = 0; i < nCom; i++) order.push("comum");
  for (let i = 0; i < nRara; i++) order.push("rara");
  for (let i = 0; i < nEpi; i++) order.push("epica");
  for (let i = 0; i < nLend; i++) order.push("lendaria");
  // Fisher-Yates com o mesmo rng => distribuição embaralhada a cada corrida.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const MIN_DIST = worldW * 0.16;
  const M = 70;
  const out: ScrapCrate[] = [];
  let guard = 0;
  while (out.length < order.length && guard < 4000) {
    guard++;
    const x = M + rnd() * (worldW - M * 2);
    const y = M + rnd() * (worldH - M * 2);
    let ok = true;
    for (const o of out) {
      if (Math.hypot(o.x - x, o.y - y) < MIN_DIST) { ok = false; break; }
    }
    if (!ok) continue;
    // Lendária sempre longe dos postos e mais pro fundo do mapa.
    out.push({ id: `roll-${mapId}-${out.length}`, x, y, rarity: order[out.length] });
  }
  return out;
}

/**
 * Tentacool extras que SÓ aparecem enquanto está chovendo — o temporal
 * traz mais predadores e uma caixa de sucata de raridade alta.
 */
export const RAIN_TENTACOOLS: Record<string, TentacoolDef[]> = {
  azulante: [
    { id: "tenta-r1", x: 460, y: 260, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 11, range: 155 },
    { id: "tenta-r2", x: 900, y: 880, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 11, range: 155 },
    { id: "tenta-r3", x: 240, y: 760, shiny: true, level: 99, rarity: "ÉPICO", name: "Tentacool Shiny", damage: 19, range: 175 },
  ],
  margrande: [
    { id: "tenta-r1", x: 700, y: 380, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 11, range: 155 },
    { id: "tenta-r2", x: 1100, y: 760, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 11, range: 155 },
  ],
  navegante: [
    { id: "tenta-r1", x: 480, y: 420, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 11, range: 155 },
    { id: "tenta-r2", x: 900, y: 880, shiny: false, level: 76, rarity: "RARO", name: "Tentacool", damage: 11, range: 155 },
  ],
};

/**
 * Caixa de sucata bônus que aparece enquanto chove. Também sorteada.
 */
export function rollRainScrap(mapId: string, seed: number, worldW: number, worldH: number) {
  const rnd = rngFrom(seed + 991 + mapId.length);
  const tier = rnd() < 0.5 ? "epica" : "lendaria";
  return {
    id: `roll-rain-${mapId}`,
    x: worldW * (0.35 + rnd() * 0.3),
    y: worldH * (0.35 + rnd() * 0.3),
    rarity: tier as ScrapRarity,
  };
}

/** Postos de abastecimento: parado em cima, abastece com Óleo. */
export const REFUEL_STATIONS: Record<string, { x: number; y: number }[]> = {
  azulante: [
    { x: 120, y: 1060 },
    { x: 1180, y: 160 },
  ],
  margrande: [
    { x: 150, y: 775 },
    { x: 1520, y: 160 },
  ],
  navegante: [
    { x: 900, y: 420 },
    { x: 110, y: 1120 },
  ],
};

/** Chuva nos mapas de água: ciclo de 4 minutos (2 min com chuva, 2 sem). */
export const RAIN_CYCLE_MS = 4 * 60 * 1000;
export const RAIN_ON_MS = 2 * 60 * 1000;

export function rainState(now: number): { raining: boolean; phase: number; remaining: number } {
  const cycle = now % RAIN_CYCLE_MS;
  const raining = cycle < RAIN_ON_MS;
  return { raining, phase: raining ? cycle / RAIN_ON_MS : (cycle - RAIN_ON_MS) / (RAIN_CYCLE_MS - RAIN_ON_MS), remaining: (raining ? RAIN_ON_MS : RAIN_CYCLE_MS - RAIN_ON_MS) - (raining ? cycle : cycle - RAIN_ON_MS) };
}

export const OIL_PRICE_GOLD = 1_200;
