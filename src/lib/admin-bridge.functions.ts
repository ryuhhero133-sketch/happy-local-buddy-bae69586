import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminUpdateSchema = z.object({
  targetUserId: z.string().optional(),
  targetPokemonId: z.string().optional(),
  type: z.enum(['trainer', 'pokemon']).default('trainer'),
  level: z.number(),
  xp: z.number().optional(),
  snapshot: z.any().optional(),
  username: z.string().optional(),
  craftPoints: z.number().optional(),
  guildName: z.string().nullable().optional(),
});

/**
 * V42 - BRIDGE_TO_EDGE_FUNCTION
 * Esta Server Function atua como uma ponte para a Supabase Edge Function.
 * Ela não tenta mais ler ADMIN_SB_KEY no Cloudflare Worker.
 */
export const updatePlayerStatsAdminBridge = createServerFn({ method: "POST" })
  .inputValidator((data) => adminUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    // 1. Obter token de autenticação do usuário logado (o Admin)
    // No TanStack Start, o context do Supabase Auth está disponível se o middleware for usado
    // Mas para manter a simplicidade e autoridade, vamos delegar a validação de Role para a Edge Function
    
    const SUPABASE_URL = "https://kgrspvqhpgiuxvkcxgcp.supabase.co";
    const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/admin-update-player`;
    
    console.log(`[AdminBridge] Encaminhando update para Edge Function: ${data.targetUserId}`);

    try {
      // Chamada para a Supabase Edge Function
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: Se a função no Supabase for protegida, ela precisará de um Authorization header.
          // Como estamos em um ambiente server-side (Worker), poderíamos usar a anon key ou o token do usuário.
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const status = response.status;
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }

        console.error(`[AdminBridge] Edge Function falhou (Status: ${status}):`, errorData);

        if (status === 404) {
          throw new Error("A Edge Function 'admin-update-player' não foi encontrada no seu projeto Supabase. Certifique-se de realizar o deploy da função no painel do Supabase.");
        }

        const message = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
        throw new Error(`Erro na Edge Function (${status}): ${message}`);
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (err: any) {
      console.error("[AdminBridge] Falha na ponte:", err);
      throw new Error(err.message || "Erro ao conectar com a autoridade administrativa do Supabase.");
    }
  });
