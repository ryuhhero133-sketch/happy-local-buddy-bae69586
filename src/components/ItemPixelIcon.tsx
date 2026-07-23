// Ícones de itens em pixel-art SVG, animados. Sem dependência de assets externos.
// Cada glyph desenha um grid 16×16 com <rect> de 1u. Animações via CSS keyframes.
import React from "react";
import cartaGovernanteAsset from "@/assets/carta-governante.png.asset.json";
import cartaIncubadoraAsset from "@/assets/carta-incubadora.png.asset.json";
import rubyKeyAsset from "@/assets/ruby-key.png.asset.json";
import cartaPlusAsset from "@/assets/black-mitic-plus-egg-icon.png.asset.json";
import { assetUrlFromJson } from "@/lib/assetUrl";

// Overrides que renderizam uma imagem bitmap ao invés do glyph SVG.
const BITMAP_OVERRIDES: Record<string, string> = {
  carta_governante: assetUrlFromJson(cartaGovernanteAsset),
  carta_incubadora: assetUrlFromJson(cartaIncubadoraAsset),
  chave_ruby: assetUrlFromJson(rubyKeyAsset),
  carta_plus: assetUrlFromJson(cartaPlusAsset),
};

type Cell = [number, number, string]; // x, y, color

// paleta reutilizável
const C = {
  outline: "#1a0d05",
  shineHi: "#ffffff",
  shine: "#fff6d6",
  gold: "#f2c94c",
  goldDk: "#a67418",
  red: "#e94b3c",
  redDk: "#8f1b12",
  blue: "#3aa9ff",
  blueDk: "#1a5f9e",
  green: "#6bd66b",
  greenDk: "#1f6b2a",
  purple: "#b46bff",
  purpleDk: "#5a2794",
  pink: "#ff8bd0",
  cyan: "#7ff0ff",
  brown: "#8a5a2b",
  brownDk: "#4a2e14",
  paper: "#f7e6b6",
  paperDk: "#c9a24b",
  silver: "#d9e0ea",
  silverDk: "#6b7788",
  honey: "#f6a622",
  honeyDk: "#8a4a10",
};

function grid(cells: Cell[]) {
  return cells.map(([x, y, c], i) => (
    <rect key={i} x={x} y={y} width={1} height={1} fill={c} shapeRendering="crispEdges" />
  ));
}

// helpers para desenhar formas simples
function fillRect(x1: number, y1: number, x2: number, y2: number, color: string): Cell[] {
  const out: Cell[] = [];
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) out.push([x, y, color]);
  return out;
}

// ---- desenhos individuais ----
function drawPokeball(top: string, topDk: string) {
  const cells: Cell[] = [];
  // círculo 12x12 centrado
  const circle: Array<[number, number]> = [
    [4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],
    [3,4],[12,4], [2,5],[13,5], [2,6],[13,6], [2,7],[13,7],
    [2,8],[13,8], [2,9],[13,9], [3,10],[12,10],
    [4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],
  ];
  // preenchimento topo (vermelho/cor) até y=7 e branco abaixo
  for (let y = 4; y <= 10; y++) {
    for (let x = 3; x <= 12; x++) {
      const inside =
        (y === 4 && x >= 4 && x <= 11) ||
        (y === 5 && x >= 3 && x <= 12) ||
        (y === 6 && x >= 3 && x <= 12) ||
        (y === 7 && x >= 3 && x <= 12) ||
        (y === 8 && x >= 3 && x <= 12) ||
        (y === 9 && x >= 3 && x <= 12) ||
        (y === 10 && x >= 4 && x <= 11);
      if (!inside) continue;
      if (y <= 6) cells.push([x, y, top]);
      else if (y === 7) cells.push([x, y, C.outline]); // faixa
      else cells.push([x, y, "#fdfdfd"]);
    }
  }
  // sombra
  cells.push(...fillRect(4, 10, 11, 10, "#d3d3d3").map(([x,y]) => [x,y,y===10 && x>=4 && x<=11 ? "#d8d8d8" : ""] as Cell).filter(c => c[2]));
  // botão central
  cells.push([7, 7, "#efefef"], [8, 7, "#efefef"], [7, 6, "#efefef"], [8, 6, "#efefef"]);
  cells.push([7, 7, "#efefef"]);
  // outline (círculo)
  for (const [x, y] of circle) cells.push([x, y, C.outline]);
  // brilho topo
  cells.push([4, 4, topDk], [11, 4, topDk]);
  cells.push([5, 4, C.shine], [6, 4, C.shine]);
  return cells;
}

