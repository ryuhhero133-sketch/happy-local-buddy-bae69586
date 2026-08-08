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
    // V33: A função de servidor DEVE ter acesso às variáveis de ambiente
    // O import dinâmico garante que o código do admin client não vaze para o bundle do cliente.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Verificamos se o client foi inicializado corretamente (evita erro silencioso se a env faltar)
    if (!supabaseAdmin) {
      throw new Error("Falha ao inicializar o cliente administrativo Supabase.");
    }

    const lockUntil = new Date(Date.now() + 20000).toISOString();
    console.log(`[AdminServer] Iniciando update para ${data.targetUserId} (Level: ${data.level})`);

    try {
      // 1. Atualizações em massa ignorando RLS (via Service Role)
      // Usamos upsert forçado para garantir que o registro seja criado se não existir
      const ops = [
        supabaseAdmin.from("game_saves").upsert({
          user_id: data.targetUserId,
          data: data.snapshot,
          updated_at: new Date().toISOString()
        }),
        supabaseAdmin.from("trainer_state" as any).upsert({
          user_id: data.targetUserId,
          trainer_level: data.level,
          trainer_xp: data.xp,
          updated_at: new Date().toISOString()
        }),
        supabaseAdmin.from("ranked_scores").upsert({
          user_id: data.targetUserId,
          username: data.username,
          trainer_level: data.level,
          updated_at: new Date().toISOString()
        }),
        supabaseAdmin.from("profiles").update({
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
