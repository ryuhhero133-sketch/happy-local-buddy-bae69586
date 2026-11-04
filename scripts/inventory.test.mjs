import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/components/inventory/inventoryModel.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const mod = { exports: {} };
new Function("require", "module", "exports", outputText)(require, mod, mod.exports);
const { inventoryCategory, inventoryRarity, filterInventory, inventoryUseQuantity, INVENTORY_PAGE_SIZE } = mod.exports;
const item = (id, patch = {}) => ({ key: id, id, name: id, description: "", quantity: 12, rarity: inventoryRarity(id), category: inventoryCategory(id), source: "bag", usable: true, bulk: false, actionLabel: "Usar", ...patch });

test("reference grid uses six columns and four rows", () => assert.equal(INVENTORY_PAGE_SIZE, 24));
test("real item IDs map to their pockets", () => {
  for (const [id, expected] of Object.entries({ pokeball: "balls", potion: "usable", book_atk: "usable", egg_anc_plus: "eggs", egg_boost_69: "evolution", stone_fire: "evolution", stone_pack_all: "events", ferro: "ores", fibra: "materials", cr_rare: "fragments", ticket_ancestral: "events" })) assert.equal(inventoryCategory(id), expected, id);
  assert.equal(inventoryCategory("helmet", true), "equipment");
});
test("filters compose and ignore accents in search", () => {
  const items = [item("potion", { name: "Poção" }), item("pokeball"), item("egg_common")];
  assert.deepEqual(filterInventory(items, "consumables", "all", "POCAO").map(i => i.id), ["potion"]);
  assert.deepEqual(filterInventory(items, "items", "eggs").map(i => i.id), ["egg_common"]);
  assert.equal(filterInventory(items, "balls", "usable").length, 0);
});
test("vault and bag entries stay distinct and depleted items disappear", () => {
  const items = [item("ferro"), item("ferro", { key: "vault:ferro", source: "vault" }), item("potion", { quantity: 0 })];
  assert.deepEqual(filterInventory(items, "materials", "all").map(i => i.key), ["ferro", "vault:ferro"]);
  assert.equal(filterInventory(items, "items", "all").length, 2);
});
test("bulk quantities are clamped and rounded safely", () => {
  const potion = item("potion", { bulk: true });
  for (const [request, expected] of [[999, 12], [-1, 1], [2.9, 2], [NaN, 1], [Infinity, 1]]) assert.equal(inventoryUseQuantity(potion, request), expected);
});
test("single-use handlers never receive bulk quantities", () => {
  for (const id of ["book_vip", "egg_common", "premium_box", "berry"]) assert.equal(inventoryUseQuantity(item(id), 12), 1);
});
test("rarity styling recognizes special real items", () => {
  assert.equal(inventoryRarity("egg_anc_plus"), "mythic");
  assert.equal(inventoryRarity("book_vip_60"), "legendary");
  assert.equal(inventoryRarity("premium_box"), "epic");
  assert.equal(inventoryRarity("potion"), "common");
});
