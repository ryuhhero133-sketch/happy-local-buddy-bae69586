// ============================================================
// IDLEMON REVO — SAGA NARRATIVA "AS MEMÓRIAS APAGADAS"
// ============================================================
// 21 etapas (20 + escolha final) com 5 NPCs: BOBY, SAN, NANIZINHA,
// PAYKA e PAN (Payka e Pan são irmãos).
// - Usa SOMENTE itens reais do jogo (sem moeda/item novo).
// - Estado por jogador em IdleState.saga (persistido no save).
// - Recompensa com flag claimed: nunca duplica (reload/login/mapa).
// ============================================================

export type SagaNpcId = "boby" | "san" | "nanizinha" | "payka" | "pan";

export type SagaObjective =
  | { kind: "talk" }
  | { kind: "kill"; count: number }
  | { kind: "capture"; count: number }
  | { kind: "item"; itemId: string; qty: number; consume: boolean }
  | { kind: "feed_pet"; count: number }
  | { kind: "feed_trainer"; count: number }
  | { kind: "visit"; map: string }
  | { kind: "choice" };

export type SagaChoice = { id: string; label: string; reply: string };

export type SagaReward =
  | { kind: "item"; itemId: string; qty: number }
  | { kind: "gold"; qty: number };

export type SagaStage = {
  id: string;
  npc: SagaNpcId;
  title: string;
  lines: string[];
  choices?: SagaChoice[];
  objective: SagaObjective;
  objectiveLabel: string;
  reward: SagaReward[];
};

export const SAGA_NPCS: Record<SagaNpcId, { name: string; title: string; map: string }> = {
  boby:      { name: "BOBY",      title: "O Companheiro das Pokébolas", map: "mapinha6" },
  san:       { name: "SAN",       title: "O Especialista em Orbs",      map: "mapinha6" },
  nanizinha: { name: "NANIZINHA", title: "A Cozinheira",                map: "mapinha6" },
  payka:     { name: "PAYKA",     title: "O Negociador (irmão da Pan)", map: "florest_bone" },
  pan:       { name: "PAN",       title: "A Informante (irmã do Payka)",map: "valley_plume" },
};

