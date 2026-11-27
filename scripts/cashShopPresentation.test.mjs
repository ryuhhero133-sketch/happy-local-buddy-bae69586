import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const shop = read("src/components/CaktoPixShop.tsx");
const modal = read("src/components/RedCrystalCashShopModal.tsx");
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
