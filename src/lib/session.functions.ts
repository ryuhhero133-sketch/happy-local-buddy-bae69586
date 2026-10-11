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
// O código antigo lia/gravava "session_token"/"updated_at", colunas que não
// existem: TODA chamada falhava com 42703 e o lock de sessão única nunca
// funcionou. A PK em user_id já garante a unicidade exigida pelo
// onConflict("user_id") do upsert — nenhum índice extra é necessário.
//
// Política de falhas (importante):
//   - Sem registro (existing == null) => fluxo normal de primeira reivindicação.
//   - Erro de banco na LEITURA        => ok:false / SESSION_UNAVAILABLE.
//     NÃO libera a sessão silenciosamente (evita sessões simultâneas quando
//     o banco está fora) e NÃO lança exceção (o catch do AuthGate e o
//     .catch(() => {}) do heartbeat já engoliriam — gerando retry a cada 30s).
//   - Erro de banco na ESCRITA        => ok:false / SESSION_WRITE_FAILED.

export const updateActiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    // Compara a assinatura da sessão atual com a registrada no banco.
    const { data: existing, error: readError } = await supabase
      .from("active_sessions")
      .select("session_id, claimed_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (readError) {
      // Falha real de leitura: não sabemos se há outra sessão ativa.
      // Tratar como indisponível — NÃO assumir "sem sessão".
      console.warn("[active_sessions] select falhou:", readError.code, readError.message);
      return { ok: false, error: "SESSION_UNAVAILABLE", message: "Não foi possível verificar a sessão ativa. Tente novamente." };
    }

    if (existing && existing.session_id !== data.token) {
      // Já existe outra sessão ativa para esta conta — recusa a nova.
      return { ok: false, error: "SESSION_TAKEN", message: "Esta conta já está logada em outro local." };
    }

    // claimed_at marca a PRIMEIRA reivindicação e não é reescrito (coluna NOT NULL).
    // last_seen_at é o heartbeat, atualizado a cada 30s.
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase.from("active_sessions").upsert(
      {
        user_id: userId,
        session_id: data.token,
        claimed_at: existing?.claimed_at ?? now,
        last_seen_at: now,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.warn("[active_sessions] upsert falhou:", upsertError.code, upsertError.message);
      return { ok: false, error: "SESSION_WRITE_FAILED", message: "Não foi possível registrar a sessão." };
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
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    await supabase.from("active_sessions").delete().eq("user_id", userId);
    return { ok: true };
  });
