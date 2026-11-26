import { supabase } from "@/integrations/supabase/client";

export type RankedRow = {
  user_id: string;
  username: string;
  trainer_level: number;
  craft_points: number;
  guild_name: string | null;
  score: number;
  updated_at: string;
  leader_species?: string | null;
  leader_rarity?: string | null;
  skin_url?: string | null;
  /** Hora real do snapshot oficial (gerado a cada 6 horas). */
  refreshed_at?: string | null;
};

export type RankedSeason = {
  id: string;
  started_at: string;
  ends_at: string;
  is_current: boolean;
};

type LegacyRankedScore = {
  user_id: string;
  username: string | null;
  trainer_level?: number | null;
  level?: number | null;
  pokedex_count?: number | null;
  craft_points?: number | null;
  total_kills?: number | null;
  score?: number | null;
  updated_at: string;
};

type PlayerRankRow = {
  id: string;
  name: string | null;
  level?: number | null;
  trainer_level?: number | null;
  craft_points?: number | null;
  leader_species?: string | null;
  leader_rarity?: string | null;
  guild_name?: string | null;
  skin_url?: string | null;
  updated_at?: string | null;
};

function safeInt(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function cleanTrainerName(value: unknown): string | null {
  const name = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
  if (!name || name.toLowerCase() === "treinador") return null;
  return name;
}

async function resolveTrainerName(preferred?: string | null): Promise<{ userId: string | null; name: string | null }> {
  const preferredName = cleanTrainerName(preferred);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;
  if (!user) return { userId: null, name: preferredName };

  let profileName: string | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    profileName = cleanTrainerName(data?.username);
  } catch {
    profileName = null;
  }

  const metadataName = cleanTrainerName(user.user_metadata?.username)
    ?? cleanTrainerName(user.user_metadata?.name)
    ?? cleanTrainerName(user.email?.split("@")[0]);

  return { userId: user.id, name: preferredName ?? profileName ?? metadataName };
}

function inferTrainerLevelFromScore(score: unknown) {
  const n = safeInt(score, 0);
  return n > 0 ? Math.max(1, Math.min(10000, Math.floor(n / 100))) : 1;
}

function rowTime(row: Pick<RankedRow, "updated_at">) {
  const t = Date.parse(row.updated_at);
  return Number.isFinite(t) ? t : 0;
}

