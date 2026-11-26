// Owner-only catalog sync: reads real Cakto products/offers and fills prices
// and offer IDs. Never invents an ID or price.
import { adminClient, caktoFetch, corsHeaders, env, json, userClient } from "../_shared/cakto.ts";

type Product = { id: string; name?: string; status?: string; type?: string };
type Offer = {
  id: string; name?: string; price?: number; currency?: string; product?: string;
  status?: string; default?: boolean; type?: string;
};
type PackageRow = { id: string; name: string; diamonds: number };

const OWNER_ID = "16d47359-8fbb-4a81-9596-918b2d53b75b";
const PACKAGE_KEYWORDS: Record<string, string[]> = {
  bau_inicial: ["bau inicial", "pacote 1", "1000 diamante", "1.000 diamante"],
  bau_avancado: ["bau avancado", "pacote 2", "2000 diamante", "2.000 diamante"],
  bau_supremo: ["bau supremo", "pacote 3", "3200 diamante", "3.200 diamante"],
};

const normalize = (value: unknown) => String(value ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ ok: false, error: "unauthorized" }, 401);

  try {
    const client = userClient(authorization);
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || authData?.user?.id !== (env("CAKTO_OWNER_ID") ?? OWNER_ID)) {
      return json({ ok: false, error: "owner_only" }, 403);
    }

    const productsResponse = await caktoFetch("/products/?limit=100&status=active");
    if (!productsResponse.ok) return json({ ok: false, error: `products_http_${productsResponse.status}` }, 502);
    const productsPayload = await productsResponse.json() as { results?: Product[] };
    const products = Array.isArray(productsPayload.results) ? productsPayload.results : [];

    const offersResponse = await caktoFetch("/offers/?limit=100&status=active");
    if (!offersResponse.ok) return json({ ok: false, error: `offers_http_${offersResponse.status}` }, 502);
    const offersPayload = await offersResponse.json() as { results?: Offer[] };
    const offers = Array.isArray(offersPayload.results) ? offersPayload.results : [];

    const admin = adminClient();
    const { data: packages, error: packageError } = await admin
      .from("cakto_packages")
      .select("id,name,diamonds")
      .order("sort_order");
    if (packageError) throw new Error("packages_read_failed");

    const updated: unknown[] = [];
    const missing: string[] = [];
    for (const pkg of (packages ?? []) as PackageRow[]) {
      const keywords = PACKAGE_KEYWORDS[pkg.id] ?? [];
      // Só aceita um produto por pacote. Nome ambíguo não vira oferta ativa.
      const matches = products.filter((candidate) => {
        if (candidate.type !== undefined && candidate.type !== "unique") return false;
        const haystack = normalize(candidate.name);
        return keywords.some((keyword) => haystack.includes(keyword));
      });
      if (matches.length !== 1) { missing.push(pkg.id); continue; }
      const product = matches[0];
      const productOffers = offers.filter((offer) =>
        offer.product === product.id
        && offer.status === "active"
        && offer.currency === "BRL"
        && (offer.type === undefined || offer.type === "unique")
      );
      const defaults = productOffers.filter((offer) => offer.default === true);
      // Prefere a oferta padrão; sem padrão, só aceita se houver exatamente uma.
      const offer = defaults.length === 1 ? defaults[0] : defaults.length === 0 && productOffers.length === 1 ? productOffers[0] : null;
      if (!offer || typeof offer.price !== "number" || offer.price <= 0) {
        missing.push(pkg.id);
        continue;
      }
      const priceCents = Math.round(offer.price * 100);
      const currency = "BRL";
      const { error: updateError } = await admin
        .from("cakto_packages")
        .update({
          cakto_offer_id: offer.id,
          price_cents: priceCents,
          currency,
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pkg.id);
      if (updateError) throw new Error("package_update_failed");
      updated.push({ packageId: pkg.id, offerId: offer.id, priceCents, currency, product: product.name, offer: offer.name });
    }

    return json({ ok: true, updated, missing, products: products.length, offers: offers.length });
  } catch (error) {
    console.error("[cakto-sync-catalog]", error instanceof Error ? error.message : "unknown_error");
    return json({ ok: false, error: "sync_failed" }, 500);
  }
});
