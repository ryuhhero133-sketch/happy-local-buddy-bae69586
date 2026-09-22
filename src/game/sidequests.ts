// ============================================================
// IDLEMON REVO — QUESTS SECUNDÁRIAS (PEDIDOS dos NPCs da saga)
// ============================================================
// - Cada NPC tem um pool de pedidos; os 3 primeiros liberados, +1 por
//   estrela (máx 3 estrelas = 1 estrela a cada 5 concluídos).
// - Recompensa: 4-5 cristais + item temático (nada fácil!).
// - Repetível com cooldown de 20h por pedido.
// - Entrega SEMPRE no diálogo com o NPC (aba PEDIDOS → RECEBER).
// ============================================================

import type { SagaNpcId } from "./saga";

export type SideObjective =
  | { kind: "kill"; count: number }
  | { kind: "capture"; count: number }
  | { kind: "item"; itemId: string; qty: number; consume: boolean }
  | { kind: "feed_pet"; count: number }
  | { kind: "feed_trainer"; count: number }
  | { kind: "visit"; map: string };

export type SideQuest = {
  id: string;
  npc: SagaNpcId;
  title: string;
  desc: string;
  objective: SideObjective;
  objectiveLabel: string;
  crystals: number; // 4-5
  bonus?: { itemId: string; qty: number }[];
  /** estrelas necessárias para desbloquear (0 = base, 1-2 = extra) */
  minStars: number;
};

export const SIDEQUEST_COOLDOWN_MS = 20 * 60 * 60 * 1000;
/** 1 estrela a cada 5 concluídos, máx 3. */
export function starsFor(completed: number): number {
  return Math.max(0, Math.min(3, Math.floor(completed / 5)));
}

