import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/debug-env")({
  server: {
    handlers: {
      GET: async () => {
        const env: any = {};
        const sources = ["process.env", "globalThis", "import.meta.env"];
        
        try {
          if (typeof process !== 'undefined' && process.env) {
            env.process_env = Object.keys(process.env).map(k => `${k}=${k.includes("KEY") || k.includes("SECRET") || k.includes("TOKEN") ? "***" : process.env[k]}`);
          }
        } catch (e) {}

        try {
          const g = globalThis as any;
          env.global_this = Object.keys(g).filter(k => typeof g[k] !== 'function').map(k => `${k}=${k.includes("KEY") || k.includes("SECRET") || k.includes("TOKEN") ? "***" : g[k]}`);
        } catch (e) {}

        return Response.json(env);
      },
    },
  },
});