function normalizeRankedRow(row: RankedRow): RankedRow {
  const trainerLevel = Math.max(1, Math.min(10000, safeInt(row.trainer_level, 1)));
  const craftPoints = Math.max(0, safeInt(row.craft_points, 0));
  return {
    ...row,
    trainer_level: trainerLevel,
    craft_points: craftPoints,
    score: trainerLevel * 100 + craftPoints,
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

function mergeRankedRows(...sources: RankedRow[][]): RankedRow[] {
  const byUser = new Map<string, RankedRow>();
  for (const rows of sources) {
    for (const raw of rows) {
      const incoming = normalizeRankedRow(raw);
      const existing = byUser.get(incoming.user_id);
      if (!existing) {
        byUser.set(incoming.user_id, incoming);
        continue;
      }
      const incomingTime = rowTime(incoming);
      const existingTime = rowTime(existing);
      const newer = incomingTime >= existingTime;
      const trainerLevel = incoming.trainer_level > 1 && (newer || existing.trainer_level <= 1)
        ? incoming.trainer_level
        : existing.trainer_level;
      const craftPoints = newer ? incoming.craft_points : existing.craft_points;
      byUser.set(incoming.user_id, {
        user_id: incoming.user_id,
        username: newer ? incoming.username : existing.username,
        trainer_level: trainerLevel,
        craft_points: craftPoints,
        guild_name: newer ? incoming.guild_name : existing.guild_name,
        score: trainerLevel * 100 + craftPoints,
        updated_at: newer ? incoming.updated_at : existing.updated_at,
      });
    }
  }
  return [...byUser.values()]
    .sort((a, b) => b.score - a.score || rowTime(a) - rowTime(b));
}

function mapLegacyRankedRows(rows: LegacyRankedScore[], inferFromScore = false): RankedRow[] {
  return rows.map((r) => {
    // Nível REAL do treinador. Em setups antigos que só tinham `score`, inferimos
    // porque o próprio cliente grava `score = trainerLevel * 100 + craft`.
    const trainerLevel = Math.max(1, Math.min(10000, safeInt(
      r.trainer_level ?? (inferFromScore ? inferTrainerLevelFromScore(r.score) : 1),
      1,
    )));
    const craftPoints = Math.max(0, safeInt(r.pokedex_count ?? r.craft_points ?? 0, 0));
    const score = trainerLevel * 100 + craftPoints;
    return {
      user_id: r.user_id,
      username: r.username || "Treinador",
      trainer_level: trainerLevel,
      craft_points: craftPoints,
      guild_name: null,
      score,
      updated_at: r.updated_at,
    };
  });
}

function mapPlayersRows(rows: PlayerRankRow[]): RankedRow[] {
  return rows.map((r) => {
    // Nível REAL do treinador — não usa o nível do líder Pokémon como fallback.
    const trainerLevel = Math.max(1, Math.min(10000, safeInt(r.trainer_level ?? 1, 1)));
    const craftPoints = Math.max(0, safeInt(r.craft_points ?? 0, 0));
    return {
      // `players.id` é "userId:sessionId" — normaliza pro userId (igual identity.id).
      user_id: String(r.id || crypto.randomUUID()).split(":")[0] || String(r.id || crypto.randomUUID()),
      username: r.name || "Treinador",
      trainer_level: trainerLevel,
      craft_points: craftPoints,
      guild_name: r.guild_name ?? null,
      score: trainerLevel * 100 + craftPoints,
      updated_at: r.updated_at || new Date().toISOString(),
      leader_species: r.leader_species ?? null,
      leader_rarity: r.leader_rarity ?? null,
      skin_url: r.skin_url ?? null,
    };
  });
}

/** Uma linha por usuário — a tabela `players` guarda várias sessões da mesma conta. */
function dedupeByUser(rows: RankedRow[]): RankedRow[] {
  const byUser = new Map<string, RankedRow>();
  for (const r of rows) {
    const prev = byUser.get(r.user_id);
    if (!prev || r.score > prev.score || (r.score === prev.score && rowTime(r) > rowTime(prev))) {
      byUser.set(r.user_id, r);
    }
  }
  return [...byUser.values()];
}

async function fetchPlayersFallback(limit: number): Promise<RankedRow[]> {
  // Presença é gravada pelo navegador e nunca pode alimentar o ranking.
  void limit;
  return [];
}

async function fetchLegacyRankedScores(limit: number): Promise<RankedRow[]> {
  // Tabelas legadas aceitam campos que não são a fonte de verdade do jogo.
  void limit;
  return [];
}

/** Top N oficial: a RPC lê exclusivamente o snapshot `game_saves` do servidor. */
export async function fetchTopRanked(limit = 50): Promise<RankedRow[]> {
  try {
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit || 50)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_global_ranked", { _limit: safeLimit });
    if (error) {
      console.warn("[ranked] global rpc:", error.message);
      return [];
    }
    if (!Array.isArray(data)) return [];
    // A RPC já devolve o snapshot na posição oficial. Não reordenar no cliente:
    // o Top 10 precisa ser idêntico para todos até a próxima janela de 6 horas.
    return (data as RankedRow[]).map(normalizeRankedRow).slice(0, safeLimit);
  } catch (e) {
    console.warn("[ranked] global rpc exc:", e);
    return [];
  }
}

// ============================================================
// Ranking do evento Grass Oddish (capturas totais por jogador).
// Requer o SQL em SUPABASE_ODDISH_LEADERBOARD.sql.
// ============================================================
export type OddishRankRow = {
  user_id: string;
  username: string;
  captures: number;
  updated_at: string;
};

/** Envia/atualiza a contagem de Oddish capturados no evento. */
export async function submitOddishCaptures(captures: number, username?: string | null): Promise<void> {
  const safe = Math.max(0, Math.floor(captures || 0));
  const { name: nameArg } = await resolveTrainerName(username);
  try {
    // Somente via RPC server-side. Sem escrita direta: o servidor valida e calcula.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("record_oddish_captures", { _captures: safe, _username: nameArg });
    if (!error) return;
    // Fallback: RPC antiga sem parâmetro _username.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacy = await (supabase as any).rpc("record_oddish_captures", { _captures: safe });
    if (legacy.error) console.warn("[oddish rank] submit:", legacy.error.message);
  } catch (e) {
    console.warn("[oddish rank] submit exc:", e);
  }
}

/** Top N do ranking global do evento Grass Oddish. */
export async function fetchOddishTop(limit = 100): Promise<OddishRankRow[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_oddish_top", { _limit: limit });
    if (!error && Array.isArray(data)) {
      return (data as OddishRankRow[]).map((r) => ({
        user_id: r.user_id,
        username: r.username || "Treinador",
        captures: Math.max(0, Math.floor(r.captures || 0)),
        updated_at: r.updated_at,
      }));
    }
    if (error) console.warn("[oddish rank] top rpc:", error.message);
  } catch (e) {
    console.warn("[oddish rank] top exc:", e);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("oddish_event_leaderboard")
      .select("user_id, username, captures, updated_at")
      .order("captures", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(limit);
    if (error) { console.warn("[oddish rank] top table:", error.message); return []; }
    return ((data ?? []) as OddishRankRow[]).map((r) => ({
      user_id: r.user_id,
      username: r.username || "Treinador",
      captures: Math.max(0, Math.floor(r.captures || 0)),
      updated_at: r.updated_at,
    }));
  } catch (e) {
    console.warn("[oddish rank] top table exc:", e);
    return [];
  }
}