export const SIDE_QUESTS: SideQuest[] = [
  // ================= BOBY (bolas & captura) =================
  { id: "boby_s1", npc: "boby", title: "Caça modesta", desc: "Boby precisa de movimento no estoque: capture para ele.", objective: { kind: "capture", count: 8 }, objectiveLabel: "Capture 8 Pokémon", crystals: 4, bonus: [{ itemId: "pokeball", qty: 3 }], minStars: 0 },
  { id: "boby_s2", npc: "boby", title: "Limpeza de campo", desc: "Selvagens demais perto da cidade. Limpe a área.", objective: { kind: "kill", count: 30 }, objectiveLabel: "Derrote 30 selvagens", crystals: 4, bonus: [{ itemId: "greatball", qty: 2 }], minStars: 0 },
  { id: "boby_s3", npc: "boby", title: "Estoque de emergência", desc: "Boby trocou poções por bolas e ficou sem nada.", objective: { kind: "item", itemId: "potion", qty: 5, consume: true }, objectiveLabel: "Entregue 5 Poções", crystals: 5, bonus: [{ itemId: "pokeball", qty: 5 }], minStars: 0 },
  { id: "boby_s4", npc: "boby", title: "Caçador experiente", desc: "Só para quem já provou serviço com ele.", objective: { kind: "capture", count: 15 }, objectiveLabel: "Capture 15 Pokémon", crystals: 5, bonus: [{ itemId: "ultraball", qty: 1 }], minStars: 1 },
  { id: "boby_s5", npc: "boby", title: "Extermínio", desc: "Uma horda inteira. Traga as bolas de volta vazias.", objective: { kind: "kill", count: 60 }, objectiveLabel: "Derrote 60 selvagens", crystals: 5, bonus: [{ itemId: "ultraball", qty: 3 }], minStars: 2 },
  // ================= SAN (orbs & farm) =================
  { id: "san_s1", npc: "san", title: "Aquecimento", desc: "San quer calibrar os Orbs com batalha de verdade.", objective: { kind: "kill", count: 25 }, objectiveLabel: "Derrote 25 selvagens", crystals: 4, bonus: [{ itemId: "orb_xp_minor", qty: 1 }], minStars: 0 },
  { id: "san_s2", npc: "san", title: "Coleta de campo", desc: "Orbs reagem melhor perto de capturas recentes.", objective: { kind: "capture", count: 10 }, objectiveLabel: "Capture 10 Pokémon", crystals: 4, bonus: [{ itemId: "book_exp", qty: 1 }], minStars: 0 },
  { id: "san_s3", npc: "san", title: "Provisões", desc: "Pesquisa dá fome. Traga energéticos.", objective: { kind: "item", itemId: "energetico", qty: 5, consume: true }, objectiveLabel: "Entregue 5 Energéticos", crystals: 5, bonus: [{ itemId: "orb_xp_minor", qty: 1 }], minStars: 0 },
  { id: "san_s4", npc: "san", title: "Maratona", desc: "50 batalhas sem parar. O Orb vai cantar.", objective: { kind: "kill", count: 50 }, objectiveLabel: "Derrote 50 selvagens", crystals: 5, bonus: [{ itemId: "orb_xp_minor", qty: 2 }], minStars: 1 },
  { id: "san_s5", npc: "san", title: "Caçador de elite", desc: "Só os melhores encostam neste balcão.", objective: { kind: "capture", count: 15 }, objectiveLabel: "Capture 15 Pokémon", crystals: 5, bonus: [{ itemId: "orb_team", qty: 1 }], minStars: 2 },
  // ================= NANIZINHA (comida) =================
  { id: "nan_s1", npc: "nanizinha", title: "Mesa posta", desc: "Prove que você come direito.", objective: { kind: "feed_trainer", count: 2 }, objectiveLabel: "Alimente-se 2 vezes", crystals: 4, bonus: [{ itemId: "fruta", qty: 2 }], minStars: 0 },
  { id: "nan_s2", npc: "nanizinha", title: "Hora do pet", desc: "Os bichinhos dela estão famintos.", objective: { kind: "feed_pet", count: 3 }, objectiveLabel: "Alimente Pokémon 3 vezes", crystals: 4, bonus: [{ itemId: "morango", qty: 2 }], minStars: 0 },
  { id: "nan_s3", npc: "nanizinha", title: "Despensa", desc: "A dispensa esvaziou no meio do banquete.", objective: { kind: "item", itemId: "bolo_morango", qty: 4, consume: true }, objectiveLabel: "Entregue 4 Bolos de Morango", crystals: 5, bonus: [{ itemId: "refeicao", qty: 2 }], minStars: 0 },
  { id: "nan_s4", npc: "nanizinha", title: "Banquete", desc: "Comer bem é treino também.", objective: { kind: "feed_trainer", count: 4 }, objectiveLabel: "Alimente-se 4 vezes", crystals: 5, bonus: [{ itemId: "refeicao", qty: 2 }], minStars: 1 },
  { id: "nan_s5", npc: "nanizinha", title: "Nutrição total", desc: "Time inteiro redondo e feliz.", objective: { kind: "feed_pet", count: 5 }, objectiveLabel: "Alimente Pokémon 5 vezes", crystals: 5, bonus: [{ itemId: "morango", qty: 4 }], minStars: 2 },
  // ================= PAYKA (ouro & stones) =================
  { id: "pay_s1", npc: "payka", title: "Cobrança", desc: "Uns selvagens 'devem' para ele. Vaquinha na marra.", objective: { kind: "kill", count: 30 }, objectiveLabel: "Derrote 30 selvagens", crystals: 4, bonus: [], minStars: 0 },
  { id: "pay_s2", npc: "payka", title: "Mercadoria", desc: "Stones verdes valem ouro na mão dele.", objective: { kind: "item", itemId: "stone_grass", qty: 5, consume: true }, objectiveLabel: "Entregue 5 Stones Verdejantes", crystals: 4, bonus: [], minStars: 0 },
  { id: "pay_s3", npc: "payka", title: "Investimento", desc: "Histórias de captura vendem bem. Traga capturas.", objective: { kind: "capture", count: 10 }, objectiveLabel: "Capture 10 Pokémon", crystals: 5, bonus: [], minStars: 0 },
  { id: "pay_s4", npc: "payka", title: "Dívida grande", desc: "Dessa vez é sério. Ou não. Tanto faz, vai lá.", objective: { kind: "kill", count: 55 }, objectiveLabel: "Derrote 55 selvagens", crystals: 5, bonus: [], minStars: 1 },
  { id: "pay_s5", npc: "payka", title: "Contrato premium", desc: "Stones ígneas. Pagamento à vista.", objective: { kind: "item", itemId: "stone_fire", qty: 8, consume: true }, objectiveLabel: "Entregue 8 Stones Ígneas", crystals: 5, bonus: [], minStars: 2 },
  // ================= PAN (recados & visitas) =================
  { id: "pan_s1", npc: "pan", title: "Recado", desc: "Alguém precisa ouvir isso em Revoland.", objective: { kind: "visit", map: "mapinha6" }, objectiveLabel: "Visite Revoland", crystals: 4, bonus: [{ itemId: "potion", qty: 2 }], minStars: 0 },
  { id: "pan_s2", npc: "pan", title: "Olheiros", desc: "Tem gente estranha rondando. Espante.", objective: { kind: "kill", count: 25 }, objectiveLabel: "Derrote 25 selvagens", crystals: 4, bonus: [{ itemId: "revive", qty: 2 }], minStars: 0 },
  { id: "pan_s3", npc: "pan", title: "Correio", desc: "Irmão sem café é irmão perigoso. Leve café ao Payka... quer dizer, a ela.", objective: { kind: "item", itemId: "cafe", qty: 3, consume: true }, objectiveLabel: "Entregue 3 Cafés", crystals: 5, bonus: [], minStars: 0 },
  { id: "pan_s4", npc: "pan", title: "Infiltração", desc: "Capture sem ser notado. Ela acredita em você.", objective: { kind: "capture", count: 12 }, objectiveLabel: "Capture 12 Pokémon", crystals: 5, bonus: [{ itemId: "ultraball", qty: 1 }], minStars: 1 },
  { id: "pan_s5", npc: "pan", title: "Segredo final", desc: "As ruínas guardam respostas. Volte vivo.", objective: { kind: "visit", map: "ruinas" }, objectiveLabel: "Visite as Ruínas", crystals: 5, bonus: [{ itemId: "revive", qty: 2 }], minStars: 2 },
];

