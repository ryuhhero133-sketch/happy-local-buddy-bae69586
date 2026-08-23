import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPlayerPvpSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const { data } = await supabase.from("player_pvp_settings").select("*").eq("user_id", userId).maybeSingle();
    return data || { pvp_mode: "peaceful" };
  });

export const updatePlayerPvpSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({ pvp_mode: z.enum(["peaceful", "manual", "auto"]) }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    await supabase.from("player_pvp_settings").upsert({ user_id: userId, pvp_mode: data.pvp_mode }, { onConflict: "user_id" });
    return { ok: true };
  });

export const startPvpBattle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({ target_user_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    if (userId === data.target_user_id) throw new Error("Não pode atacar a si mesmo.");

    // Validar se alvo existe e está online (simplificado)
    const { data: targetPlayer } = await supabase.from("players").select("id, name, guild_name").eq("id", data.target_user_id).maybeSingle();
    if (!targetPlayer) throw new Error("Jogador não encontrado.");

    // Checar Party (Server Side)
    const { data: myParty } = await supabase.from("party_members").select("party_id").eq("player_id", userId).maybeSingle();
    if (myParty) {
      const { data: targetInParty } = await supabase.from("party_members")
        .select("player_id").eq("player_id", data.target_user_id).eq("party_id", myParty.party_id).maybeSingle();
      if (targetInParty) throw new Error("Este jogador faz parte da sua Party.");
    }

    // Criar registro de batalha
    const { data: battle } = await supabase.from("pvp_battles").insert({
      attacker_id: userId,
      defender_id: data.target_user_id,
      status: "active"
    }).select().single();

    return { ok: true, battle_id: (battle as any).id };
  });
