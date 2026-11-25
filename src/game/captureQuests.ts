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

export type CaptureQuestProgress = {
  completed?: string[];
  milestones?: number[];
};

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
): { progress: CaptureQuestProgress; completedNow: CaptureQuestDef[]; rewards: CaptureQuestMilestone[] } {
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
  const changed = completedNow.length > 0 || rewards.length > 0;
  return {
    progress: changed
      ? { completed: [...completed], milestones: [...milestones] }
      : (progress ?? {}),
    completedNow,
    rewards,
  };
}
