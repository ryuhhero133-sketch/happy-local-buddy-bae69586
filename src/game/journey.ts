export const JOURNEY_VERSION = "emerald_journey_v1";
export const JOURNEY_TEMPLE = "bobo_t2";
export const JOURNEY_DESTINATION = "emerald";
export const JOURNEY_ARRIVAL = { x: 768, y: 512 };

export function journeyAwardStars(level: number): number {
  return level >= 300 ? 4 : level >= 150 ? 2 : level >= 100 ? 1 : 0;
}

export type JourneyLine = { scene: number; speaker: string; text: string; silence?: boolean };
// Transcrição do arquivo TEXTO DAS FALAS.txt. O trecho final sem cabeçalho
// pertence à imagem 7. Não inclui instruções de palco como fala do professor.
const story: Array<{ scene: number; lines: Array<[string, string, boolean?]> }> = [
  { scene: 1, lines: [
    ["Professor", "Hahaha! Finalmente chegou, jovem aventureiro! Estava ansioso para conhecê-lo!"],
    ["Professor", "Imagino que esteja sonhando em capturar criaturas lendárias, conquistar insígnias e se tornar um grande mestre, não é?"],
    ["Professor", "Pois saiba que este mundo é muito maior do que qualquer coisa que você já tenha imaginado!"],
    ["Professor", "E hoje você terá o privilégio de conhecer uma descoberta que poderá mudar para sempre a história dos treinadores!"],
  ] },
  { scene: 2, lines: [
    ["Professor", "Observe atentamente! Está vendo essas esferas?"],
    ["Professor", "Nós as chamamos de Black Mitic Balls. Durante anos, acreditamos que fossem apenas uma lenda."],
    ["Professor", "Elas são capazes de capturar criaturas que possuem uma manifestação de poder completamente desconhecida!"],
    ["Professor", "Hahaha! Imagine descobrir uma criatura que ainda nem foi registrada na Pokédex!"],
    ["Professor", "E o mais extraordinário é que qualquer treinador poderá encontrar uma dessas esferas. Inclusive você!"],
  ] },
  { scene: 3, lines: [
    ["Professor", "Recentemente, descobrimos que essa energia também reage a determinados ovos. Se minhas pesquisas estiverem corretas..."],
    ["Jogador", "Professor?"],
    ["Professor", "Sim, jovem? Ficou com alguma dúvida?"],
    ["Jogador", "Quem são aqueles seres atrás de você?"],
    ["Professor", "Atrás de mim? Como assim?"],
    ["Narração", "O professor interrompe sua explicação. A música para.", true],
    ["Professor", "Ora... Eu não estava esperando mais ninguém hoje.", true],
  ] },
  { scene: 4, lines: [
    ["Professor", "Esperem... Essas vestimentas..."],
    ["Professor", "Sacerdotes da Ordem Ancestral?! O que estão fazendo aqui?"],
    ["Sacerdote", "Afaste-se da maleta, professor."],
    ["Professor", "Como ousam?! Essas esferas estão sob minha proteção!"],
    ["Sacerdote", "Não nos obrigue a repetir."],
    ["Professor", "Quem autorizou vocês a entrarem neste lugar?!"],
    ["Sacerdote", "A filha do Sacerdote Ancestral."],
    ["Professor", "Lyra?! Mas isso é impossível!"],
  ] },
  { scene: 5, lines: [
    ["Sacerdote", "Entregue as Black Mitic Balls. Agora!"],
    ["Professor", "Vocês não fazem ideia do que estão tentando despertar!"],
    ["Sacerdote", "Sabemos muito mais do que o senhor imagina."],
    ["Professor", "Jovem! Afaste-se imediatamente!"],
    ["Jogador", "Professor!"],
    ["Narração", "Um clarão roxo toma conta da tela. O impacto faz o cenário tremer."],
    ["Professor", "ARGH! A maleta... Não deixem que levem a maleta!"],
    ["Sacerdote", "Temos as esferas. Vamos embora!"],
  ] },
  { scene: 6, lines: [
    ["Narração", "Uma das esferas começa a pulsar violentamente dentro da maleta."],
    ["Sacerdote", "O que está acontecendo?!"],
    ["Segundo sacerdote", "A energia está fora de controle!"],
    ["Sacerdote", "Feche a maleta! FECHE A MALETA!"],
    ["Narração", "Uma explosão de energia ilumina o santuário. A tela fica completamente branca."],
    ["Professor", "Não... Isso não pode estar acontecendo..."],
    ["Jogador", "Professor, você está bem?!"],
    ["Professor", "As esferas... Desapareceram!"],
    ["Professor", "Jovem, escute-me atentamente. Se aquela energia as espalhou pelo continente, elas podem estar em absolutamente qualquer lugar."],
    ["Professor", "E se Lyra encontrá-las antes de nós... temo que esta seja a última geração de treinadores que conheceremos."],
  ] },
  { scene: 7, lines: [
    ["Sacerdote", "Hahaha! Então você é o pequeno aventureiro que pretende mudar o destino deste continente?"],
    ["Sacerdote", "Escute meu conselho: esqueça as Black Mitic Balls. Não procure respostas, não desafie os ginásios e muito menos tente conquistar as insígnias."],
    ["Jogador", "Por que está tão preocupado com alguém que acabou de começar?"],
    ["Sacerdote", "Preocupado? Hahaha! Você não passa de mais um sonhador carregando uma Pokébola. Existem poderes neste mundo que jamais estarão ao seu alcance."],
    ["Jogador", "Todo mestre já carregou uma primeira Pokébola. A diferença é que alguns tiveram coragem de continuar."],
    ["Sacerdote", "Você realmente acredita que pode se tornar alguém importante?"],
    ["Jogador", "Não preciso que você acredite em mim. Essa jornada é minha, não sua."],
    ["Sacerdote", "Então caminhe em direção à sua própria ruína, pequeno treinador. Quando possuir as oito insígnias, talvez eu me lembre do seu rosto."],
    ["Jogador", "Não se preocupe em lembrar do meu rosto... Quando esse dia chegar, você conhecerá o meu nome."],
  ] },
];

// Páginas curtas cabem na moldura também no celular deitado. Cada página
// tem um cursor próprio no servidor: F5 nunca pula uma imagem/fala pendente.
export function dialoguePages(text: string, maxLength = 135): string[] {
  const pages: string[] = [];
  let page = "";
  for (const word of text.split(/\s+/)) {
    if (page && page.length + word.length + 1 > maxLength) { pages.push(page); page = ""; }
    page += (page ? " " : "") + word;
  }
  if (page) pages.push(page);
  return pages;
}
export const JOURNEY_LINES: JourneyLine[] = story.flatMap(({ scene, lines }) =>
  lines.flatMap(([speaker, text, silence]) => dialoguePages(text).map((page) => ({ scene, speaker, text: page, silence }))));
