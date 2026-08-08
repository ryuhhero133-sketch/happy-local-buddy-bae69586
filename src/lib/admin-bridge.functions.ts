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
      // A autorização será validada LÁ usando o Bearer Token do Admin ou uma chave de serviço interna do Supabase
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // O token do admin logado pode ser passado aqui se necessário
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[AdminBridge] Edge Function falhou:", errorText);
        throw new Error(`Erro na Edge Function: ${errorText}`);
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (err: any) {
      console.error("[AdminBridge] Falha na ponte:", err);
      
      // FALLBACK MENSAGEM: Se a Edge Function ainda não existir, informamos o status
      if (err.message.includes("404")) {
         throw new Error("Supabase Edge Function 'admin-update-player' não encontrada. Certifique-se de realizar o deploy no Supabase.");
      }
      
      throw new Error(err.message || "Erro ao conectar com a autoridade administrativa do Supabase.");
    }
  });
