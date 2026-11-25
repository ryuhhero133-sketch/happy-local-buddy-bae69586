import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const idle = read("../src/routes/idle.tsx");
const auth = read("../src/components/AuthGate.tsx");
const shop = read("../src/components/RedCrystalCashShopModal.tsx");
const welcome = read("../src/lib/welcomePack.ts");
const welcomeSql = read("../supabase/migrations/20261125034907_welcome_potion_pack.sql");
const shopSql = read("../supabase/migrations/20261125034747_red_crystal_potion_pack.sql");

test("HUD branca liberada para todos", () => {
  assert.ok(idle.includes("newHud\n"));
  assert.ok(!idle.includes("newHud={identity?.id === MAP_EDITOR_OWNER_ID}"));
  assert.ok(auth.includes("LOCKDOWN_ONLY_OWNER = false"));
});

test("pacote único de 200 Poções no login", () => {
  assert.ok(welcome.includes("claim_welcome_potions"));
  assert.ok(welcome.includes("adoptAuthoritativeCheckpoint"));
  assert.ok(idle.includes("claimWelcomePotions"));
  assert.ok(idle.includes("+200 Poções na mochila"));
  assert.ok(welcomeSql.includes("private.welcome_potion_grants"));
  assert.ok(welcomeSql.includes("v_potion + 200"));
  assert.ok(welcomeSql.includes("already_granted"));
});

test("20 Poções por 1 Cristal Vermelho na Loja Cash", () => {
  assert.ok(shop.includes('id: "potion_20"'));
  assert.ok(shop.includes('name: "20 Poções"'));
  assert.ok(shop.includes("price: 1"));
  assert.ok(shop.includes("icon-potion.webp"));
  assert.ok(idle.includes('potion_20: "potion"'));
  assert.ok(shopSql.includes("when 'potion_20' then"));
  assert.ok(shopSql.includes("v_price := 1; v_granted_item := 'potion'; v_granted_qty := 20;"));
});
