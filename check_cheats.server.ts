import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function run() {
  console.log("--- Suspeitos de Nível 10.000 ---");
  try {
    const { data: suspects } = await supabaseAdmin
      .from("audit_events" as any)
      .select("created_at, username, user_id, detail")
      .eq("kind", "save_delta")
      .order("created_at", { ascending: false })
      .limit(50);

    const levelSuspects = suspects?.filter((s: any) => 
      (s.detail?.level_to >= 9000) && 
      s.user_id !== "61b4d001-c8c3-424d-862d-0b798782f9d6" &&
      s.username !== "lordryuhhh"
    );
    
    console.log(JSON.stringify(levelSuspects || [], null, 2));

    console.log("\n--- Saltos de Nível Bruscos (>5) nas últimas 24h ---");
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: deltas } = await supabaseAdmin
      .from("audit_events" as any)
      .select("created_at, username, detail")
      .eq("kind", "save_delta")
      .gt("created_at", yesterday)
      .order("created_at", { ascending: false });

    const majorDeltas = deltas?.filter((d: any) => 
      (d.detail?.level_to - d.detail?.level_from) > 5
    );
    console.log(JSON.stringify(majorDeltas || [], null, 2));
    
    console.log("\n--- Tentativas de rate limit (Kill Spam) ---");
     const { data: rateLogs } = await supabaseAdmin
      .from("audit_events" as any)
      .select("created_at, username, detail")
      .eq("kind", "rate_limit")
      .gt("created_at", yesterday)
      .order("created_at", { ascending: false });
    console.log(JSON.stringify(rateLogs || [], null, 2));

  } catch (err) {
    console.error("Erro na consulta:", err);
  }
}

run();
