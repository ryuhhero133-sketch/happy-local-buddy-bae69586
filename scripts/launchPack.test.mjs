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
const slimeSql = read("../supabase/migrations/20261125062401_red_crystal_slimeball.sql");

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

test("Pokébola Slime e confirmação na Loja Cash", () => {
  assert.ok(shop.includes('id: "slimeball"'));
  assert.ok(shop.includes('name: "Pokébola Slime"'));
  assert.ok(shop.includes("price: 100"));
  assert.ok(shop.includes("icon-slime.webp"));
  assert.ok(shop.includes("setConfirming(product.id)"));
  assert.ok(shop.includes("Confirmar compra"));
  assert.ok(idle.includes('slimeball: "slimeball"'));
  assert.ok(idle.includes('"potion", "slimeball"'));
  assert.ok(idle.includes('b.id === "slimeball"'));
  assert.ok(slimeSql.includes("when 'slimeball' then"));
  assert.ok(slimeSql.includes("v_price := 100; v_granted_item := 'slimeball'; v_granted_qty := 1;"));
  assert.ok(idle.includes("spawnBoboSlimes"));
  assert.ok(idle.includes("slimeSheet"));
  assert.ok(idle.includes("Slime só pode ser capturado com Pokébola Slime"));
});

test("cada 3 missões gera ticket da Nevezinha", () => {
  assert.ok(read("../src/game/captureQuests.ts").includes("ticketGroups"));
  assert.ok(read("../src/lib/nevezinhaTickets.ts").includes("nevezinha_grant_tickets"));
  assert.ok(idle.includes("grantNevezinhaTickets(update.tickets)"));
  assert.ok(idle.includes("completedCount * 50"));
  assert.ok(idle.includes("completedCount * 250"));
});
