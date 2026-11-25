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
const cashFoodSql = read("../supabase/migrations/20261125120715_cash_shop_combo_and_slimeball_50.sql");
const resources = read("../src/game/resources.ts");
const rewardCodeSql = read("../supabase/migrations/20261125065731_reward_code_nevenatalinos.sql");
const rewardCodeResetSql = read("../supabase/migrations/20261125071920_reward_code_ticket_reset.sql");
const captureQuests = read("../src/game/captureQuests.ts");
const captureQuestHud = read("../src/components/hud/CaptureQuestHud.tsx");

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
  assert.ok(shop.includes("price: 50,"));
  assert.ok(idle.includes('{ id: "slimeball", name: "Pokébola Slime", price: 50'));
  assert.ok(shop.includes("icon-slime.webp"));
  assert.ok(shop.includes("setConfirming(product.id)"));
  assert.ok(shop.includes("Confirmar compra"));
  assert.ok(idle.includes('slimeball: "slimeball"'));
  assert.ok(idle.includes('"potion", "slimeball"'));
  assert.ok(idle.includes('b.id === "slimeball"'));
  assert.ok(slimeSql.includes("when 'slimeball' then"));
  assert.ok(slimeSql.includes("v_price := 100; v_granted_item := 'slimeball'; v_granted_qty := 1;"));
  assert.ok(cashFoodSql.includes("v_price := 50; v_granted_item := 'slimeball'; v_granted_qty := 1;"));
  assert.ok(idle.includes("spawnMilestoneSlime"));
  assert.ok(idle.includes("slimeSheet"));
  assert.ok(idle.includes("Slime só pode ser capturado com Pokébola Slime"));
});

test("Combo Revo alimenta Pokémon e treinador por 20 Cristais Vermelhos", () => {
  assert.ok(shop.includes('id: "combo_revo"'));
  assert.ok(shop.includes('name: "Combo Revo"'));
  assert.ok(shop.includes("price: 20,"));
  assert.ok(idle.includes('combo_revo: "combo_revo"'));
  assert.ok(idle.includes('"slimeball", "combo_revo"'));
  assert.ok(resources.includes("combo_revo: { hunger: 60, loyalty: 15"));
  assert.ok(resources.includes("combo_revo:  { hunger: 50, energy: 40"));
  assert.ok(cashFoodSql.includes("when 'combo_revo' then"));
  assert.ok(cashFoodSql.includes("v_price := 20; v_granted_item := 'combo_revo'; v_granted_qty := 1;"));
});

test("Slime aparece a cada 100 derrotas, sem spawn aleatório", () => {
  assert.ok(idle.includes("const SLIME_KILL_MILESTONE = 100"));
  assert.ok(idle.includes("const SLIME_MAX_ALIVE = 2"));
  assert.ok(idle.includes("spawnMilestoneSlime"));
  assert.ok(idle.includes("Math.floor(newKills / SLIME_KILL_MILESTONE)"));
  assert.ok(idle.includes("if (spawnMilestoneSlime()) lastSlimeMilestoneRef.current = slimeMilestone"));
  assert.ok(!idle.includes("spawnBoboSlimes"));
  assert.ok(!idle.includes("setInterval(spawn, 12000)"));
});

test("cada 3 missões gera ticket da Nevezinha", () => {
  assert.ok(captureQuests.includes("ticketGroups"));
  assert.ok(read("../src/lib/nevezinhaTickets.ts").includes("nevezinha_grant_tickets"));
  assert.ok(idle.includes("grantNevezinhaTickets(update.tickets)"));
  assert.ok(idle.includes("completedCount * 50"));
  assert.ok(idle.includes("completedCount * 250"));
});

test("caixas de brinde verdes e épicas a cada 5 missões", () => {
  assert.ok(captureQuests.includes("CAPTURE_QUEST_CHESTS"));
  assert.ok(captureQuests.includes("openedChests"));
  assert.ok(captureQuests.includes("rollCaptureChest"));
  assert.ok(captureQuests.includes('"emerald_egg"'));
  assert.ok(captureQuests.includes('"carta_montaria"'));
  assert.ok(captureQuestHud.includes("bau_verde.webp"));
  assert.ok(captureQuestHud.includes("bau_epic.webp"));
  assert.ok(captureQuestHud.includes("VOCÊ GANHOU"));
  assert.ok(captureQuestHud.includes("capture-quests-modal__sheet"));
  assert.ok(idle.includes("captureQuestChests(idle.captureQuests)"));
  assert.ok(idle.includes("onOpenCaptureChest={openCaptureChest}"));
});

test("código NEVENATALINOSPLUS44YHWH com 2 usos por conta", () => {
  assert.ok(idle.includes("NEVENATALINOSPLUS44YHWH"));
  assert.ok(idle.includes("redeem_nevenatalinos_code"));
  assert.ok(idle.includes("adoptAuthoritativeCheckpoint"));
  assert.ok(rewardCodeSql.includes("NEVENATALINOSPLUS44YHWH"));
  assert.ok(rewardCodeSql.includes("uses between 0 and 2"));
  assert.ok(rewardCodeSql.includes("if v_uses >= 2 then"));
  for (const item of ["ultraball", "pokeball", "potion", "morango", "book_atk", "orb_xp_supreme", "disc_raiz", "disc_combustao", "disc_mare"]) {
    assert.ok(rewardCodeSql.includes(`'${item}'`), `faltou ${item}`);
  }
  assert.ok(rewardCodeSql.includes("tickets + 20"));
  assert.ok(rewardCodeSql.includes("least(999"));
  assert.ok(rewardCodeResetSql.includes("last_claim_day is distinct from v_today"));
  assert.ok(rewardCodeResetSql.includes("set tickets = 3"));
});
