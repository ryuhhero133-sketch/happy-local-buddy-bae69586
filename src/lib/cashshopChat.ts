// Cash Shop tickets — chat persistido no Supabase (users ↔ admin)
// Tabela ainda não gerada em types.ts, então usamos casts amplos.
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from("cashshop_tickets");

export type TicketMsg = {
  id: string;
  user_id: string;
  username: string;
  from_role: "user" | "support";
  text: string;
  image: string | null;
  created_at: string;
};

export type AdminThreadSummary = {
  user_id: string;
  username: string;
  last_text: string;
  last_ts: string;
  count: number;
};

let lastChatError: string | null = null;
let lastSalesError: string | null = null;

export function getCashShopChatError() {
  return lastChatError;
}

export function getCashShopSalesError() {
  return lastSalesError;
}

export async function checkCashShopAdmin(userId: string): Promise<{ ok: boolean; error: string | null }> {
  if (!userId || userId === "guest" || userId.startsWith("guest-")) return { ok: false, error: "Conta convidada não pode ser admin." };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);

  if (error) {
    console.error("[chat] checkCashShopAdmin", error);
    return { ok: false, error: error.message ?? String(error) };
  }
  return { ok: Array.isArray(data) && data.length > 0, error: null };
}

export async function fetchThread(userId: string): Promise<TicketMsg[]> {
  const { data, error } = await db()
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) { lastChatError = error.message ?? String(error); console.error("[chat] fetchThread", error); return []; }
  lastChatError = null;
  return (data ?? []) as TicketMsg[];
}

export async function sendUserMessage(userId: string, username: string, text: string, image?: string) {
  const { error } = await db().insert({
    user_id: userId, username, from_role: "user", text, image: image ?? null,
  });
  if (error) { lastChatError = error.message ?? String(error); console.error("[chat] sendUserMessage", error); }
  else lastChatError = null;
  return !error;
}

export async function sendAdminMessage(targetUserId: string, adminName: string, text: string, image?: string) {
  const { error } = await db().insert({
    user_id: targetUserId, username: adminName, from_role: "support", text, image: image ?? null,
  });
  if (error) { lastChatError = error.message ?? String(error); console.error("[chat] sendAdminMessage", error); }
  else lastChatError = null;
  return !error;
}

export async function fetchThreadsForAdmin(): Promise<AdminThreadSummary[]> {
  const { data, error } = await db()
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) { lastChatError = error.message ?? String(error); console.error("[chat] fetchThreadsForAdmin", error); return []; }
  lastChatError = null;
  const map = new Map<string, AdminThreadSummary>();
  for (const r of ((data ?? []) as TicketMsg[])) {
    const cur = map.get(r.user_id);
    if (!cur) {
      map.set(r.user_id, {
        user_id: r.user_id,
        username: r.username || "Treinador",
        last_text: r.text || (r.image ? "📎 imagem" : ""),
        last_ts: r.created_at,
        count: 1,
      });
    } else {
      cur.count++;
    }
  }
  return [...map.values()].sort((a, b) => b.last_ts.localeCompare(a.last_ts));
}

export function subscribeThread(userId: string, cb: (msg: TicketMsg) => void) {
  const ch = supabase
    .channel(`ticket_${userId}`)
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "cashshop_tickets", filter: `user_id=eq.${userId}` },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => cb(payload.new as TicketMsg),
    )
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

export function subscribeAll(cb: (msg: TicketMsg) => void) {
  const ch = supabase
    .channel("ticket_all")
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "cashshop_tickets" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => cb(payload.new as TicketMsg),
    )
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

// ============= PENDING PURCHASES (vendas em análise) =============
export type PendingSale = {
  id: string;
  user_id: string;
  username: string;
  product_id: string;
  product_name: string;
  price_brl: number | null;
  payment_method: string | null;
  transaction_ref: string | null;
  status: "analise" | "approved" | "rejected" | "expired";
  admin_note: string | null;
  created_at: string;
  expires_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdb = () => (supabase as any).from("pending_purchases");

export async function fetchPendingSales(): Promise<PendingSale[]> {
  const { data, error } = await pdb()
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) { lastSalesError = error.message ?? String(error); console.error("[cash] fetchPendingSales", error); return []; }
  lastSalesError = null;
  return (data ?? []) as PendingSale[];
}

export async function updatePendingStatus(
  id: string,
  status: "approved" | "rejected",
  adminName: string,
  note?: string,
) {
  const { error } = await pdb()
    .update({
      status,
      approved_by: adminName,
      admin_note: note ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) { lastSalesError = error.message ?? String(error); console.error("[cash] updatePendingStatus", error); }
  else lastSalesError = null;
  return !error;
}

export function subscribePendingSales(cb: () => void) {
  const ch = supabase
    .channel("pending_purchases_all")
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "pending_purchases" },
      () => cb(),
    )
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}
