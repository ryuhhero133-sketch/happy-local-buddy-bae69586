import { supabase } from "@/integrations/supabase/client";

export async function fetchServerBalances(uid: string) {
  try {
    const { data, error } = await supabase.from("player_balances").select("gold, crystals, ruby").eq("user_id", uid).maybeSingle();
    if (error || !data) return null;
    return { gold: Number(data.gold ?? 0), crystals: Number(data.crystals ?? 0), ruby: Number(data.ruby ?? 0) };
  } catch { return null; }
}

/** Aplicação direta no ledger (minima, evita RPC complexo com inout) */
export async function applyServerBalances(uid: string, delta: { gold?: number; crystals?: number; ruby?: number }) {
  try {
    // Buscar atual para calcular
    const { data } = await supabase.from("player_balances").select("gold, crystals, ruby").eq("user_id", uid).maybeSingle();
    const cur = data || { gold: 0, crystals: 0, ruby: 0 };
    await supabase.from("player_balances").update({
      gold: Math.max(0, Number(cur.gold ?? 0) + (delta.gold ?? 0)),
      crystals: Math.max(0, Number(cur.crystals ?? 0) + (delta.crystals ?? 0)),
      ruby: Math.max(0, Number(cur.ruby ?? 0) + (delta.ruby ?? 0)),
    }).eq("user_id", uid);
    return true;
  } catch { return false; }
}
