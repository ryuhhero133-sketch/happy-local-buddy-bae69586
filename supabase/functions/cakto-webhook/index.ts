// Cakto webhook endpoint. No JWT: authenticity comes from the official
// X-Cakto-Signature HMAC over "{timestamp}.{raw body}".
import {
  adminClient, env, json, sha256Hex, timingSafeEqual, validUuid, verifyCaktoSignature,
} from "../_shared/cakto.ts";

type OrderData = Record<string, any>;

function eventKey(event: string, data: OrderData): string {
  const id = typeof data.id === "string" ? data.id : "";
  return `${event}:${id}`;
}

async function processOrder(event: string, data: OrderData, payloadHash: string) {
  const admin = adminClient();
  const caktoId = typeof data.id === "string" ? data.id : "";
  if (!caktoId) return { event, ok: false, reason: "missing_order_id" };
  const orderId = validUuid(data.sck) ? data.sck : null;
  const key = eventKey(event, data);
  const offerId = data.offer && typeof data.offer.id === "string" ? data.offer.id : null;
  const amount = data.amount == null ? null : Number(data.amount);
  const currency = typeof data.currency === "string" ? data.currency : null;
  const paymentMethod = typeof data.paymentMethod === "string" ? data.paymentMethod : "";
  const paidAt = typeof data.paidAt === "string" ? data.paidAt : null;

  if (event === "purchase_approved") {
    if (data.status !== "paid" || paymentMethod !== "pix") {
      await admin.rpc("cakto_mark_order_event", {
        p_event_key: key, p_event_type: event, p_payment_id: caktoId, p_order_id: orderId,
        p_target_status: "ignored", p_payload_hash: payloadHash, p_error: "not_a_paid_pix",
      });
      return { event, ok: true, ignored: true };
    }
    const { data: result, error } = await admin.rpc("cakto_deliver_order", {
      p_event_key: key,
      p_event_type: event,
      p_payment_id: caktoId,
      p_order_id: orderId,
      p_offer_id: offerId,
      p_amount: amount,
      p_currency: currency,
      p_paid_at: paidAt,
      p_payload_hash: payloadHash,
    });
    if (error) throw new Error("delivery_rpc_failed");
    return { event, ...(result as Record<string, unknown>) };
  }

  if (event === "refund" || event === "chargeback") {
    const { data: result, error } = await admin.rpc("cakto_mark_order_reversed", {
      p_event_key: key,
      p_event_type: event,
      p_payment_id: caktoId,
      p_order_id: orderId,
      p_kind: event,
      p_amount: amount,
      p_payload_hash: payloadHash,
    });
    if (error) throw new Error("reversal_rpc_failed");
    return { event, ...(result as Record<string, unknown>) };
  }

  const target = event === "pix_expirado" ? "expired"
    : event === "purchase_refused" ? "failed"
      : event === "pix_gerado" || event === "picpay_gerado" ? "pending"
        : "ignored";
  const { data: result, error } = await admin.rpc("cakto_mark_order_event", {
    p_event_key: key,
    p_event_type: event,
    p_payment_id: caktoId,
    p_order_id: orderId,
    p_target_status: target,
    p_payload_hash: payloadHash,
    p_error: event === "purchase_refused" && typeof data.reason === "string" ? data.reason.slice(0, 160) : null,
  });
  if (error) throw new Error("event_rpc_failed");
  return { event, ...(result as Record<string, unknown>) };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const secret = env("CAKTO_WEBHOOK_SECRET");
  if (!secret) return json({ ok: false, error: "webhook_not_configured" }, 503);

  const rawBody = await request.text();
  const timestamp = request.headers.get("x-cakto-timestamp") ?? "";
  const signature = request.headers.get("x-cakto-signature") ?? "";
  if (!(await verifyCaktoSignature(rawBody, timestamp, signature, secret))) {
    return json({ ok: false, error: "invalid_signature" }, 401);
  }

  let payload: { secret?: unknown; event?: unknown; data?: unknown };
  try { payload = JSON.parse(rawBody); } catch { return json({ ok: false, error: "invalid_json" }, 400); }

  if (typeof payload.secret !== "string" || !timingSafeEqual(payload.secret, secret)) {
    return json({ ok: false, error: "invalid_secret" }, 401);
  }
  const event = typeof payload.event === "string" ? payload.event : "";
  if (!event) return json({ ok: false, error: "missing_event" }, 400);

  const entries = Array.isArray(payload.data) ? payload.data : [payload.data];
  const payloadHash = await sha256Hex(rawBody);
  const results: unknown[] = [];

  try {
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      results.push(await processOrder(event, entry as OrderData, payloadHash));
    }
    return json({ ok: true, event, processed: results.length, results });
  } catch (error) {
    console.error("[cakto-webhook]", error instanceof Error ? error.message : "unknown_error");
    return json({ ok: false, error: "processing_failed" }, 500);
  }
});
