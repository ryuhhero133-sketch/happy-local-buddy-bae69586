import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Sessão única por conta: a PRIMEIRA aba/dispositivo vence, a SEGUNDA é
// recusada. A assinatura da sessão é um uuid gerado no cliente e guardado
// em sessionStorage — mesma lógica de antes, agora nas colunas reais.
//
// Schema real de public.active_sessions (verificado no Supabase):
//   user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
//   session_id uuid NOT NULL
//   claimed_at timestamptz NOT NULL
//   last_seen_at timestamptz NOT NULL
//
// claim_session faz a disputa atomicamente no banco. Uma falha nunca é
// interpretada como ausência de sessão; o AuthGate bloqueia a entrada.

export const updateActiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;

    // O RPC faz o claim e a verificação em uma única transação. SELECT seguido
    // de UPSERT no cliente permitia que duas abas reivindicassem a mesma conta.
    const { data: claim, error: claimError } = await supabase.rpc("claim_session", {
      p_session_id: data.token,
    });
    if (claimError) {
      console.warn("[active_sessions] claim falhou:", claimError.code, claimError.message);
      return { ok: false, error: "SESSION_WRITE_FAILED", message: "Não foi possível registrar a sessão." };
    }
    if (claim?.ok !== true) {
      return { ok: false, error: claim?.reason === "SESSION_TAKEN" ? "SESSION_TAKEN" : "SESSION_UNAVAILABLE",
        message: "Não foi possível confirmar a sessão ativa." };
    }
    return { ok: true };
  });

export const getActiveSessionToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    const { data, error } = await supabase
      .from("active_sessions")
      .select("session_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // Sem registro => null (fluxo normal). Erro de banco => null + log,
      // para não confundir "sem sessão" com "banco indisponível" em silêncio.
      console.warn("[active_sessions] select falhou:", error.code, error.message);
      return { token: null, error: "SESSION_UNAVAILABLE" as const };
    }

    return { token: data?.session_id ?? null };
  });

export const clearActiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    const { data: released, error } = await supabase.rpc("release_session", { p_session_id: data.token });
    return { ok: !error && released === true };
  });
