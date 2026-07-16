// Sistema de Quests / Modo História — definições + persistência local.
//
// Cada quest é uma sequência de etapas (steps). Cada etapa é endereçada a um
// NPC; o jogador conversa com o NPC (ou abre o Quest Log) e clica em
// "Entregar". Se a etapa pede itens (`need`), o jogo verifica o inventário,
// consome-os e avança o step. Etapas sem `need` (entregar = receber) servem
// para o NPC dar itens ao jogador.
//
// O progresso é salvo em localStorage por jogador (chave de identidade).

export type QuestReward = {
  gold?: number;
  items?: Record<string, number>; // todos entram como `bound`
  xpBoostHours?: number; // horas de boost de XP (aplicado no handler do idle)
  message?: string;
};


export type QuestStep = {
  npc: NpcId;
  ask: string;          // texto do NPC ao abrir a quest
  need?: { item: string; qty: number };
  give?: Record<string, number>; // itens que o NPC entrega ao avançar (bound)
  reward?: QuestReward; // recompensa só do último step normalmente
};

export type Quest = {
  id: string;
  title: string;
  intro: string;
  chain: QuestStep[];
};

export type NpcId =
  | "oak"
  | "moranguinho"
  | "velhoDosMares"
  | "kurt"
  | "botanist"
  | "captainNavio"
  | "fisherman"
  | "trainerTree"
  | "mercador";

export const NPC_LABEL: Record<NpcId, string> = {
  oak: "PROF. OAK",
  moranguinho: "MORANGUINHO",
  velhoDosMares: "VELHO DOS MARES",
  kurt: "KURT",
  botanist: "BOTÂNICA",
  captainNavio: "CAPITÃO NAVIO",
  fisherman: "PESCADOR",
  trainerTree: "TREINADOR DA ÁRVORE",
  mercador: "MERCADOR",
};

