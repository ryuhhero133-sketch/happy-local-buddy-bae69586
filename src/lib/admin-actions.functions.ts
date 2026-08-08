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
    // V35: Ponto central de salvamento. O import dinâmico do client.server garante bypass de RLS.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // O erro de configuração será lançado pelo client.server se as chaves faltarem.
    // Aqui apenas confirmamos que o objeto existe.
    if (!supabaseAdmin) {
      throw new Error("Erro Crítico: supabaseAdmin não pôde ser carregado no servidor.");
    }

    const lockUntil = new Date(Date.now() + 20000).toISOString();
    console.log(`[AdminServer] Iniciando update para ${data.targetUserId} (Level: ${data.level})`);

    try {
      // 1. Atualizações em massa ignorando RLS (via Service Role)
      // Usamos type-casting (as any) para evitar erros de tipagem quando o schema local não está atualizado
      const ops = [
        (supabaseAdmin.from("game_saves") as any).upsert({
          user_id: data.targetUserId,
          data: data.snapshot,
          updated_at: new Date().toISOString()
        }),
        (supabaseAdmin.from("trainer_state" as any) as any).upsert({
          user_id: data.targetUserId,
          trainer_level: data.level,
          trainer_xp: data.xp,
          updated_at: new Date().toISOString()
        }),
        (supabaseAdmin.from("ranked_scores" as any) as any).upsert({
          user_id: data.targetUserId,
          username: data.username,
          trainer_level: data.level,
          updated_at: new Date().toISOString()
        }),
        (supabaseAdmin.from("profiles" as any) as any).update({
          trainer_level: data.level,
          updated_at: new Date().toISOString(),
          lock_until: lockUntil,
          account_status: 'active'
        }).eq("id", data.targetUserId)
      ];

      const results = await Promise.all(ops);
      
      const error = results.find(r => r.error)?.error;
      if (error) {
        console.error("[AdminServer] Erro no banco de dados:", error);
        throw new Error(`Erro Supabase: ${error.message} (${error.code})`);
      }

      // 2. Sincroniza o ranking global via RPC
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabaseAdmin.rpc as any)("record_ranked_score", {
        _level: data.level,
        _craft_points: data.craftPoints,
        _guild_name: data.guildName
      });
      
      if (rpcError) {
        console.warn("[AdminServer] RPC record_ranked_score falhou (continuando):", rpcError);
      }

      console.log(`[AdminServer] Update concluído com sucesso para ${data.targetUserId}`);
      return { success: true };
    } catch (err: any) {
      console.error("[AdminServer] Falha crítica no processamento:", err);
      throw new Error(err.message || "Erro interno no servidor ao processar atualização.");
    }
  });
