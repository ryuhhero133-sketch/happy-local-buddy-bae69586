// Enciclopédia de Pokémon Raros — aba ANCESTRAL do Professor do Laboratório.
// Módulo de dados (sem JSX) para não acionar a regra react-refresh dos componentes.
// Todos os 17 são apenas documentação de coleção: nenhum é adicionado ao jogo.
import darkraiUrl from "@/ambiente/ancestral/darkrai.jpg";
import dragoniteMgUrl from "@/ambiente/ancestral/dragonite-mg.jpg";
import giratinaUrl from "@/ambiente/ancestral/giratina.jpg";
import groudonShinyUrl from "@/ambiente/ancestral/groudon-shiny.jpg";
import cresseliaUrl from "@/ambiente/ancestral/cresselia.jpg";
import kyuremUrl from "@/ambiente/ancestral/kyurem.jpg";
import latiosAncestralUrl from "@/ambiente/ancestral/latios-ancestral.jpg";
import lugiaMShinyUrl from "@/ambiente/ancestral/lugia-m-shiny.jpg";
import lugiaShinyAncestralUrl from "@/ambiente/ancestral/lugia-shiny-ancestral.jpg";
import megaCharizardUrl from "@/ambiente/ancestral/mega-charizard.jpg";
import megaLugiaAncestralUrl from "@/ambiente/ancestral/mega-lugia-ancestral.jpg";
import megaCharizardXUrl from "@/ambiente/ancestral/mega-charizard-x.jpg";
import rayquazaShinyUrl from "@/ambiente/ancestral/rayquaza-shiny.jpg";
import rayquazaUrl from "@/ambiente/ancestral/rayquaza.jpg";
import reshiramUrl from "@/ambiente/ancestral/reshiram.jpg";
import zekromUrl from "@/ambiente/ancestral/zekrom.jpg";

export type AncestralTier = "ancestral" | "lendario" | "mitico" | "mega" | "shiny" | "variante";

export type AncestralEntry = {
  id: string;
  number: number;
  name: string;
  category: string;
  types: string[];
  specialty: string;
  trait: string;
  description: string;
  abilities: { name: string; text: string }[];
  role: string;
  tier: AncestralTier;
  accent: string;
  image: string;
  imagePending?: boolean;
};

export const TIER_META: Record<AncestralTier, { label: string; color: string; glow: string }> = {
  ancestral: { label: "ANCESTRAL", color: "#c98cff", glow: "rgba(201,140,255,0.55)" },
  lendario: { label: "LENDÁRIO", color: "#ffd94d", glow: "rgba(255,217,77,0.55)" },
  mitico: { label: "MÍTICO", color: "#ff5c8a", glow: "rgba(255,92,138,0.55)" },
  mega: { label: "MEGA", color: "#35e0ff", glow: "rgba(53,224,255,0.55)" },
  shiny: { label: "SHINY", color: "#7cffb2", glow: "rgba(124,255,178,0.55)" },
  variante: { label: "VARIANTE", color: "#ff9f43", glow: "rgba(255,159,67,0.55)" },
};

/** Bônus econômicos universais — idênticos para os 17. */
export const UNIVERSAL_BONUS = [
  { label: "Cristais", value: "+10%", desc: "na obtenção de cristais." },
  { label: "XP do Pokémon", value: "+50%", desc: "da XP recebida pelo Pokémon." },
  { label: "XP do Treinador", value: "2×", desc: "no XP destinado à evolução do treinador." },
  { label: "Ouro (Trait)", value: "+50%", desc: "de bônus de ouro pelo Trait." },
] as const;

export const GLOBAL_GOLD_NOTE =
  "O multiplicador global de ouro de 5× NÃO decorre do Trait de +50%: é implementado separadamente no sistema econômico e validado no balanceamento do servidor. Bônus de XP e ouro contam UMA VEZ por recompensa elegível.";

export const EGG_NOTE =
  "Ovos ancestrais NÃO são vendidos: PLUS e LUCK saem do BAÚ ANCESTRAL na aba INCUBADORA (abre com 1 TICKET ANCESTRAL do admin — com animação — e sorteia um dos dois). Toque num card do ancestral para ver as infos e use SELAR no card de ovos dele. O ovo libera em 3 DIAS — ou já, se você alimentar 300 Esferas de Safira (≥12 traits, nunca abaixo do ROXO).";

export function eggNameFor(name: string): string {
  return `Ovo de ${name}`;
}

