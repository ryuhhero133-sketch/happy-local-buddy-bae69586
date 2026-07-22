// Cash Shop tickets — chat persistido no Supabase (users ↔ admin)
import { supabase } from "@/integrations/supabase/client";

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

export async function fetchThread(userId: string): Promise<TicketMsg[]> {
  const { data, error } = await supabase
    .from("cashshop_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) { console.error("[chat] fetchThread", error); return []; }
  return (data ?? []) as TicketMsg[];
}

export async function sendUserMessage(userId: string, username: string, text: string, image?: string) {
  const { error } = await supabase.from("cashshop_tickets").insert({
    user_id: userId, username, from_role: "user", text, image: image ?? null,
  });
  if (error) console.error("[chat] sendUserMessage", error);
  return !error;
}

export async function sendAdminMessage(targetUserId: string, adminName: string, text: string, image?: string) {
  const { error } = await supabase.from("cashshop_tickets").insert({
    user_id: targetUserId, username: adminName, from_role: "support", text, image: image ?? null,
  });
  if (error) console.error("[chat] sendAdminMessage", error);
  return !error;
}

export async function fetchThreadsForAdmin(): Promise<AdminThreadSummary[]> {
  const { data, error } = await supabase
    .from("cashshop_tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) { console.error("[chat] fetchThreadsForAdmin", error); return []; }
  const map = new Map<string, AdminThreadSummary>();
  for (const r of (data as TicketMsg[])) {
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
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "cashshop_tickets", filter: `user_id=eq.${userId}` },
      (payload) => cb(payload.new as TicketMsg),
    )
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

export function subscribeAll(cb: (msg: TicketMsg) => void) {
  const ch = supabase
    .channel("ticket_all")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "cashshop_tickets" },
      (payload) => cb(payload.new as TicketMsg),
    )
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}
