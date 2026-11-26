import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const component = read("src/components/AmbientTrainers.tsx");
const menu = read("src/components/TrainerActionMenu.tsx");
const idle = read("src/routes/idle.tsx");

test("30 treinadores ambiente: 7 na cidade, 5 na Rota 1 e o resto nos mapas de caça", () => {
  assert.ok(component.includes('["emerald", ...PVP_SCHEDULE_MAP_IDS]'));
  assert.ok(component.includes("emerald: 7"));
  assert.ok(component.includes("rota1: 5"));
  assert.ok(component.includes("bobo_rota2: 3"));
  assert.ok(component.includes("bobo_uuid: 3"));
  assert.ok(component.includes("bobo_transicao: 3"));
  assert.ok(component.includes("bobo_g11ds: 2"));
  assert.ok(component.includes("bobo_rota_gelo: 2"));
  assert.ok(component.includes("bobo_transicao_gelo: 2"));
  assert.ok(component.includes("bobo_mmmm: 3"));
  const total = 7 + 5 + 3 + 3 + 3 + 2 + 2 + 2 + 3;
  assert.equal(total, 30);
});

test("bots usam o mesmo menu de um treinador real, mas as ações não fazem nada", () => {
  assert.ok(component.includes("<TrainerActionMenu"));
  assert.ok(component.includes("onGuild={() => setMenuFor(null)}"));
  assert.ok(component.includes("onFriend={() => setMenuFor(null)}"));
  assert.ok(component.includes("onParty={() => setMenuFor(null)}"));
  assert.ok(component.includes("guildEnabled={guildEnabled}"));
  assert.ok(menu.includes("🏰 ADICIONAR À GUILDA"));
  assert.ok(menu.includes("💚 ADICIONAR AMIGO"));
  assert.ok(menu.includes("⚔️ JUNTAR À PARTY"));
  assert.ok(idle.includes("<TrainerActionMenu"));
});

test("alguns bots têm selo VIP GOLD e outros VIP EPIC", () => {
  assert.ok(component.includes('"vip60"'));
  assert.ok(component.includes('"vip"'));
  assert.ok(component.includes("PROFILE_SPRITES.books[VIP_BOOK_BY_TIER[def.vipTier]]"));
  assert.ok(component.includes("Jogador VIP GOLD"));
  assert.ok(component.includes("Jogador VIP EPIC"));
});

test("bots não ficam sobre colisão e, nos mapas de caça, ficam dentro do mato", () => {
  assert.ok(component.includes("collisionReady(mapId)"));
  assert.ok(component.includes("isWalkable"));
  assert.ok(component.includes("isInGrassPatch"));
  assert.ok(component.includes("grassTileCenter"));
  assert.ok(component.includes("patchId"));
  assert.ok(component.includes("grassPatches"));
  assert.ok(idle.includes("grassPatches={grassPatches}"));
  assert.ok(!component.includes("hue-rotate"));
});

test("bots são 100% client-side: sem rede, banco, save ou chat global", () => {
  assert.ok(!/supabase|fetch\(|localStorage|sessionStorage|setIdle|pushChat|pushCloudSaveNow/.test(component));
  assert.ok(component.includes("window.setInterval"));
  assert.ok(!component.includes("requestAnimationFrame"));
  assert.ok(component.includes("memo(function AmbientTrainers"));
});

test("só o mapa atual é renderizado e o editor fica limpo", () => {
  assert.ok(component.includes("if (!canPlace || !BOT_MAP_SET.has(mapId)) return null"));
  assert.ok(component.includes("defs.map((def) =>"));
  assert.ok(idle.includes("<AmbientTrainers"));
  assert.ok(idle.includes("key={idle.currentMap}"));
  assert.ok(idle.includes("!mapEditorOpen"));
  assert.ok(idle.includes("worldW={curWorldW}"));
  assert.ok(idle.includes("worldH={curWorldH}"));
});

test("bots usam nomes fictícios e líderes da área", () => {
  for (const name of ["Luna", "Ryu", "Mika", "Theo", "Nina", "Kai", "Juca"]) {
    assert.ok(component.includes(`"${name}"`), name);
  }
  assert.ok(component.includes("leaderPool(mapId)"));
  assert.ok(component.includes("zoneForMap(mapId)"));
});