const ICONS: Record<string, () => Cell[]> = {
  // BOLAS
  pokeball: () => drawPokeball(C.red, C.redDk),
  greatball: () => drawPokeball(C.blue, C.blueDk),
  ultraball: () => {
    const base = drawPokeball("#2b2b2b", "#0a0a0a");
    // marca amarela em H
    base.push([5, 4, C.gold], [10, 4, C.gold], [5, 5, C.gold], [10, 5, C.gold]);
    base.push([6, 4, "#1a1a1a"], [7, 4, "#1a1a1a"], [8, 4, "#1a1a1a"], [9, 4, "#1a1a1a"]);
    base.push([5, 6, C.goldDk], [10, 6, C.goldDk]);
    return base;
  },

  // POÇÕES
  potion: () => {
    const cells: Cell[] = [];
    // tampa
    cells.push(...fillRect(6, 2, 9, 3, "#c25a2b"));
    cells.push([6,2,C.outline],[9,2,C.outline],[5,2,C.outline],[10,2,C.outline]);
    cells.push([5,3,C.outline],[10,3,C.outline]);
    // gargalo
    cells.push(...fillRect(7, 4, 8, 5, "#e0f2ff"));
    cells.push([6,4,C.outline],[9,4,C.outline],[6,5,C.outline],[9,5,C.outline]);
    // corpo
    cells.push(...fillRect(4, 7, 11, 12, C.red));
    cells.push(...fillRect(4, 6, 11, 6, "#ff8f8f"));
    // outline corpo
    cells.push([3,7,C.outline],[3,8,C.outline],[3,9,C.outline],[3,10,C.outline],[3,11,C.outline],[3,12,C.outline]);
    cells.push([12,7,C.outline],[12,8,C.outline],[12,9,C.outline],[12,10,C.outline],[12,11,C.outline],[12,12,C.outline]);
    cells.push(...fillRect(4, 13, 11, 13, C.outline));
    cells.push([5,6,C.outline],[6,6,C.outline],[7,6,C.outline],[8,6,C.outline],[9,6,C.outline],[10,6,C.outline]);
    // brilho
    cells.push([5,8,"#ffb0b0"],[5,9,"#ffb0b0"]);
    // marca
    cells.push([7,10,"#fff"],[8,10,"#fff"],[7,9,"#fff"]);
    return cells;
  },
  revive: () => {
    const cells: Cell[] = [];
    // mesmo formato da poção mas em amarelo/dourado
    cells.push(...fillRect(6, 2, 9, 3, "#8a5a10"));
    cells.push([5,2,C.outline],[10,2,C.outline],[5,3,C.outline],[10,3,C.outline]);
    cells.push([6,2,C.outline],[9,2,C.outline]);
    cells.push(...fillRect(7, 4, 8, 5, "#fff6c8"));
    cells.push([6,4,C.outline],[9,4,C.outline],[6,5,C.outline],[9,5,C.outline]);
    cells.push(...fillRect(4, 7, 11, 12, C.gold));
    cells.push(...fillRect(4, 6, 11, 6, "#ffe27a"));
    cells.push([3,7,C.outline],[3,8,C.outline],[3,9,C.outline],[3,10,C.outline],[3,11,C.outline],[3,12,C.outline]);
    cells.push([12,7,C.outline],[12,8,C.outline],[12,9,C.outline],[12,10,C.outline],[12,11,C.outline],[12,12,C.outline]);
    cells.push(...fillRect(4, 13, 11, 13, C.outline));
    cells.push([5,6,C.outline],[6,6,C.outline],[7,6,C.outline],[8,6,C.outline],[9,6,C.outline],[10,6,C.outline]);
    // símbolo estrela
    cells.push([7,9,"#fff"],[8,9,"#fff"],[6,10,"#fff"],[9,10,"#fff"],[7,10,"#fff"],[8,10,"#fff"],[7,11,"#fff"],[8,11,"#fff"]);
    return cells;
  },
  berry: () => {
    const cells: Cell[] = [];
    // baga vermelha
    cells.push(...fillRect(5,7,10,11,"#e13a3a"));
    cells.push(...fillRect(6,6,9,6,"#e13a3a"));
    cells.push(...fillRect(6,12,9,12,"#7a1616"));
    cells.push([4,7,C.outline],[4,8,C.outline],[4,9,C.outline],[4,10,C.outline],[4,11,C.outline]);
    cells.push([11,7,C.outline],[11,8,C.outline],[11,9,C.outline],[11,10,C.outline],[11,11,C.outline]);
    cells.push([5,6,C.outline],[6,5,C.outline],[7,5,C.outline],[8,5,C.outline],[9,5,C.outline],[10,6,C.outline]);
    cells.push([5,12,C.outline],[10,12,C.outline],[6,13,C.outline],[7,13,C.outline],[8,13,C.outline],[9,13,C.outline]);
    // folha
    cells.push([7,3,"#2f7a2a"],[8,3,"#2f7a2a"],[8,4,"#3a9a35"],[7,4,"#3a9a35"],[9,4,"#2f7a2a"],[6,4,"#2f7a2a"]);
    cells.push([7,2,C.outline],[8,2,C.outline],[6,3,C.outline],[9,3,C.outline]);
    // brilho
    cells.push([6,8,"#ff8a8a"],[6,9,"#ff8a8a"]);
    return cells;
  },

  // LIVROS
  book_exp: () => drawBook("#2b6bff", "#0f3a99", "?"),
  book_exp_big: () => drawBook("#b46bff", "#5a2794", "!"),
  book_exp_max: () => drawBook("#f2c94c", "#8a5a10", "★"),
  book_atk: () => drawBook("#e94b3c", "#8f1b12", "⚔"),
  book_def: () => drawBook("#6bd66b", "#1f6b2a", "◈"),
  book_vip: () => drawBook("#f2c94c", "#8a5a10", "V"),
  book_vip_30: () => drawBook("#ff9ad4", "#8f2f6b", "V"),
  book_vip_60: () => drawBook("#7ff0ff", "#1a6f8a", "V"),

  // OVOS
  egg_common: () => drawEgg("#e8dcc0", "#a58c60"),
  egg_rare: () => drawEgg("#a9d8ff", "#2b6faf"),
  egg_epic: () => drawEgg("#d0a4ff", "#5a2794"),
  egg_mystic: () => drawEgg("#ffb5e0", "#9a3d78"),
  egg_aura: () => drawEgg("#c4ffe8", "#1f8060"),
  egg_charizard: () => drawEgg("#ffbd7a", "#8f3f0f"),
  egg_lugia: () => drawEgg("#e8f4ff", "#5a7fa8"),

  // OUTROS
  premium_box: () => {
    const cells: Cell[] = [];
    // corpo dourado
    cells.push(...fillRect(3, 7, 12, 13, C.gold));
    cells.push(...fillRect(3, 6, 12, 6, "#ffe27a"));
    cells.push([2,6,C.outline],[13,6,C.outline]);
    cells.push([2,7,C.outline],[2,8,C.outline],[2,9,C.outline],[2,10,C.outline],[2,11,C.outline],[2,12,C.outline],[2,13,C.outline]);
    cells.push([13,7,C.outline],[13,8,C.outline],[13,9,C.outline],[13,10,C.outline],[13,11,C.outline],[13,12,C.outline],[13,13,C.outline]);
    cells.push(...fillRect(3, 14, 12, 14, C.outline));
    cells.push(...fillRect(3, 5, 12, 5, C.outline));
    // tampa
    cells.push(...fillRect(3, 3, 12, 5, "#e6a828"));
    cells.push(...fillRect(3, 3, 12, 3, "#ffd66b"));
    cells.push([2,3,C.outline],[2,4,C.outline],[2,5,C.outline]);
    cells.push([13,3,C.outline],[13,4,C.outline],[13,5,C.outline]);
    cells.push(...fillRect(3, 2, 12, 2, C.outline));
    // fita vermelha vertical
    cells.push(...fillRect(7, 3, 8, 13, C.red));
    // laço
    cells.push([6,3,C.red],[9,3,C.red],[6,4,C.red],[9,4,C.red]);
    cells.push([5,2,C.red],[10,2,C.red],[6,1,C.red],[9,1,C.red],[7,2,C.red],[8,2,C.red]);
    cells.push([5,1,C.outline],[10,1,C.outline],[5,2,C.outline],[10,2,C.outline]);
    // brilho
    cells.push([4,8,"#fff6d6"],[4,9,"#fff6d6"]);
    return cells;
  },
  chest_amulet: () => {
    const cells: Cell[] = [];
    // amuleto — pingente redondo com corrente
    cells.push([6,2,C.silverDk],[7,2,C.silverDk],[8,2,C.silverDk],[9,2,C.silverDk]);
    cells.push([5,3,C.silverDk],[10,3,C.silverDk]);
    cells.push([4,4,C.silverDk],[11,4,C.silverDk]);
    // gema central
    cells.push(...fillRect(6, 6, 9, 11, C.red));
    cells.push(...fillRect(5, 7, 5, 10, C.red));
    cells.push(...fillRect(10, 7, 10, 10, C.red));
    cells.push(...fillRect(6, 12, 9, 12, "#7a1616"));
    cells.push([5,6,C.outline],[10,6,C.outline],[4,7,C.outline],[11,7,C.outline]);
    cells.push([4,8,C.outline],[11,8,C.outline],[4,9,C.outline],[11,9,C.outline],[4,10,C.outline],[11,10,C.outline]);
    cells.push([5,11,C.outline],[10,11,C.outline],[5,12,C.outline],[10,12,C.outline]);
    cells.push([6,13,C.outline],[7,13,C.outline],[8,13,C.outline],[9,13,C.outline]);
    cells.push([6,5,C.outline],[7,5,C.outline],[8,5,C.outline],[9,5,C.outline]);
    // brilho
    cells.push([6,7,"#ff8a8a"],[6,8,"#ff8a8a"]);
    return cells;
  },
  incenso_mel: () => drawIncense("#f6a622", "#8a4a10"),
  incenso_mel_raro: () => drawIncense("#ffd66b", "#a67418"),
  skin_ticket: () => {
    const cells: Cell[] = [];
    // ticket em ângulo
    cells.push(...fillRect(2, 5, 13, 10, "#ffd166"));
    cells.push(...fillRect(2, 5, 13, 5, "#ffe27a"));
    cells.push(...fillRect(2, 10, 13, 10, "#c9932a"));
    // outline
    for (let x = 2; x <= 13; x++) { cells.push([x, 4, C.outline]); cells.push([x, 11, C.outline]); }
    cells.push([1,5,C.outline],[1,6,C.outline],[1,7,C.outline],[1,8,C.outline],[1,9,C.outline],[1,10,C.outline]);
    cells.push([14,5,C.outline],[14,6,C.outline],[14,7,C.outline],[14,8,C.outline],[14,9,C.outline],[14,10,C.outline]);
    // furos perfurados
    cells.push([5,7,"#fff"],[5,8,"#fff"],[10,7,"#fff"],[10,8,"#fff"]);
    // estrela
    cells.push([7,7,C.outline],[8,7,C.outline],[7,8,C.outline],[8,8,C.outline]);
    return cells;
  },
  key: () => {
    const cells: Cell[] = [];
    // cabeça circular
    cells.push(...fillRect(3, 5, 6, 9, C.gold));
    cells.push([2,6,C.gold],[2,7,C.gold],[2,8,C.gold]);
    cells.push([7,6,C.gold],[7,7,C.gold],[7,8,C.gold]);
    // outline cabeça
    cells.push([3,4,C.outline],[4,4,C.outline],[5,4,C.outline],[6,4,C.outline]);
    cells.push([3,10,C.outline],[4,10,C.outline],[5,10,C.outline],[6,10,C.outline]);
    cells.push([2,5,C.outline],[2,6,C.outline],[2,7,C.outline],[2,8,C.outline],[2,9,C.outline]);
    cells.push([7,5,C.outline],[7,9,C.outline]);
    // furo
    cells.push([4,7,C.outline],[5,7,C.outline]);
    // haste
    cells.push(...fillRect(8, 7, 13, 7, C.gold));
    cells.push(...fillRect(8, 6, 13, 6, C.outline));
    cells.push(...fillRect(8, 8, 13, 8, C.outline));
    // dentes
    cells.push([11,9,C.gold],[11,10,C.outline],[13,9,C.gold],[13,10,C.outline]);
    return cells;
  },

  // STONES ELEMENTAIS — Evento Odisséia Oddish
  stone_grass:    () => drawStone("#6bd66b", "#1f6b2a", "#c8ffb0"),
  stone_fire:     () => drawStone("#ff6b3d", "#8f1b12", "#ffd8a8"),
  stone_water:    () => drawStone("#3aa9ff", "#1a5f9e", "#b0e6ff"),
  stone_electric: () => drawStone("#f6d94a", "#8a6a10", "#fff7b0"),
  stone_dark:     () => drawStone("#7b3ee0", "#3a1478", "#c9a4ff"),
  stone_dragon:   () => drawStone("#ff4d94", "#7a1147", "#ffb0d4"),
};

