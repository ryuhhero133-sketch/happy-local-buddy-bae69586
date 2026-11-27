import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const cryptoSource = read("supabase/functions/_shared/caktoCrypto.ts");
const { outputText } = ts.transpileModule(cryptoSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { hmacSha256Hex, verifyCaktoSignature, validUuid } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("Cakto webhook signature follows the official HMAC and 5-minute window", async () => {
  const secret = "test-webhook-secret-32-bytes-long";
  const timestamp = "1700000000";
  const raw = '{"secret":"test","event":"purchase_approved","data":{"id":"order-1"}}';
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  assert.equal(await hmacSha256Hex(secret, `${timestamp}.${raw}`), expected);
  assert.equal(await verifyCaktoSignature(raw, timestamp, `v1=${expected}`, secret, 1700000000_000), true);
  assert.equal(await verifyCaktoSignature(raw, timestamp, `v2=ignored,v1=${expected}`, secret, 1700000000_000), true);
  assert.equal(await verifyCaktoSignature(raw, timestamp, `v1=${"0".repeat(64)}`, secret, 1700000000_000), false);
  assert.equal(await verifyCaktoSignature(raw, "1699999000", `v1=${expected}`, secret, 1700000000_000), false);
  assert.equal(await verifyCaktoSignature(raw, timestamp, `v1=${expected}`, "", 1700000000_000), false);
});

test("order IDs are validated before being used as UUID filters", () => {
  assert.equal(validUuid("11111111-1111-4111-8111-111111111111"), true);
  assert.equal(validUuid("11111111-1111-1111-1111-111111111111"), false);
  assert.equal(validUuid("not-a-uuid"), false);
  assert.equal(validUuid(null), false);
});

test("the three packages map to the exact server-side diamond amounts", () => {
  const sql = read("supabase/migrations/20261126150000_cakto_pix.sql");
  assert.match(sql, /'bau_inicial',\s*'Pacote 1[^']*',\s*1000,/);
  assert.match(sql, /'bau_avancado',\s*'Pacote 2[^']*',\s*2000,/);
  assert.match(sql, /'bau_supremo',\s*'Pacote 3[^']*',\s*3200,/);
  assert.match(sql, /active boolean not null default false/);
  assert.match(sql, /currency = 'BRL'/);
});

test("a Pix approved after pix_expirado still credits exactly once", () => {
  const sql = read("supabase/migrations/20261126160000_cakto_late_pix.sql");
  assert.match(sql, /''created'', ''pending'', ''failed'', ''expired''/);
  assert.match(sql, /pg_get_functiondef/);
  assert.match(sql, /private\.cakto_deliver_order/);
});

test("payment database is server-authoritative and delivery is exactly once", () => {
  const sql = read("supabase/migrations/20261126150000_cakto_pix.sql");
  for (const text of [
    "create table if not exists public.cakto_packages",
    "create table if not exists private.cakto_orders",
    "idempotency_key text not null unique",
    "create table if not exists private.cakto_deliveries",
    "order_id uuid primary key references private.cakto_orders",
    "create table if not exists private.cakto_webhook_events",
    "event_key text primary key",
    "v_order.status not in ('created', 'pending', 'failed')",
    "v_credit := least(v_order.diamonds",
    "insert into private.cakto_deliveries",
    "on conflict (event_key) do nothing",
    "order_already_delivered",
    "get_my_cakto_order",
  ]) assert.ok(sql.includes(text), text);
  assert.match(sql, /revoke all on table public\.cakto_packages from anon, authenticated/);
  assert.match(sql, /grant select on table public\.cakto_packages to anon, authenticated/);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table public\.cakto_packages/i);
});

test("create-payment uses OAuth, one server offer, idempotency and real PIX fields", () => {
  const source = read("supabase/functions/cakto-create-payment/index.ts");
  for (const text of [
    "cakto_server_create_order",
    "getCaktoAccessToken",
    "X-Idempotency-Key",
    "paymentMethod: \"pix\"",
    "offerId",
    "pix.qrCode",
    "pixExpiresIn: 900",
    "cakto_server_save_payment",
    "auth.getUser()",
  ]) assert.ok(source.includes(text), text);
  assert.doesNotMatch(source, /diamonds\s*[:=]\s*Number\(body/);
});

test("webhook only credits on paid one-time purchase_approved and maps hosted callbacks", () => {
  const source = read("supabase/functions/cakto-webhook/index.ts");
  assert.match(source, /X-Cakto-Signature|x-cakto-signature/);
  assert.match(source, /x-cakto-timestamp/);
  assert.match(source, /verifyCaktoSignature/);
  assert.match(source, /event === "purchase_approved"/);
  assert.match(source, /data\.status !== "paid"/);
  assert.match(source, /offerType !== "main"/);
  assert.match(source, /productType !== "unique"/);
  assert.match(source, /cakto_server_order_by_checkout/);
  assert.match(source, /cakto_deliver_order/);
  assert.match(source, /refund|chargeback/);
  assert.match(source, /pix_gerado/);
  assert.doesNotMatch(source, /paymentMethod !== "pix"/);
  assert.doesNotMatch(source, /pix_gerado[\s\S]{0,200}cakto_deliver_order/);
});

test("hosted checkout carries a random callback token and never handles card data", () => {
  const sql = read("supabase/migrations/20261126170000_cakto_hosted_checkout.sql");
  for (const text of [
    "checkout_token",
    "cakto_server_prepare_checkout",
    "cakto_server_order_by_checkout",
    "pay.cakto.com.br",
    "'?callback='",
    "'&sck='",
  ]) assert.ok(sql.includes(text), text);
  assert.match(sql, /grant execute on function public\.cakto_server_prepare_checkout\(uuid, text\)\s+to service_role/);
  assert.match(sql, /grant execute on function public\.cakto_server_order_by_checkout\(text\)\s+to service_role/);

  const edge = read("supabase/functions/cakto-create-checkout/index.ts");
  for (const text of [
    "cakto_server_create_order",
    "cakto_server_prepare_checkout",
    "crypto.getRandomValues",
    "checkoutUrl",
    "auth.getUser()",
  ]) assert.ok(edge.includes(text), text);
  assert.doesNotMatch(edge, /cardNumber|cvv|cvc|credit_card/i);
});

test("cash shop exposes PIX, QR, polling and the approved message", () => {
  const shop = read("src/components/CaktoPixShop.tsx");
  assert.match(shop, /cakto_packages/);
  assert.match(shop, /cakto-create-payment/);
  assert.match(shop, /get_my_cakto_order/);
  assert.match(shop, /QRCode\.toDataURL/);
  assert.match(shop, /PAGAMENTO APROVADO!/);
  assert.match(shop, /Seus Diamantes Vermelhos chegaram!/);
  assert.match(shop, /Boa aventura, treinador!/);
  assert.match(shop, /EM CONFIGURAÇÃO/);
  assert.match(shop, /!hasAvailablePackage/);
  assert.match(shop, /cakto-create-checkout/);
  assert.match(shop, /CARTÃO/);
  assert.match(shop, />COMPRAR<\/a>/);
  assert.doesNotMatch(shop, /ABRIR CHECKOUT DA CAKTO|checkout da Cakto|página segura da Cakto|A Cakto não conseguiu/);
  assert.doesNotMatch(shop, /cardNumber|cvv|cvc/i);
  assert.match(read("src/components/RedCrystalCashShopModal.tsx"), /CaktoPixShop/);
});
