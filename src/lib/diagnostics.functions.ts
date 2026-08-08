import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "vinxi/http";

export const getAdminDiagnostics = createServerFn({ method: "GET" })
  .handler(async () => {
    let env: Record<string, any> = {};
    
    // 1. Tentar process.env
    try {
      if (typeof process !== 'undefined' && process.env) {
        env = { ...env, ...process.env };
      }
    } catch (e) {}

    // 2. Tentar Contexto do Vinxi/H3 (Nitro)
    try {
      const event = getEvent();
      // No Cloudflare Worker, o Nitro injeta os bindings em event.context.cloudflare.env
      const cfEnv = (event?.context as any)?.cloudflare?.env;
      if (cfEnv) {
        env = { ...env, ...cfEnv };
      }
    } catch (e) {}

    const ADMIN_SB_KEY = env.ADMIN_SB_KEY || (globalThis as any).ADMIN_SB_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || (globalThis as any).SUPABASE_SERVICE_ROLE_KEY || ADMIN_SB_KEY;
    const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL || (globalThis as any).SUPABASE_URL || (globalThis as any).VITE_SUPABASE_URL || "https://kgrspvqhpgiuxvkcxgcp.supabase.co";

    return {
      ADMIN_SB_KEY: ADMIN_SB_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      SUPABASE_URL: SUPABASE_URL ? "CONFIGURED" : "NOT_CONFIGURED",
      RUNTIME: (globalThis as any).caches ? "Cloudflare Worker (Edge)" : "Node/Bun",
      HAS_PROCESS_ENV: typeof process !== 'undefined',
      HAS_GLOBAL_KEY: !!(globalThis as any).ADMIN_SB_KEY,
      HAS_VINXI_CONTEXT: !!env.ADMIN_SB_KEY && !process.env?.ADMIN_SB_KEY
    };
  });
