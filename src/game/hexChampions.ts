// Hexagonal Champions — dados do continente endgame.
// Fase 1: hub visual. Todos os mapas ficam bloqueados até o treinador atingir
// o nível exigido.

import bannerCrystal from "@/assets/hex/banner-crystal-valley.jpg";
import bannerCitadel from "@/assets/hex/banner-citadel.jpg";
import bannerRuby from "@/assets/hex/banner-ruby-sanctuary.jpg";
import bannerMine from "@/assets/hex/banner-obsidian-mine.jpg";
import bannerShadow from "@/assets/hex/banner-shadow-nexus.jpg";
import bannerDragon from "@/assets/hex/banner-dragon-crown.jpg";

export type HexRank = "silver" | "gold" | "diamond" | "emerald" | "ruby";

export const HEX_RANKS: {
  id: HexRank;
  name: string;
  minLevel: number;
  color: string;
  glow: string;
  desc: string;
  rewards: string;
}[] = [
  { id: "silver",  name: "Silver",        minLevel: 10000, color: "#c8cdd6", glow: "#e6ecff",
    desc: "A porta de entrada de Hexagonal Champions. Ainda longe da glória.",
    rewards: "Fragmentos comuns, Pokébolas raras, ovos épicos." },
  { id: "gold",    name: "Gold",          minLevel: 15000, color: "#f4c04a", glow: "#ffe27a",
    desc: "Campeões consagrados. A energia do continente começa a te reconhecer.",
    rewards: "Cristais Prisma, Ultra Balls, ovos lendários." },
  { id: "diamond", name: "Diamond",       minLevel: 22000, color: "#7fd8ff", glow: "#c1ecff",
    desc: "Sua presença altera o campo mágico. Portais se abrem para você.",
    rewards: "Relíquias, Master Balls, ovos míticos." },
  { id: "emerald", name: "Emerald",       minLevel: 32000, color: "#4be29b", glow: "#a6ffd2",
    desc: "Poucos alcançam a esmeralda. Você é rumor entre treinadores.",
    rewards: "Insígnias, Pokémon Black Mitic Plus, drops secretos." },
  { id: "ruby",    name: "Mastery Ruby",  minLevel: 50000, color: "#ff3b58", glow: "#ff8fa3",
    desc: "O trono do continente. Reserva de eternidade. O sonho impossível.",
    rewards: "Trono do Rubi, Pokémon Mítico Brilhante Plus exclusivo, aura de coroação." },
];

export type HexMap = {
  id: string;
  name: string;
  banner: string;
  x: number; // 0..100 posição no mapa
  y: number;
  minLevel: number;
  rank: HexRank;
  story: string;
  boss: string;
  pokemons: string[];
  drops: string[];
  rewards: string[];
  connections: string[]; // ids conectados
  trivia: string;
};