export const SAGA_STAGES: SagaStage[] = [
  // ================= BOBY 1–4 =================
  {
    id: "boby1", npc: "boby", title: "Você demorou",
    lines: [
      "BOBY: Você demorou.",
      "VOCÊ: Eu acabei de chegar.",
      "BOBY: Eu sei.",
      "VOCÊ: Então por que disse que eu demorei?",
      "BOBY: ...Não sei. Estranho, né? Enfim! Pegue essas Pokébolas. Vai que você demora de novo.",
    ],
    choices: [
      { id: "rir", label: "😄 Rir da situação", reply: "BOBY: Viu? A gente já se entende. Isso é raro. Ou... comum? Esquece." },
      { id: "serio", label: "🤨 Perguntar se ele está bem", reply: "BOBY: Bem? Melhor do que ontem. Ou do que amanhã. Tanto faz, pegue as bolas." },
    ],
    objective: { kind: "talk" }, objectiveLabel: "Converse com Boby",
    reward: [{ kind: "item", itemId: "pokeball", qty: 5 }],
  },
  {
    id: "boby2", npc: "boby", title: "Uma Pokébola a menos",
    lines: [
      "BOBY: Conta pra mim... quantas Pokébolas eu tinha ontem?",
      "VOCÊ: Como eu vou saber? Te conheci hoje!",
      "BOBY: É. Pois eu sinto falta de uma. UMA. Vai ver rolou pra debaixo de algum Pokémon bravo por aí.",
      "BOBY: Derrote uns selvagens e confere se ela aparece. Se achar... mentira, pode ficar com umas minhas.",
    ],
    objective: { kind: "kill", count: 5 }, objectiveLabel: "Derrote 5 Pokémon selvagens",
    reward: [{ kind: "item", itemId: "pokeball", qty: 8 }],
  },
  {
    id: "boby3", npc: "boby", title: "Você já sabia disso?",
    lines: [
      "BOBY: Aula rápida de graça: Pokémon com HP baixo entra mais fácil na bola. De nada.",
      "VOCÊ: Todo mundo sabe disso.",
      "BOBY: ...Você também já sabia antes de eu falar, né? Esquisito. Prova pra mim: capture 2 e a gente finge que foi minha dica.",
    ],
    objective: { kind: "capture", count: 2 }, objectiveLabel: "Capture 2 Pokémon",
    reward: [{ kind: "item", itemId: "greatball", qty: 3 }],
  },
  {
    id: "boby4", npc: "boby", title: "Eu conheço você?",
    lines: [
      "BOBY: Achei isso aqui no meu bolso. Não é meu. Ou é? Lê aí.",
      "FRAGMENTO: “Você prometeu que voltaria.”",
      "BOBY: ...Eu não sei o que é isso. Mas minha mão tremeu quando você leu. Guarda isso na cabeça, tá?",
    ],
    choices: [
      { id: "prometo", label: "🤝 “Eu vou voltar, prometo”", reply: "BOBY: ...Valeu. Não sei por que, mas eu precisava ouvir isso." },
      { id: "desconversa", label: "😅 “Deve ser bilhete antigo”", reply: "BOBY: É. Antigo. De... sei lá quando. Valeu mesmo assim." },
    ],
    objective: { kind: "talk" }, objectiveLabel: "Ouça Boby até o fim",
    reward: [{ kind: "item", itemId: "pokeball", qty: 5 }],
  },
  // ================= SAN 5–8 =================
  {
    id: "san1", npc: "san", title: "O Orb errado",
    lines: [
      "SAN: Você sabe para que serve isso?",
      "VOCÊ: Não.",
      "SAN: Perfeito.",
      "VOCÊ: Por quê?",
      "SAN: Porque agora tenho uma desculpa para falar por cinco minutos. Isso é um Orb de XP: ativa e ganha +10% de EXP por 1 hora. Toma um, por conta da casa. Quer dizer... por conta do mistério.",
    ],
    objective: { kind: "talk" }, objectiveLabel: "Ouça a explicação do San",
    reward: [{ kind: "item", itemId: "orb_xp_minor", qty: 1 }],
  },
  {
    id: "san2", npc: "san", title: "Onde foi parar?",
    lines: [
      "SAN: Sumiu um Orb aqui de cima do balcão. Ou eu guardei e esqueci. 50/50.",
      "SAN: Faz assim: derrota 8 selvagens pra espantar qualquer um que possa ter... pego emprestado. Se achar meu Orb no caminho, nem me conta, só finge que foi tudo planejado.",
    ],
    objective: { kind: "kill", count: 8 }, objectiveLabel: "Derrote 8 Pokémon selvagens",
    reward: [{ kind: "item", itemId: "orb_xp_minor", qty: 1 }],
  },
  {
    id: "san3", npc: "san", title: "Você já fez isso antes",
    lines: [
      "SAN: Me responde rápido: quanto tempo dura um Orb de Time?",
      "VOCÊ: Três horas, time todo ganhando EXP.",
      "SAN: ...Eu não te contei isso ainda. Você já fez isso antes, não fez?",
      "SAN: Quer saber? Toma um Orb de Time. Se você já sabe usar, ótimo. Se não sabe... você vai lembrar.",
    ],
    objective: { kind: "capture", count: 3 }, objectiveLabel: "Capture 3 Pokémon",
    reward: [{ kind: "item", itemId: "orb_team", qty: 1 }],
  },
  {
    id: "san4", npc: "san", title: "A primeira lembrança",
    lines: [
      "SAN: Caiu do meu bolso junto com o troco. Lê.",
      "FRAGMENTO: “Quando chegar a hora, vocês terão que escolher.”",
      "SAN: Escolher o quê?",
      "O papel se desfez em poeira azul.",
      "SAN: ...Você sabe. Não sabe?",
    ],
    choices: [
      { id: "sei", label: "😶 “Eu... acho que sei”", reply: "SAN: Então quando chegar a hora, me lembra. Porque eu vou esquecer. Eu sempre esqueço." },
      { id: "naosei", label: "🤷 “Não faço ideia”", reply: "SAN: Ótimo. Dois confusos é melhor que um. Anota isso aí na cabeça." },
    ],
    objective: { kind: "talk" }, objectiveLabel: "Enfrente o mistério com San",
    reward: [{ kind: "item", itemId: "orb_xp_minor", qty: 1 }],
  },
  // ================= NANIZINHA 9–12 =================
  {
    id: "nani1", npc: "nanizinha", title: "Você comeu?",
    lines: [
      "NANIZINHA: Você comeu hoje?",
      "VOCÊ: Comi.",
      "NANIZINHA: Quando?",
      "VOCÊ: ...",
      "NANIZINHA: Foi o que eu pensei. Come alguma coisa AGORA e me mostra a barriga cheia. Toma duas frutas, por conta da casa.",
    ],
    objective: { kind: "feed_trainer", count: 1 }, objectiveLabel: "Use 1 comida (mochila)",
    reward: [{ kind: "item", itemId: "fruta", qty: 2 }],
  },
  {
    id: "nani2", npc: "nanizinha", title: "A cozinha virou um desastre",
    lines: [
      "NANIZINHA: NÃO OLHA PRA COZINHA! ...Olhou, né?",
      "VOCÊ: Tem um Pidgey comendo meu... quer dizer, SEU bolo.",
      "NANIZINHA: Ele disse que pagaria com... nada. Ele é um Pidgey. Expulsa uns selvagens daqui de perto pra eu fechar a janela em paz!",
    ],
    objective: { kind: "kill", count: 6 }, objectiveLabel: "Derrote 6 Pokémon selvagens",
    reward: [{ kind: "item", itemId: "suco", qty: 2 }],
  },
  {
    id: "nani3", npc: "nanizinha", title: "Leva isso",
    lines: [
      "NANIZINHA: Toma. Uma refeição completa, feita agora.",
      "VOCÊ: Pra comer agora?",
      "NANIZINHA: Não. Pra GUARDAR. Um dia você vai estar longe, com fome, e vai lembrar de mim. Isso não é comida. É... garantia.",
    ],
    objective: { kind: "talk" }, objectiveLabel: "Receba a refeição",
    reward: [{ kind: "item", itemId: "refeicao", qty: 1 }],
  },
  {
    id: "nani4", npc: "nanizinha", title: "Eu preparei isso antes de te conhecer",
    lines: [
      "NANIZINHA: ...Essa marmita aqui tá com seu nome. Eu escrevi ontem.",
      "VOCÊ: A gente se conheceu hoje.",
      "NANIZINHA: Eu sei. E mesmo assim eu escrevi. Minha mão sabia antes de mim.",
      "NANIZINHA: Aliás, seu Pokémon tá com cara de fome. Alimenta ele na minha frente pra eu fingir que foi ideia minha.",
      "FRAGMENTO (no fundo da marmita): “Ele precisa comer antes de partir.”",
    ],
    objective: { kind: "feed_pet", count: 1 }, objectiveLabel: "Alimente seu Pokémon (morango/limão)",
    reward: [{ kind: "item", itemId: "morango", qty: 2 }],
  },
  // ================= PAYKA 13–16 =================
  {
    id: "payka1", npc: "payka", title: "Você me deve?",
    lines: [
      "PAYKA: Psiu... larga o CLT de Revoland um minuto e escuta: achei um mapa velho falando de um FÓSSIL raríssimo aqui em Florest Bone. Dizem que ele lembra... o MEW. O lendário!",
      "PAYKA: E tem boato de passagem secreta nestas bandas. Se eu achar esse fóssil, fico rico e peço demissão da vida de balcão! Se você farejar alguma pista por aí, me conta, tá? Aí a gente conversa de verdade.",
      "PAYKA: Eu tenho uma sensação estranha.",
      "VOCÊ: Qual?",
      "PAYKA: Que você já me deve dinheiro.",
      "VOCÊ: Eu nem te conheço!",
      "PAYKA: Então começamos mal. Brincadeira! ...Ou não. Derrota 5 selvagens pra mim e a gente quita essa dívida imaginária. Te pago em ouro de verdade.",
    ],
    objective: { kind: "kill", count: 5 }, objectiveLabel: "Derrote 5 Pokémon selvagens",
    reward: [{ kind: "gold", qty: 500 }],
  },
  {
    id: "payka2", npc: "payka", title: "O negócio perfeito",
    lines: [
      "PAYKA: Negócio perfeito, zero risco: você captura 2 Pokémon, eu vendo a HISTÓRIA de como capturei, e divido o lucro.",
      "VOCÊ: Isso é golpe.",
      "PAYKA: É MARKETING. Anda logo, captura 2 aí.",
    ],
    objective: { kind: "capture", count: 2 }, objectiveLabel: "Capture 2 Pokémon",
    reward: [{ kind: "gold", qty: 800 }],
  },
  {
    id: "payka3", npc: "payka", title: "Meu irmão sabe demais",
    lines: [
      "PAYKA: Entre nós... meu irmão anda falando coisas estranhas.",
      "PAYKA: Ele sabe coisas que eu NUNCA contei pra ele. Tipo... o meu esconderijo de ouro. QUE EU NUNCA CONTEI.",
      "PAYKA: Fica de olho na Pan por mim? E se ela perguntar, eu nunca tive esconderijo nenhum.",
    ],
    objective: { kind: "talk" }, objectiveLabel: "Ouça Payka",
    reward: [{ kind: "gold", qty: 500 }],
  },
  {
    id: "payka4", npc: "payka", title: "Eu lembro de você",
    lines: [
      "PAYKA: ...Eu lembro de você.",
      "VOCÊ: A gente se conheceu essa semana.",
      "PAYKA: Não. De ANTES. De um lugar com cheiro de chuva e uma porta barulhenta.",
      "PAYKA: Toma. Guarda. Se eu esquecer de você...",
      "PAYKA: Não me deixa esquecer que eu gostei de você.",
    ],
    choices: [
      { id: "jamais", label: "💛 “Jamais vou deixar”", reply: "PAYKA: ...Anotado. No coração, que é onde eu guardo as dívidas boas." },
      { id: "leve", label: "😄 “Tá dramático hoje, hein”", reply: "PAYKA: Dramático? EU? ...Tá, um pouco. Mas anota aí mesmo assim." },
    ],
    objective: { kind: "kill", count: 8 }, objectiveLabel: "Derrote 8 Pokémon selvagens",
    reward: [{ kind: "gold", qty: 1200 }],
  },
  // ================= PAN 17–20 =================
  {
    id: "pan1", npc: "pan", title: "Não conte para Payka",
    lines: [
      "PAN: Não escuta meu irmão.",
      "PAYKA (de longe): Você acabou de falar pra ele não me escutar?",
      "PAN: Sim.",
      "PAYKA: Então ele provavelmente vai escutar.",
      "PAN: ...Enfim. Eu sei de uma coisa que ele não sabe: tem ouro fácil pra quem derrota selvagens por aqui. Vai lá, e a gente divide o segredo — quer dizer, o ouro não. Só o segredo.",
    ],
    objective: { kind: "kill", count: 6 }, objectiveLabel: "Derrote 6 Pokémon selvagens",
    reward: [{ kind: "item", itemId: "potion", qty: 2 }],
  },
  {
    id: "pan2", npc: "pan", title: "A poção",
    lines: [
      "PAN: Me traz uma poção? É pra... uma emergência. Minha emergência é que meu irmão bebeu a minha.",
      "PAN: Traz UMA poção aqui e eu te dou uma coisa melhor. Palavra de irmã mais nova (que vale o dobro).",
    ],
    objective: { kind: "item", itemId: "potion", qty: 1, consume: true }, objectiveLabel: "Entregue 1 Poção",
    reward: [{ kind: "item", itemId: "revive", qty: 1 }, { kind: "gold", qty: 300 }],
  },
  {
    id: "pan3", npc: "pan", title: "Os cinco",
    lines: [
      "PAN: Vem pra Valley Plume e fala comigo aqui. É importante. E traz a cabeça aberta.",
      "PAN: Não são só eu e o Payka. São CINCO. Boby. San. Nanizinha. Payka. Pan.",
      "PAN: Todos lembrando de coisas que nunca aconteceram. Isso não é coincidência. Isso é... um padrão. E padrão é pista.",
    ],
    objective: { kind: "visit", map: "valley_plume" }, objectiveLabel: "Vá a Valley Plume e fale com Pan",
    reward: [{ kind: "gold", qty: 500 }],
  },
  {
    id: "pan4", npc: "pan", title: "Nós já fizemos isso",
    lines: [
      "PAN: Junta todo mundo na cabeça: as Pokébolas do Boby. Os Orbs do San. A comida da Nanizinha. O ouro do Payka. Minhas poções.",
      "PAN: A gente já fez isso. JUNTOS. Eu sinto o gosto dessa lembrança e nem sei explicar.",
      "PAN: Cinco começaram. Dois continuarão. Três esquecerão. ...Por que eu disse isso em voz alta?",
    ],
    choices: [
      { id: "juntos", label: "✊ “Então vamos juntos até o fim”", reply: "PAN: ...É. Até o fim. Mesmo sabendo como termina." },
      { id: "medo", label: "😟 “Isso me dá medo”", reply: "PAN: Em mim também. Medo compartilhado pesa metade. Vem." },
    ],
    objective: { kind: "talk" }, objectiveLabel: "Enfrente a verdade com Pan",
    reward: [{ kind: "item", itemId: "potion", qty: 3 }],
  },
];