export type SideQuestProgress = {
  /** quests aceitas (em andamento) */
  accepted: string[];
  /** progresso atual por quest (kill/capture/feed) */
  count: Record<string, number>;
  /** último resgate por quest (cooldown 20h p/ repetir) */
  claimedAt: Record<string, number>;
  /** total concluído por NPC (define estrelas) */
  completed: Partial<Record<string, number>>;
  /** mapas já visitados (p/ objetivo visit) */
  visited: Record<string, boolean>;
};

export function freshSideQuests(): SideQuestProgress {
  return { accepted: [], count: {}, claimedAt: {}, completed: {}, visited: {} };
}

/** Quests visíveis do NPC (base + desbloqueadas por estrela). */
export function sideQuestsFor(npc: string, completedCount: number): SideQuest[] {
  const stars = starsFor(completedCount);
  return SIDE_QUESTS.filter((q) => q.npc === npc && q.minStars <= stars);
}

/** Texto de progresso p/ display. */
export function sideProgressText(
  q: SideQuest,
  prog: SideQuestProgress,
  items: Record<string, number>,
  currentMap: string,
): string {
  const ob = q.objective;
  if (ob.kind === "kill" || ob.kind === "capture" || ob.kind === "feed_pet" || ob.kind === "feed_trainer") {
    const cur = prog.count[q.id] ?? 0;
    return `${Math.min(cur, ob.count)}/${ob.count}`;
  }
  if (ob.kind === "item") return `${Math.min(items[ob.itemId] ?? 0, ob.qty)}/${ob.qty}`;
  if (ob.kind === "visit") {
    if (currentMap === ob.map || prog.visited[ob.map]) return "✓ visitado";
    return "vá até o local";
  }
  return "";
}

/** Objetivo cumprido? */
export function sideObjectiveDone(
  q: SideQuest,
  prog: SideQuestProgress,
  items: Record<string, number>,
  currentMap: string,
): boolean {
  const ob = q.objective;
  if (ob.kind === "kill" || ob.kind === "capture" || ob.kind === "feed_pet" || ob.kind === "feed_trainer") {
    return (prog.count[q.id] ?? 0) >= ob.count;
  }
  if (ob.kind === "item") return (items[ob.itemId] ?? 0) >= ob.qty;
  if (ob.kind === "visit") return currentMap === ob.map || !!prog.visited[ob.map];
  return false;
}

/** Em cooldown de repetição? */
export function sideOnCooldown(qid: string, prog: SideQuestProgress, now = Date.now()): boolean {
  const last = prog.claimedAt[qid] ?? 0;
  return now - last < SIDEQUEST_COOLDOWN_MS;
}
