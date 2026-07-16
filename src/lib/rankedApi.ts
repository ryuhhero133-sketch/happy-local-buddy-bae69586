import { supabase } from "@/integrations/supabase/client";

export type RankedRow = {
  user_id: string;
  username: string;
  trainer_level: number;
  craft_points: number;
  guild_name: string | null;
  score: number;
  updated_at: string;
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
  updated_at?: string | null;
};

function mapLegacyRankedRows(rows: LegacyRankedScore[]): RankedRow[] {
  return rows.map((r) => {
    const trainerLevel = Math.max(1, Number(r.trainer_level ?? r.level ?? (r.score ? Math.floor(Number(r.score) / 100) : 1)) || 1);
    const craftPoints = Math.max(0, Number(r.pokedex_count ?? r.craft_points ?? 0) || 0);
    const score = Number(r.score ?? (trainerLevel * 100 + craftPoints + Math.floor((Number(r.total_kills ?? 0) || 0) / 10))) || trainerLevel * 100;
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
    const trainerLevel = Math.max(1, Number(r.trainer_level ?? r.level ?? 1) || 1);
    const craftPoints = Math.max(0, Number(r.craft_points ?? 0) || 0);
    return {
      user_id: String(r.id || crypto.randomUUID()),
      username: r.name || "Treinador",
      trainer_level: trainerLevel,
      craft_points: craftPoints,
      guild_name: r.guild_name ?? null,
      score: trainerLevel * 100 + craftPoints,
      updated_at: r.updated_at || new Date().toISOString(),
    };
  });
}

async function fetchPlayersFallback(limit: number): Promise<RankedRow[]> {
  try {
    // Fallback visual: usa a tabela de presença quando o ranked ainda não foi populado.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("players")
      .select("id, name, level, trainer_level, craft_points, guild_name, updated_at")
      .order("trainer_level", { ascending: false })
      .order("level", { ascending: false })
      .limit(limit);
    if (!error) return mapPlayersRows((data ?? []) as PlayerRankRow[]).sort((a, b) => b.score - a.score);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const simple = await (supabase as any)
      .from("players")
      .select("id, name, level, updated_at")
      .order("level", { ascending: false })
      .limit(limit);
    if (simple.error) {
      console.warn("[ranked] players fallback:", simple.error.message);
      return [];
    }
    return mapPlayersRows((simple.data ?? []) as PlayerRankRow[]).sort((a, b) => b.score - a.score);
  } catch (e) {
    console.warn("[ranked] players fallback exc:", e);
    return [];
  }
}

async function fetchLegacyRankedScores(limit: number): Promise<RankedRow[]> {
  try {
    // Compatível com o setup antigo (`ranked_scores`) que o servidor já alimenta no save/sync.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ranked_scores")
      .select("user_id, username, trainer_level, pokedex_count, total_kills, updated_at")
      .order("trainer_level", { ascending: false })
      .order("pokedex_count", { ascending: false })
      .order("total_kills", { ascending: false })
      .limit(limit);
    if (!error) {
      return mapLegacyRankedRows((data ?? []) as LegacyRankedScore[])
        .sort((a, b) => b.score - a.score || new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    }

    // Compatível com `SUPABASE_FULL_SETUP.md`, que usa somente score/season.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallback = await (supabase as any)
      .from("ranked_scores")
      .select("user_id, username, score, updated_at")
      .order("score", { ascending: false })
      .limit(limit);
    if (fallback.error) {
      console.warn("[ranked] legacy:", fallback.error.message);
      return fetchPlayersFallback(limit);
    }
    const rows = mapLegacyRankedRows((fallback.data ?? []) as LegacyRankedScore[]);
    return rows.length ? rows : fetchPlayersFallback(limit);
  } catch (e) {
    console.warn("[ranked] legacy exc:", e);
    return fetchPlayersFallback(limit);
  }
}

/** Envia/atualiza score do jogador na temporada corrente. */
export async function recordRankedScore(level: number, craftPoints: number, guildName?: string | null) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("record_ranked_score", {
      _level: Math.max(1, Math.floor(level || 1)),
      _craft_points: Math.max(0, Math.floor(craftPoints || 0)),
      _guild_name: guildName ?? null,
    });
    if (!error) return;
    console.warn("[ranked] record:", error.message);
  } catch (e) {
    console.warn("[ranked] record exc:", e);
  }

  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    const trainerLevel = Math.max(1, Math.floor(level || 1));
    const craft = Math.max(0, Math.floor(craftPoints || 0));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("ranked_scores").upsert({
      user_id: user.id,
      username: (user.user_metadata?.username || user.user_metadata?.name || user.email?.split("@")[0] || "Treinador") as string,
      trainer_level: trainerLevel,
      pokedex_count: craft,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (!error) return;
    console.warn("[ranked] legacy upsert:", error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallback = await (supabase as any).from("ranked_scores").upsert({
      user_id: user.id,
      username: (user.user_metadata?.username || user.user_metadata?.name || user.email?.split("@")[0] || "Treinador") as string,
      score: trainerLevel * 100 + craft,
      season: 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,season" });
    if (fallback.error) console.warn("[ranked] score upsert:", fallback.error.message);
  } catch (e) {
    console.warn("[ranked] legacy record exc:", e);
  }
}

/** Busca a temporada corrente (com ends_at para countdown). */
export async function fetchCurrentSeason(): Promise<RankedSeason | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("ranked_seasons")
    .select("id, started_at, ends_at, is_current")
    .eq("is_current", true)
    .limit(1)
    .maybeSingle();
  if (error) { console.warn("[ranked] season:", error.message); return null; }
  return data as RankedSeason | null;
}

/** Top N da temporada corrente, ordenado por score desc. */
export async function fetchTopRanked(limit = 50): Promise<RankedRow[]> {
  const season = await fetchCurrentSeason();
  if (!season) {
    const legacy = await fetchLegacyRankedScores(limit);
    return legacy.length ? legacy : fetchPlayersFallback(limit);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("ranked_leaderboard")
    .select("user_id, username, trainer_level, craft_points, guild_name, score, updated_at")
    .eq("season_id", season.id)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) {
    console.warn("[ranked] top:", error.message);
    const legacy = await fetchLegacyRankedScores(limit);
    return legacy.length ? legacy : fetchPlayersFallback(limit);
  }
  const rows = (data ?? []) as RankedRow[];
  if (rows.length) return rows;
  const legacy = await fetchLegacyRankedScores(limit);
  return legacy.length ? legacy : fetchPlayersFallback(limit);
}
