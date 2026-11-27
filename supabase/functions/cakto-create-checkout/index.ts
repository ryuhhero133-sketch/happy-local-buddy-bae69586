// Creates a game order and returns the official Cakto hosted checkout URL.
// Card data never touches this project: the buyer pays on Cakto's page.
import {
  adminClient, CAKTO_PACKAGE_IDS, corsHeaders, json, sha256Hex, userClient, validUuid,
} from "../_shared/cakto.ts";

type Body = {
  packageId?: unknown;
  requestId?: unknown;
  name?: unknown;
};

const PACKAGE_IDS = new Set<string>(CAKTO_PACKAGE_IDS);

function empty(status: number, error: string) {
  return json({ ok: false, error }, status);
}

function newCheckoutToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return empty(405, "method_not_allowed");

  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return empty(401, "unauthorized");

  try {
    const client = userClient(authorization);
    const { data: authData, error: authError } = await client.auth.getUser();
    const user = authData?.user;
    if (authError || !user) return empty(401, "unauthorized");

    const body = await request.json() as Body;
    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    if (!PACKAGE_IDS.has(packageId) || !validUuid(requestId)) return empty(400, "invalid_request");

    const name = String(body.name ?? "").trim().slice(0, 255) || "Treinador";
    const email = String(user.email ?? "").trim().toLowerCase().slice(0, 254);
    const fingerprint = await sha256Hex(`${user.id}:${requestId}:hosted`);

    const admin = adminClient();
    const { data: orderResult, error: orderError } = await admin.rpc("cakto_server_create_order", {
      p_user_id: user.id,
      p_package_id: packageId,
      p_request_id: requestId,
      p_customer: { name, email, phone: "", docType: "cpf", docNumber: "", fingerprint },
    });
    if (orderError) throw new Error("order_create_failed");

    const order = orderResult as Record<string, unknown> | null;
    if (!order || order.ok !== true) {
      if (order?.reason === "package_not_configured") return empty(503, "packages_not_configured");
      if (order?.reason === "request_conflict") return empty(409, "request_conflict");
      return empty(400, "order_create_failed");
    }

    const orderId = String(order.order_id);
    const diamonds = Number(order.diamonds);
    const amountCents = Number(order.price_cents);
    const currency = String(order.currency ?? "BRL");
    if (String(order.status ?? "created") === "paid") {
      return json({ ok: true, status: "paid", orderId, packageId, diamonds, amountCents, currency });
    }

    let prepared: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await admin.rpc("cakto_server_prepare_checkout", {
        p_order_id: orderId,
        p_checkout_token: newCheckoutToken(),
      });
      if (error) throw new Error("checkout_prepare_failed");
      if (data?.ok === true) { prepared = data as Record<string, unknown>; break; }
      if (data?.reason === "token_conflict") continue;
      if (data?.reason === "order_not_pending") return empty(409, "order_expired");
      if (data?.reason === "package_not_configured") return empty(503, "packages_not_configured");
      return empty(409, String(data?.reason ?? "checkout_create_failed"));
    }

    const checkoutUrl = typeof prepared?.checkout_url === "string" ? prepared.checkout_url : "";
    if (!checkoutUrl.startsWith("https://pay.cakto.com.br/")) {
      return empty(500, "checkout_create_failed");
    }

    return json({
      ok: true,
      status: "pending",
      orderId,
      packageId,
      diamonds,
      amountCents,
      currency,
      checkoutUrl,
    });
  } catch (error) {
    console.error("[cakto-create-checkout]", error instanceof Error ? error.message : "unknown_error");
    return empty(500, "internal_error");
  }
});
