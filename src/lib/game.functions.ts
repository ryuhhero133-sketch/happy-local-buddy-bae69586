// Server functions com validação anti-cheat.
// Cliente NUNCA soma recurso — sempre chama uma dessas funções e recebe o novo estado.
//
// NOTA: usamos `supabase as any` porque as tabelas novas (trainer_state, etc.)
// só existem depois que o SQL de SUPABASE_ANTICHEAT_SETUP.md for rodado.
// Os types.ts do Supabase são regenerados só quando o schema muda.

import { createServerFn } from "@tanstack/react-start";
import { syncClientState_handler } from "./game.functions.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---- Types (client-safe, servem de contrato) --------------------------------

export type TrainerStateDTO = {
  gold: number;
  ruby: number;
  crystal: number;
  trainer_level: number;
  trainer_xp: number;
  trainer_xp_to_next: number;
  kill_count: number;
  active_map: string;
};

export type PokemonDTO = {
  id: string;
  species: string;
  level: number;
  xp: number;
  rarity: string;
  hp_current: number;
  hp_max: number;
  energy: number;
  team_slot: number | null;
  captured_at: string;
};

export type FullStateDTO = {
  trainer: TrainerStateDTO;
  team: PokemonDTO[];
  collection: PokemonDTO[];
  inventory: Array<{ item_id: string; qty: number }>;
  pokeballs: Array<{ ball_type: string; qty: number }>;
};

// ---- Bootstrap: cria linha inicial se não existir ---------------------------

export const bootstrapGameState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    await supabase
      .from("trainer_state")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

    await supabase
      .from("pokeballs")
      .upsert(
        { user_id: userId, ball_type: "pokeball", qty: 5 },
        { onConflict: "user_id,ball_type", ignoreDuplicates: true },
      );

    return { ok: true };
  });

// ---- Snapshot completo do estado --------------------------------------------

export const getFullGameState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FullStateDTO> => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const { xpForTrainerLevel } = await import("./game.balance.server");

    const [trainerRes, pokemonsRes, invRes, ballsRes] = await Promise.all([
      supabase.from("trainer_state").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("pokemon_collection").select("*").eq("user_id", userId),
      supabase.from("inventory").select("item_id, qty").eq("user_id", userId),
      supabase.from("pokeballs").select("ball_type, qty").eq("user_id", userId),
    ]);

    const t = trainerRes.data ?? {
      gold: 0, ruby: 0, crystal: 0, trainer_level: 1, trainer_xp: 0,
      kill_count: 0, active_map: "verdejante",
    };

    const pokemons = (pokemonsRes.data ?? []) as PokemonDTO[];
    const team = pokemons.filter((p) => p.team_slot != null)
      .sort((a, b) => (a.team_slot ?? 0) - (b.team_slot ?? 0));
    const collection = pokemons.filter((p) => p.team_slot == null);

    return {
      trainer: {
        gold: Number(t.gold),
        ruby: Number(t.ruby),
        crystal: Number(t.crystal),
        trainer_level: t.trainer_level,
        trainer_xp: Number(t.trainer_xp),
        trainer_xp_to_next: xpForTrainerLevel(t.trainer_level + 1),
        kill_count: Number(t.kill_count),
        active_map: t.active_map,
      },
      team,
      collection,
      inventory: (invRes.data ?? []) as Array<{ item_id: string; qty: number }>,
      pokeballs: (ballsRes.data ?? []) as Array<{ ball_type: string; qty: number }>,
    };
  });

// ---- Reportar kill: servidor calcula tudo -----------------------------------

const KillSchema = z.object({
  species: z.string().min(1).max(64),
  target_level: z.number().int().min(1).max(10000),
  rarity: z.enum(["common","uncommon","rare","epic","legendary","mythic","mythic_shiny"]),
  map_id: z.string().min(1).max(32),
  leader_level: z.number().int().min(1).max(10000),
});

