import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const shop = read("src/components/CaktoPixShop.tsx");
const modal = read("src/components/RedCrystalCashShopModal.tsx");
const idle = read("src/routes/idle.tsx");
const carousel = read("src/components/cash-shop/CashShopBannerCarousel.tsx");
const art = read("src/components/cash-shop/cashShopArt.ts");
const css = read("src/components/cash-shop/cash-shop.css");

test("all provider names stay out of displayed shop text", () => {
  const files = [
    "src/components/CaktoPixShop.tsx",
    "src/components/RedCrystalCashShopModal.tsx",
    "src/components/cash-shop/CashShopBannerCarousel.tsx",
    "src/components/cash-shop/cashShopArt.ts",
  ];
  for (const file of files) {
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node) => {
      if (ts.isJsxText(node) || ts.isStringLiteralLike(node)) {
        const text = node.text;
        // Internal API identifiers, imports and the real destination remain unchanged.
        const internal = /^(?:@\/|\.\/|cakto[_-]|get_my_cakto_order$|https:\/\/pay\.cakto\.com\.br\/)/.test(text);
        if (!internal) assert.doesNotMatch(text, /cakto/i, `${file}: ${text}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.match(shop, />COMPRAR<\/a>/);
  assert.match(shop, /https:\/\/pay\.cakto\.com\.br\//);
  assert.match(shop, /get_my_cakto_order/);
});

test("each server package uses its new chest artwork, without client-side prices", () => {
  assert.match(art, /bau_inicial: \{ image: initialChest/);
  assert.match(art, /bau_avancado: \{ image: advancedChest/);
  assert.match(art, /bau_supremo: \{ image: supremeChest/);
  assert.doesNotMatch(art, /price_cents|price:|diamonds:/);
  assert.match(shop, /DIAMOND_PACKAGE_ART\[pkg.id\]/);
  assert.match(shop, /money\(pkg.price_cents\)/);
  assert.match(shop, /setChoosingMethod\(pkg\)/);
  assert.match(shop, /openForm\(choosingMethod\)/);
  assert.match(shop, /createHostedCheckout\(choosingMethod\)/);
});

test("banners are above both tabs and open the package cards at the top", () => {
  assert.ok(modal.indexOf("<CashShopBannerCarousel") < modal.indexOf('role="tablist"'));
  assert.match(modal, /onOpenCards=\{\(\) => openShopTab\("cards"\)\}/);
  for (const id of ["cards", "items"]) {
    assert.ok(modal.includes(`aria-controls="cash-shop-panel-${id}"`));
    assert.ok(modal.includes(`id="cash-shop-panel-${id}"`));
    assert.ok(modal.includes(`hidden={shopTab !== "${id}"}`));
  }
  assert.match(modal, /tabTopRef/);
  assert.match(modal, /content.scrollTo/);
  assert.match(modal, /preventScroll: true/);
  assert.match(modal, /ArrowLeft.*ArrowRight.*Home.*End/);
  assert.match(modal, /<CaktoPixShop/);
  assert.doesNotMatch(modal, /shopTab === "cards" &&.*CaktoPixShop/);
});

test("category tabs use the DNM diamond and game bag with decorative motion", () => {
  for (const [asset, name] of [
    ["src/assets/cash-shop/dnm-diamond.webp", "cashShopDiamondImg"],
    ["src/ambiente/aba/men ic/Mochila.webp", "shopBagImg"],
  ]) {
    assert.ok(modal.includes(`import ${name} from "@/${asset.slice(4)}"`));
    assert.ok(statSync(new URL(`../${asset}`, import.meta.url)).size < 128 * 1024);
    assert.ok(modal.includes(`<img src={${name}} alt="" width={40} height={40} draggable={false} />`));
  }
  for (const tab of ["cards", "items"]) {
    assert.ok(modal.includes(`className="cash-shop-tab__icon cash-shop-tab__icon--${tab}" aria-hidden="true"`));
  }
  assert.match(modal, /<span>CASH SHOP<\/span>/);
  assert.match(modal, /<span>SHOP ITENS<\/span>/);
  assert.doesNotMatch(modal, /<span>CARDS<\/span>|<span>ITENS<\/span>|💎 CARDS|🎒 ITENS/);
  assert.match(css, /animation: cash-shop-card-float 3\.6s ease-in-out infinite/);
  assert.match(css, /animation: cash-shop-bag-sway 3\.2s ease-in-out infinite/);
  assert.match(css, /white-space: nowrap/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.cash-shop-tab__icon img, \.cash-shop-tab__icon::before \{ animation: none; \}/);
});

test("VIP GOLD 30 days costs 2.000 red crystals and is delivered by the server", () => {
  const sql = read("supabase/migrations/20261127015426_cash_shop_vip_gold_30.sql");
  assert.match(modal, /id: "vip_gold_30"/);
  assert.match(modal, /name: "VIP GOLD · 30 dias"/);
  assert.match(modal, /price: 2_000/);
  assert.match(modal, /image: vipGoldImg/);
  assert.match(modal, /\+40% de Ouro e EXP por 30 dias/);
  assert.match(idle, /vip_gold_30: "book_vip_gold_30"/);
  assert.match(idle, /"book_vip_gold_30"/);
  assert.match(sql, /when 'vip_gold_30' then\s+v_price := 2000; v_granted_item := 'book_vip_gold_30'; v_granted_qty := 1;/);
  assert.doesNotMatch(sql, /p_price|price_cents/);
});

test("nova tabela de precos da Loja Cash e entregas especiais", () => {
  const sql = read("supabase/migrations/20261127060610_cash_shop_new_prices.sql");
  const branches = [
    ["ultraball_50", "1500", "ultraball", "50"],
    ["ultraball_100", "2300", "ultraball", "100"],
    ["masterball", "10000", "masterball", "1"],
    ["mount_30", "3000", "carta_montaria_30", "1"],
    ["egg_epic", "1000", "egg_epic", "1"],
    ["egg_mythic", "8000", "egg_mystic", "1"],
    ["vegeta_skin", "3000", "vegeta"],
    ["goku_skin", "4000", "goku"],
    ["one_skin", "3000", "one"],
  ];
  for (const [id, price, item, qty] of branches) {
    assert.match(sql, new RegExp(`when '${id}' then\\s+v_price := ${price};`), id);
    if (qty) assert.match(sql, new RegExp(`v_granted_item := '${item}'; v_granted_qty := ${qty};`), id);
    else assert.match(sql, new RegExp(`v_skin := '${item}';`), id);
  }
  for (const id of ["orb_xp_minor", "orb_xp_major", "orb_xp_supreme", "orb_team"]) {
    assert.match(sql, new RegExp(`when '${id}' then\\s+v_price := 500;`), id);
  }
  assert.match(sql, /v_skin = 'one' and \(/);
  assert.match(modal, /id: "ultraball_100"/);
  assert.match(modal, /price: 2_300/);
  assert.match(modal, /id: "masterball"/);
  assert.match(modal, /price: 10_000/);
  assert.match(modal, /id: "mount_30"/);
  assert.match(modal, /price: 3_000/);
  assert.match(modal, /id: "one_skin"/);
  assert.match(modal, /price: 4_000/);
  assert.match(idle, /mount_30: "carta_montaria_30"/);
  assert.match(idle, /productId === "one_skin"[\s\S]{0,80}"one"/);
  assert.match(idle, /carta_montaria_30: Math\.max\(0/);
  assert.match(idle, /usedBall\.id === "masterball" && !target\.menace\) \{\s*\/\/[\s\S]{0,220}captured = true;/);
  assert.equal((idle.match(/usedBall\.id === "masterball" && !target\.menace/g) ?? []).length, 2);
  assert.match(idle, /preferredBall: "auto" \| "pokeball" \| "greatball" \| "ultraball" \| "safariball" \| "masterball"/);
  assert.match(idle, /p === "masterball" \? "Master"/);
  assert.match(idle, /mutation\.skin === "one"[\s\S]{0,120}unlockedSkins\.includes\(mutation\.skin\)/);
});

test("carousel supports swipe, looping, controls, pause and reduced motion", () => {
  assert.match(carousel, /useEmblaCarousel\(\{ loop: true \}\)/);
  assert.match(carousel, /onClick=\{onOpenCards\}/);
  assert.match(carousel, /prefers-reduced-motion: reduce/);
  assert.match(carousel, /hovered \|\| focused \|\| dragging \|\| !playing/);
  assert.match(carousel, /document.visibilityState === "visible"/);
  assert.match(carousel, /window.clearInterval/);
  assert.match(carousel, /Pausar banners/);
  assert.match(carousel, /Banner anterior/);
  assert.match(carousel, /Próximo banner/);
  assert.match(css, /touch-action: pan-y pinch-zoom/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /max-width: 400px/);
});

test("all eight optimized artwork assets are valid WebP files under 320 KB each", () => {
  const imports = [...art.matchAll(/@\/assets\/cash-shop\/([^"]+\.webp)/g)];
  assert.equal(imports.length, 8);
  for (const [, name] of imports) {
    const file = new URL(`../src/assets/cash-shop/${name}`, import.meta.url);
    const bytes = readFileSync(file);
    assert.equal(bytes.subarray(0, 4).toString(), "RIFF", name);
    assert.equal(bytes.subarray(8, 12).toString(), "WEBP", name);
    assert.ok(statSync(file).size < 320 * 1024, name);
  }
});
