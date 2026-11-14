import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const [message, setMessage] = useState("Finalizando login seguro...");

  useEffect(() => {
    let cancelled = false;
    const finishOAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const providerError = params.get("error_description") ?? params.get("error");
      if (providerError) {
        if (!cancelled) setMessage(`Não foi possível entrar: ${providerError}`);
        return;
      }

      try {
        // supabase-js pode concluir PKCE durante sua inicialização. Só troca o
        // código aqui quando a sessão ainda não foi estabelecida.
        const { data: existing } = await supabase.auth.getSession();
        const code = params.get("code");
        if (!existing.session && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) throw new Error("A sessão não foi criada. Tente entrar novamente.");
        window.location.replace("/idle");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Falha ao concluir o login.");
      }
    };
    void finishOAuth();
    return () => { cancelled = true; };
  }, []);

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#071426", color: "#e5f4ff", fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center" }}>
    <p>{message}</p>
  </main>;
}
