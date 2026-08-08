import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "vinxi/http";

export const getAdminDiagnostics = createServerFn({ method: "GET" })
  .handler(async () => {
    // No Cloudflare Worker, as variáveis de ambiente (bindings) estão no contexto do evento (Vinxi/Nitro)
    const event = getEvent();
    
    // O TanStack Start/Nitro armazena o contexto do worker em event.context.cloudflare.env
    const cfEnv = (event?.context as any)?.cloudflare?.env || (event?.context as any)?.env || {};
    
    // Também checamos process.env (para compatibilidade local/node)
    const env = { ...process.env, ...cfEnv };

    const ADMIN_SB_KEY = env.ADMIN_SB_KEY || (globalThis as any).ADMIN_SB_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || (globalThis as any).SUPABASE_SERVICE_ROLE_KEY || ADMIN_SB_KEY;
    const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "https://kgrspvqhpgiuxvkcxgcp.supabase.co";

    return {
      ADMIN_SB_KEY: ADMIN_SB_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      SUPABASE_URL: SUPABASE_URL ? "CONFIGURED" : "NOT_CONFIGURED",
      RUNTIME: (globalThis as any).caches ? "Cloudflare Worker (Edge)" : "Node/Bun",
      HAS_CF_CONTEXT: !!(event?.context as any)?.cloudflare,
      CF_ENV_KEYS: Object.keys(cfEnv).filter(k => !k.includes("KEY") && !k.includes("SECRET"))
    };
  });
