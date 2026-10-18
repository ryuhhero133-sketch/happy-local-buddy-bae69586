// Missões do Professor do Laboratório — 3 diálogos → quests com progresso real.
// Módulo de dados (sem JSX) para não acionar a regra react-refresh dos componentes.
import type { Element } from "@/game/synergies";
import iceblowUrl from "@/ambiente/mascara colisao/UPDATE/ICEBLOW.png";
import iceblowMaskUrl from "@/ambiente/mascara colisao/UPDATE/ICEBLOW colisao.jpg";
import iceblowCristalUrl from "@/ambiente/mascara colisao/UPDATE/efeito-cristal-iceblow.png";
import monteFloretoUrl from "@/ambiente/mascara colisao/UPDATE/MONTE FLORETO.png";
import monteFloretoMaskUrl from "@/ambiente/mascara colisao/UPDATE/MONTE FLORETO COLISAO.png";
import monteFloretoAmareloUrl from "@/ambiente/mascara colisao/UPDATE/efeito-amarelo-monte-floreto.png";
import monteFloretoBolhasUrl from "@/ambiente/mascara colisao/UPDATE/efeito-bolhas-monte-floreto.png";
import rayowRaiosUrl from "@/ambiente/mascara colisao/UPDATE/efeito-raios-rayow.png";
import rayowUrl from "@/ambiente/mascara colisao/UPDATE/RAYOW.png";
import rayowMaskUrl from "@/ambiente/mascara colisao/UPDATE/RAYOWCOLISAO.png";
import sakuraUrl from "@/ambiente/mascara colisao/UPDATE/Sakura City.png";
import sakuraMaskUrl from "@/ambiente/mascara colisao/UPDATE/Sakura City COLISAO.png";
import sakuraRosaUrl from "@/ambiente/mascara colisao/UPDATE/efeito-rosa-sakura-city.png";
import sakuraAmareloUrl from "@/ambiente/mascara colisao/UPDATE/efeito-amarelo-sakura-city.png";
import venenotUrl from "@/ambiente/mascara colisao/UPDATE/venenot.png";
import venenotMaskUrl from "@/ambiente/mascara colisao/UPDATE/venenot colisao.png";
import venenotBolhasVerdesUrl from "@/ambiente/mascara colisao/UPDATE/efeito-bolhas-verdes-venenot.png";
import venenotBolhasRoxasUrl from "@/ambiente/mascara colisao/UPDATE/efeito-bolhas-roxas-venenot.png";
import azulanteUrl from "@/CHAR/kg/Jornada Dos Navegantes/Azulante.png";
import azulanteMaskUrl from "@/CHAR/kg/Jornada Dos Navegantes/Azulante COLISAO.png";
import azulanteMarUrl from "@/CHAR/kg/Jornada Dos Navegantes/efeito-mar-azulante.png";
import margrandeUrl from "@/CHAR/kg/Jornada Dos Navegantes/MARGRANDE.png";
import margrandeMaskUrl from "@/CHAR/kg/Jornada Dos Navegantes/MARGRANDE COLISAO.png";
import margrandeMarUrl from "@/CHAR/kg/Jornada Dos Navegantes/efeito-mar-margrande.png";
import naveganteUrl from "@/CHAR/kg/Jornada Dos Navegantes/Navegante.png";
import naveganteMaskUrl from "@/CHAR/kg/Jornada Dos Navegantes/Navegante COLISAO.png";
import naveganteMarUrl from "@/CHAR/kg/Jornada Dos Navegantes/efeito-mar-navegante.png";
import hallowUrl from "@/ambiente/mascara colisao/hallow.png";
import hallowMaskUrl from "@/ambiente/mascara colisao/hallow Colisao.png";
import cavernaBrokUrl from "@/ambiente/mascara colisao/Caverna de Brok.png";
import cavernaBrokMaskUrl from "@/ambiente/mascara colisao/Caverna de brok Colisao.png";

export type ProfQuestId =
  | "q1" | "q2" | "q3"
  | "q4" | "q5" | "q6" | "q7" | "q8" | "q9";

