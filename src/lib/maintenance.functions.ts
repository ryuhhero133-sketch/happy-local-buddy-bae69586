import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const setMaintenanceMode = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ enabled: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await (supabaseAdmin as any)
      .from("server_config")
      .upsert({ key: "maintenance_mode", value: String(data.enabled) }, { onConflict: 'key' });

    if (error) {
      console.error("Erro ao atualizar manutenção:", error);
      throw new Error("Falha ao atualizar configuração");
    }

    return { success: true, enabled: data.enabled };
  });
