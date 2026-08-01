// 🌐 Log de IP / rede do jogador.
// Cliente descobre o IP público, registra via RPC (SECURITY DEFINER) e pode
// listar seu próprio histórico. Admin (role 'admin') vê o de todos via RLS.
import { supabase } from "@/integrations/supabase/client";

export type IpLogRow = {
  id: string;
  user_id: string;
  username: string | null;
  ip: string;
  user_agent: string | null;
  created_at: string;
};

const IP_CACHE_KEY = "rubym.net.ip.v1";

export async function detectPublicIp(): Promise<string | null> {
  try {
    const cachedRaw = localStorage.getItem(IP_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as { ip: string; at: number };
      if (cached?.ip && Date.now() - cached.at < 30 * 60 * 1000) return cached.ip;
    }
  } catch { /* ignore */ }

  const endpoints = [
    "https://api.ipify.org?format=json",
    "https://ipapi.co/json/",
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const json = (await res.json()) as { ip?: string };
      if (json?.ip) {
        try { localStorage.setItem(IP_CACHE_KEY, JSON.stringify({ ip: json.ip, at: Date.now() })); } catch { /* ignore */ }
        return json.ip;
      }
    } catch { /* tenta o próximo */ }
  }
  return null;
}

/** Registra o acesso atual. Silencioso em caso de falha — nunca bloqueia o login. */
export async function recordIpLog(username?: string | null): Promise<string | null> {
  const ip = await detectPublicIp();
  if (!ip) return null;
  try {
    await supabase.rpc("log_player_ip", {
      _ip: ip,
      _user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : null,
      _username: username ?? null,
    });
  } catch { /* offline / sem tabela ainda */ }
  return ip;
}

/** Meu histórico (ou de todos, se a conta for admin — RLS decide). */
export async function fetchIpLogs(limit = 100): Promise<IpLogRow[]> {
  try {
    const { data, error } = await supabase
      .from("ip_logs" as never)
      .select("id,user_id,username,ip,user_agent,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as unknown as IpLogRow[];
  } catch {
    return [];
  }
}