export type ProfQuestState = {
  active?: ProfQuestId;
  startKills?: number;
  startCaps?: number;
  /** Nível do treinador ao aceitar (missões de ganhar níveis). */
  startLevel?: number;
  /** Timestamp do aceite (missões de capturar shiny exigem captura depois dele). */
  startedAt?: number;
  completed?: string[];
};

export type ProfQuestMetric = "kills" | "caps" | "shiny" | "level";

export type ProfQuestGrant = {
  gold?: number;
  crystals?: number;
  items?: Record<string, number>;
};

export type ProfQuestDef = {
  id: ProfQuestId;
  letter: string;
  title: string;
  quote: string;
  objective: string;
  metric: ProfQuestMetric;
  /** Espécie alvo do metric "shiny" (shiny que EXISTE no jogo e spawn aqui). */
  species?: string;
  target: number;
  reward: string;
  /** Concedido no resgate — fonte única do profClaimQuest. */
  grant: ProfQuestGrant;
};

// Shinies alvo escolhidos SÓ de pools reais do jogo (contadores ocultos de
// kills / pools de mapa): caterpie (Verdejante 1), sandshrew (Florest Ice),
// bellsprout (Rota Flower), gastly (Ruínas de Vênus).
export const PROF_QUESTS: ProfQuestDef[] = [
  {
    id: "q1",
    letter: "A",
    title: "Estudo de Batalha",
    quote:
      "Treinador, meu laboratório precisa de dados de combate! Enfrente 10 Pokémon e registre tudo para mim.",
    objective: "Derrote 10 Pokémon",
    metric: "kills",
    target: 10,
    reward: "800 🪙 ouro + 5 Pokébolas",
    grant: { gold: 800, items: { pokeball: 5 } },
  },
  {
    id: "q2",
    letter: "B",
    title: "Amostras Vivas",
    quote:
      "Minhas pesquisas precisam de amostras vivas. Capture 3 Pokémon e eu analiso o DNA deles!",
    objective: "Capture 3 Pokémon",
    metric: "caps",
    target: 3,
    reward: "400 🪙 ouro + 3 Great Balls",
    grant: { gold: 400, items: { greatball: 3 } },
  },
  {
    id: "q3",
    letter: "C",
    title: "Expedição de Longa Distância",
    quote:
      "A expedição aos novos continentes exige resistência. Prove seu valor derrotando 50 Pokémon!",
    objective: "Derrote 50 Pokémon",
    metric: "kills",
    target: 50,
    reward: "5 💎 cristais + 1 Ultra Ball",
    grant: { crystals: 5, items: { ultraball: 1 } },
  },
  {
    id: "q4",
    letter: "D",
    title: "Primeira Cintilação",
    quote:
      "Shinies são a prova viva da genética rara! Comece pelo mais acessível: existe um Caterpie Shiny espreitando na Verdejante 1 — capture-o para mim.",
    objective: "Capture o shiny Caterpie Shiny",
    metric: "shiny",
    species: "caterpie_shiny",
    target: 1,
    reward: "3.000 🪙 ouro + 8 💎",
    grant: { gold: 3000, crystals: 8 },
  },
  {
    id: "q5",
    letter: "E",
    title: "Brilho Glacial",
    quote:
      "A Florest Ice esconde um Sandshrew Shiny entre os gelos. Derrote selvagens até ele aparecer — paciência de pesquisador!",
    objective: "Capture o shiny Sandshrew Shiny",
    metric: "shiny",
    species: "sandshrew_shiny",
    target: 1,
    reward: "5.000 🪙 ouro + 15 💎",
    grant: { gold: 5000, crystals: 15 },
  },
  {
    id: "q6",
    letter: "F",
    title: "Flor Radiante",
    quote:
      "Na Rota Flower, um Bellsprout Shiny brilha entre as pétalas. É raro — mas meu estudo depende dele.",
    objective: "Capture o shiny Bellsprout Shiny",
    metric: "shiny",
    species: "bellsprout_shiny",
    target: 1,
    reward: "8.000 🪙 ouro + 20 💎 + 2 Ultra Balls",
    grant: { gold: 8000, crystals: 20, items: { ultraball: 2 } },
  },
  {
    id: "q7",
    letter: "G",
    title: "Espectro Luminoso",
    quote:
      "Nas Ruínas de Vênus, um Gastly Shiny ronda as pedras ancestrais. Capture-o — talvez ele revele segredos que os mortos guardam.",
    objective: "Capture o shiny Gastly Shiny",
    metric: "shiny",
    species: "gastly_shiny",
    target: 1,
    reward: "12.000 🪙 ouro + 30 💎",
    grant: { gold: 12000, crystals: 30 },
  },
  {
    id: "q8",
    letter: "H",
    title: "Ascensão de Nível",
    quote:
      "Dados de combate valem pouco sem experiência! Ganhe 20 níveis de treinador e volte para eu medir sua evolução.",
    objective: "Ganhe 20 níveis de treinador",
    metric: "level",
    target: 20,
    reward: "10.000 🪙 ouro + 35 💎",
    grant: { gold: 10000, crystals: 35 },
  },
  {
    id: "q9",
    letter: "I",
    title: "Veterano de Elite",
    quote:
      "Só os melhores chegam até aqui: 50 níveis acima de onde começou. Mostre que é digno do meu melhor material de pesquisa.",
    objective: "Ganhe 50 níveis de treinador",
    metric: "level",
    target: 50,
    reward: "25.000 🪙 ouro + 60 💎 + 20 🥇 Pepitas",
    grant: { gold: 25000, crystals: 60, items: { pepita: 20 } },
  },
];

