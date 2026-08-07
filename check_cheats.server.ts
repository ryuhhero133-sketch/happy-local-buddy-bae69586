import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function run() {
  console.log("--- Jogadores com nível > 1 no ranking ---");
  const { data: ranked } = await supabaseAdmin
    .from("ranked_scores")
    .select("username, trainer_level, total_kills")
    .gt("trainer_level", 1)
    .order("trainer_level", { ascending: false });
  console.log(JSON.stringify(ranked || [], null, 2));

  console.log("\n--- Contagem de auditoria ---");
  const { count } = await supabaseAdmin
    .from("audit_events" as any)
    .select("*", { count: 'exact', head: true });
  console.log("Total eventos:", count);

  console.log("\n--- Histórico de códigos resgatados ---");
  const { data: redemptions } = await supabaseAdmin
    .from("code_redemptions" as any)
    .select("code, username, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  console.log(JSON.stringify(redemptions || [], null, 2));
}

run();
