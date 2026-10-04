import type { Species } from "@/game/systems";
import { elementsOf } from "@/game/synergies";
import {
  loadMaterialsStore,
  saveMaterialsStore,
  type MaterialId,
  type MaterialsStore,
} from "@/components/MercadorMateriaisOverlay";

// Sprites das Lands (níveis 1/2/3) — assets já existentes em src/lands/land01.
import landFruto1Url from "@/lands/land01/LAND FRUTO (1).png";
import landFruto2Url from "@/lands/land01/LAND FRUTO (2).png";
import landFruto3Url from "@/lands/land01/LAND FRUTO (3).png";
// Sprites das plantações (base / evoluída / fruto) — assets já existentes.
import laranjeiraUrl from "@/lands/land01/Laranjeira.png";
import laranjeira1Url from "@/lands/land01/Laranjeira 1.png";
import laranjinhaUrl from "@/lands/land01/Laranjinha.png";
import morango00Url from "@/lands/land01/morango 00.png";
import morango1Url from "@/lands/land01/Morango 1.png";
import moranguinhoUrl from "@/lands/land01/Moranguinho.png";
import bananeiraUrl from "@/lands/land01/bananeira.png";
import bananeira1Url from "@/lands/land01/Bananeira 1.png";
import bananasUrl from "@/lands/land01/bananas.png";
// Madeira (requisito de evolução) — assets já existentes.
import lenhaUrl from "@/assets/materials/lenha.png";
import madeiraUrl from "@/assets/craft/madeira.png";

export type LandLevel = 1 | 2 | 3;
export type PlantKind = "laranja" | "morango" | "banana";
// 0 PLANTADA → 1 CRESCENDO → 2 CRESCIDA → 3 FRUTO DISPONÍVEL
export type PlantStage = 0 | 1 | 2 | 3;

export interface LandPlant {
  id: string;
  kind: PlantKind;
  slot: number;
  plantedAt: number;
  collectingUntil?: number;
}

export type LandStatus = "building" | "ready";

export interface PlacedLand {
  id: string;
  level: LandLevel;
  x: number;
  y: number;
  status: LandStatus;
  startedAt: number;
  readyAt: number;
  plants: LandPlant[];
  totalCollected?: number;
}

export const LAND_BUILD_MS = 60_000; // 1 minuto de construção
export const LAND_STAGE_MS = 10 * 60_000; // 10 min por estágio (fruto em ~30 min)
export const LAND_COLLECT_MS = 2_000; // 2s de coleta
export const LAND_MAX = 3; // máximo de Lands por jogador
export const LAND_MIN_SPACING = 250; // px entre Lands
// 3 slots de plantio por Land (offsets a partir da base da construção).
export const LAND_SLOTS = [
  { x: -95, y: 70 },
  { x: 0, y: 95 },
  { x: 95, y: 70 },
];

export interface LandLevelDef {
  level: LandLevel;
  name: string;
  img: string;
}

export const LAND_LEVELS: LandLevelDef[] = [
  { level: 1, name: "LAND FRUTO 1", img: landFruto1Url },
  { level: 2, name: "LAND FRUTO 2", img: landFruto2Url },
  { level: 3, name: "LAND FRUTO 3", img: landFruto3Url },
];

export const landLevelDef = (level: LandLevel): LandLevelDef =>
  LAND_LEVELS.find((l) => l.level === level) ?? LAND_LEVELS[0];

export interface PlantDef {
  kind: PlantKind;
  name: string;
  fruitName: string;
  fruitMat: MaterialId;
  fruitImg: string;
  growingImg: string;
  grownImg: string;
  yieldByLevel: [number, number, number];
}

export const PLANT_DEFS: PlantDef[] = [
  {
    kind: "laranja", name: "Laranjeira", fruitName: "Laranja",
    fruitMat: "laranja", fruitImg: laranjinhaUrl,
    growingImg: laranjeiraUrl, grownImg: laranjeira1Url,
    yieldByLevel: [1, 2, 3],
  },
  {
    kind: "morango", name: "Morango", fruitName: "Morango",
    fruitMat: "morango", fruitImg: moranguinhoUrl,
    growingImg: morango00Url, grownImg: morango1Url,
    yieldByLevel: [1, 2, 3],
  },
  {
    kind: "banana", name: "Bananeira", fruitName: "Banana",
    fruitMat: "banana", fruitImg: bananasUrl,
    growingImg: bananeiraUrl, grownImg: bananeira1Url,
    yieldByLevel: [1, 2, 3],
  },
];

export const plantDef = (kind: PlantKind): PlantDef =>
  PLANT_DEFS.find((p) => p.kind === kind) ?? PLANT_DEFS[0];

// Escala visual da planta conforme o nível da Land.
export const plantScaleFor = (level: LandLevel): number =>
  level === 1 ? 1 : level === 2 ? 1.15 : 1.3;

