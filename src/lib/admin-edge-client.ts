import { supabase } from "@/integrations/supabase/client";

export type AdminUpdatePayload = {
  targetUserId?: string;
  targetPokemonId?: string;
  type?: 'trainer' | 'pokemon';
  level: number;
  xp?: number;
  snapshot?: any;
  username?: string;
  craftPoints?: number;
  guildName?: string | null;
};

/**
 * V53 - DIRECT_EDGE_INVOKE
 * Chama a Edge Function diretamente do cliente usando supabase.functions.invoke.
 * O SDK anexa automaticamente o apikey e o Authorization: Bearer <access_token>
 * da sessão ativa, eliminando o erro 401 causado pelo hop no Worker.
 */
export async function updatePlayerStatsAdmin(payload: AdminUpdatePayload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    throw new Error("Sessão expirada. Faça login como administrador novamente.");
  }

  const { data, error } = await supabase.functions.invoke("admin-update-player", {
    body: { ...payload, type: payload.type ?? 'trainer' },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let detail = error.message;
    const ctx: any = (error as any).context;
    if (ctx?.json) {
      try {
        const body = await ctx.json();
        if (body?.error) detail = body.error;
      } catch { /* ignore */ }
    } else if (ctx?.text) {
      try {
        const txt = await ctx.text();
        if (txt) detail = txt;
      } catch { /* ignore */ }
    }
    if (ctx?.status === 401) {
      detail = "401 na Edge Function: token inválido ou usuário sem privilégio de administrador.";
    }
    if (ctx?.status === 404) {
      detail = "Edge Function 'admin-update-player' não encontrada. Faça o deploy no Supabase.";
    }
    throw new Error(detail);
  }

  if (data && (data as any).error) {
    throw new Error((data as any).error);
  }

  return (data as any) ?? { success: true };
}
