import type { Species } from "@/game/systems";

export type CaptureQuestDef = {
  id: string;
  species: Species;
  map: string;
  level: string;
  chance: string;
  title: string;
};

/** 20 missões individuais de captura. Mapa/nível/chance são a dica de onde achar. */
export const CAPTURE_QUESTS: CaptureQuestDef[] = [
  { id: "cq01", species: "bulbasaur", map: "01", level: "8", chance: "1%", title: "O Guardião Verde" },
  { id: "cq02", species: "pikachu", map: "01", level: "5–8", chance: "2%", title: "Energia Perdida" },
  { id: "cq03", species: "charmander", map: "02", level: "18", chance: "0,5%", title: "A Última Chama" },
  { id: "cq04", species: "eevee", map: "02", level: "16–18", chance: "1,5%", title: "As Três Evoluções" },
  { id: "cq05", species: "squirtle", map: "03", level: "28", chance: "1%", title: "O Pequeno Marinheiro" },
  { id: "cq06", species: "abra", map: "03", level: "24–27", chance: "3%", title: "Mestre do Teleporte" },
  { id: "cq07", species: "growlithe", map: "03", level: "22–26", chance: "8%", title: "Companheiro Leal" },
  { id: "cq08", species: "scyther", map: "04", level: "35–38", chance: "2,5%", title: "A Lâmina Selvagem" },
  { id: "cq09", species: "pinsir", map: "04", level: "35–38", chance: "2,5%", title: "O Rei dos Insetos" },
  { id: "cq10", species: "kangaskhan", map: "04", level: "38", chance: "1%", title: "Instinto Materno" },
  { id: "cq11", species: "gengar", map: "05", level: "46–48", chance: "3%", title: "A Sombra Perdida" },
  { id: "cq12", species: "alakazam", map: "05", level: "48", chance: "2%", title: "Poder da Mente" },
  { id: "cq13", species: "ditto", map: "05", level: "44–47", chance: "5%", title: "O Impostor" },
  { id: "cq14", species: "snorlax", map: "06", level: "60", chance: "1%", title: "O Gigante Adormecido" },
  { id: "cq15", species: "arcanine", map: "06", level: "54–58", chance: "6%", title: "A Fera Flamejante" },
  { id: "cq16", species: "dratini", map: "06", level: "55–59", chance: "4%", title: "O Dragão Perdido" },
  { id: "cq17", species: "dragonair", map: "06", level: "58–60", chance: "2%", title: "A Serpente Celestial" },
  { id: "cq18", species: "lapras", map: "07", level: "75", chance: "2%", title: "A Canção Glacial" },
  { id: "cq19", species: "gyarados", map: "08", level: "84–88", chance: "5%", title: "A Fúria dos Mares" },
  { id: "cq20", species: "dragonite", map: "08", level: "88–90", chance: "1%", title: "O Último Dragão" },
];

export type CaptureChestKind = "green" | "epic";

export type CaptureQuestProgress = {
  completed?: string[];
  milestones?: number[];
  /** Grupos de 3 missões já convertidos em ticket da Nevezinha. */
  ticketGroups?: number;
  /** Caixas de brinde já abertas (ids `chest_5`, `chest_10`, ...). */
  openedChests?: string[];
};

/** Uma caixa de brinde a cada 5 missões: verde nos ímpares e épica nos pares. */
export const CAPTURE_QUEST_CHESTS: { at: number; kind: CaptureChestKind }[] = [
  { at: 5, kind: "green" },
  { at: 10, kind: "epic" },
  { at: 15, kind: "green" },
  { at: 20, kind: "epic" },
];

export type CaptureChestView = {
  id: string;
  at: number;
  kind: CaptureChestKind;
  opened: boolean;
  ready: boolean;
};

export type CaptureChestReward = {
  itemId: string | null;
  qty: number;
  label: string;
  /** Ticket não entra na mochila: é somado no evento da Nevezinha. */
  ticket?: boolean;
  chestKind: CaptureChestKind;
};

const STONE_IDS = [
  "stone_grass", "stone_fire", "stone_water",
  "stone_electric", "stone_dark", "stone_dragon",
] as const;

const STONE_NAMES: Record<string, string> = {
  stone_grass: "Planta",
  stone_fire: "Fogo",
  stone_water: "Água",
  stone_electric: "Elétrica",
  stone_dark: "Sombria",
  stone_dragon: "Dracônica",
};

type ChestPoolEntry = {
  itemId: string | null;
  min: number;
  max: number;
  weight: number;
  label: string;
  ticket?: boolean;
  stone?: boolean;
};

const GREEN_CHEST_POOL: ChestPoolEntry[] = [
  { itemId: "potion", min: 20, max: 40, weight: 34, label: "{qty} Poções" },
  { itemId: null, min: 1, max: 2, weight: 28, label: "{qty} Pedra(s) Elemental(is)", stone: true },
  { itemId: "morango", min: 20, max: 50, weight: 14, label: "{qty} Morangos" },
  { itemId: null, min: 1, max: 1, weight: 14, label: "{qty} tiro da Nevezinha", ticket: true },
  { itemId: "emerald_egg", min: 1, max: 1, weight: 7, label: "1 Ovo Emerald" },
  { itemId: "carta_montaria", min: 1, max: 1, weight: 3, label: "1 Carta Montaria (24h)" },
];