export const SAGA_FINAL_ID = "final";
export const SAGA_TOTAL_STAGES = SAGA_STAGES.length; // 20

export type SagaProgress = {
  /** índice da etapa ativa (0–20). 21 = saga concluída. */
  stage: number;
  /** progresso do objetivo atual (kills/capturas/feeds). */
  count: number;
  /** etapas com recompensa já resgatada (anti-dupe). */
  claimed: Record<string, boolean>;
  /** escolhas feitas (stageId -> choiceId). */
  choices: Record<string, string>;
  /** os dois escolhidos no final. */
  chosen: SagaNpcId[];
  /** saga finalizada. */
  finished: boolean;
  /** presentes diários dos escolhidos (npcId -> timestamp). */
  giftAt: Record<string, number>;
};

export function freshSaga(): SagaProgress {
  return { stage: 0, count: 0, claimed: {}, choices: {}, chosen: [], finished: false, giftAt: {} };
}

export function activeStage(saga: SagaProgress): SagaStage | null {
  if (saga.finished || saga.stage >= SAGA_STAGES.length) return null;
  return SAGA_STAGES[saga.stage];
}

/** Diálogo dos esquecidos (pós-escolha). */
export const SAGA_FORGOTTEN_LINES: Record<SagaNpcId, string[]> = {
  boby: ["BOBY: Desculpa... nós já nos conhecemos?"],
  san: ["SAN: Eu sinto que deveria saber seu nome."],
  nanizinha: ["NANIZINHA: Eu preparei alguma coisa para você uma vez. ...Mas não lembro para quem."],
  payka: ["PAYKA: Estranho. Eu tenho certeza que já negociei com você."],
  pan: ["PAN: Você parece alguém que eu deveria conhecer."],
};

