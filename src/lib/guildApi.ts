// Supabase-backed guild API.
// Tabelas: guilds, guild_members, guild_invites (criadas via SQL no SUPABASE_SETUP.md).
//
// Converte rows do DB para a shape `Guild` esperada pelo overlay
// (mantém compat com src/game/guild.ts).
import { supabase } from "@/integrations/supabase/client";
import type { Guild, GuildElement, GuildMember } from "@/game/guild";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export type GuildInvite = {
  id: string;
  guild_id: string;
  guild_name: string;
  from_user_id: string;
  from_username: string;
  to_user_id: string | null;
  to_username: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type DbGuild = {
  id: string;
  name: string;
  element: GuildElement;
  level: number;
  xp: number;
  total_donated: number;
  treasury_gold: number;
  treasury_crystal: number;
  treasury_ruby: number;
  founder_id: string;
  vice_leader_id: string | null;
  created_at: string;
};

type DbMember = {
  guild_id: string;
  user_id: string;
  username: string;
  role: "leader" | "vice" | "member";
  leader_species: string | null;
  level: number;
  joined_at: string;
};

function toGuild(g: DbGuild, members: DbMember[]): Guild {
  return {
    id: g.id,
    name: g.name,
    element: g.element,
    level: g.level,
    xp: g.xp,
    founderId: g.founder_id,
    foundedAt: new Date(g.created_at).getTime(),
    totalDonated: g.total_donated,
    viceLeaderId: g.vice_leader_id,
    treasury: {
      gold: g.treasury_gold ?? 0,
      crystal: g.treasury_crystal ?? 0,
      ruby: g.treasury_ruby ?? 0,
    },
    members: members.map<GuildMember>((m) => ({
      id: m.user_id,
      name: m.username,
      level: m.level,
      leaderSpecies: m.leader_species,
      joinedAt: new Date(m.joined_at).getTime(),
      role: m.role,
    })),
  };
}


/** Carrega a guilda atual do usuário (ou null). */
export async function fetchMyGuild(userId: string): Promise<Guild | null> {
    const { data: mine, error: mineError } = await sb
      .from("guild_members")
      .select("guild_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (mineError) throw mineError;
    if (!mine?.guild_id) return null;
    const [{ data: g, error: guildError }, { data: ms, error: memberError }] = await Promise.all([
      sb.from("guilds").select("*").eq("id", mine.guild_id).maybeSingle(),
      sb.from("guild_members").select("*").eq("guild_id", mine.guild_id),
    ]);
    if (guildError) throw guildError;
    if (memberError) throw memberError;
    if (!g) throw new Error("Guilda vinculada ao jogador não encontrada no banco.");
    return toGuild(g as DbGuild, (ms as DbMember[]) ?? []);
}

/** Verifica se um usuário já tem guilda. */
export async function userHasGuild(userId: string): Promise<boolean> {
  const { data, error } = await sb.from("guild_members").select("guild_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return !!data?.guild_id;
}

export async function fetchGuildClaims(guildId: string, userId: string): Promise<string[]> {
  const { data, error } = await sb.from("guild_mission_claims")
    .select("mission_id").eq("guild_id", guildId).eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row: { mission_id: string }) => row.mission_id);
}

export async function createGuildRemote(args: {
  name: string;
  element: GuildElement;
  founderLevel: number;
  leaderSpecies?: string | null;
  expectedVersion: number;
}): Promise<{ ok: boolean; server_version?: number; value?: number; error?: string }> {
    const { data, error } = await sb.rpc("create_player_guild", {
      p_name: args.name.trim(),
      p_element: args.element,
      p_level: args.founderLevel,
      p_expected_version: args.expectedVersion,
      p_species: args.leaderSpecies ?? null,
    });
    if (error) throw error;
    return { ok: data?.ok === true, server_version: data?.server_version,
      value: data?.gold, error: data?.reason };
}

/** Resolve username → user_id (via tabela `players` por último visto). */
async function resolveUserId(username: string): Promise<string | null> {
  const u = username.trim();
  if (!u) return null;
  const { data } = await sb.from("players").select("id, name").ilike("name", u).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function sendInviteByUsername(args: {
  guild: Guild;
  fromUserId: string;
  fromUsername: string;
  toUsername: string;
}): Promise<{ ok: boolean; error?: string }> {
  const username = args.toUsername.trim();
  if (!username) return { ok: false, error: "Informe o username." };
  const { error } = await sb.rpc("invite_player_to_guild", {
    p_guild: args.guild.id,
    p_username: username,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendInviteToPlayer(args: {
  guild: Guild;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (await userHasGuild(args.toUserId)) {
    return { ok: false, error: `${args.toUsername} já está em uma guilda.` };
  }
  const { data: existing } = await sb
    .from("guild_invites")
    .select("id")
    .eq("guild_id", args.guild.id)
    .eq("status", "pending")
    .eq("to_user_id", args.toUserId)
    .maybeSingle();
  if (existing) return { ok: false, error: "Convite já pendente." };
  const { error } = await sb.from("guild_invites").insert({
    guild_id: args.guild.id,
    guild_name: args.guild.name,
    from_user_id: args.fromUserId,
    from_username: args.fromUsername,
    to_user_id: args.toUserId,
    to_username: args.toUsername,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchPendingInvites(userId: string, _username: string): Promise<GuildInvite[]> {
  const { data, error } = await sb
    .from("guild_invites")
    .select("*")
    .eq("status", "pending")
    .eq("to_user_id", userId);
  if (error) throw error;
  return (data as GuildInvite[]) ?? [];
}

export async function acceptInvite(args: {
  invite: GuildInvite;
  userId: string;
  username: string;
  level: number;
  leaderSpecies?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await sb.rpc("accept_player_guild_invite", {
    p_invite: args.invite.id,
    p_level: args.level,
    p_species: args.leaderSpecies ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function declineInvite(inviteId: string): Promise<void> {
  const { error } = await sb.rpc("decline_player_guild_invite", { p_invite: inviteId });
  if (error) throw error;
}

export async function kickMemberRemote(guildId: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await sb.rpc("kick_player_guild_member", { p_guild: guildId, p_member: userId });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function leaveGuildRemote(_userId: string): Promise<void> {
  const { error } = await sb.rpc("leave_player_guild");
  if (error) throw error;
}

export async function dissolveGuildRemote(guildId: string): Promise<void> {
  await sb.from("guilds").delete().eq("id", guildId);
}

export async function donateToGuildRemote(guildId: string, xp: number): Promise<{ ok: boolean; error?: string }> {
  if (xp <= 0) return { ok: false, error: "Inválido" };
  const { data: g } = await sb.from("guilds").select("xp, total_donated, level").eq("id", guildId).maybeSingle();
  if (!g) return { ok: false, error: "Guilda não encontrada." };
  const newXp = (g.xp ?? 0) + xp;
  const newTotal = (g.total_donated ?? 0) + xp;
  const { error } = await sb.from("guilds").update({ xp: newXp, total_donated: newTotal }).eq("id", guildId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Doa recurso (gold/crystal/ruby) para o tesouro da guilda. */
export async function donateResourceRemote(
  guildId: string,
  kind: "gold" | "crystal" | "ruby",
  qty: number,
): Promise<{ ok: boolean; error?: string }> {
  if (qty <= 0) return { ok: false, error: "Inválido" };
  const col = `treasury_${kind}`;
  const { data: g } = await sb.from("guilds").select(`${col}, total_donated`).eq("id", guildId).maybeSingle();
  if (!g) return { ok: false, error: "Guilda não encontrada." };
  const cur = (g as Record<string, number>)[col] ?? 0;
  const { error } = await sb
    .from("guilds")
    .update({ [col]: cur + qty, total_donated: (g.total_donated ?? 0) + qty })
    .eq("id", guildId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Consome o tesouro e sobe 1 nível da guilda (líder ou vice). */
export async function evolveGuildRemote(guildId: string): Promise<{ ok: boolean; error?: string; newLevel?: number }> {
  const { nextLevelCost, GUILD_MAX_LEVEL } = await import("@/game/guild");
  const { data: g } = await sb
    .from("guilds")
    .select("level, treasury_gold, treasury_crystal, treasury_ruby")
    .eq("id", guildId)
    .maybeSingle();
  if (!g) return { ok: false, error: "Guilda não encontrada." };
  if (g.level >= GUILD_MAX_LEVEL) return { ok: false, error: "Nível máximo atingido." };
  const cost = nextLevelCost(g.level);
  if (!cost) return { ok: false, error: "Sem custo definido." };
  if ((cost.gold ?? 0) > (g.treasury_gold ?? 0)) return { ok: false, error: `Faltam ${(cost.gold ?? 0) - (g.treasury_gold ?? 0)} ouro no tesouro.` };
  if ((cost.crystal ?? 0) > (g.treasury_crystal ?? 0)) return { ok: false, error: `Faltam ${(cost.crystal ?? 0) - (g.treasury_crystal ?? 0)} cristal no tesouro.` };
  if ((cost.ruby ?? 0) > (g.treasury_ruby ?? 0)) return { ok: false, error: `Faltam ${(cost.ruby ?? 0) - (g.treasury_ruby ?? 0)} ruby no tesouro.` };
  const { error } = await sb
    .from("guilds")
    .update({
      level: g.level + 1,
      treasury_gold: (g.treasury_gold ?? 0) - (cost.gold ?? 0),
      treasury_crystal: (g.treasury_crystal ?? 0) - (cost.crystal ?? 0),
      treasury_ruby: (g.treasury_ruby ?? 0) - (cost.ruby ?? 0),
    })
    .eq("id", guildId);
  return error ? { ok: false, error: error.message } : { ok: true, newLevel: g.level + 1 };
}

/** Promove um membro a vice-líder (apenas o fundador). */
export async function setViceLeaderRemote(guildId: string, userId: string | null): Promise<{ ok: boolean; error?: string }> {
  // 1) atualiza coluna na guilds
  const { error: e1 } = await sb.from("guilds").update({ vice_leader_id: userId }).eq("id", guildId);
  if (e1) return { ok: false, error: e1.message };
  // 2) rebaixa vices antigos
  await sb.from("guild_members").update({ role: "member" }).eq("guild_id", guildId).eq("role", "vice");
  // 3) promove o novo
  if (userId) {
    const { error: e2 } = await sb.from("guild_members").update({ role: "vice" }).eq("guild_id", guildId).eq("user_id", userId);
    if (e2) return { ok: false, error: e2.message };
  }
  return { ok: true };
}

/** Realtime subscription para convites do usuário (callback chamado a cada change). */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const activeInviteChannels = new Map<string, any>();
export function subscribeMyInvites(userId: string, cb: () => void): () => void {
  const topic = `rt-invites-${userId}`;
  // Idempotente: se já existe canal deste tópico (remount/HMR/troca de party
  // sem cleanup), remove antes de recriar — evita "cannot add callbacks
  // after subscribe()" e canais duplicados.
  const prev = activeInviteChannels.get(topic);
  if (prev) {
    try { sb.removeChannel(prev); } catch { /* ignore */ }
    activeInviteChannels.delete(topic);
  }
  const ch = sb
    .channel(topic)
    .on("postgres_changes", { event: "*", schema: "public", table: "guild_invites", filter: `to_user_id=eq.${userId}` }, cb)
    .subscribe();
  activeInviteChannels.set(topic, ch);
  return () => {
    try { sb.removeChannel(ch); } catch { /* ignore */ }
    if (activeInviteChannels.get(topic) === ch) activeInviteChannels.delete(topic);
  };
}