export const ANCESTRAL_ENTRIES: AncestralEntry[] = [
  {
    id: "darkrai",
    number: 1,
    name: "Darkrai",
    category: "Mítico",
    types: ["Sombrio"],
    specialty: "Controle, sono e enfraquecimento",
    trait: "Caçador de Sonhos",
    accent: "#ff5c8a",
    tier: "mitico",
    image: darkraiUrl,
    description:
      "Darkrai é um Pokémon associado à escuridão e aos pesadelos. No IDLEMON REVO, é especializado em incapacitar adversários, reduzir suas capacidades de combate e causar dano enquanto o inimigo está vulnerável.",
    abilities: [
      { name: "Pesadelo Eterno", text: "Causa dano sombrio e possui chance de colocar o adversário para dormir." },
      { name: "Véu da Escuridão", text: "Cria uma zona sombria que reduz a precisão dos inimigos atingidos." },
      { name: "Ruptura Onírica", text: "Causa dano elevado, com dano adicional contra adversários afetados por sono." },
    ],
    role: "Excelente para combates estratégicos, controle de inimigos e confrontos contra adversários resistentes.",
  },
  {
    id: "dragonite-mg",
    number: 2,
    name: "Dragonite MG",
    category: "Variante especial",
    types: ["Dragão", "Voador"],
    specialty: "Força física, mobilidade e resistência",
    trait: "Espírito Dracônico",
    accent: "#ff9f43",
    tier: "variante",
    image: dragoniteMgUrl,
    description:
      "Dragonite MG é uma variante especial de Dragonite, com visual energético e presença imponente. Sua proposta é combinar força física, mobilidade aérea e capacidade de permanecer no combate.",
    abilities: [
      { name: "Impacto Dracônico", text: "Executa um golpe físico poderoso com energia dracônica." },
      { name: "Asas Celestiais", text: "Realiza um ataque aéreo veloz, com chance de atordoar o alvo." },
      { name: "Fúria do Dragão", text: "Aumenta temporariamente o poder de ataque, preparando Dragonite para causar mais dano." },
    ],
    role: "Atacante equilibrado, indicado para jogadores que procuram dano consistente e boa resistência.",
  },
  {
    id: "giratina",
    number: 3,
    name: "Giratina",
    category: "Lendário",
    types: ["Fantasma", "Dragão"],
    specialty: "Dano dimensional, resistência e enfraquecimento",
    trait: "Senhor do Antimundo",
    accent: "#c98cff",
    tier: "lendario",
    image: giratinaUrl,
    description:
      "Giratina é uma entidade lendária ligada a outra dimensão. No jogo, representa o poder de distorcer a realidade e controlar o campo de batalha por meio de ataques sobrenaturais.",
    abilities: [
      { name: "Garra Dimensional", text: "Golpe fantasmagórico que causa dano e pode aplicar um efeito de sangramento." },
      { name: "Portal do Antimundo", text: "Abre uma ruptura dimensional que causa dano em área." },
      { name: "Ruptura da Realidade", text: "Distorce a energia ao redor do alvo, reduzindo temporariamente sua defesa." },
    ],
    role: "Pokémon de combate avançado, com potencial para enfrentar grupos de inimigos e enfraquecer adversários poderosos.",
  },
  {
    id: "groudon-shiny",
    number: 4,
    name: "Groudon Shiny",
    category: "Lendário Shiny",
    types: ["Terra"],
    specialty: "Força física, resistência e dano em área",
    trait: "Núcleo Terrestre",
    accent: "#ffd94d",
    tier: "shiny",
    image: groudonShinyUrl,
    description:
      "Groudon Shiny é uma variante rara do lendário associado à expansão dos continentes. Sua identidade é baseada em força bruta, ataques terrestres e resistência.",
    abilities: [
      { name: "Abalo Continental", text: "Provoca um tremor que causa dano aos inimigos próximos." },
      { name: "Punho Magmático", text: "Concentra energia subterrânea em um golpe físico que pode causar queimadura." },
      { name: "Fúria das Placas", text: "Aumenta temporariamente o ataque e a defesa de Groudon." },
    ],
    role: "Combatente robusto, recomendado para confrontos prolongados e batalhas contra múltiplos inimigos.",
  },
  {
    id: "cresselia",
    number: 5,
    name: "Cresselia",
    category: "Lendário",
    types: ["Psíquico"],
    specialty: "Cura, proteção e suporte",
    trait: "Bênção Lunar",
    accent: "#7cffb2",
    tier: "lendario",
    image: cresseliaUrl,
    description:
      "Cresselia é associada à Lua e aos sonhos tranquilos. Sua função é oferecer uma alternativa aos Pokémon puramente ofensivos, protegendo aliados e prolongando a sobrevivência durante o combate.",
    abilities: [
      { name: "Luz Lunar", text: "Recupera parte da vida de Cresselia ou de um aliado." },
      { name: "Barreira dos Sonhos", text: "Cria uma proteção temporária que reduz o dano recebido." },
      { name: "Pulso Psíquico", text: "Dispara energia psíquica contra o alvo, causando dano e podendo reduzir seu ataque especial." },
    ],
    role: "Suporte defensivo, indicado para jogadores que valorizam sobrevivência e recuperação.",
  },
  {
    id: "kyurem",
    number: 6,
    name: "Kyurem",
    category: "Lendário",
    types: ["Dragão", "Gelo"],
    specialty: "Congelamento, lentidão e dano elevado",
    trait: "Coração de Gelo",
    accent: "#35e0ff",
    tier: "lendario",
    image: kyuremUrl,
    description:
      "Kyurem é um dragão lendário associado ao frio extremo. Sua proposta de combate combina dano dracônico, ataques congelantes e controle da movimentação dos adversários.",
    abilities: [
      { name: "Prisão Glacial", text: "Causa dano de Gelo e reduz temporariamente a velocidade do alvo." },
      { name: "Sopro do Vazio", text: "Dispara uma rajada congelante em linha, atingindo os inimigos no caminho." },
      { name: "Ruptura Congelante", text: "Disfere um golpe poderoso que causa dano adicional contra adversários congelados." },
    ],
    role: "Atacante especializado em controle, ideal para dificultar a movimentação de inimigos perigosos.",
  },
  {
    id: "latias-ancestral",
    number: 7,
    name: "Latias Ancestral",
    category: "Ancestral",
    types: ["Dragão", "Psíquico"],
    specialty: "Evasão, proteção e suporte",
    trait: "Memória Eônica",
    accent: "#ff8fc4",
    tier: "ancestral",
    image: "",
    imagePending: true,
    description:
      "Latias Ancestral é uma variante exclusiva do IDLEMON REVO, inspirada na conexão de Latias com a energia psíquica e a velocidade. Sua identidade é protetora e elegante, com habilidades voltadas à defesa e à evasão.",
    abilities: [
      { name: "Reflexo Ancestral", text: "Aumenta temporariamente a chance de Latias evitar ataques." },
      { name: "Lança Eônica", text: "Dispara um projétil de energia psíquica que causa dano elevado." },
      { name: "Escudo Carmesim", text: "Cria uma barreira protetora para Latias ou um aliado." },
    ],
    role: "Pokémon raro de suporte ágil, capaz de combinar proteção e ataques especiais.",
  },
  {
    id: "latios-ancestral",
    number: 8,
    name: "Latios Ancestral",
    category: "Ancestral",
    types: ["Dragão", "Psíquico"],
    specialty: "Velocidade, precisão e dano especial",
    trait: "Voo Eônico",
    accent: "#4da6ff",
    tier: "ancestral",
    image: latiosAncestralUrl,
    description:
      "Latios Ancestral é a contraparte ofensiva de Latias Ancestral. Sua proposta é concentrar energia em ataques rápidos e poderosos, mantendo a temática de velocidade e poder psíquico.",
    abilities: [
      { name: "Investida Eônica", text: "Realiza uma investida veloz que pode atingir o adversário duas vezes." },
      { name: "Cometa Mental", text: "Lança energia psíquica em área, atingindo vários inimigos." },
      { name: "Rasgo do Horizonte", text: "Executa um ataque dracônico que ignora parte da defesa do alvo." },
    ],
    role: "Atacante ágil, recomendado para causar dano elevado em alvos individuais ou grupos.",
  },
  {
    id: "lugia-m-shiny",
    number: 9,
    name: "Lugia M Shiny",
    category: "Variante especial Shiny",
    types: ["Psíquico", "Voador"],
    specialty: "Defesa, contra-ataque e controle",
    trait: "Guardião Sombrio",
    accent: "#7cffb2",
    tier: "shiny",
    image: lugiaMShinyUrl,
    description:
      "Lugia M Shiny é uma variante especial criada para o IDLEMON REVO, com aparência sombria e energia concentrada. Sua proposta é representar um guardião capaz de resistir a ataques e responder com golpes de grande alcance.",
    abilities: [
      { name: "Turbilhão Abissal", text: "Produz um turbilhão de energia que causa dano em área." },
      { name: "Muralha Psíquica", text: "Reduz temporariamente o dano recebido." },
      { name: "Onda do Guardião", text: "Libera uma onda de energia que causa dano e pode interromper inimigos." },
    ],
    role: "Defensor lendário com capacidade de interromper ataques e proteger-se durante combates difíceis.",
  },
  {
    id: "lugia-shiny-ancestral",
    number: 10,
    name: "Lugia Shiny Ancestral",
    category: "Ancestral Shiny",
    types: ["Psíquico", "Voador"],
    specialty: "Proteção, cura e controle em área",
    trait: "Legado das Eras",
    accent: "#e0a8ff",
    tier: "ancestral",
    image: lugiaShinyAncestralUrl,
    description:
      "Lugia Shiny Ancestral é uma variante exclusiva de prestígio, com aparência celestial e temática de poder ancestral. Pode ser posicionada como uma forma extremamente rara, valorizada tanto pela coleção quanto pelo combate.",
    abilities: [
      { name: "Aurora Ancestral", text: "Envolve o usuário em energia luminosa que recupera vida gradualmente." },
      { name: "Asas da Eternidade", text: "Concede proteção temporária a Lugia e aos aliados próximos." },
      { name: "Julgamento Celeste", text: "Libera uma onda psíquica que causa dano aos adversários em área." },
    ],
    role: "Forma rara de suporte avançado, com ênfase em sobrevivência e proteção coletiva.",
  },
  {
    id: "mega-charizard",
    number: 11,
    name: "Mega Charizard",
    category: "Mega",
    types: ["Fogo", "Dragão / Voador"],
    specialty: "Dano explosivo e pressão ofensiva",
    trait: "Fornalha Viva",
    accent: "#ff7a2f",
    tier: "mega",
    image: megaCharizardUrl,
    description:
      "Mega Charizard representa uma evolução de alto poder ofensivo. A forma X favorece o combate físico e a energia dracônica, enquanto a forma Y é ideal para ataques especiais e domínio das chamas.",
    abilities: [
      { name: "Chama Mega", text: "Concentra fogo em uma explosão que causa dano elevado." },
      { name: "Mergulho Flamejante", text: "Realiza uma investida aérea que causa dano e pode queimar o alvo." },
      { name: "Sol Devastador", text: "Aumenta temporariamente o poder dos ataques de Fogo." },
    ],
    role: "Atacante de alto impacto, com capacidade de causar grandes quantidades de dano em pouco tempo.",
  },
  {
    id: "mega-lugia-ancestral",
    number: 12,
    name: "Mega Lugia Ancestral",
    category: "Mega Ancestral",
    types: ["Psíquico", "Voador"],
    specialty: "Proteção avançada, dano em área e enfraquecimento",
    trait: "Soberano dos Céus",
    accent: "#8ecbff",
    tier: "mega",
    image: megaLugiaAncestralUrl,
    description:
      "Mega Lugia Ancestral representa uma forma de elite do guardião dos mares. Sua identidade combina poder ancestral, resistência e controle, diferenciando-se de versões mais ofensivas ou puramente visuais de Lugia.",
    abilities: [
      { name: "Tempestade Primordial", text: "Desencadeia uma tempestade de energia que causa dano em área." },
      { name: "Escudo dos Antigos", text: "Reduz o dano recebido e protege temporariamente os aliados." },
      { name: "Ressonância Celeste", text: "Dispara uma onda psíquica que causa dano e enfraquece o alvo." },
    ],
    role: "Defensor de elite com capacidade de proteger aliados e controlar confrontos contra grupos de inimigos.",
  },
  {
    id: "mega-charizard-x",
    number: 13,
    name: "Mega Charizard X",
    category: "Mega X",
    types: ["Fogo", "Dragão"],
    specialty: "Dano físico, queimadura e ruptura defensiva",
    trait: "Chama Dracônica",
    accent: "#2f8fff",
    tier: "mega",
    image: megaCharizardXUrl,
    description:
      "Mega Charizard X é a forma de combate físico de Charizard, marcada pelas chamas azuis e pela combinação dos tipos Fogo e Dragão. Sua proposta é concentrar poder em golpes próximos e ataques dracônicos.",
    abilities: [
      { name: "Garras Dracônicas", text: "Executa um golpe físico que causa dano de Dragão." },
      { name: "Chama Azul", text: "Libera uma chama concentrada que causa dano e pode provocar queimadura." },
      { name: "Ruptura do Dragão", text: "Disfere um golpe pesado que reduz temporariamente a defesa do adversário." },
    ],
    role: "Atacante físico especializado em pressão ofensiva e enfraquecimento da defesa inimiga.",
  },
  {
    id: "rayquaza-shiny",
    number: 14,
    name: "Rayquaza Shiny",
    category: "Lendário Shiny",
    types: ["Dragão", "Voador"],
    specialty: "Velocidade, mobilidade e dano elevado",
    trait: "Predador dos Céus",
    accent: "#7cffb2",
    tier: "shiny",
    image: rayquazaShinyUrl,
    description:
      "Rayquaza Shiny é uma variante rara do lendário que domina os céus. Sua aparência diferenciada oferece valor de coleção, enquanto suas habilidades são orientadas para velocidade e ataques de grande impacto.",
    abilities: [
      { name: "Ascensão Celeste", text: "Aumenta temporariamente a velocidade e o ataque." },
      { name: "Cauda Meteórica", text: "Executa um golpe dracônico de alto impacto." },
      { name: "Ruptura Atmosférica", text: "Desencadeia um ataque aéreo em área que pode interromper os inimigos." },
    ],
    role: "Atacante veloz, indicado para causar dano consistente e pressionar inimigos antes que consigam reagir.",
  },
  {
    id: "rayquaza",
    number: 15,
    name: "Rayquaza",
    category: "Lendário",
    types: ["Dragão", "Voador"],
    specialty: "Dano consistente, mobilidade e controle",
    trait: "Equilíbrio Celeste",
    accent: "#4ade80",
    tier: "lendario",
    image: rayquazaUrl,
    description:
      "Rayquaza é um lendário associado ao equilíbrio dos céus. No IDLEMON REVO, sua função é ser um atacante versátil, capaz de combinar golpes dracônicos com ataques aéreos e efeitos de enfraquecimento.",
    abilities: [
      { name: "Tornado Dracônico", text: "Cria um tornado de energia que causa dano em área." },
      { name: "Investida do Firmamento", text: "Executa um ataque veloz contra o alvo." },
      { name: "Rugido Atmosférico", text: "Libera uma onda de pressão que reduz temporariamente o ataque dos inimigos próximos." },
    ],
    role: "Lendário ofensivo versátil, adequado para diferentes estilos de combate.",
  },
  {
    id: "reshiram",
    number: 16,
    name: "Reshiram",
    category: "Lendário",
    types: ["Dragão", "Fogo"],
    specialty: "Ataque especial, queimadura e dano concentrado",
    trait: "Verdade Flamejante",
    accent: "#ffa03d",
    tier: "lendario",
    image: reshiramUrl,
    description:
      "Reshiram é o lendário associado à verdade e ao poder das chamas. Sua identidade de combate é baseada em ataques especiais de Fogo, energia dracônica e pressão ofensiva a distância.",
    abilities: [
      { name: "Chama da Verdade", text: "Libera uma explosão de fogo que causa dano elevado." },
      { name: "Pulso Dracônico", text: "Dispara um projétil de energia dracônica contra o inimigo." },
      { name: "Sol Branco", text: "Concentra energia térmica e aumenta temporariamente o poder dos ataques de Fogo." },
    ],
    role: "Atacante especial, ideal para causar dano concentrado e explorar fraquezas de adversários vulneráveis a Fogo.",
  },
  {
    id: "zekrom",
    number: 17,
    name: "Zekrom",
    category: "Lendário",
    types: ["Dragão", "Elétrico"],
    specialty: "Ataque físico, eletricidade e paralisia",
    trait: "Ideal Tempestuoso",
    accent: "#ffe14d",
    tier: "lendario",
    image: zekromUrl,
    description:
      "Zekrom é o lendário associado aos ideais e ao poder elétrico. Sua identidade combina força física, ataques de eletricidade e capacidade de prejudicar a movimentação dos adversários.",
    abilities: [
      { name: "Raio dos Ideais", text: "Libera um ataque elétrico que causa dano e pode paralisar o alvo." },
      { name: "Investida do Trovão", text: "Executa um golpe físico de alta potência, envolvido em eletricidade." },
      { name: "Núcleo de Plasma", text: "Libera uma descarga elétrica em área, atingindo vários inimigos." },
    ],
    role: "Atacante físico elétrico, especializado em pressão ofensiva e interrupção dos movimentos inimigos.",
  },
];

export const ANCESTRAL_BY_ID: Record<string, AncestralEntry> = Object.fromEntries(
  ANCESTRAL_ENTRIES.map((e) => [e.id, e]),
);