/** Diálogo dos preservados (pós-escolha). */
export const SAGA_KEPT_LINES: Record<SagaNpcId, string[]> = {
  boby: ["BOBY: E agora?", "BOBY: Agora nós lembramos por eles. Toma, umas bolas. Pra jornada."],
  san: ["SAN: E agora?", "SAN: Agora nós lembramos por eles. Toma um Orb. Você vai precisar."],
  nanizinha: ["NANIZINHA: E agora?", "NANIZINHA: Agora nós lembramos por eles. Come. Você vai precisar de força."],
  payka: ["PAYKA: E agora?", "PAYKA: Agora nós lembramos por eles. Toma esse ouro. É... investimento emocional."],
  pan: ["PAN: E agora?", "PAN: Agora nós lembramos por eles. Toma uma poção. E conta comigo."],
};

/** Presente ao conversar com escolhido (cooldown 20h, itens reais). */
export const SAGA_KEPT_GIFTS: Record<SagaNpcId, { kind: "item"; itemId: string; qty: number } | { kind: "gold"; qty: number }> = {
  boby: { kind: "item", itemId: "pokeball", qty: 5 },
  san: { kind: "item", itemId: "orb_xp_minor", qty: 1 },
  nanizinha: { kind: "item", itemId: "fruta", qty: 2 },
  payka: { kind: "gold", qty: 400 },
  pan: { kind: "item", itemId: "potion", qty: 2 },
};
export const SAGA_GIFT_COOLDOWN_MS = 20 * 60 * 60 * 1000;

/** Texto de recompensa ("+5 pokeball · +300 ouro"). */
export function sagaRewardText(reward: SagaReward[]): string {
  return reward.map((r) => (r.kind === "item" ? `+${r.qty} ${r.itemId}` : `+${r.qty} ouro`)).join(" · ");
}

/** Texto de progresso do objetivo (puro — display). */
export function sagaProgressText(
  st: SagaStage,
  sg: SagaProgress,
  items: Record<string, number>,
  here: boolean,
): string {
  const ob = st.objective;
  if (ob.kind === "kill" || ob.kind === "capture" || ob.kind === "feed_pet" || ob.kind === "feed_trainer") {
    const cur = sg.stage < SAGA_STAGES.length && SAGA_STAGES[sg.stage].id === st.id ? sg.count : 0;
    return `${Math.min(cur, ob.count)}/${ob.count}`;
  }
  if (ob.kind === "item") return `${Math.min(items[ob.itemId] ?? 0, ob.qty)}/${ob.qty} ${ob.itemId}`;
  if (ob.kind === "visit") return here ? "✓ no local" : "vá até o local";
  return "converse até o fim";
}
