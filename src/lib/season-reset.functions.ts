import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const executeSeasonReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    // 1. Verificar se já resetou
    // 1. Verificar se o estado existe ou criar se estiver faltando (bootstrap de segurança)
    let { data: trainer, error: trainerErr } = await supabase
      .from("trainer_state")
      .select("season_reset_used")
      .eq("user_id", userId)
      .maybeSingle();

    if (trainerErr) {
      console.error("Erro ao buscar trainer_state:", trainerErr);
      throw new Error("Erro de conexão com o banco de dados.");
    }

    if (!trainer) {
      // Se não existe, tentamos criar um estado inicial
      console.log("Estado não encontrado, tentando bootstrap para o usuário:", userId);
      const { data: newState, error: upsertErr } = await supabase
        .from("trainer_state")
        .upsert({ user_id: userId }, { onConflict: "user_id" })
        .select("season_reset_used")
        .single();
      
      if (upsertErr) {
        console.error("Erro no bootstrap do trainer_state:", upsertErr);
        throw new Error("Estado do treinador não pôde ser criado.");
      }
      trainer = newState;
    }
    
    if (trainer.season_reset_used) {
      throw new Error("O Ritual de Reset já foi realizado por este treinador.");
    }

    // Operação Atômica via RPC que zera níveis e converte coleção em Fragmentos Vermelhos
    const { data: rpcData, error: rpcError } = await supabase.rpc("perform_season_reset", {
      p_user_id: userId
    }) as { data: any, error: any };

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error(rpcError.message);
    }

    return { success: true, message: "Nova Jornada Iniciada!" };
  });
