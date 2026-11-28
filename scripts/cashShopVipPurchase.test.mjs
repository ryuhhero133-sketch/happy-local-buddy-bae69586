import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const shop = read("src/components/RedCrystalCashShopModal.tsx");
const idle = read("src/routes/idle.tsx");
const css = read("src/components/cash-shop/cash-shop.css");
const journeyFix = read("supabase/migrations/20261128030000_cash_shop_journey_reset_fix.sql");
const nullItemFix = read("supabase/migrations/20261128030500_red_crystal_cash_null_item_fix.sql");

test("VIP GOLD 30 dias custa 2.000 Cristais e entrega o livro na mochila", () => {
  assert.match(shop, /id: "vip_gold_30"/);
  assert.match(shop, /name: "VIP GOLD · 30 dias"/);
  assert.match(shop, /price: 2_000/);

  assert.match(journeyFix, /when 'vip_gold_30' then/);
  assert.match(journeyFix, /v_price := 2000; v_granted_item := 'book_vip_gold_30'; v_granted_qty := 1;/);
  assert.match(idle, /vip_gold_30: "book_vip_gold_30"/);
  assert.match(idle, /book_vip_gold_30/);
});

test("compra não apaga a mochila quando o item novo ainda não existe", () => {
  // O helper devolvia NULL para chave ausente; o jsonb_set seguinte zerava
  // todo o objeto items e a trigger da Jornada abortava com 23514.
  assert.match(nullItemFix, /if p_value is null or p_cap < 0 or jsonb_typeof\(p_value\) <> 'number' then/);
  assert.match(nullItemFix, /return 0;/);
  assert.match(journeyFix, /coalesce\(private\.red_crystal_cash_nonnegative_int\(v_items -> 'cr_red', 999999\), 0\)/);
  assert.match(journeyFix, /coalesce\(private\.red_crystal_cash_nonnegative_int\(v_items -> v_granted_item, 999999\), 0\)/);
});

test("compra preserva o marcador da Jornada já resetada", () => {
  assert.match(journeyFix, /public\.emerald_journey_progress/);
  assert.match(journeyFix, /jp\.reset_applied_at is not null/);
  assert.match(journeyFix, /jsonb_set\(v_data, '\{idle,journey,version\}', to_jsonb\('emerald_journey_v1'::text\), true\)/);
  assert.match(idle, /journey_reset_requires_reload: "Atualize a página para sincronizar o progresso da Jornada e tente novamente\."/);
});

test("compra aprovada mostra a celebração e oferece abrir a mochila", () => {
  assert.match(shop, /setCelebration\(\{ product, result \}\)/);
  assert.match(shop, /if \(result\.ok\)/);
  assert.match(shop, /className="cash-shop-celebration"/);
  assert.match(shop, /id="cash-shop-celebration-title"[^>]*>PARABÉNS!</);
  assert.match(shop, /COMPRA CONFIRMADA/);
  assert.match(shop, /Livro na Mochila · use para ativar os 30 dias/);
  assert.match(shop, /Ver na Mochila/);
  assert.match(shop, /onOpenBag\(\)/);
  assert.match(idle, /onOpenBag=\{\(\) => \{ playClick\(\); setCashShopOpen\(false\); setTab\("mochila"\); \}\}/);

  assert.match(css, /\.cash-shop-celebration \{/);
  assert.match(css, /cash-shop-celebration__title/);
  assert.match(css, /cash-shop-celebration-pop/);
  assert.match(css, /cash-shop-celebration-spark/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*cash-shop-celebration__card/);
});
