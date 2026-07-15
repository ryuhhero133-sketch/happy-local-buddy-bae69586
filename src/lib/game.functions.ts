// Server functions com validação anti-cheat.
// Cliente NUNCA soma recurso — sempre chama uma dessas funções e recebe o novo estado.

import { createServerFn } from "@tanstack/react-start";
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
    const { supabase, userId } = context;

    // Insere trainer_state se não existir.
    await supabase
      .from("trainer_state")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

    // 5 pokébolas iniciais.
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
    const { supabase, userId } = context;
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
    const team = pokemons.filter((p) => p.team_slot != null).sort((a, b) => (a.team_slot ?? 0) - (b.team_slot ?? 0));
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
  target_level: z.number().int().min(1).max(100),
  rarity: z.enum(["common","uncommon","rare","epic","legendary","mythic","mythic_shiny"]),
  map_id: z.string().min(1).max(32),
  leader_level: z.number().int().min(1).max(100),
});

export const reportKill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => KillSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const {
      RARITY_REWARDS, MAP_LEVEL_CAP, levelGapMultiplier,
      ULTRA_BALL_DROP_CHANCE, xpForTrainerLevel,
      KILL_MILESTONE, KILL_MILESTONE_REWARD_BALLS,
    } = await import("./game.balance.server");

    // Anti-flood: máx 6 kills/segundo do mesmo user.
    const { count } = await supabase
      .from("kill_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 1000).toISOString());
    if ((count ?? 0) > 6) {
      return { ok: false as const, reason: "rate_limit" };
    }

    // Cálculo server-side de gold/xp.
    const base = RARITY_REWARDS[data.rarity];
    const cap = MAP_LEVEL_CAP[data.map_id];
    const levelMult = 1 + data.target_level * 0.03;
    const gapMult = levelGapMultiplier(data.leader_level, data.target_level);
    const mapPenalty = cap && data.leader_level > cap.max ? 0.2 : 1.0;

    const gold = Math.max(0, Math.floor(base.gold * levelMult * gapMult * mapPenalty));
    const xp   = Math.max(0, Math.floor(base.xp   * levelMult * gapMult * mapPenalty));

    // Grava log.
    await supabase.from("kill_log").insert({
      user_id: userId,
      species: data.species,
      target_level: data.target_level,
      rarity: data.rarity,
      map_id: data.map_id,
      gold_awarded: gold,
      xp_awarded: xp,
    });

    // Ultra ball drop.
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

    // Atualiza trainer_state.
    const { data: state } = await supabase.from("trainer_state")
      .select("*").eq("user_id", userId).maybeSingle();
    if (!state) return { ok: false as const, reason: "no_state" };

    let newGold = Number(state.gold) + gold;
    let newXp = Number(state.trainer_xp) + xp;
    let newLevel = state.trainer_level;
    let newKills = Number(state.kill_count) + 1;

    // Level up loop.
    while (newXp >= xpForTrainerLevel(newLevel + 1) && newLevel < 100) {
      newXp -= xpForTrainerLevel(newLevel + 1);
      newLevel += 1;
    }

    // Milestone: a cada 100 kills, +10 pokébolas.
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

    // Atualiza ranked.
    await supabase.from("ranked_scores").upsert({
      user_id: userId,
      username: (context.claims as { user_metadata?: { username?: string } })?.user_metadata?.username ?? "Treinador",
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

// ---- Tentar captura: servidor decide sucesso --------------------------------

const CaptureSchema = z.object({
  species: z.string().min(1).max(64),
  target_level: z.number().int().min(1).max(100),
  rarity: z.enum(["common","uncommon","rare","epic","legendary","mythic","mythic_shiny"]),
  ball_type: z.enum(["pokeball","greatball","ultraball","masterball"]),
});

export const attemptCapture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CaptureSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { CAPTURE_RATES } = await import("./game.balance.server");

    // Confere e decrementa bola.
    const { data: ball } = await supabase
      .from("pokeballs").select("qty").eq("user_id", userId).eq("ball_type", data.ball_type).maybeSingle();
    if (!ball || ball.qty < 1) {
      return { ok: false as const, reason: "no_ball" };
    }
    await supabase.from("pokeballs")
      .update({ qty: ball.qty - 1 })
      .eq("user_id", userId).eq("ball_type", data.ball_type);

    // Rolar captura.
    const rate = CAPTURE_RATES[data.rarity][data.ball_type] ?? 0.1;
    const success = Math.random() < rate;

    if (!success) {
      return { ok: true as const, captured: false, ball_used: data.ball_type };
    }

    // Adicionar à coleção (fora do time).
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

    // Atualiza pokedex_count no ranked.
    const { count } = await supabase.from("pokemon_collection")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    await supabase.from("ranked_scores").upsert({
      user_id: userId,
      username: (context.claims as { user_metadata?: { username?: string } })?.user_metadata?.username ?? "Treinador",
      pokedex_count: count ?? 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return { ok: true as const, captured: true, pokemon: inserted as PokemonDTO };
  });

// ---- Abrir baú: anti-replay + loot server-side ------------------------------

const ChestSchema = z.object({
  chest_id: z.string().min(1).max(64),
  map_id: z.string().min(1).max(32),
});

export const openChest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ChestSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { CHEST_LOOT, pickWeighted } = await import("./game.balance.server");

    // Anti-replay: se já existe claim, rejeita.
    const { data: existing } = await supabase.from("chest_claims")
      .select("id").eq("user_id", userId).eq("chest_id", data.chest_id).maybeSingle();
    if (existing) {
      return { ok: false as const, reason: "already_opened" };
    }

    // Sorteia loot.
    const entry = pickWeighted(CHEST_LOOT);
    let loot: Record<string, unknown> = { kind: entry.kind };

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

    // Marca como aberto.
    await supabase.from("chest_claims").insert({
      user_id: userId,
      chest_id: data.chest_id,
      map_id: data.map_id,
      loot,
    });

    return { ok: true as const, loot };
  });

// ---- Trocar mapa: valida level cap ------------------------------------------

const MoveMapSchema = z.object({ map_id: z.string().min(1).max(32) });

export const setActiveMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => MoveMapSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
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
