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
  .handler(async ({ data, context }) => {
    const authHeader = (context as any).request?.headers?.get("Authorization");
    
    const SUPABASE_URL = "https://kgrspvqhpgiuxvkcxgcp.supabase.co";
    const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/admin-update-player`;
    
    console.log(`[AdminBridge] Forwarding update (${data.type}) by ${authHeader ? 'authed user' : 'anonymous'}`);

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {}),
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const status = response.status;
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }

        console.error(`[AdminBridge] Edge Function failed (${status}):`, errorData);

        if (status === 404) {
          throw new Error("A Edge Function 'admin-update-player' não foi encontrada. Realize o deploy no Supabase.");
        }

        throw new Error(errorData.error || `Erro ${status} na Edge Function`);
      }

      return await response.json();
    } catch (err: any) {
      console.error("[AdminBridge] Bridge failure:", err);
      throw new Error(err.message || "Erro de conexão com o Supabase.");
    }
  });
