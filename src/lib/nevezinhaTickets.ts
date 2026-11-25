import { supabase } from "@/integrations/supabase/client";

/** Soma tickets extras ao evento da Nevezinha (prêmio a cada 3 missões). */
export async function grantNevezinhaTickets(amount: number): Promise<void> {
  if (!Number.isSafeInteger(amount) || amount <= 0) return;
  try {
    await (supabase as any).rpc("nevezinha_grant_tickets", { p_amount: amount });
  } catch {
    /* o próximo login/evento tenta de novo se necessario */
  }
}
