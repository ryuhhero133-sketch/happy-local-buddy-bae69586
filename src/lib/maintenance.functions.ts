import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const checkMaintenanceMode = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      // Usamos o public-publishable client para ler uma configuração global
      // Note: No Supabase, se value for JSONB, data.value pode vir como string "true" ou booleano true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("app_config")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      
      if (error) {
        console.error("[Maintenance] DB error:", error);
        return { enabled: false };
      }

      const isEnabled = data?.value === "true" || data?.value === true;
      console.log("[Maintenance] Check status:", isEnabled, data?.value);
      return { enabled: isEnabled };
    } catch (e) {

      console.error("[Maintenance] Error checking mode:", e);
      return { enabled: false };
    }
  });

export const isAdmin = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      return { isAdmin: !!data };
    } catch (e) {
      return { isAdmin: false };
    }
  });