export const reportKill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => KillSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const {
      RARITY_REWARDS, MAP_LEVEL_CAP, levelGapMultiplier,
      ULTRA_BALL_DROP_CHANCE, xpForTrainerLevel,
      KILL_MILESTONE, KILL_MILESTONE_REWARD_BALLS,
    } = await import("./game.balance.server");

    // Anti-flood: máx 6 kills/segundo.
    const { count } = await supabase
      .from("kill_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 1000).toISOString());
    if ((count ?? 0) > 6) {
      return { ok: false as const, reason: "rate_limit" };
    }

    const base = RARITY_REWARDS[data.rarity];
    const cap = MAP_LEVEL_CAP[data.map_id];
    const levelMult = 1 + data.target_level * 0.03;
    const gapMult = levelGapMultiplier(data.leader_level, data.target_level);
    const mapPenalty = cap && data.leader_level > cap.max ? 0.2 : 1.0;

    const gold = Math.max(0, Math.floor(base.gold * levelMult * gapMult * mapPenalty));
    const xp   = Math.max(0, Math.floor(base.xp   * levelMult * gapMult * mapPenalty));

    await supabase.from("kill_log").insert({
      user_id: userId,
      species: data.species,
      target_level: data.target_level,
      rarity: data.rarity,
      map_id: data.map_id,
      gold_awarded: gold,
      xp_awarded: xp,
    });

    let ultraBallDrop = 0;
    const dropChance = ULTRA_BALL_DROP_CHANCE[data.rarity] ?? 0;
    if (dropChance > 0 && Math.random() < dropChance) {
      ultraBallDrop = 1;
      const { data: cur } = await supabase.from("pokeballs")
        .select("qty").eq("user_id", userId).eq("ball_type", "ultraball").maybeSingle();
      await supabase.from("pokeballs").upsert(
        { user_id: userId, ball_type: "ultraball", qty: (cur?.qty ?? 0) + 1 },
        { onConflict: "user_id,ball_type" },
      );
    }

    const { data: state } = await supabase.from("trainer_state")
      .select("*").eq("user_id", userId).maybeSingle();
    if (!state) return { ok: false as const, reason: "no_state" };

    let newGold = Number(state.gold) + gold;
    let newXp = Number(state.trainer_xp) + xp;
    let newLevel = state.trainer_level;
    const newKills = Number(state.kill_count) + 1;

    while (newXp >= xpForTrainerLevel(newLevel + 1) && newLevel < 10000) {
      newXp -= xpForTrainerLevel(newLevel + 1);
      newLevel += 1;
    }

    let ballBonus = 0;
    if (Math.floor(newKills / KILL_MILESTONE) > Math.floor(Number(state.kill_count) / KILL_MILESTONE)) {
      ballBonus = KILL_MILESTONE_REWARD_BALLS;
      const { data: cur } = await supabase.from("pokeballs")
        .select("qty").eq("user_id", userId).eq("ball_type", "pokeball").maybeSingle();
      await supabase.from("pokeballs").upsert(
        { user_id: userId, ball_type: "pokeball", qty: (cur?.qty ?? 0) + ballBonus },
        { onConflict: "user_id,ball_type" },
      );
    }

    await supabase.from("trainer_state").update({
      gold: newGold,
      trainer_xp: newXp,
      trainer_level: newLevel,
      kill_count: newKills,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    const username = (context.claims as { user_metadata?: { username?: string } })?.user_metadata?.username ?? "Treinador";
    await supabase.from("ranked_scores").upsert({
      user_id: userId,
      username,
      trainer_level: newLevel,
      total_kills: newKills,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return {
      ok: true as const,
      gold_awarded: gold,
      xp_awarded: xp,
      ultra_ball_drop: ultraBallDrop,
      ball_bonus: ballBonus,
      leveled_up: newLevel > state.trainer_level,
      new_state: {
        gold: newGold,
        trainer_xp: newXp,
        trainer_level: newLevel,
        kill_count: newKills,
      },
    };
  });

// ---- Tentar captura ---------------------------------------------------------

const CaptureSchema = z.object({
  species: z.string().min(1).max(64),
  target_level: z.number().int().min(1).max(10000),
  rarity: z.enum(["common","uncommon","rare","epic","legendary","mythic","mythic_shiny"]),
  ball_type: z.enum(["pokeball","greatball","ultraball","masterball"]),
});

export const attemptCapture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CaptureSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const { CAPTURE_RATES } = await import("./game.balance.server");

    const { data: ball } = await supabase
      .from("pokeballs").select("qty").eq("user_id", userId).eq("ball_type", data.ball_type).maybeSingle();
    if (!ball || ball.qty < 1) {
      return { ok: false as const, reason: "no_ball" };
    }
    await supabase.from("pokeballs")
      .update({ qty: ball.qty - 1 })
      .eq("user_id", userId).eq("ball_type", data.ball_type);

    const rate = CAPTURE_RATES[data.rarity][data.ball_type] ?? 0.1;
    const success = Math.random() < rate;

    if (!success) {
      return { ok: true as const, captured: false, ball_used: data.ball_type };
    }

    const hpMax = 20 + data.target_level * 4;
    const { data: inserted } = await supabase.from("pokemon_collection").insert({
      user_id: userId,
      species: data.species,
      level: data.target_level,
      rarity: data.rarity,
      hp_current: hpMax,
      hp_max: hpMax,
      energy: 100,
      team_slot: null,
    }).select().single();

    const { count } = await supabase.from("pokemon_collection")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    const username = (context.claims as { user_metadata?: { username?: string } })?.user_metadata?.username ?? "Treinador";
    await supabase.from("ranked_scores").upsert({
      user_id: userId,
      username,
      pokedex_count: count ?? 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return { ok: true as const, captured: true, pokemon: inserted as PokemonDTO };
  });

// ---- Abrir baú --------------------------------------------------------------

const ChestSchema = z.object({
  chest_id: z.string().min(1).max(64),
  map_id: z.string().min(1).max(32),
});

export const openChest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ChestSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const { CHEST_LOOT, pickWeighted } = await import("./game.balance.server");

    const { data: existing } = await supabase.from("chest_claims")
      .select("id").eq("user_id", userId).eq("chest_id", data.chest_id).maybeSingle();
    if (existing) {
      return { ok: false as const, reason: "already_opened" };
    }

    const entry = pickWeighted(CHEST_LOOT);
    type Loot =
      | { kind: "nothing" }
      | { kind: "gold"; amount: number }
      | { kind: "crystal"; amount: number }
      | { kind: "ball"; ball_type: string; qty: number };
    let loot: Loot = { kind: "nothing" };

    if (entry.kind === "gold") {
      const gold = Math.floor(entry.min + Math.random() * (entry.max - entry.min + 1));
      const { data: st } = await supabase.from("trainer_state").select("gold").eq("user_id", userId).maybeSingle();
      await supabase.from("trainer_state")
        .update({ gold: Number(st?.gold ?? 0) + gold, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      loot = { kind: "gold", amount: gold };
    } else if (entry.kind === "crystal") {
      const c = Math.floor(entry.min + Math.random() * (entry.max - entry.min + 1));
      const { data: st } = await supabase.from("trainer_state").select("crystal").eq("user_id", userId).maybeSingle();
      await supabase.from("trainer_state")
        .update({ crystal: Number(st?.crystal ?? 0) + c, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      loot = { kind: "crystal", amount: c };
    } else if (entry.kind === "ball") {
      const { data: cur } = await supabase.from("pokeballs")
        .select("qty").eq("user_id", userId).eq("ball_type", entry.ball_type).maybeSingle();
      await supabase.from("pokeballs").upsert(
        { user_id: userId, ball_type: entry.ball_type, qty: (cur?.qty ?? 0) + entry.qty },
        { onConflict: "user_id,ball_type" },
      );
      loot = { kind: "ball", ball_type: entry.ball_type, qty: entry.qty };
    }

    await supabase.from("chest_claims").insert({
      user_id: userId,
      chest_id: data.chest_id,
      map_id: data.map_id,
      loot,
    });

    return { ok: true as const, loot };
  });

// ---- Trocar mapa ------------------------------------------------------------

const MoveMapSchema = z.object({ map_id: z.string().min(1).max(32) });

export const setActiveMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => MoveMapSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const { MAP_LEVEL_CAP } = await import("./game.balance.server");

    const { data: state } = await supabase.from("trainer_state")
      .select("trainer_level").eq("user_id", userId).maybeSingle();
    if (!state) return { ok: false as const, reason: "no_state" };

    const cap = MAP_LEVEL_CAP[data.map_id];
    if (cap && state.trainer_level < cap.min) {
      return { ok: false as const, reason: "level_too_low", required: cap.min };
    }

    await supabase.from("trainer_state")
      .update({ active_map: data.map_id, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    return { ok: true as const };
  });

// ---- Push inicial (one-shot): preserva progresso local do jogador ----------
// Só age se o trainer_state ainda estiver zerado (evita sobrescrever server-side legítimo).

const RarityEnum = z.enum(["common","uncommon","rare","epic","legendary","mythic","mythic_shiny"]);
const PushInitialSchema = z.object({
  gold: z.number().int().min(0).max(50_000_000),
  crystal: z.number().int().min(0).max(1_000_000),
  ruby: z.number().int().min(0).max(1_000_000).optional().default(0),
  trainer_level: z.number().int().min(1).max(10000),
  trainer_xp: z.number().int().min(0).max(1_000_000_000),
  kill_count: z.number().int().min(0).max(1_000_000).optional().default(0),
  pokeballs: z.record(z.string(), z.number().int().min(0).max(9999)),
  collection: z.array(z.object({
    id: z.string().uuid().optional(),
    species: z.string().min(1).max(64),
    level: z.number().int().min(1).max(10000),
    xp: z.number().int().min(0).max(1_000_000_000).optional().default(0),
    rarity: RarityEnum,
    team_slot: z.number().int().min(0).max(4).nullable().optional(),
  })).max(2000),
});

export const pushInitialState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PushInitialSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: boolean; applied: boolean; reason?: string }> => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    // Existe estado? Se sim e já tem progresso, ignora (server é canônico).
    const { data: cur } = await supabase.from("trainer_state")
      .select("gold, crystal, trainer_level, trainer_xp, kill_count")
      .eq("user_id", userId).maybeSingle();

    const hasProgress = cur && (
      Number(cur.gold) > 0 || Number(cur.crystal) > 0 ||
      cur.trainer_level > 1 || Number(cur.trainer_xp) > 0 ||
      Number(cur.kill_count) > 0
    );
    if (hasProgress) return { ok: true, applied: false, reason: "server_has_progress" };

    // Upsert estado do treinador com o snapshot local.
    await supabase.from("trainer_state").upsert({
      user_id: userId,
      gold: data.gold,
      crystal: data.crystal,
      ruby: data.ruby,
      trainer_level: data.trainer_level,
      trainer_xp: data.trainer_xp,
      kill_count: data.kill_count,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Pokébolas
    const ballTypes = ["pokeball","greatball","ultraball","masterball"] as const;
    for (const bt of ballTypes) {
      const qty = data.pokeballs[bt] ?? 0;
      if (qty > 0) {
        await supabase.from("pokeballs").upsert({
          user_id: userId, ball_type: bt, qty,
        }, { onConflict: "user_id,ball_type" });
      }
    }

    // Coleção — só insere se a tabela estiver vazia pro user.
    const { count: colCount } = await supabase.from("pokemon_collection")
      .select("id", { count: "exact", head: true }).eq("user_id", userId);
    if ((colCount ?? 0) === 0 && data.collection.length > 0) {
      const rows = data.collection.map((p) => {
        const hp = 20 + p.level * 4;
        return {
          ...(p.id ? { id: p.id } : {}),
          user_id: userId,
          species: p.species,
          level: p.level,
          xp: p.xp ?? 0,
          rarity: p.rarity,
          hp_current: hp,
          hp_max: hp,
          energy: 100,
          team_slot: p.team_slot ?? null,
        };
      });
      // Insere em lotes (Postgrest tem limite prático)
      const chunk = 200;
      for (let i = 0; i < rows.length; i += chunk) {
        await supabase.from("pokemon_collection").insert(rows.slice(i, i + chunk));
      }
    }

    // Espelha ranked_scores
    const username = (context.claims as { user_metadata?: { username?: string } })?.user_metadata?.username ?? "Treinador";
    const { count: pokedexCount } = await supabase.from("pokemon_collection")
      .select("id", { count: "exact", head: true }).eq("user_id", userId);
    await supabase.from("ranked_scores").upsert({
      user_id: userId,
      username,
      trainer_level: data.trainer_level,
      pokedex_count: pokedexCount ?? 0,
      total_kills: data.kill_count,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return { ok: true, applied: true };
  });

// ---- Sync client state (throttled, delta-clamped anti-cheat) ---------------
// Client empurra o snapshot local; servidor CLAMPA ganhos e persiste.
// Perdas (gastar ouro na loja etc.) são aceitas — cheat local só arma valores altos,
// e o servidor descarta o excesso silenciosamente.

const SyncSchema = z.object({
  gold: z.number().int().min(0).max(50_000_000),
  crystal: z.number().int().min(0).max(1_000_000),
  ruby: z.number().int().min(0).max(1_000_000).optional().default(0),
  trainer_level: z.number().int().min(1).max(10000),
  trainer_xp: z.number().int().min(0).max(1_000_000_000),
  kill_count: z.number().int().min(0).max(10_000_000),
  active_map: z.string().min(1).max(32).optional(),
  pokeballs: z.record(z.string(), z.number().int().min(0).max(9999)),
  collection: z.array(z.object({
    id: z.string().uuid().optional(),
    species: z.string().min(1).max(64),
    level: z.number().int().min(1).max(10000),
    xp: z.number().int().min(0).max(1_000_000_000).optional().default(0),
    rarity: RarityEnum,
    team_slot: z.number().int().min(0).max(4).nullable().optional(),
  })).max(2000),
});

// Ganhos máximos permitidos por push (~a cada 5-10s).
const CAP_GAIN = {
  gold: 250_000,
  crystal: 500,
  trainer_xp: 80_000,
  trainer_level: 3,
  kill_count: 60,
  ball_per_type: 120,
  new_pokemons: 15,
};

export const syncClientState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => SyncSchema.parse(data))
  .handler(async (args) => {
    return syncClientState_handler(args);
  });

