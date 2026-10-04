import type { Species } from "@/game/systems";
import { elementsOf, type Element } from "@/game/synergies";
import type { MaterialId } from "@/components/MercadorMateriaisOverlay";

// Sprites dos recursos — assets já existentes em src/material land.
import aguaUrl from "@/material land/agua.png";
import bronzeUrl from "@/material land/bronze.png";
import buqueUrl from "@/material land/buque.png";
import chicoteUrl from "@/material land/chicote.png";
import cogBlueUrl from "@/material land/cogumelo-blue.png";
import cogOrangeUrl from "@/material land/cogumelo-orange.png";
import cogRedUrl from "@/material land/cogumelo-red.png";
import cogBrownUrl from "@/assets/materials/cogumelo-brown.png";
import sucataUrl from "@/assets/materials/sucata.png";
import escamasUrl from "@/material land/escamas.png";
import ferroUrl from "@/material land/ferro.png";
import fibraUrl from "@/material land/fibra.png";
import florBlueUrl from "@/material land/flor-blue.png";
import florPurpleUrl from "@/material land/flor-purple.png";
import florRedUrl from "@/material land/flor-red.png";
import pepitaUrl from "@/material land/Pepita de ouro.png";
import perolaUrl from "@/material land/perola.png";

// ===== Configuração central de drops de recurso =====
// Filosofia: RECURSO NÃO É GRATUITO. Comum = 30–40%; especial/raro/quest = baixo.
// Tudo cai no CHÃO (drop de mundo) — nunca direto na mochila.
export interface DropRule {
  id: string;
  mat: MaterialId;
  label: string;
  img: string;
  chance: number; // 0..1 por abate
  qty: number;
  species?: string[]; // espécies-base (vale p/ shiny/plus da mesma base)
  elements?: Element[]; // elementos (synergies) da espécie abatida
  maps?: string[]; // mapas permitidos (undefined = qualquer mapa)
  quest?: boolean; // item de quest (não é farm comum)
}

export const DROP_GROUND_TTL_MS = 90_000;
export const DROP_COLLECT_PX = 260;

// Espécies de AÇO (ferro + especial raro). Sem "aço" nos elementos do jogo:
// lista explícita por espécie-base.
const STEEL_SPECIES = ["magnemite", "magneton"];
// Espécies de TERRA (bronze). Sem "terra" nos elementos: lista explícita.
const GROUND_SPECIES = [
  "diglett", "cubone", "sandshrew", "sandslash", "marowak", "rhyhorn",
];
const VENUSAUR = ["venusaur", "venusaur_shiny"];
const BULBA_IVY = ["bulbasaur", "bulbasaur_shiny", "ivysaur", "ivysaur_shiny"];

const COG_MATS: MaterialId[] = ["cog_red", "cog_brown", "cog_blue", "cog_orange"];

export const DROP_RULES: DropRule[] = [
  // Fibra — fonte principal: Venusaur (planta). 35%.
  { id: "fibra", mat: "fibra", label: "Fibra", img: fibraUrl, chance: 0.35, qty: 1, species: VENUSAUR },
  // Ferro — Pokémon de aço. 35%.
  { id: "ferro", mat: "ferro", label: "Ferro", img: ferroUrl, chance: 0.35, qty: 1, species: STEEL_SPECIES },
  // Especial metálico — aço, raro e independente. 5% sucata.
  { id: "sucata", mat: "sucata", label: "Sucata", img: sucataUrl, chance: 0.05, qty: 1, species: STEEL_SPECIES },
  // Buquê — Bulbasaur/Ivysaur, baixo, quest. 4%.
  { id: "buque", mat: "buque", label: "Buquê", img: buqueUrl, chance: 0.04, qty: 1, species: BULBA_IVY, quest: true },
  // Chicote — Bulbasaur/Ivysaur 35% + planta 30%.
  { id: "chicote-sp", mat: "chicote", label: "Chicote", img: chicoteUrl, chance: 0.35, qty: 1, species: BULBA_IVY },
  { id: "chicote-planta", mat: "chicote", label: "Chicote", img: chicoteUrl, chance: 0.30, qty: 1, elements: ["planta"] },
  // Cogumelo — qualquer mapa/espécie, raro. 3% (sorteia a cor).
  { id: "cogumelo", mat: "cog_red", label: "Cogumelo", img: cogRedUrl, chance: 0.03, qty: 1 },
  // Pérola — só aquáticos, baixa. 12%.
  { id: "perola", mat: "perola", label: "Pérola", img: perolaUrl, chance: 0.12, qty: 1, elements: ["agua"] },
  // Escamas — aquático/gelo. 32%.
  { id: "escamas", mat: "escamas", label: "Escamas", img: escamasUrl, chance: 0.32, qty: 1, elements: ["agua", "gelo"] },
  // Flor (pokémon) — planta/inseto. 30%.
  { id: "flor", mat: "flor", label: "Flor", img: florRedUrl, chance: 0.30, qty: 1, elements: ["planta", "inseto"] },
  // Pepita de ouro — pedra. 32%.
  { id: "pepita", mat: "pepita", label: "Pepita de Ouro", img: pepitaUrl, chance: 0.32, qty: 1, elements: ["pedra"] },
  // Bronze — terra. 32%.
  { id: "bronze", mat: "bronze", label: "Bronze", img: bronzeUrl, chance: 0.32, qty: 1, species: GROUND_SPECIES },
];

