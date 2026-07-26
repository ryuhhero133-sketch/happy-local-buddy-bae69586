import { createFileRoute } from "@tanstack/react-router";

import { isUuid, purgeUserCompletely } from "@/lib/purgeUser.server";

// Endpoint administrativo: exclusão permanente de um usuário (Auth + dados).
// Protegido por header `x-admin-key` que precisa bater com ADMIN_PURGE_TOKEN.
export const Route = createFileRoute("/api/public/purge-user")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.ADMIN_PURGE_TOKEN;
        if (!token) {
          return Response.json(
            { ok: false, error: "ADMIN_PURGE_TOKEN não configurado no servidor." },
            { status: 503 },
          );
        }

        const provided = request.headers.get("x-admin-key") ?? "";
        if (provided !== token) {
          return Response.json({ ok: false, error: "Não autorizado." }, { status: 401 });
        }

        let userId = "";
        try {
          const body = (await request.json()) as { userId?: string };
          userId = (body.userId ?? "").trim();
        } catch {
          return Response.json({ ok: false, error: "JSON inválido." }, { status: 400 });
        }

        if (!isUuid(userId)) {
          return Response.json({ ok: false, error: "userId inválido (UUID obrigatório)." }, { status: 400 });
        }

        try {
          const result = await purgeUserCompletely(userId);
          return Response.json({ ok: true, ...result });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro desconhecido.";
          console.error("[purge-user]", message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
