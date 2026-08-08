import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminUpdateSchema = z.object({
  targetUserId: z.string(),
  level: z.number(),
  xp: z.number(),
  snapshot: z.any(),
  username: z.string(),
  craftPoints: z.number(),
  guildName: z.string().nullable(),
});

export const updatePlayerStatsAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => adminUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    // V27: A função de servidor DEVE ter acesso às variáveis de ambiente
    // O erro de "configuração incompleta" acontece se process.env.SUPABASE_SERVICE_ROLE_KEY for undefined.
    // Estamos usando o proxy supabaseAdmin que busca as chaves no momento da primeira chamada.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const lockUntil = new Date(Date.now() + 20000).toISOString();

    console.log(`[AdminServer] Iniciando update para ${data.targetUserId} (Level: ${data.level})`);

    try {
      const results = await Promise.all([
        (supabaseAdmin.from("game_saves") as any).upsert({
          user_id: data.targetUserId,
          data: data.snapshot,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" }),
        (supabaseAdmin.from("trainer_state") as any).upsert({
          user_id: data.targetUserId,
          trainer_level: data.level,
          trainer_xp: data.xp,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" }),
        (supabaseAdmin.from("ranked_scores") as any).upsert({
          user_id: data.targetUserId,
          username: data.username,
          trainer_level: data.level,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" }),
        (supabaseAdmin.from("profiles") as any).update({
          trainer_level: data.level,
          updated_at: new Date().toISOString(),
          lock_until: lockUntil,
          account_status: 'active'
        }).eq("id", data.targetUserId),
        // Sincroniza o ranking global
        (supabaseAdmin.rpc as any)("record_ranked_score", {
          _level: data.level,
          _craft_points: data.craftPoints,
          _guild_name: data.guildName
        })
      ]);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error("[AdminServer] Erro parcial no update:", errors[0].error);
        throw new Error(`Erro no banco: ${errors[0].error?.message}`);
      }

      console.log(`[AdminServer] Update concluído com sucesso para ${data.targetUserId}`);
      return { success: true };
    } catch (err: any) {
      console.error("[AdminServer] Falha crítica no update:", err);
      throw new Error(err.message || "Falha desconhecida no servidor");
    }
  });
