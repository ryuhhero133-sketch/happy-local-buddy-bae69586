import { supabase } from "@/integrations/supabase/client";

export async function executeSeasonReset() {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke("season-reset", {
    body: {}, // A lógica do usuário é extraída do token
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let detail = error.message;
    const ctx: any = (error as any).context;
    if (ctx?.status === 401) {
      detail = "Não autorizado para realizar o reset.";
    }
    throw new Error(detail);
  }

  if (data && (data as any).error) {
    throw new Error((data as any).error);
  }

  return (data as any) ?? { success: true };
}