function drawStone(main: string, dark: string, hi: string): Cell[] {
  const cells: Cell[] = [];
  // Gema facetada em octaedro pixel-art
  // topo
  cells.push([7, 3, C.outline], [8, 3, C.outline]);
  cells.push([6, 4, C.outline], [9, 4, C.outline]);
  cells.push([7, 4, main], [8, 4, main]);
  cells.push([5, 5, C.outline], [10, 5, C.outline]);
  cells.push([6, 5, main], [7, 5, hi], [8, 5, hi], [9, 5, main]);
  cells.push([4, 6, C.outline], [11, 6, C.outline]);
  cells.push([5, 6, main], [6, 6, hi], [7, 6, hi], [8, 6, main], [9, 6, main], [10, 6, dark]);
  cells.push([3, 7, C.outline], [12, 7, C.outline]);
  cells.push(...fillRect(4, 7, 11, 7, main));
  cells.push([5, 7, hi], [6, 7, hi], [10, 7, dark], [11, 7, dark]);
  // corpo largo
  cells.push([3, 8, C.outline], [12, 8, C.outline]);
  cells.push(...fillRect(4, 8, 11, 8, main));
  cells.push([4, 8, hi], [11, 8, dark]);
  cells.push([3, 9, C.outline], [12, 9, C.outline]);
  cells.push(...fillRect(4, 9, 11, 9, main));
  cells.push([5, 9, hi], [10, 9, dark], [11, 9, dark]);
  // afunilando
  cells.push([4, 10, C.outline], [11, 10, C.outline]);
  cells.push(...fillRect(5, 10, 10, 10, main));
  cells.push([9, 10, dark], [10, 10, dark]);
  cells.push([5, 11, C.outline], [10, 11, C.outline]);
  cells.push(...fillRect(6, 11, 9, 11, main));
  cells.push([9, 11, dark]);
  cells.push([6, 12, C.outline], [9, 12, C.outline]);
  cells.push([7, 12, main], [8, 12, dark]);
  cells.push([7, 13, C.outline], [8, 13, C.outline]);
  // brilho superior estrelado
  cells.push([6, 4, "#ffffff"]);
  return cells;
}