export type ProfQuestCtx = {
  kills: number;
  captures: number;
  level: number;
  /** Informa se a espécie foi capturada ATÉ DEPOIS do aceite da missão. */
  capturedSince?: (species: string, since: number) => boolean;
};

/** Progresso ATUAL (0..target) da missão ativa; 0 se a missão não está ativa. */
export function profQuestProgress(
  def: ProfQuestDef | undefined,
  q: ProfQuestState | undefined,
  ctx: ProfQuestCtx,
): number {
  if (!def || !q?.active || q.active !== def.id) return 0;
  switch (def.metric) {
    case "kills":
      return Math.max(0, ctx.kills - (q.startKills ?? 0));
    case "caps":
      return Math.max(0, ctx.captures - (q.startCaps ?? 0));
    case "level": {
      const start = q.startLevel ?? ctx.level;
      return Math.max(0, Math.min(def.target, ctx.level - start));
    }
    case "shiny": {
      if (!def.species) return 0;
      // Sem startedAt (save antigo) vale qualquer captura — leniente.
      return ctx.capturedSince?.(def.species, q.startedAt ?? 0) ? def.target : 0;
    }
    default:
      return 0;
  }
}

export function profQuestDone(
  q: ProfQuestState | undefined,
  ctx: ProfQuestCtx,
): boolean {
  if (!q?.active) return false;
  const def = PROF_QUESTS.find((x) => x.id === q.active);
  if (!def) return false;
  return profQuestProgress(def, q, ctx) >= def.target;
}

// ============ Mapas do UPDATE — aba MAPAS do Professor ============
// Sem restrição de nível, sem custo de energia, sem pokémons e sem objetos.
// Colisão estilo Laboratório: branco puro anda; rosa e amarelo bloqueiam.
// rosa = luzes brilhando (camada com glow); amarelo = brilho varrendo (máscara).
export type ProfMapId =
  | "iceblow"
  | "monte_floreto"
  | "rayow"
  | "sakura_city"
  | "venenot"
  | "azulante"
  | "margrande"
  | "navegante"
  | "hallow"
  | "caverna_brok";

