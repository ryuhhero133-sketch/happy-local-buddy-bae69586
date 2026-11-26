// Creates a real Cakto PIX charge for a verified Supabase player.
// Deploy with verify_jwt = false because this function validates the bearer itself.
import {
  adminClient, caktoFetch, corsHeaders, getCaktoAccessToken, json, onlyDigits,
  sha256Hex, userClient, validUuid,
} from "../_shared/cakto.ts";

type Body = {
  packageId?: unknown;
  requestId?: unknown;
  customer?: { name?: unknown; phone?: unknown; docNumber?: unknown; docType?: unknown };
};

const PACKAGE_IDS = new Set(["bau_inicial", "bau_avancado", "bau_supremo"]);

function empty(status: number, error: string) {
  return json({ ok: false, error }, status);
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

    const customer = body.customer ?? {};
    const name = String(customer.name ?? "").trim().slice(0, 255);
    const phone = onlyDigits(customer.phone, 13);
    const docNumber = onlyDigits(customer.docNumber, 14);
    const docType = customer.docType === "cnpj" ? "cnpj" : "cpf";
    const email = String(user.email ?? "").trim().toLowerCase();
    if (name.length < 2) return empty(400, "name_required");
    if (!/^55\d{10,11}$/.test(phone)) return empty(400, "phone_required");
    if (!(docType === "cpf" ? docNumber.length === 11 : docNumber.length === 14)) {
      return empty(400, "document_required");
    }
    if (!email.includes("@")) return empty(400, "email_required");

    const fingerprint = await sha256Hex(`${user.id}:${requestId}`);

    const admin = adminClient();
    const { data: orderResult, error: orderError } = await admin.rpc("cakto_server_create_order", {
      p_user_id: user.id,
      p_package_id: packageId,
      p_request_id: requestId,
      p_customer: { name, email, phone, docType, docNumber, fingerprint },
    });
    if (orderError) throw new Error("order_create_failed");
    const order = orderResult as Record<string, unknown> | null;
    if (!order || order.ok !== true) {
      if (order?.reason === "package_not_configured") return empty(503, "packages_not_configured");
      if (order?.reason === "request_conflict") return empty(409, "request_conflict");
      return empty(400, "order_create_failed");
    }

    const orderId = String(order.order_id);
    const status = String(order.status ?? "created");
    if (status === "paid") {
      return json({ ok: true, status: "paid", orderId, alreadyPaid: true });
    }
    const existingQr = typeof order.pix_qr_code === "string" ? order.pix_qr_code : "";
    const existingExpiration = order.pix_expiration ? Date.parse(String(order.pix_expiration)) : 0;
    if (existingQr && existingExpiration > Date.now() + 30_000) {
      return json({
        ok: true,
        status: "pending",
        orderId,
        packageId,
        diamonds: Number(order.diamonds),
        amountCents: Number(order.price_cents),
        currency: String(order.currency ?? "BRL"),
        pixQrCode: existingQr,
        pixExpiration: new Date(existingExpiration).toISOString(),
        checkoutUrl: order.checkout_url ?? null,
      });
    }

    const offerId = typeof order.cakto_offer_id === "string" ? order.cakto_offer_id : "";
    if (!offerId) return empty(503, "packages_not_configured");
    if (!(await getCaktoAccessToken())) return empty(503, "cakto_not_configured");

    let caktoResponse: Response;
    try {
      caktoResponse = await caktoFetch("/payments/", {
        method: "POST",
        headers: { "X-Idempotency-Key": requestId },
        body: JSON.stringify({
          paymentMethod: "pix",
          customer: { name, email, phone, fingerprint, docType, docNumber },
          items: [{ offerId }],
          metadata: { sck: orderId },
          pixExpiresIn: 900,
        }),
      });
    } catch (error) {
      await admin.rpc("cakto_server_save_payment", {
        p_order_id: orderId,
        p_payment_id: null,
        p_ref_id: null,
        p_checkout_url: null,
        p_pix_qr_code: null,
        p_pix_expiration: null,
        p_status: "failed",
        p_error: error instanceof Error ? error.message.slice(0, 120) : "cakto_request_failed",
      });
      return empty(502, "cakto_unavailable");
    }

    const responseText = await caktoResponse.text();
    let payload: Record<string, any> | null = null;
    try { payload = JSON.parse(responseText); } catch { payload = null; }

    if (caktoResponse.status === 409) return empty(409, "payment_processing_or_conflict");
    if (!caktoResponse.ok || !payload) {
      await admin.rpc("cakto_server_save_payment", {
        p_order_id: orderId,
        p_payment_id: null,
        p_ref_id: null,
        p_checkout_url: null,
        p_pix_qr_code: null,
        p_pix_expiration: null,
        p_status: "failed",
        p_error: `cakto_http_${caktoResponse.status}`,
      });
      return empty(caktoResponse.status >= 500 ? 502 : 400, "cakto_payment_failed");
    }

    const pix = payload.pix as { qrCode?: unknown; expirationDate?: unknown } | undefined;
    const qrCode = typeof pix?.qrCode === "string" ? pix.qrCode : "";
    if (!qrCode) return empty(502, "cakto_pix_missing");

    const rawExpiration = typeof pix?.expirationDate === "string" ? Date.parse(pix.expirationDate.replace(" ", "T")) : NaN;
    const expirationIso = Number.isFinite(rawExpiration) ? new Date(rawExpiration).toISOString() : null;
    const amount = Number(payload.amount);
    const amountCents = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
    const rawCheckoutUrl = typeof payload.checkoutUrl === "string" ? payload.checkoutUrl.trim() : "";
    const checkoutUrl = rawCheckoutUrl
      ? (/^https?:\/\//i.test(rawCheckoutUrl) ? rawCheckoutUrl : `https://${rawCheckoutUrl}`).slice(0, 2048)
      : null;

    const { error: saveError } = await admin.rpc("cakto_server_save_payment", {
      p_order_id: orderId,
      p_payment_id: typeof payload.id === "string" ? payload.id : null,
      p_ref_id: typeof payload.refId === "string" ? payload.refId : null,
      p_checkout_url: checkoutUrl,
      p_pix_qr_code: qrCode,
      p_pix_expiration: expirationIso,
      p_status: "pending",
      p_error: null,
    });
    if (saveError) throw new Error("payment_save_failed");

    return json({
      ok: true,
      status: "pending",
      orderId,
      packageId,
      diamonds: Number(order.diamonds),
      amountCents: amountCents ?? Number(order.price_cents),
      currency: String(order.currency ?? "BRL"),
      pixQrCode: qrCode,
      pixExpiration: expirationIso,
      checkoutUrl,
    });
  } catch (error) {
    console.error("[cakto-create-payment]", error instanceof Error ? error.message : "unknown_error");
    return empty(500, "internal_error");
  }
});
