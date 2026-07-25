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
    const rows = mapLegacyRankedRows((fallback.data ?? []) as LegacyRankedScore[], true);
    return rows.length ? rows : fetchPlayersFallback(limit);
  } catch (e) {
    console.warn("[ranked] legacy exc:", e);
    return fetchPlayersFallback(limit);
  }
}

/** Envia/atualiza score do jogador na temporada corrente. */
export async function recordRankedScore(level: number, craftPoints: number, guildName?: string | null) {
  const trainerLevel = Math.max(1, Math.min(10000, Math.floor(level || 1)));
  const craft = Math.max(0, Math.floor(craftPoints || 0));

  const upsertDirectBackup = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    const username = (user.user_metadata?.username || user.user_metadata?.name || user.email?.split("@")[0] || "Treinador") as string;

    // Tabela legacy/publica usada pelo ranking global. Mantém nível REAL atual.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacy = await (supabase as any).from("ranked_scores").upsert({
      user_id: user.id,
      username,
      trainer_level: trainerLevel,
      pokedex_count: craft,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (legacy.error) {
      // Compatibilidade com setup antigo que só tinha score/season.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallback = await (supabase as any).from("ranked_scores").upsert({
        user_id: user.id,
        username,
        score: trainerLevel * 100 + craft,
        season: 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,season" });
      if (fallback.error) console.warn("[ranked] score upsert:", fallback.error.message);
    }

    // Backup direto também na tabela de temporada, para não depender só da RPC.
    try {
      const season = await fetchCurrentSeason();
      if (!season) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("ranked_leaderboard").upsert({
        season_id: season.id,
        user_id: user.id,
        username,
        trainer_level: trainerLevel,
        craft_points: craft,
        guild_name: guildName ?? null,
        score: trainerLevel * 100 + craft,
        updated_at: new Date().toISOString(),
      }, { onConflict: "season_id,user_id" });
      if (error) console.warn("[ranked] leaderboard backup:", error.message);
    } catch (e) {
      console.warn("[ranked] leaderboard backup exc:", e);
    }
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("record_ranked_score", {
      _level: trainerLevel,
      _craft_points: craft,
      _guild_name: guildName ?? null,
    });
    if (!error) {
      await upsertDirectBackup();
      return;
    }
    console.warn("[ranked] record:", error.message);
  } catch (e) {
    console.warn("[ranked] record exc:", e);
  }

  try {
    await upsertDirectBackup();
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
  try {
    // Fonte mais fiel: RPC segura lê o Lv real do blob `game_saves` e só retorna campos públicos.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_global_ranked", { _limit: limit });
    if (!error && Array.isArray(data) && data.length) {
      return mergeRankedRows(data as RankedRow[]).slice(0, limit);
    }
    if (error) console.warn("[ranked] global rpc:", error.message);
  } catch (e) {
    console.warn("[ranked] global rpc exc:", e);
  }

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
  const rows = ((data ?? []) as RankedRow[]).map(normalizeRankedRow);
  const legacy = await fetchLegacyRankedScores(limit);
  const online = await fetchPlayersFallback(limit);
  const merged = mergeRankedRows(rows, legacy, online);
  return merged.length ? merged.slice(0, limit) : online;
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
  const { userId, name: nameArg } = await resolveTrainerName(username);
  let submittedByRpc = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("record_oddish_captures", { _captures: safe, _username: nameArg });
    if (!error) submittedByRpc = true;
    else {
      // Fallback: RPC antiga sem parâmetro _username.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legacy = await (supabase as any).rpc("record_oddish_captures", { _captures: safe });
      if (legacy.error) console.warn("[oddish rank] submit:", legacy.error.message);
      else submittedByRpc = true;
    }
  } catch (e) {
    console.warn("[oddish rank] submit exc:", e);
  }
  // Backup direto sempre roda quando há nome real: corrige linhas antigas presas como "Treinador".
  if (!nameArg || !userId) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (supabase as any)
      .from("oddish_event_leaderboard")
      .select("captures")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("oddish_event_leaderboard")
        .update({ username: nameArg, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("oddish_event_leaderboard").insert({
        user_id: userId,
        username: nameArg,
        captures: safe,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    if (!submittedByRpc) console.warn("[oddish rank] backup exc:", e);
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