// ===== Requisitos de evolução (modular: novos requisitos entram aqui) =====
export interface LandReq {
  id: string;
  label: string;
  have: number;
  need: number;
  ok: boolean;
  kind: "material" | "bug" | "pinsir";
  mat?: MaterialId;
  img?: string;
}

interface ReqSpec {
  kind: LandReq["kind"];
  mat?: MaterialId;
  need: number;
  label: string;
  img?: string;
}

// Para evoluir PARA o nível alvo.
const LAND_REQS: Partial<Record<LandLevel, ReqSpec[]>> = {
  2: [
    { kind: "material", mat: "lenha", need: 15, label: "Madeira (Lenha)", img: lenhaUrl },
    { kind: "material", mat: "fibra", need: 8, label: "Fibra" },
    { kind: "bug", need: 3, label: "Pokémon inseto capturados" },
    { kind: "pinsir", need: 1, label: "Pinsir capturado" },
  ],
  3: [
    { kind: "material", mat: "lenha", need: 30, label: "Madeira (Lenha)", img: lenhaUrl },
    { kind: "material", mat: "pedra", need: 12, label: "Pedra" },
    { kind: "material", mat: "ferro", need: 6, label: "Ferro" },
    { kind: "material", mat: "fibra", need: 10, label: "Fibra" },
    { kind: "bug", need: 6, label: "Pokémon inseto capturados" },
    { kind: "pinsir", need: 1, label: "Pinsir capturado" },
  ],
};

export const bugCaughtCount = (caught: Species[]): number => {
  const set = new Set<Species>();
  for (const sp of caught ?? []) {
    try {
      if (elementsOf(sp).includes("inseto")) set.add(sp);
    } catch { /* espécie desconhecida: ignora */ }
  }
  return set.size;
};

export const pinsirCaught = (caught: Species[]): boolean =>
  (caught ?? []).includes("pinsir" as Species);

export function landReqsFor(
  targetLevel: LandLevel,
  mats: MaterialsStore,
  caught: Species[],
): LandReq[] {
  const specs = LAND_REQS[targetLevel] ?? [];
  return specs.map((s, i) => {
    const have =
      s.kind === "material" ? (s.mat ? (mats[s.mat] ?? 0) : 0)
      : s.kind === "bug" ? bugCaughtCount(caught)
      : pinsirCaught(caught) ? 1 : 0;
    return {
      id: `${targetLevel}-${i}`,
      label: s.label,
      have, need: s.need,
      ok: have >= s.need,
      kind: s.kind,
      mat: s.mat,
      img: s.img,
    };
  });
}

export const landReqsMet = (reqs: LandReq[]): boolean =>
  reqs.length > 0 && reqs.every((r) => r.ok);

// Consome os materiais dos requisitos (capturas só verificadas). false = faltava algo.
export function consumeLandReqs(targetLevel: LandLevel, caught: Species[]): boolean {
  const mats = loadMaterialsStore();
  const reqs = landReqsFor(targetLevel, mats, caught);
  if (!landReqsMet(reqs)) return false;
  const next = { ...mats };
  for (const r of reqs) {
    if (r.kind === "material" && r.mat) {
      next[r.mat] = Math.max(0, (next[r.mat] ?? 0) - r.need);
    }
  }
  saveMaterialsStore(next);
  return true;
}

// ===== Plantas: estágios e frutos =====
export function plantStageAt(plant: LandPlant, now: number): PlantStage {
  const el = Math.max(0, now - plant.plantedAt);
  const s = Math.floor(el / LAND_STAGE_MS);
  return (s >= 3 ? 3 : s) as PlantStage;
}

export const plantFruitReady = (plant: LandPlant, now: number): boolean =>
  plantStageAt(plant, now) >= 3 && !(plant.collectingUntil != null && plant.collectingUntil > now);

// Adiciona frutos ao recurso do jogador (materials store). Retorna a qtd.
export function grantFruit(kind: PlantKind, qty: number): number {
  const def = plantDef(kind);
  const store = loadMaterialsStore();
  (store as Record<string, number>)[def.fruitMat] =
    ((store as Record<string, number>)[def.fruitMat] ?? 0) + qty;
  saveMaterialsStore(store);
  return qty;
}

export const fruitYieldFor = (kind: PlantKind, level: LandLevel): number =>
  plantDef(kind).yieldByLevel[level - 1] ?? 1;

let landSeq = 0;
export const newLandId = (): string =>
  `land_${Date.now().toString(36)}_${(landSeq++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

export const newPlantId = (): string =>
  `plant_${Date.now().toString(36)}_${(landSeq++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

export { lenhaUrl, madeiraUrl };
export type { MaterialId, MaterialsStore };
