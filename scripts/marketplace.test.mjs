import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = file => readFileSync(new URL(file, root), "utf8");
const load = async file => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(read(file), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString("base64")}`);
const market = await load("src/components/marketplace/marketplaceModel.ts");
const shiny = await load("src/game/shinyAnnouncement.ts");
const idle = read("src/routes/idle.tsx");
const ast = ts.createSourceFile("idle.tsx", idle, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function handler(name, globals) {
  let found;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) found = node.initializer;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(found, name);
  const code = ts.transpileModule(`const handler = ${found.getText(ast)}`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  return new Function(...Object.keys(globals), `${code};return handler`)(...Object.values(globals));
}
const pet = (uid, extra = {}) => ({ uid, species: "pikachu", level: 5, rarity: "common", capturedAt: 100, ...extra });

test("o inicial é protegido por indivíduo, inclusive evoluído; capturados da mesma espécie são vendáveis", () => {
  const starter = pet("initial", { species: "charizard", event: "starter", isStarter: true });
  const wild = pet("wild", { species: "charizard", capturedAt: 500 });
  assert.equal(market.initialPokemonUid([wild, starter]), "initial");
  assert.match(market.pokemonSaleError(starter, "initial", new Set()), /inicial/);
  assert.equal(market.pokemonSaleError(wild, "initial", new Set()), null);
  assert.equal(market.initialPokemonUid([pet("late", { species: "venusaur", capturedAt: 200 }), pet("old", { species: "ivysaur", capturedAt: 1 })]), "old");
  assert.equal(market.initialPokemonUid([wild], "missing-initial"), "missing-initial");
  assert.equal(market.initialPokemonUid([pet("bought", { species: "charizard", purchasedAt: 1000 })]), undefined);
});
test("não anuncia Pokémon do time, protegido ou descansando", () => {
  assert.match(market.pokemonSaleError(pet("active"), undefined, new Set(["active"])), /time/);
  assert.match(market.pokemonSaleError(pet("locked", { locked: true }), undefined, new Set()), /protegido/);
  assert.match(market.pokemonSaleError(pet("rest"), undefined, new Set(), new Set(["rest"])), /descanso/);
  assert.equal(market.pokemonSaleError(pet("free"), undefined, new Set()), null);
});
const listing = (id, extra = {}) => ({ id, kind: "item", item_id: "potion", qty: 1, pet_data: null, seller_id: "other", seller_name: "João", price: 100, currency: "gold", created_at: "2026-11-25T10:00:00Z", ...extra });
test("busca acentos, moeda, Pokémon/itens e shiny; ordenação não altera os dados originais", () => {
  const rows = [listing("a"), listing("b", { price: 20, currency: "crystal" }), listing("c", { kind: "pokemon", item_id: null, pet_data: pet("shiny", { species: "pikachu_shiny" }) })];
  const base = { query: "", kind: "all", currency: "all", sort: "recent" };
  assert.equal(market.filterMarketListings(rows, { ...base, query: "pocao" }).length, 2);
  assert.equal(market.filterMarketListings(rows, { ...base, query: "joao" }).length, 3);
  assert.deepEqual(market.filterMarketListings(rows, { ...base, shiny: true }).map(row => row.id), ["c"]);
  assert.deepEqual(market.filterMarketListings(rows, { ...base, currency: "crystal" }).map(row => row.id), ["b"]);
  assert.equal(market.filterMarketListings(rows, { ...base, sort: "price_asc" })[0].id, "b");
  assert.deepEqual(rows.map(row => row.id), ["a", "b", "c"]);
});
test("catálogo de itens do cliente coincide com a lista explícita do servidor e não vende moedas", () => {
  const sql = read("supabase/migrations/20261125111543_public_pokemon_marketplace.sql");
  const list = sql.slice(sql.indexOf("create function private.market_item_ids"), sql.indexOf("revoke all on function private.market_item_ids"));
  const server = [...list.matchAll(/'([a-z0-9_]+)'/g)].map(match => match[1]);
  assert.deepEqual(Object.keys(market.MARKET_ITEM_NAMES).sort(), server.sort());
  assert.ok(!market.MARKET_ITEM_NAMES.safira_verde);
  assert.ok(!market.MARKET_ITEM_NAMES.cristal_vermelho);
  assert.ok(sql.includes("starter_not_tradeable"));
  assert.ok(sql.includes("for update"));
  assert.ok(!sql.includes("'vip_required'"));
});
test("shiny de qualquer raridade gera aviso com treinador e espécie; captura comum não gera", () => {
  assert.equal(shiny.shinyCaptureMessage({ name: "Lia", sp: "pikachu", rarity: "common" }), null);
  assert.equal(shiny.shinyCaptureMessage({ name: "Lia", sp: "caterpie_shiny", rarity: "common", level: 1 }), "🌍✨ Lia capturou CATERPIE SHINY Nv. 1 — SHINY!");
  assert.ok(shiny.shinyCaptureMessage({ name: "Lia", sp: "mewtwo", rarity: "mythic_shiny" }));
  assert.equal(shiny.shinyCaptureMessage({ sp: "<script>", shiny: true }), null);
  assert.ok(idle.includes('ch.on("broadcast", { event: "capture" }'));
  assert.ok(idle.includes("seenCaptures.has(key)"));
  assert.ok(idle.includes("captureId: np.uid"));
});
test("mutação real do Marketplace remove a custódia sem perder ganhos ocorridos durante a chamada", () => {
  const amount = handler("marketAmount", {});
  const patch = handler("patchMarketSnapshot", { marketAmount: amount });
  const base = { idle: { items: { safira_verde: 10 }, bank: { gold: 1000, crystals: 30 }, collection: [pet("sale"), pet("keep")], caughtSpecies: [], seenSpecies: [] }, team: [pet("keep")], restingBench: [pet("sale")] };
  const current = structuredClone(base);
  current.idle.bank.gold += 100;
  current.idle.collection.push(pet("new-capture"));
  const result = patch(current, base, null, { removed_uid: "sale", gold: 1000, crystals: 30, safira: 10 });
  assert.equal(result.idle.bank.gold, 1100);
  assert.deepEqual(result.idle.collection.map(pet => pet.uid), ["keep", "new-capture"]);
  assert.deepEqual(result.restingBench, []);
  assert.equal(result.team[0].uid, "keep");
  const received = pet("bought", { species: "mewtwo", event: "ancestral", traits: ["atk"], legacyStars: 7, statBoost: 1.2 });
  const bought = patch(current, base, null, { gold: 700, crystals: 30, safira: 10, pet_data: received });
  assert.equal(bought.idle.bank.gold, 800);
  assert.equal(bought.idle.collection.at(-1).uid, "bought");
  assert.equal(bought.idle.collection.at(-1).statBoost, 1.2);
  assert.ok(bought.idle.caughtSpecies.includes("mewtwo"));
  assert.equal(patch(bought, base, null, { pet_data: received }).idle.collection.filter(pet => pet.uid === "bought").length, 1);
});
test("reação de combate não depende mais de movimento; mantém cooldown de dano e restrições", () => {
  assert.equal(ast.parseDiagnostics.length, 0);
  const start = idle.indexOf("const lastWildAttackAtRef");
  const end = idle.indexOf("// Dano de skill inimiga:", start);
  const battle = idle.slice(start, end);
  assert.ok(battle.includes("battleTickRef.current = () =>"));
  assert.ok(battle.includes("const team = teamRef.current"));
  assert.ok(battle.includes("setInterval(tick, 120)"));
  assert.ok(battle.includes("attackTime - lastWildAttackAtRef.current >= 900"));
  assert.ok(battle.includes("lastWildAttackAtRef.current >= attackTime"));
  assert.ok(battle.includes("if (!attackReady"));
  assert.ok(!battle.includes("[team, trainerPos, leaderHp"));
  for (const guard of ["ownPvpFaintedRef", "isStarving(leader)", "autoBattleRef", "paralyzedUntilRef", "fDist > pRange"]) assert.ok(battle.includes(guard));
});
test("todos os mapas do Professor fechados no cliente e no save remoto, sem fechar o hub", () => {
  const access = read("src/game/mapAccess.ts");
  const data = read("src/components/professorLabData.ts");
  const ids = [...data.slice(data.indexOf("export type ProfMapId"), data.indexOf("export type ProfMapDef")).matchAll(/"([a-z0-9_]+)"/g)].map(match => match[1]);
  const blocked = access.slice(access.indexOf("export const BLOCKED_LAB_MAPS"), access.indexOf("export const isMapBlocked"));
  const sql = read("supabase/migrations/20261125111553_server_vip_bonus_and_limited_codes.sql");
  assert.equal(ids.length, 14);
  for (const id of ids) { assert.ok(blocked.includes(`"${id}"`)); assert.ok(sql.includes(`'${id}'`)); }
  assert.ok(!blocked.includes('"laboratorio"'));
  assert.ok(!access.match(/isMapBlocked = .*DEV/));
});
test("códigos globais usam limite atômico de 3 e o bônus tem prazo único, sem códigos legíveis no bundle", () => {
  const sql = read("supabase/migrations/20261125111553_server_vip_bonus_and_limited_codes.sql");
  assert.ok(sql.includes("check(max_uses=3)"));
  assert.ok(sql.includes("used_count<max_uses"));
  assert.ok(sql.includes("for update"));
  assert.ok(sql.includes("now()+interval '48 hours'"));
  assert.ok(sql.includes("on conflict(id) do nothing"));
  assert.ok(sql.includes("goldMultUntil"));
  assert.ok(idle.includes('limitedServerCode ? "redeem_limited_server_reward"'));
  assert.ok(!idle.match(/VIPANUAL3[A-Z2-9]{20}/));
});