// Água — SOMENTE pontos configurados (a definir: quais mapas). Lista vazia = nada ativo.
export interface WaterSpot {
  map: string;
  x: number;
  y: number;
}
export const WATER_SPOTS: WaterSpot[] = [
  // Ex.: { map: "mapinha5", x: 900, y: 700 },
];

/** Base da espécie (tolerante a shiny/plus): pinsir_shiny → pinsir. */
export const speciesBaseOf = (sp: string): string =>
  sp.replace(/_shiny_plus$/, "").replace(/_shiny$/, "").replace(/_plus$/, "");

export interface RolledDrop {
  rule: DropRule;
  mat: MaterialId;
  qty: number;
  img: string;
  label: string;
}

/** Rola os drops de recurso para uma espécie abatida num mapa. Rolls independentes. */
export function rollDropsFor(sp: Species, mapId: string): RolledDrop[] {
  const base = speciesBaseOf(String(sp));
  let els: Element[] = [];
  try {
    els = elementsOf(sp);
  } catch { els = []; }
  const out: RolledDrop[] = [];
  for (const r of DROP_RULES) {
    if (r.maps && !r.maps.includes(mapId)) continue;
    if (r.species && !r.species.includes(base) && !r.species.includes(String(sp))) continue;
    if (r.elements && !r.elements.some((e) => els.includes(e))) continue;
    if (Math.random() >= r.chance) continue;
    if (r.id === "cogumelo") {
      const pick = COG_MATS[Math.floor(Math.random() * COG_MATS.length)];
      const cogImgs: Record<string, string> = {
        cog_red: cogRedUrl, cog_blue: cogBlueUrl, cog_orange: cogOrangeUrl,
        cog_brown: cogBrownUrl,
      };
      out.push({
        rule: r, mat: pick, qty: r.qty,
        img: cogImgs[pick] ?? cogRedUrl,
        label: pick === "cog_red" ? "Cogumelo Vermelho" : pick === "cog_blue" ? "Cogumelo Azul" : pick === "cog_orange" ? "Cogumelo Laranja" : "Cogumelo Marrom",
      });
      continue;
    }
    out.push({ rule: r, mat: r.mat, qty: r.qty, img: r.img, label: r.label });
  }
  return out;
}

export const DROP_IMG_BY_MAT: Partial<Record<MaterialId, string>> = {
  fibra: fibraUrl, ferro: ferroUrl, agua: aguaUrl, bronze: bronzeUrl,
  buque: buqueUrl, chicote: chicoteUrl, escamas: escamasUrl,
  perola: perolaUrl, pepita: pepitaUrl, flor: florRedUrl,
  cog_blue: cogBlueUrl, cog_orange: cogOrangeUrl, cog_red: cogRedUrl,
  cog_brown: cogBrownUrl, sucata: sucataUrl,
};
export const DROP_LABEL_BY_MAT: Partial<Record<MaterialId, string>> = {
  fibra: "Fibra", ferro: "Ferro", agua: "Água", bronze: "Bronze",
  buque: "Buquê", chicote: "Chicote", escamas: "Escamas",
  perola: "Pérola", pepita: "Pepita de Ouro", flor: "Flor",
  cog_red: "Cogumelo Vermelho", cog_blue: "Cogumelo Azul",
  cog_orange: "Cogumelo Laranja", cog_brown: "Cogumelo Marrom",
};
export { florBlueUrl, florPurpleUrl };