function drawBook(cover: string, coverDk: string, mark: string): Cell[] {
  const cells: Cell[] = [];
  // capa
  cells.push(...fillRect(3, 3, 12, 13, cover));
  cells.push(...fillRect(3, 3, 12, 3, coverDk));
  cells.push(...fillRect(3, 13, 12, 13, coverDk));
  // outline
  for (let x = 3; x <= 12; x++) { cells.push([x, 2, C.outline]); cells.push([x, 14, C.outline]); }
  for (let y = 3; y <= 13; y++) { cells.push([2, y, C.outline]); cells.push([13, y, C.outline]); }
  // páginas
  cells.push(...fillRect(4, 4, 11, 12, "#fff8e0"));
  cells.push(...fillRect(4, 4, 11, 4, "#e0d09a"));
  cells.push(...fillRect(4, 12, 11, 12, "#e0d09a"));
  cells.push(...fillRect(7, 4, 8, 12, cover));
  // marca central
  if (mark === "?") {
    cells.push([5,6,coverDk],[6,6,coverDk],[9,6,coverDk],[10,6,coverDk]);
    cells.push([5,7,coverDk],[10,7,coverDk],[9,8,coverDk],[10,9,coverDk],[9,10,coverDk],[9,11,coverDk]);
  } else if (mark === "!") {
    cells.push([5,6,coverDk],[10,6,coverDk],[5,7,coverDk],[10,7,coverDk],[5,8,coverDk],[10,8,coverDk],[5,10,coverDk],[10,10,coverDk]);
  } else if (mark === "★") {
    cells.push([5,7,coverDk],[10,7,coverDk],[6,8,coverDk],[9,8,coverDk],[5,9,coverDk],[10,9,coverDk],[6,10,coverDk],[9,10,coverDk]);
  } else if (mark === "V") {
    cells.push([5,6,coverDk],[10,6,coverDk],[5,7,coverDk],[10,7,coverDk],[6,8,coverDk],[9,8,coverDk],[6,9,coverDk],[9,9,coverDk],[7,10,coverDk],[8,10,coverDk]);
  } else if (mark === "⚔") {
    cells.push([5,6,coverDk],[10,6,coverDk],[5,7,coverDk],[10,7,coverDk],[6,8,coverDk],[9,8,coverDk],[7,9,coverDk],[8,9,coverDk],[7,10,coverDk],[8,10,coverDk]);
  } else if (mark === "◈") {
    cells.push([7,6,coverDk],[8,6,coverDk],[6,7,coverDk],[9,7,coverDk],[5,8,coverDk],[10,8,coverDk],[6,9,coverDk],[9,9,coverDk],[7,10,coverDk],[8,10,coverDk]);
  }
  // brilho lombada
  cells.push([4,5,"#fff"],[4,6,"#fff"]);
  return cells;
}