const EPIC_CHEST_POOL: ChestPoolEntry[] = [
  { itemId: "potion", min: 50, max: 100, weight: 22, label: "{qty} Poções" },
  { itemId: null, min: 2, max: 4, weight: 22, label: "{qty} Pedra(s) Elemental(is)", stone: true },
  { itemId: "morango", min: 50, max: 100, weight: 12, label: "{qty} Morangos" },
  { itemId: null, min: 1, max: 1, weight: 20, label: "{qty} tiro da Nevezinha", ticket: true },
  { itemId: "emerald_egg", min: 1, max: 1, weight: 14, label: "1 Ovo Emerald" },
  { itemId: "carta_montaria", min: 1, max: 1, weight: 10, label: "1 Carta Montaria (24h)" },
];

/** Lista as 4 caixas, marcando quais já podem ser abertas. */
export function captureQuestChests(progress: CaptureQuestProgress | null | undefined): CaptureChestView[] {
  const count = captureQuestCount(progress);
  const opened = new Set(progress?.openedChests ?? []);
  return CAPTURE_QUEST_CHESTS.map((chest) => {
    const id = `chest_${chest.at}`;
    return {
      id,
      at: chest.at,
      kind: chest.kind,
      opened: opened.has(id),
      ready: count >= chest.at && !opened.has(id),
    };
  });
}

/** Sorteia o conteúdo de uma caixa. `random` é injetável para testes. */
export function rollCaptureChest(
  kind: CaptureChestKind,
  random: () => number = Math.random,
): CaptureChestReward {
  const pool = kind === "epic" ? EPIC_CHEST_POOL : GREEN_CHEST_POOL;
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;
  let picked = pool[pool.length - 1];
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll < 0) { picked = entry; break; }
  }
  const itemId = picked.stone
    ? STONE_IDS[Math.min(STONE_IDS.length - 1, Math.floor(random() * STONE_IDS.length))]
    : picked.itemId;
  const qty = picked.min + Math.floor(random() * (picked.max - picked.min + 1));
  const label = picked.stone
    ? `${qty} ${qty === 1 ? "Pedra Elemental" : "Pedras Elementais"} (${STONE_NAMES[itemId ?? ""] ?? "Elemental"})`
    : picked.label.replace("{qty}", String(qty));
  return { itemId, qty, label, ticket: picked.ticket, chestKind: kind };
}

/** Abre uma caixa pronta e devolve o prêmio sorteado + o novo progresso. */
export function openCaptureQuestChest(
  progress: CaptureQuestProgress | null | undefined,
  chestId: string,
  random: () => number = Math.random,
): { progress: CaptureQuestProgress; reward: CaptureChestReward } | null {
  const chest = captureQuestChests(progress).find((item) => item.id === chestId);
  if (!chest || !chest.ready) return null;
  const openedChests = [...(progress?.openedChests ?? []), chest.id];
  return {
    progress: { ...(progress ?? {}), openedChests },
    reward: rollCaptureChest(chest.kind, random),
  };
}

export type CaptureQuestMilestone = {
  at: number;
  label: string;
  items: Record<string, number>;
};

export const CAPTURE_QUEST_MILESTONES: CaptureQuestMilestone[] = [
  { at: 5, label: "Pacote 05", items: { cr_red: 5, potion: 50, greatball: 10 } },
  { at: 10, label: "Pacote 10", items: { cr_red: 10, potion: 100, ultraball: 10, orb_xp_minor: 1 } },
  { at: 15, label: "Pacote 15", items: { cr_red: 15, potion: 150, rare_candy: 2, orb_xp_major: 1 } },
  { at: 20, label: "Pacote 20", items: { cr_red: 30, potion: 200, masterball: 1, orb_xp_supreme: 1 } },
];

export function captureQuestCount(progress: CaptureQuestProgress | null | undefined): number {
  return new Set(progress?.completed ?? []).size;
}

/**
 * Marca a captura da espécie e libera os pacotes de 5/10/15/20.
 * Retorna os itens que devem ser somados ao save e o novo progresso.
 */
export function applyCaptureQuest(
  progress: CaptureQuestProgress | null | undefined,
  species: string,
): { progress: CaptureQuestProgress; completedNow: CaptureQuestDef[]; rewards: CaptureQuestMilestone[]; tickets: number } {
  const completed = new Set(progress?.completed ?? []);
  const completedNow: CaptureQuestDef[] = [];
  for (const quest of CAPTURE_QUESTS) {
    if (quest.species === species && !completed.has(quest.id)) {
      completed.add(quest.id);
      completedNow.push(quest);
    }
  }
  const milestones = new Set(progress?.milestones ?? []);
  const rewards = CAPTURE_QUEST_MILESTONES.filter(
    (milestone) => completed.size >= milestone.at && !milestones.has(milestone.at),
  );
  for (const reward of rewards) milestones.add(reward.at);
  const groups = Math.floor(completed.size / 3);
  const previousGroups = progress?.ticketGroups ?? 0;
  const tickets = Math.max(0, groups - previousGroups);
  const ticketGroups = Math.max(previousGroups, groups);
  const changed = completedNow.length > 0 || rewards.length > 0 || tickets > 0;
  return {
    progress: changed
      ? {
          completed: [...completed],
          milestones: [...milestones],
          ticketGroups,
          openedChests: progress?.openedChests ?? [],
        }
      : (progress ?? {}),
    completedNow,
    rewards,
    tickets,
  };
}
