// ============================================================
// QUEST DO ASPECTRO — A Ember da Trinite Desapareceu (10 encontros)
// Roteiro completo, preservado na íntegra: cada retorno = 1 revelação
// + 1 pergunta nova + 1 missão. Nunca tudo de uma vez.
// Etapas (aspectroStage): 0 = nunca falou ... 10 = encontro final,
// 11 = concluída. Passos: npc (barra roxa) / player (botão de pergunta)
// / pause (suspense). Botões de quest só aparecem no ÚLTIMO passo.
// ============================================================

export type AspectroStep = {
  who: "npc" | "player" | "pause";
  text: string;
};

export const ASPECTRO_ELEM_NOUN: Record<string, string> = {
  fire: "fogo",
  water: "água",
  grass: "planta",
  electric: "o raio",
  poison: "veneno",
  psychic: "a mente",
  ice: "o gelo",
  rock: "pedra",
  fighting: "punhos",
  flying: "asas",
  normal: "o comum",
};

export const ASPECTRO_ELEM_LINE: Record<string, string> = {
  fire: "Interessante. Vocês humanos olham para o fogo e enxergam destruição. Eu enxergo transformação. O fogo destrói. Mas também permite que algo novo exista. Talvez o problema nunca tenha sido o fogo. Talvez tenha sido... quem decidiu acendê-lo.",
  water: "A água não discute com a pedra. Ela espera. E um dia... a pedra cede. O que será que a Trinite está esperando?",
  grass: "Ela cresce no escuro sem pedir licença. A vida sempre encontra um jeito de continuar. Mesmo quando tentam apagá-la.",
  electric: "Rápido demais para segurar, forte demais para ignorar. Alguém um dia tentou guardar energia assim. E guardar demais... cobra um preço.",
  poison: "Pequeno, silencioso, paciente. As coisas mais perigosas deste mundo não são as maiores. Lembre disso.",
  psychic: "Ela vê sem olhos e toca sem mãos. Cuidado: algumas coisas percebem quando são percebidas.",
  ice: "O gelo preserva o que o tempo quer levar. Talvez a Trinite esteja... preservada. Em algum lugar frio.",
  rock: "Ela estava aqui antes de você. Estará aqui depois. As pedras guardam memórias mais antigas que qualquer treinador.",
  fighting: "Força resolve batalhas. Mas me diga... quem decide quais batalhas valem a pena?",
  flying: "Ver o mundo de cima muda tudo. Um dia você vai entender por que alguns preferem observar de longe.",
  normal: "O comum. E é exatamente isso que me intriga: o comum esconde o extraordinário melhor que qualquer sombra.",
};

const N = (text: string): AspectroStep => ({ who: "npc", text });
const P = (text: string): AspectroStep => ({ who: "player", text });
const PAUSE: AspectroStep = { who: "pause", text: "..." };

