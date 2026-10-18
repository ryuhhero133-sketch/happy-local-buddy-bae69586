// Trava de USO ÚNICO POR CONTA para códigos promocionais.
//
// O localStorage (redeemedCodes) só protege o mesmo navegador — duas contas
// diferentes no mesmo PC (ou em PCs diferentes) compartilhariam o código. Por
// isso o resgate grava uma linha em `promo_code_uses`, cuja `code` é PRIMARY
// KEY: o segundo INSERT do mesmo código falha com 23505 (duplicate key) e o
// código é recusado. O bloqueio é atômico no banco.
//
// Requer a tabela criada em supabase/migrations/20261017120000_promo_code_uses.sql
// (SQL Editor do Supabase). Sem a tabela, o caller decide o fallback.
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export type PromoClaimResult = {
  ok: boolean;
  /** undefined quando ok === true */
  reason?: "already_used" | "not_logged" | "server_lock_missing" | "error";
  message?: string;
};

export async function claimPromoCodeOnce(
  code: string,
  userId: string | null,
  username: string | null,
): Promise<PromoClaimResult> {
  if (!userId) return { ok: false, reason: "not_logged" };
  try {
    const { error } = await sb.from("promo_code_uses").insert({
      code,
      user_id: userId,
      username: username ?? null,
    });
    if (!error) return { ok: true };

    const errCode = String(error.code ?? "");
    const errMsg = String(error.message ?? "");

    // 23505 = duplicate key → outra conta já resgatou este código.
    if (errCode === "23505" || /duplicate key|already exists/i.test(errMsg)) {
      return { ok: false, reason: "already_used" };
    }
    // 42P01 = relation does not exist → migration ainda não aplicada.
    if (errCode === "42P01" || /does not exist/i.test(errMsg)) {
      return { ok: false, reason: "server_lock_missing" };
    }
    return { ok: false, reason: "error", message: errMsg };
  } catch (e) {
    const msg = String((e as Error)?.message ?? e ?? "");
    if (/does not exist/i.test(msg)) return { ok: false, reason: "server_lock_missing" };
    return { ok: false, reason: "error", message: msg };
  }
}