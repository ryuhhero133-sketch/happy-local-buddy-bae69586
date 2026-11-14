// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// Navegações interrompidas durante recompilações do Vite podem emitir
// ECONNRESET num socket sem listener (Node 24), encerrando o servidor local.
const ignoreDisconnectedDevClients: Plugin = {
  name: "ignore-disconnected-dev-clients",
  apply: "serve",
  configureServer(server) {
    server.httpServer?.on("connection", (socket) => {
      socket.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code !== "ECONNRESET" && error.code !== "EPIPE") {
          console.error("Erro no socket do servidor de desenvolvimento:", error);
        }
      });
    });
  },
};

export default defineConfig({
  vite: { plugins: [ignoreDisconnectedDevClients] },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