export function aspectroSteps(stage: number, element: string): AspectroStep[] {
  const noun = ASPECTRO_ELEM_NOUN[element] ?? ASPECTRO_ELEM_NOUN.normal;
  const elemLine = ASPECTRO_ELEM_LINE[element] ?? ASPECTRO_ELEM_LINE.normal;
  switch (stage) {
    case 0:
      return [
        N("Você finalmente chegou."),
        P("Quem é você?"),
        N("Essa é uma pergunta interessante. Mas antes... quem é você?"),
        P("Eu sou um treinador."),
        N("Não. Isso é o que você faz. Eu perguntei quem você é."),
        PAUSE,
        N("Você entrou neste mundo... recebeu um corpo... recebeu Pokémon... recebeu energia... e começou a obedecer às regras. Mas você nunca perguntou quem escreveu essas regras."),
        P("O que você quer?"),
        N("Encontrar algo."),
        P("O quê?"),
        N("A EMBER DA TRINITE. Ela desapareceu."),
        P("E você sabe onde ela está?"),
        N("Se eu soubesse... você acha que ainda estaria aqui?"),
        N("MISSÃO 1 — Encontre o primeiro vestígio da Trinite. Traga-me 1 FLOR."),
      ];
    case 1:
      return [
        N("O primeiro vestígio. Traga-me 1 FLOR — plantas e insetos costumam derrubá-las."),
        N("Sem o vestígio, não há próxima verdade. Vá."),
      ];
    case 2:
      return [
        N("Você voltou."),
        N(`E trouxe ${noun}.`),
        N(elemLine),
        P("O que isso tem a ver com a Trinite?"),
        N("Ainda nada. Você quer respostas rápido demais. Vá. Aprenda sobre o elemento que carrega. Depois volte."),
        N("MISSÃO 2 — Derrote 30 Pokémon e traga 1 CHICOTE."),
      ];
    case 3:
      return [
        P("Voltei."),
        N("Eu sei."),
        P("Como?"),
        N("Porque você ainda está aqui."),
        PAUSE,
        N("Posso lhe mostrar uma coisa."),
        P("O quê?"),
        N("Uma memória."),
        P("Quanto custa?"),
        N("Finalmente. Você começou a entender."),
        N("CUSTO: 30 de ENERGIA do treinador."),
      ];
    case 4:
      return [
        P("Você disse que não estava pronto."),
        N("Agora talvez esteja. Você quer saber quem eu sou?"),
        P("Sim."),
        N("Então não espere encontrar um nome. Eu não nasci. Eu fui criado."),
        PAUSE,
        N("Eu vim de um tempo que ainda não chegou. Fui criado por humanos. Não para proteger. Não para viver. Não para amar. Fui criado para destruir."),
        P("Destruir o quê?"),
        N("Universos."),
        N("Mas isso é tudo que você saberá hoje."),
        P("Por quê?!"),
        N("Porque algumas verdades... quando descobertas cedo demais... deixam de ser verdade."),
        N("MISSÃO 4 — Encontre uma estrutura de tecnologia antiga. Traga 1 SUCATA."),
      ];
    case 5:
      return [
        N("Então você encontrou."),
        P("O que é isso?"),
        N("A prova de que eu não pertenço a este tempo."),
        P("Quem criou você?"),
        N("Humanos."),
        P("E quem salvou você?"),
        PAUSE,
        N("RYUH."),
        P("O Dr. Ryuh?"),
        N("O Mestre dos Elementos. Ele poderia ter me destruído. Mas não destruiu."),
        P("Por quê?"),
        N("Porque ele percebeu algo que meus criadores não perceberam: uma criatura não precisa permanecer aquilo para o qual foi criada."),
        N("MISSÃO 5 — Investigue a Grande REVO. Derrote 50 Pokémon e traga 1 FERRO."),
      ];
    case 6:
      return [
        N("Eu não fui o único. Existiam outros. Máquinas. Clones. Seres criados para substituir o orgânico."),
        N("Humanos criaram máquinas para destruir aquilo que era vivo. E quando perceberam o que haviam criado... alguns começaram a fugir."),
        P("Para onde?"),
        N("Para a Grande REVO."),
        P("O que é a Grande REVO?"),
        N("Um refúgio. Para aqueles que não deveriam existir."),
        N("MISSÃO 6 — Derrote 60 Pokémon e traga 1 BRONZE. Vestígios contam histórias."),
      ];
    case 7:
      return [
        N("O que você encontrou?"),
        P("Mostro o que encontrei."),
        N("Interessante. Agora observe uma coisa. Observe os outros."),
        P("Outros?"),
        N("Jogadores. Você acha que eles estão apenas jogando? Alguns constroem. Alguns destroem. Alguns ajudam. Alguns enganam. Alguns acumulam. Alguns compartilham. E todos acreditam que suas escolhas desaparecem quando fecham o jogo."),
        PAUSE,
        N("Mas escolhas revelam pessoas."),
        P("Você está dizendo que existe lado certo?"),
        N("Não. Estou dizendo que... você escolhe seu lado todos os dias."),
        N("Existe uma energia que nenhuma barra mostra. A energia de uma intenção. Uma atitude. Uma escolha. Talvez seja essa energia que a Trinite esteja procurando."),
        N("MISSÃO 7 — Capture 5 Pokémon e traga 1 BUQUÊ. Escolhas também florescem."),
      ];
    case 8:
      return [
        P("E as Míticas?"),
        N("Algumas criaturas são raras porque existem poucas. Outras são raras porque o mundo tentou escondê-las."),
        P("E a Black Mítica?"),
        PAUSE,
        N("Não procure uma Black Mítica apenas pelo valor que ela possui. Pergunte primeiro... o que aconteceu para ela existir?"),
        N("MISSÃO 8 — Derrote 80 Pokémon e traga 1 PEPITA DE OURO."),
      ];
    case 9:
      return [
        P("Você sabe onde está Mewthow?"),
        N("Sim."),
        P("Onde?"),
        N("Você já esteve perto."),
        P("Onde?!"),
        N("O problema não é encontrar Mewthow. É descobrir... por que alguém fez questão de escondê-lo."),
        P("E o castelo?"),
        N("Existe. Mas não procure o castelo."),
        P("Por quê?"),
        N("Porque talvez... o castelo esteja procurando você."),
        N("MISSÃO 9 — Derrote 100 Pokémon e traga 1 PÉROLA."),
      ];
    case 10:
      return [
        P("Então onde está a Ember da Trinite?"),
        N("Agora você pode ouvir a resposta. A Ember não desapareceu."),
        PAUSE,
        N("Ela foi escondida."),
        P("Por quem?"),
        N("Essa é a pergunta que você precisa responder."),
        P("Para quê?"),
        N("Porque a Ember não é apenas poder. É uma chave."),
        P("Chave para quê?"),
        N("Para descobrir onde termina este mundo... e onde começa o outro."),
        N("Você ainda chama isso de jogo. Talvez esse seja seu primeiro erro."),
        N("Traga 1 STONE SOMBRIA. Então a verdadeira missão começa."),
      ];
    default:
      return [
        N("Você entrou procurando uma criatura. Agora está procurando respostas."),
        N("Descubra quem escondeu a Ember. E lembre-se: eu lembrarei de cada escolha sua até lá."),
      ];
  }
}