function drawEgg(main: string, dark: string): Cell[] {
  const cells: Cell[] = [];
  // formato de ovo
  const rows: [number, number][] = [
    [6, 9],   // y=3
    [5, 10],  // y=4
    [4, 11],  // y=5
    [4, 11],  // y=6
    [3, 12],  // y=7
    [3, 12],  // y=8
    [3, 12],  // y=9
    [3, 12],  // y=10
    [4, 11],  // y=11
    [4, 11],  // y=12
    [5, 10],  // y=13
  ];
  rows.forEach(([x1, x2], i) => {
    const y = i + 3;
    for (let x = x1; x <= x2; x++) cells.push([x, y, main]);
    cells.push([x1 - 1, y, C.outline], [x2 + 1, y, C.outline]);
  });
  // top/bottom outline
  cells.push([6,2,C.outline],[7,2,C.outline],[8,2,C.outline],[9,2,C.outline]);
  cells.push([5,14,C.outline],[6,14,C.outline],[7,14,C.outline],[8,14,C.outline],[9,14,C.outline],[10,14,C.outline]);
  // manchinhas
  cells.push([6,5,dark],[7,5,dark],[9,7,dark],[10,7,dark],[5,10,dark],[6,10,dark],[9,11,dark],[10,11,dark]);
  // brilho
  cells.push([5,4,"#fff"],[5,5,"#fff"]);
  return cells;
}