// ============ Quests iniciais ============
export const QUESTS: Quest[] = [
  {
    id: "ash_first",
    title: "O Primeiro de Ash",
    intro: "Oak quer relembrar qual foi o primeiro Pokémon que Ash capturou.",
    chain: [
      {
        npc: "oak",
        ask: "Você lembra qual foi o primeiro Pokémon que Ash capturou? Traga um Pikachu pra mim ver.",
        need: { item: "pet:pikachu", qty: 1 },
        reward: { gold: 200, items: { event_box: 1 }, message: "Oak: Era esse mesmo! Tome, uma caixa de evento e 200 gold." },
      },
    ],
  },
  {
    id: "doce_floresta",
    title: "Doçura da Floresta",
    intro: "Moranguinho precisa de morangos pra sua receita secreta.",
    chain: [
      {
        npc: "moranguinho",
        ask: "Estou sem morangos! Plante e colha umas árvores pra mim — preciso de 3 morangos.",
        give: { fruta_morango: 1 },
      },
      {
        npc: "moranguinho",
        ask: "Trouxe os 3 morangos? Entrega aqui!",
        need: { item: "fruta_morango", qty: 3 },
        reward: { items: { event_box: 1 }, message: "Moranguinho: Que delícia! Pegue essa caixa de evento." },
      },
    ],
  },
  {
    id: "limonada_velho",
    title: "Limonada do Velho",
    intro: "O Velho dos Mares quer uma limonada cítrica.",
    chain: [
      {
        npc: "velhoDosMares",
        ask: "Faz tempo que não tomo limonada... me traz 2 limões dourados, jovem!",
        need: { item: "fruta_limao", qty: 2 },
        reward: { items: { event_box: 1, fish_bait: 5 }, message: "Velho: Ahhh! Pegue uma caixa e algumas iscas." },
      },
    ],
  },
  {
    id: "madeira_kurt",
    title: "Madeira para Kurt",
    intro: "Kurt está sem material pra fazer Pokébolas.",
    chain: [
      {
        npc: "kurt",
        ask: "Preciso de 5 toras de lenha pra terminar uma fornada de bolas. Consegue?",
        need: { item: "lenha", qty: 5 },
        reward: { items: { event_box: 2 }, message: "Kurt: Bom trabalho. Leve as caixas." },
      },
    ],
  },
  {
    id: "botanica",
    title: "Botânica",
    intro: "A Botânica troca ervas por frutas raras.",
    chain: [
      {
        npc: "botanist",
        ask: "Me traga 3 bagas rosa que eu te dou frutas raras em troca.",
        need: { item: "fruta_rosa", qty: 3 },
        reward: { items: { fruta_morango: 2, fruta_limao: 2, event_box: 1 }, message: "Botânica: Excelente! Pegue morangos, limões e uma caixa." },
      },
    ],
  },
  {
    id: "pescaria_capitao",
    title: "Pescaria de Capitão",
    intro: "O Capitão Navio quer provar que ainda é o melhor pescador.",
    chain: [
      {
        npc: "captainNavio",
        ask: "Me traga 4 bagas azuis (servem de isca de luxo). Quero superar minha marca!",
        need: { item: "fruta_azul", qty: 4 },
        reward: { items: { event_box: 1 }, message: "Capitão: Marinheiro! Sua caixa de evento, bem merecida." },
      },
    ],
  },

  // ============ QUESTS DIFÍCEIS DE CAPTURA (+2h de XP boost cada) ============
  {
    id: "hard_oddish_hunter",
    title: "★ Caçador de Oddish",
    intro: "A Botânica precisa estudar 20 Oddish.",
    chain: [
      {
        npc: "botanist",
        ask: "Capture 20 Oddish. Quero estudar cada folhinha!",
        need: { item: "pet:oddish", qty: 20 },
        reward: { gold: 3000, xpBoostHours: 2, items: { event_box: 1 }, message: "Botânica: Impressionante! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_pidgey_flock",
    title: "★ Bando de Pidgey",
    intro: "Oak quer mapear uma revoada.",
    chain: [
      {
        npc: "oak",
        ask: "Capture 20 Pidgey — preciso rastrear a rota migratória.",
        need: { item: "pet:pidgey", qty: 20 },
        reward: { gold: 3200, xpBoostHours: 2, items: { event_box: 1 }, message: "Oak: Excelente coleta! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_rattata_plague",
    title: "★ Praga de Rattata",
    intro: "Moranguinho reclama de Rattata invadindo a horta.",
    chain: [
      {
        npc: "moranguinho",
        ask: "Capture 25 Rattata pra me livrar da praga!",
        need: { item: "pet:rattata", qty: 25 },
        reward: { gold: 3500, xpBoostHours: 2, items: { event_box: 1 }, message: "Moranguinho: Salvou minha horta! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_caterpie_silk",
    title: "★ Coleta de Seda",
    intro: "Kurt quer fibras de Caterpie pra novas pokébolas.",
    chain: [
      {
        npc: "kurt",
        ask: "Capture 20 Caterpie — vou extrair seda pras minhas bolas.",
        need: { item: "pet:caterpie", qty: 20 },
        reward: { gold: 3000, xpBoostHours: 2, items: { event_box: 1 }, message: "Kurt: Fio perfeito! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_weedle_venom",
    title: "★ Ferrão Venenoso",
    intro: "A Botânica pesquisa antídotos com Weedle.",
    chain: [
      {
        npc: "botanist",
        ask: "Capture 20 Weedle — o veneno vira antídoto no laboratório.",
        need: { item: "pet:weedle", qty: 20 },
        reward: { gold: 3000, xpBoostHours: 2, items: { event_box: 1 }, message: "Botânica: Toxina rara! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_zubat_swarm",
    title: "★ Enxame de Zubat",
    intro: "O Velho dos Mares perdeu a paciência com Zubats na gruta.",
    chain: [
      {
        npc: "velhoDosMares",
        ask: "Capture 25 Zubat! Não aguento mais essas asas na cara.",
        need: { item: "pet:zubat", qty: 25 },
        reward: { gold: 3500, xpBoostHours: 2, items: { event_box: 1 }, message: "Velho: FINALMENTE! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_pikachu_squad",
    title: "★ Esquadrão Pikachu",
    intro: "O Treinador da Árvore quer um esquadrão elétrico.",
    chain: [
      {
        npc: "trainerTree",
        ask: "Capture 10 Pikachu — quero ver o poder elétrico completo!",
        need: { item: "pet:pikachu", qty: 10 },
        reward: { gold: 5000, xpBoostHours: 2, items: { event_box: 2 }, message: "Treinador: CHOCANTE! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_magikarp_farm",
    title: "★ Fazenda de Magikarp",
    intro: "O Capitão Navio jura que Magikarp vira lenda.",
    chain: [
      {
        npc: "captainNavio",
        ask: "Capture 30 Magikarp! Um deles vai virar Gyarados, marinheiro.",
        need: { item: "pet:magikarp", qty: 30 },
        reward: { gold: 4000, xpBoostHours: 2, items: { event_box: 1 }, message: "Capitão: Marinheiro lendário! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_geodude_quarry",
    title: "★ Pedreira de Geodude",
    intro: "Kurt precisa de rochas vivas.",
    chain: [
      {
        npc: "kurt",
        ask: "Capture 15 Geodude — quero forjar bolas de pedra!",
        need: { item: "pet:geodude", qty: 15 },
        reward: { gold: 4000, xpBoostHours: 2, items: { event_box: 1 }, message: "Kurt: Pedra dos deuses! +2h XP!" },
      },
    ],
  },
  {
    id: "hard_eevee_squad",
    title: "★ Colecionador de Eevee",
    intro: "Oak estuda as evoluções múltiplas.",
    chain: [
      {
        npc: "oak",
        ask: "Capture 8 Eevee — cada um pode virar algo diferente!",
        need: { item: "pet:eevee", qty: 8 },
        reward: { gold: 6000, xpBoostHours: 2, items: { event_box: 2 }, message: "Oak: Descoberta épica! +2h XP!" },
      },
    ],
  },
];



// ============ Progresso ============
type ProgressMap = Record<string, number | "done">;
const STORAGE_KEY = "rubym.quests.v1";

export function loadQuestProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
export function saveQuestProgress(p: ProgressMap) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function getStepIndex(questId: string): number | "done" {
  const p = loadQuestProgress();
  if (p[questId] === undefined) return 0; // disponível, começando no step 0
  return p[questId];
}

export function setStepIndex(questId: string, idx: number | "done") {
  const p = loadQuestProgress();
  p[questId] = idx;
  saveQuestProgress(p);
}

export function currentStep(quest: Quest): QuestStep | null {
  const idx = getStepIndex(quest.id);
  if (idx === "done") return null;
  return quest.chain[idx] ?? null;
}

export function questsForNpc(npc: NpcId): { quest: Quest; step: QuestStep }[] {
  const out: { quest: Quest; step: QuestStep }[] = [];
  for (const q of QUESTS) {
    const s = currentStep(q);
    if (s && s.npc === npc) out.push({ quest: q, step: s });
  }
  return out;
}

export function activeQuestsCount(): number {
  return QUESTS.filter((q) => getStepIndex(q.id) !== "done").length;
}

export function isQuestDone(questId: string): boolean {
  return getStepIndex(questId) === "done";
}

// Avança o quest. Retorna o reward do step atual (se houver) e flag se finalizou.
export function advanceQuestStep(questId: string): { reward?: QuestReward; finished: boolean; give?: Record<string, number> } {
  const q = QUESTS.find((x) => x.id === questId);
  if (!q) return { finished: false };
  const idx = getStepIndex(questId);
  if (idx === "done") return { finished: true };
  const step = q.chain[idx];
  const next = idx + 1;
  if (next >= q.chain.length) {
    setStepIndex(questId, "done");
    return { reward: step.reward, give: step.give, finished: true };
  }
  setStepIndex(questId, next);
  return { reward: step.reward, give: step.give, finished: false };
}
