import "@/lib/offlineTest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const msg = (error as Error)?.message ?? String(error ?? "erro desconhecido");
  const stack = ((error as Error)?.stack ?? "")
    .split("\n")
    .slice(0, 8)
    .join("\n");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <pre
          style={{
            marginTop: 12,
            padding: 10,
            fontSize: 11,
            textAlign: "left",
            background: "#1a0306",
            color: "#fecaca",
            border: "1px solid #7f1d1d",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: 220,
            overflowY: "auto",
            userSelect: "text",
          }}
        >
          {msg}
          {stack ? "\n\n" + stack : ""}
        </pre>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Poke Emerald Saga" },
      { name: "description", content: "Poke Emerald Saga: capture, evolua e batalhe Pokémon em uma aventura pixel-art." },
      { name: "author", content: "Poke Emerald Saga" },
       { name: "theme-color", content: "#071426" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Poke Emerald Saga" },
      { property: "og:title", content: "Poke Emerald Saga" },
      { property: "og:description", content: "Capture, evolua e batalhe Pokémon em uma aventura pixel-art." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Poke Emerald Saga" },
      { name: "twitter:description", content: "Capture, evolua e batalhe Pokémon em uma aventura pixel-art." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/83df230b-fd7b-409a-ae69-9f3e05a585a2/id-preview-3ee1b917--761d0e62-e6ea-49aa-8343-99c5e00a533c.lovable.app-1783456476504.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/83df230b-fd7b-409a-ae69-9f3e05a585a2/id-preview-3ee1b917--761d0e62-e6ea-49aa-8343-99c5e00a533c.lovable.app-1783456476504.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/idle-mon-icon.png", type: "image/png" },
       { rel: "apple-touch-icon", href: "/idle-mon-icon.png" },
       { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { AuthGate } from "@/components/AuthGate";
import { useState, useEffect } from "react";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // O servidor Vite local pode reiniciar; um SW de produção não deve transformar
    // uma falha temporária do localhost na página offline do jogo.
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      ).catch((error) => console.warn("Não foi possível limpar o PWA local:", error));
      return;
    }
    if (location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("PWA indisponível:", error));
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Outlet />
      </AuthGate>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