function drawIncense(main: string, dark: string): Cell[] {
  const cells: Cell[] = [];
  // pote hexagonal
  cells.push(...fillRect(4, 8, 11, 13, main));
  cells.push(...fillRect(4, 8, 11, 8, "#ffd066"));
  cells.push(...fillRect(4, 13, 11, 13, dark));
  cells.push([3,9,C.outline],[3,10,C.outline],[3,11,C.outline],[3,12,C.outline]);
  cells.push([12,9,C.outline],[12,10,C.outline],[12,11,C.outline],[12,12,C.outline]);
  cells.push(...fillRect(4, 7, 11, 7, C.outline));
  cells.push(...fillRect(4, 14, 11, 14, C.outline));
  // rótulo mel
  cells.push([6,10,C.outline],[7,10,C.outline],[8,10,C.outline],[9,10,C.outline]);
  cells.push([6,11,"#fff"],[7,11,"#fff"],[8,11,"#fff"],[9,11,"#fff"]);
  cells.push([6,12,C.outline],[7,12,C.outline],[8,12,C.outline],[9,12,C.outline]);
  // fumaça (será animada)
  cells.push([7,3,"#ffffff"],[8,3,"#ffffff"]);
  cells.push([6,5,"#f0f0f0"],[9,5,"#f0f0f0"]);
  cells.push([7,6,"#e0e0e0"]);
  return cells;
}

// fallback genérico
function drawGeneric(color: string): Cell[] {
  const cells: Cell[] = [];
  cells.push(...fillRect(5, 5, 10, 10, color));
  cells.push(...fillRect(5, 4, 10, 4, C.outline));
  cells.push(...fillRect(5, 11, 10, 11, C.outline));
  cells.push([4,5,C.outline],[4,6,C.outline],[4,7,C.outline],[4,8,C.outline],[4,9,C.outline],[4,10,C.outline]);
  cells.push([11,5,C.outline],[11,6,C.outline],[11,7,C.outline],[11,8,C.outline],[11,9,C.outline],[11,10,C.outline]);
  cells.push([6,6,"#fff"],[7,6,"#fff"]);
  return cells;
}