export type ProfMapDef = {
  id: ProfMapId;
  name: string;
  emoji: string;
  bg: string;
  mask: string;
  /** Continente exibido na aba MAPAS (se ausente, fica no grupo principal). */
  continent?: string;
  /** Pontos de sucata no banco para desbloquear (mapas terrestres). */
  reqPts?: number;
  /** Nível de treinador para desbloquear (mapas de mar avançados). */
  reqLevel?: number;
  /** Viagem grátis: sem pontos de sucata e SEM custo de energia por entrada. */
  free?: boolean;
  /** Camada de efeito: pixels rosa extraídos da máscara (luzes pulsantes). */
  rosa?: string;
  /** Camada de efeito: faíscas de cristal (brilho cintilante, ex. Iceblow). */
  cristal?: string;
  /** Camada de efeito: bolhas subindo (água/veneno). */
  bolhas?: string;
  /** Camada de efeito: segunda leva de bolhas (ritmo diferente, ex. roxas). */
  bolhasB?: string;
  /** Camada de efeito: arcos elétricos crepitando. */
  raios?: string;
  /** Camada de efeito: pixels amarelos extraídos da máscara (varredura de brilho). */
  amarelo?: string;
  /** Camada de efeito: brilhos sutis do mar (cintilação de ondas). */
  mar?: string;
  /** Ponto andável verificado na máscara (maior região branca conectada). */
  spawn: { x: number; y: number };
  element: Element;
  stars: number;
  desc: string;
};

const M_ICEBLOW: ProfMapDef = {
  id: "iceblow",
  name: "Iceblow",
  emoji: "❄️",
  bg: iceblowUrl,
  mask: iceblowMaskUrl,
  cristal: iceblowCristalUrl,
  spawn: { x: 620, y: 596 },
  element: "gelo",
  stars: 2,
  reqPts: 200,
  desc: "Caverna glacial de cristais luminosos. Poços de luz magenta tremulam no gelo.",
};
const M_MONTE: ProfMapDef = {
  id: "monte_floreto",
  name: "Monte Floreto",
  emoji: "🌿",
  bg: monteFloretoUrl,
  mask: monteFloretoMaskUrl,
  bolhas: monteFloretoBolhasUrl,
  amarelo: monteFloretoAmareloUrl,
  spawn: { x: 880, y: 424 },
  element: "planta",
  stars: 1,
  reqPts: 20,
  desc: "Colinas floridas com lagoa encantada. Bolhas d'água brotam da lagoa.",
};
const M_RAYOW: ProfMapDef = {
  id: "rayow",
  name: "Rayow",
  emoji: "🏜️",
  bg: rayowUrl,
  mask: rayowMaskUrl,
  raios: rayowRaiosUrl,
  spawn: { x: 776, y: 512 },
  element: "fogo",
  stars: 2,
  reqPts: 300,
  desc: "Vila desértica de areias douradas. Arcos elétricos crepitam sobre a fonte.",
};
const M_SAKURA: ProfMapDef = {
  id: "sakura_city",
  name: "Sakura City",
  emoji: "🌸",
  bg: sakuraUrl,
  mask: sakuraMaskUrl,
  rosa: sakuraRosaUrl,
  amarelo: sakuraAmareloUrl,
  spawn: { x: 648, y: 692 },
  element: "fada",
  stars: 3,
  reqPts: 300,
  desc: "Cidade das cerejeiras em flor. As copas rosa brilham como lanternas mágicas.",
};
const M_VENENOT: ProfMapDef = {
  id: "venenot",
  name: "Venenot",
  emoji: "☠️",
  bg: venenotUrl,
  mask: venenotMaskUrl,
  bolhas: venenotBolhasVerdesUrl,
  bolhasB: venenotBolhasRoxasUrl,
  spawn: { x: 796, y: 552 },
  element: "veneno",
  stars: 2,
  reqPts: 100,
  desc: "Bosque venenoso de poços radioativos. Bolhas verdes e roxas sobem dos poços.",
};

const M_AZULANTE: ProfMapDef = {
  id: "azulante",
  name: "Azulante",
  emoji: "🌊",
  continent: "JORNADA DOS NAVEGANTES",
  bg: azulanteUrl,
  mask: azulanteMaskUrl,
  mar: azulanteMarUrl,
  spawn: { x: 120, y: 1060 },
  element: "agua",
  stars: 1,
  desc: "Mar aberto de águas azuis com redemoinhos distantes. As ondas brilham de leve.",
};
const M_MARGRANDE: ProfMapDef = {
  id: "margrande",
  name: "Mar Grande",
  emoji: "⛵",
  continent: "JORNADA DOS NAVEGANTES",
  bg: margrandeUrl,
  mask: margrandeMaskUrl,
  mar: margrandeMarUrl,
  spawn: { x: 150, y: 775 },
  element: "agua",
  stars: 2,
  reqLevel: 500,
  desc: "Arquipélago de ilhas e recifes entre basins de mar aberto.",
};
const M_NAVEGANTE: ProfMapDef = {
  id: "navegante",
  name: "Navegante",
  emoji: "🧭",
  continent: "JORNADA DOS NAVEGANTES",
  bg: naveganteUrl,
  mask: naveganteMaskUrl,
  mar: naveganteMarUrl,
  spawn: { x: 900, y: 420 },
  element: "agua",
  stars: 3,
  reqLevel: 500,
  desc: "Costa do Navegante: castelo de gelo, um navio e ilhotas ao redor.",
};

