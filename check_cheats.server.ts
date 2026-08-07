import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function run() {
  console.log("--- Jogadores Ativos nas últimas 24h ---");
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("username, id, last_login, account_status")
    .gt("last_login", yesterday)
    .order("last_login", { ascending: false });
  console.log(JSON.stringify(profiles || [], null, 2));

  console.log("\n--- Maiores Níveis no Ranking ---");
  const { data: ranked } = await supabaseAdmin
    .from("ranked_scores")
    .select("username, trainer_level, total_kills")
    .order("trainer_level", { ascending: false })
    .limit(20);
  console.log(JSON.stringify(ranked || [], null, 2));

  console.log("\n--- Últimos 50 Eventos de Auditoria ---");
  const { data: audits } = await supabaseAdmin
    .from("audit_events" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  console.log(JSON.stringify(audits || [], null, 2));
}

run();