export interface ItemPixelIconProps {
  id: string;
  size?: number;
  color?: string; // fallback
}

export function ItemPixelIcon({ id, size = 48, color = "#c9a24b" }: ItemPixelIconProps) {
  const bmp = BITMAP_OVERRIDES[id];
  if (bmp) {
    return (
      <div className="pxi-wrap pxi-bob" style={{ width: size, height: size }}>
        <img
          src={bmp}
          width={size}
          height={size}
          alt=""
          style={{ imageRendering: "pixelated", display: "block", filter: "drop-shadow(0 0 4px rgba(255,215,110,0.6))" }}
        />
      </div>
    );
  }
  const drawer = ICONS[id];
  const cells = drawer ? drawer() : drawGeneric(color);
  // classe de animação por categoria
  const animClass =
    id.startsWith("egg_") ? "pxi-egg" :
    id.endsWith("ball") ? "pxi-ball" :
    id.startsWith("book_") ? "pxi-book" :
    id === "premium_box" ? "pxi-box" :
    id === "chest_amulet" ? "pxi-amulet" :
    id === "potion" || id === "revive" || id === "berry" ? "pxi-potion" :
    id === "skin_ticket" ? "pxi-ticket" :
    id === "incenso_mel" || id === "incenso_mel_raro" ? "pxi-incense" :
    "pxi-bob";
  return (
    <div className={`pxi-wrap ${animClass}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated", display: "block" }}
      >
        {/* halo/brilho */}
        <defs>
          <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="70%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="16" height="16" fill={`url(#glow-${id})`} />
        {grid(cells)}
      </svg>
    </div>
  );
}

// CSS global — injeta uma única vez
if (typeof document !== "undefined" && !document.getElementById("pxi-styles")) {
  const style = document.createElement("style");
  style.id = "pxi-styles";
  style.textContent = `
    @keyframes pxi-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
    @keyframes pxi-ball-shake { 0%,90%,100%{transform:rotate(0)} 93%{transform:rotate(-10deg)} 96%{transform:rotate(10deg)} }
    @keyframes pxi-book-glow { 0%,100%{filter:drop-shadow(0 0 0px transparent)} 50%{filter:drop-shadow(0 0 4px rgba(255,220,120,0.9))} }
    @keyframes pxi-egg-wobble { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
    @keyframes pxi-box-pulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 2px rgba(255,220,120,0.6))} 50%{transform:scale(1.05);filter:drop-shadow(0 0 8px rgba(255,220,120,1))} }
    @keyframes pxi-amulet-shine { 0%,100%{filter:drop-shadow(0 0 2px rgba(255,80,80,0.5))} 50%{filter:drop-shadow(0 0 8px rgba(255,80,80,1))} }
    @keyframes pxi-potion-bubble { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px) rotate(-2deg)} }
    @keyframes pxi-ticket-tilt { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} }
    @keyframes pxi-incense-smoke { 0%{transform:translateY(0);opacity:1} 50%{transform:translateY(-2px);opacity:0.7} 100%{transform:translateY(0);opacity:1} }

    .pxi-wrap { display: inline-block; transform-origin: 50% 60%; }
    .pxi-bob      { animation: pxi-bob 2.4s ease-in-out infinite; }
    .pxi-ball     { animation: pxi-ball-shake 3.2s ease-in-out infinite; }
    .pxi-book     { animation: pxi-book-glow 2.6s ease-in-out infinite, pxi-bob 3s ease-in-out infinite; }
    .pxi-egg      { animation: pxi-egg-wobble 2.2s ease-in-out infinite; }
    .pxi-box      { animation: pxi-box-pulse 2s ease-in-out infinite; }
    .pxi-amulet   { animation: pxi-amulet-shine 1.8s ease-in-out infinite; }
    .pxi-potion   { animation: pxi-potion-bubble 2s ease-in-out infinite; }
    .pxi-ticket   { animation: pxi-ticket-tilt 2.4s ease-in-out infinite; }
    .pxi-incense  { animation: pxi-incense-smoke 1.6s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}