const M_HALLOW: ProfMapDef = {
  id: "hallow",
  name: "Hallow",
  emoji: "🎃",
  bg: hallowUrl,
  mask: hallowMaskUrl,
  free: true,
  spawn: { x: 675, y: 585 },
  element: "fantasma",
  stars: 3,
  desc: "Vila do susto. A água dos rios brilha em rosa e as tochas de caverna pulsam em amarelo — pisou na luz, cai na Caverna de Brok!",
};
const M_CAVERNA_BROK: ProfMapDef = {
  id: "caverna_brok",
  name: "Caverna de Brok",
  emoji: "🕳️",
  bg: cavernaBrokUrl,
  mask: cavernaBrokMaskUrl,
  free: true,
  spawn: { x: 621, y: 657 },
  element: "pedra",
  stars: 2,
  desc: "Galeria escura onde a caverna de Brok desce por entre paredes de rocha. Só anda pela faixa clara do chão.",
};

export const PROF_MAPS: ProfMapDef[] = [
  M_ICEBLOW,
  M_MONTE,
  M_RAYOW,
  M_SAKURA,
  M_VENENOT,
  M_AZULANTE,
  M_MARGRANDE,
  M_NAVEGANTE,
];

export const PROF_MAP_BY_ID: Record<ProfMapId, ProfMapDef> = {
  iceblow: M_ICEBLOW,
  monte_floreto: M_MONTE,
  rayow: M_RAYOW,
  sakura_city: M_SAKURA,
  venenot: M_VENENOT,
  hallow: M_HALLOW,
  caverna_brok: M_CAVERNA_BROK,
  azulante: M_AZULANTE,
  margrande: M_MARGRANDE,
  navegante: M_NAVEGANTE,
};

/** Posições de chegada (instantânea, sem custo) — inclui o retorno ao Laboratório. */
export const PROF_SPAWNS: Record<string, { x: number; y: number }> = {
  iceblow: { x: 620, y: 596 },
  monte_floreto: { x: 880, y: 424 },
  rayow: { x: 776, y: 512 },
  sakura_city: { x: 648, y: 692 },
  venenot: { x: 796, y: 552 },
  hallow: { x: 675, y: 585 },
  caverna_brok: { x: 621, y: 657 },
  azulante: { x: 120, y: 1060 },
  margrande: { x: 150, y: 775 },
  navegante: { x: 900, y: 420 },
  laboratorio: { x: 499, y: 416 },
};

/** Camadas de efeito por mapa (derivadas das máscaras: rosa = glow, amarelo = varredura, cristal = faíscas, bolhas = subida, raios = arcos, mar = cintilação das ondas). */
export const PROF_FX: Record<
  string,
  {
    rosa?: string;
    amarelo?: string;
    cristal?: string;
    bolhas?: string;
    bolhasB?: string;
    raios?: string;
    mar?: string;
  }
> = {
  iceblow: { cristal: iceblowCristalUrl },
  monte_floreto: { bolhas: monteFloretoBolhasUrl, amarelo: monteFloretoAmareloUrl },
  rayow: { raios: rayowRaiosUrl },
  sakura_city: { rosa: sakuraRosaUrl, amarelo: sakuraAmareloUrl },
  venenot: { bolhas: venenotBolhasVerdesUrl, bolhasB: venenotBolhasRoxasUrl },
  azulante: { mar: azulanteMarUrl },
  margrande: { mar: margrandeMarUrl },
  navegante: { mar: naveganteMarUrl },
};
