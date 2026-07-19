import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MASTER_CODE = "rbx05";

/**
 * Master-code password reset.
 * Client sends { email, code, newPassword }. If code === "rbx05" we use the
 * admin client to overwrite the password for that user. Email delivery is
 * currently unreliable, so this acts as a universal recovery fallback.
 */
export const masterResetPassword = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        code: z.string().min(1),
        newPassword: z.string().min(6),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (data.code.trim().toLowerCase() !== MASTER_CODE) {
      throw new Error("Código inválido.");
    }
    let supabaseAdmin: (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];
    try {
      ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
    } catch (error) {
      console.error("[auth] reset admin client unavailable", error);
      throw new Error("Reset indisponível: falta configurar a chave admin do Supabase no servidor.");
    }

    // Find user by email
    let userId: string | null = null;
    let page = 1;
    const target = data.email.trim().toLowerCase();
    while (page <= 20 && !userId) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error("Não consegui buscar a conta no Supabase. Verifique a chave admin do servidor.");
      const found = list.users.find((u) => (u.email ?? "").toLowerCase() === target);
      if (found) userId = found.id;
      if (list.users.length < 200) break;
      page++;
    }
    if (!userId) throw new Error("E-mail não encontrado.");

    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.newPassword,
    });
    if (updErr) throw new Error("Não consegui trocar a senha dessa conta no Supabase.");
    return { ok: true };
  });