export const HEX_MAPS: HexMap[] = [
  {
    id: "crystal_valley", name: "Hex Crystal Valley", banner: bannerCrystal,
    x: 18, y: 30, minLevel: 10000, rank: "silver",
    story: "Um vale onde cristais de obsidiana pulsam com a memória de treinadores esquecidos.",
    boss: "Metagross Cristalino",
    pokemons: ["Lucario", "Metagross", "Gallade", "Scizor"],
    drops: ["Fragmento Prisma", "Núcleo Violeta", "Poeira Rúnica"],
    rewards: ["+120% XP", "Ovo Cristal", "Insígnia Silver I"],
    connections: ["citadel", "obsidian_mine"],
    trivia: "Os cristais aqui gemem quando um campeão cai.",
  },
  {
    id: "citadel", name: "Citadel of Champions", banner: bannerCitadel,
    x: 42, y: 18, minLevel: 12000, rank: "silver",
    story: "A fortaleza flutuante onde vivem os espectros dos maiores campeões de eras passadas.",
    boss: "Aegislash Regente",
    pokemons: ["Aegislash", "Corviknight", "Bisharp", "Kingambit"],
    drops: ["Estandarte Áureo", "Fragmento Prisma", "Chave Champion"],
    rewards: ["+150% Ouro", "Insígnia Silver II", "Título 'Campeão'"],
    connections: ["crystal_valley", "hall_legends", "arena"],
    trivia: "Cada vitória grava seu nome numa das colunas.",
  },
  {
    id: "obsidian_mine", name: "Ancient Obsidian Mine", banner: bannerMine,
    x: 25, y: 60, minLevel: 14000, rank: "gold",
    story: "Minas profundas onde anões extraíam obsidiana antes de sumirem sem explicação.",
    boss: "Excavaton (Rhyperior sombrio)",
    pokemons: ["Tyranitar", "Garchomp", "Kingambit", "Hydreigon"],
    drops: ["Obsidiana Bruta", "Cristal Prisma", "Pedra Vulcânica"],
    rewards: ["+180% Cristal", "Ovo Obsidiana", "Insígnia Gold I"],
    connections: ["crystal_valley", "shadow_nexus"],
    trivia: "O anão explorador jura ter visto luzes se movendo sozinhas nas galerias.",
  },
  {
    id: "hall_legends", name: "Hall of Legends", banner: bannerCitadel,
    x: 58, y: 32, minLevel: 16000, rank: "gold",
    story: "Corredor onde apenas nomes lendários ecoam. Cada estátua guarda um voto.",
    boss: "Salamence Coroado",
    pokemons: ["Dragonite", "Salamence", "Hydreigon", "Haxorus"],
    drops: ["Escama Antiga", "Cristal Prisma", "Placa de Bronze"],
    rewards: ["Ovo Lendário", "Insígnia Gold II", "Aura Dourada"],
    connections: ["citadel", "dragon_crown", "eternal_colosseum"],
    trivia: "A parede escuta pedidos. Nem todos ela concede.",
  },
  {
    id: "arena", name: "Master Arena", banner: bannerCitadel,
    x: 50, y: 50, minLevel: 18000, rank: "gold",
    story: "Arena central. Uma multidão invisível grita a cada golpe.",
    boss: "Machamp Sombrio",
    pokemons: ["Gallade", "Machamp", "Lucario", "Bisharp"],
    drops: ["Faixa de Combate", "Cristal Prisma", "Emblema de Ouro"],
    rewards: ["+200% XP em raid", "Insígnia Gold III"],
    connections: ["citadel", "eternal_colosseum", "shadow_nexus"],
    trivia: "A areia daqui nunca é lavada. É a memória de mil batalhas.",
  },
  {
    id: "shadow_nexus", name: "Shadow Nexus", banner: bannerShadow,
    x: 35, y: 80, minLevel: 22000, rank: "diamond",
    story: "Uma fenda dimensional onde a realidade se dobra. Só entram os que já morreram uma vez.",
    boss: "Chandelure Prismático",
    pokemons: ["Chandelure", "Hydreigon", "Zoroark", "Aegislash"],
    drops: ["Névoa Sombria", "Cristal Prisma", "Núcleo de Vazio"],
    rewards: ["Ovo Sombra", "Insígnia Diamond I", "Master Ball"],
    connections: ["obsidian_mine", "arena", "temple_infinity"],
    trivia: "Ouve-se sua própria voz vinda de longe.",
  },
  {
    id: "eternal_colosseum", name: "Eternal Colosseum", banner: bannerCitadel,
    x: 68, y: 58, minLevel: 26000, rank: "diamond",
    story: "Torneio sem fim. Vencer não te tira daqui — te faz voltar mais forte.",
    boss: "Kingambit Imortal",
    pokemons: ["Kingambit", "Corviknight", "Aegislash", "Metagross"],
    drops: ["Coroa Quebrada", "Cristal Prisma", "Fragmento Eterno"],
    rewards: ["Insígnia Diamond II", "Trono de Bronze", "+300% Ouro"],
    connections: ["hall_legends", "arena", "ruby_throne"],
    trivia: "Os campeões daqui sabem seu nome antes de você chegar.",
  },
  {
    id: "dragon_crown", name: "Dragon Crown", banner: bannerDragon,
    x: 78, y: 24, minLevel: 30000, rank: "emerald",
    story: "Onde os dragões coroaram seu próprio rei — e o esqueceram para sempre.",
    boss: "Rayquaza Coroado",
    pokemons: ["Salamence", "Dragonite", "Haxorus", "Garchomp", "Hydreigon"],
    drops: ["Escama Real", "Cristal Prisma", "Pedra Dragão"],
    rewards: ["Ovo Dragão Sombrio", "Insígnia Emerald I"],
    connections: ["hall_legends", "temple_infinity"],
    trivia: "O trono está vazio. Aparentemente.",
  },
  {
    id: "crystal_eclipse", name: "Crystal Eclipse", banner: bannerCrystal,
    x: 12, y: 78, minLevel: 34000, rank: "emerald",
    story: "Um eclipse permanente cobre este pico. Cristais dobram a luz.",
    boss: "Metagross Prismático",
    pokemons: ["Metagross", "Gallade", "Lucario", "Aegislash"],
    drops: ["Prisma Eclipsado", "Cristal Prisma", "Poeira Estelar"],
    rewards: ["Insígnia Emerald II", "Ovo Prisma"],
    connections: ["obsidian_mine", "shadow_nexus"],
    trivia: "Você vê seu próprio reflexo caminhar sozinho.",
  },
  {
    id: "temple_infinity", name: "Temple of Infinity", banner: bannerShadow,
    x: 55, y: 78, minLevel: 38000, rank: "emerald",
    story: "Um templo que não termina. Cada porta abre outra sala mais antiga.",
    boss: "Zoroark do Infinito",
    pokemons: ["Zoroark", "Chandelure", "Hydreigon", "Gallade"],
    drops: ["Pergaminho do Vazio", "Cristal Prisma", "Runa Infinita"],
    rewards: ["Ovo Infinito", "Insígnia Emerald III"],
    connections: ["shadow_nexus", "eternal_colosseum", "ruby_throne"],
    trivia: "Um treinador entrou aqui há 400 anos e ainda escreve cartas.",
  },
  {
    id: "ruby_sanctuary", name: "Ruby Sanctuary", banner: bannerRuby,
    x: 88, y: 50, minLevel: 44000, rank: "ruby",
    story: "O coração vermelho do continente. Cada batida decide o destino de um Pokémon.",
    boss: "Guardião do Rubi",
    pokemons: ["Kingambit", "Aegislash", "Salamence", "Chandelure"],
    drops: ["Chave Ruby", "Cristal Prisma", "Coração de Obsidiana"],
    rewards: ["Insígnia Ruby I", "Aura Carmesim"],
    connections: ["eternal_colosseum", "ruby_throne"],
    trivia: "O rubi nunca é o mesmo duas vezes.",
  },
  {
    id: "ruby_throne", name: "Ruby Throne", banner: bannerRuby,
    x: 82, y: 82, minLevel: 50000, rank: "ruby",
    story: "O trono final. Poucos o viram. Menos ainda voltaram para contar.",
    boss: "Imperador Escarlate",
    pokemons: ["Kingambit", "Rayquaza", "Dragonite", "Metagross", "Aegislash", "Chandelure"],
    drops: ["Coroa do Rubi", "Cristal Prisma ✦", "Fragmento do Imperador"],
    rewards: ["Título 'Mastery Ruby'", "Trono coroado", "Cosmético permanente"],
    connections: ["ruby_sanctuary", "temple_infinity", "eternal_colosseum"],
    trivia: "Reza a lenda: quem senta aqui deixa de envelhecer.",
  },
];

export const DWARF_LINES: string[] = [
  "Essas terras pertencem apenas aos verdadeiros campeões.",
  "Você ainda não possui experiência suficiente, jovem treinador.",
  "Cada esfera lê seu nível. Cresça — e elas te reconhecerão.",
  "Continue evoluindo. Voltarei a vê-lo quando estiver preparado.",
  "O rubi lá no fundo? Esqueça. Nem eu ouso chegar perto.",
  "Já perdi treinadores melhores do que você tentando entrar cedo demais.",
  "Traga cristais. Traga vitórias. Aí conversamos.",
  "Sinto o fedor de obsidiana em você. Ainda fraco, mas é um começo.",
];

export function dwarfLineFor(mapId: string): string {
  // hash simples pra manter a mesma fala por mapa
  let h = 0;
  for (let i = 0; i < mapId.length; i++) h = (h * 31 + mapId.charCodeAt(i)) >>> 0;
  return DWARF_LINES[h % DWARF_LINES.length];
}

export function readTrainerLevel(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("rubym.save.v2");
    if (!raw) return 0;
    const j = JSON.parse(raw);
    return Number(j?.trainerLevel ?? j?.trainer?.trainer_level ?? 0) || 0;
  } catch { return 0; }
}
