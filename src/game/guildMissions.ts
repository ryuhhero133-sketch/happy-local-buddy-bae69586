// Missões de guilda — captura (foco) + abates. Progresso local por temporada
// (cumulativo), resgate dá ouro ao jogador + XP à guilda (remota ou local).
export type GuildMissionKind = "capture" | "kill";

export type GuildMission = {
  id: string;
  kind: GuildMissionKind;
  target: number;
  title: string;
  desc: string;
  icon: string;
  minRarity?: string; // ex.: "rare" — só conta capturas dessa raridade pra cima
  rewardGold: number;
  rewardCrystals?: number;
  rewardGuildXp: number;
};

export const GUILD_MISSIONS: GuildMission[] = [
  { id: "g_cap10", kind: "capture", target: 10, title: "Recruta da Guilda", desc: "Capture 10 Pokémon", icon: "🔴", rewardGold: 2000, rewardGuildXp: 50 },
  { id: "g_cap50", kind: "capture", target: 50, title: "Caçador da Guilda", desc: "Capture 50 Pokémon", icon: "🟢", rewardGold: 8000, rewardGuildXp: 150 },
  { id: "g_cap150", kind: "capture", target: 150, title: "Lenda da Captura", desc: "Capture 150 Pokémon", icon: "🏆", rewardGold: 25000, rewardCrystals: 10, rewardGuildXp: 400 },
  { id: "g_rare15", kind: "capture", target: 15, title: "Olho Raro", desc: "Capture 15 Pokémon Raro+", icon: "💎", minRarity: "rare", rewardGold: 12000, rewardCrystals: 5, rewardGuildXp: 250 },
  { id: "g_kill100", kind: "kill", target: 100, title: "Patrulha", desc: "Derrote 100 selvagens", icon: "⚔️", rewardGold: 5000, rewardGuildXp: 100 },
  { id: "g_kill500", kind: "kill", target: 500, title: "Extermínio", desc: "Derrote 500 selvagens", icon: "💀", rewardGold: 20000, rewardCrystals: 8, rewardGuildXp: 300 },
];

const RARITY_RANK: Record<string, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, mythic_shiny: 6,
};

export function rarityRank(r?: string | null): number {
  if (!r) return 0;
  return RARITY_RANK[r] ?? 0;
}

const PROG_KEY = "rubym.guildmissions.v1";
const CLAIM_KEY = "rubym.guildmissions.claimed.v1";

export function loadGuildMissionProgress(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROG_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch { return {}; }
}

export function loadGuildMissionsClaimed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLAIM_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveGuildMissionsClaimed(claimed: string[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CLAIM_KEY, JSON.stringify(claimed)); } catch { /* ignore */ }
}

/** Soma +1 em toda missão do kind (respeitando raridade mínima), com teto no target. */
export function updateGuildMissionProgress(
  prev: Record<string, number>,
  kind: GuildMissionKind,
  rarity?: string | null,
): Record<string, number> {
  const rank = rarityRank(rarity);
  let changed = false;
  const next: Record<string, number> = { ...prev };
  for (const m of GUILD_MISSIONS) {
    if (m.kind !== kind) continue;
    if ((m.minRarity ? rarityRank(m.minRarity) : 0) > rank) continue;
    const cur = next[m.id] ?? 0;
    if (cur < m.target) { next[m.id] = cur + 1; changed = true; }
  }
  if (!changed) return prev;
  try { localStorage.setItem(PROG_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// ═══ Amigos + Party (locais por enquanto; guilda usa Supabase) ═══
export type FriendEntry = { name: string; addedAt: number };
const FRIENDS_KEY = "rubym.friends.v1";
const PARTY_KEY = "rubym.party.v1";

export function loadFriends(): FriendEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    const arr = raw ? (JSON.parse(raw) as FriendEntry[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveFriends(list: FriendEntry[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(FRIENDS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function loadParty(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PARTY_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveParty(list: string[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(PARTY_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
