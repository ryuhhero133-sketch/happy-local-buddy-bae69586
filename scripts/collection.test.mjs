import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function load(file, localRequire = require) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(localRequire, mod, mod.exports);
  return mod.exports;
}
const model = load("../src/components/collection/collectionModel.ts");
const { CollectionPanel } = load("../src/components/collection/CollectionPanel.tsx", id => id.endsWith(".css") ? {} : id === "./collectionModel" ? model : require(id));
const { pokemonNumber, filterPokemon, collectionProgress, eligibleForFragment, matchesCollectionFilter } = model;
const record = (key, patch = {}) => ({ key, species: "bulbasaur", name: "Bulbasaur", number: 1, image: "/bulbasaur.png", rarity: "common", types: [{ name: "Planta", color: "#78c850", icon: "🌿" }], caught: true, seen: true, inTeam: false, locked: false, craftGain: 1, traits: [], moves: ["Vine Whip"], ...patch });
const render = (records, patch = {}) => renderToStaticMarkup(createElement(CollectionPanel, { mode: "collection", records, progress: { count: 1, total: 20, percent: 5 }, capacity: 500, craftPoints: 12, onClose() {}, onDetails() { return true; }, onLock() {}, onFragment() {}, ...patch }));

test("canonical numbers do not depend on current sort or page", () => {
  assert.equal(pokemonNumber("bulbasaur"), 1);
  assert.equal(pokemonNumber("mew"), 151);
  assert.equal(pokemonNumber("charizard_shiny"), 6);
  assert.equal(pokemonNumber("lugia_shiny_ancestral"), 249);
  assert.equal(pokemonNumber("unknown_special"), undefined);
});
test("collection progress counts distinct catalog species, not duplicate captures", () => {
  assert.deepEqual(collectionProgress(["bulbasaur", "bulbasaur", "invalid"], ["bulbasaur", "charmander"]), { count: 1, total: 2, percent: 50 });
  assert.equal(collectionProgress([], []).percent, 0);
});
test("rarity and event filters retain original classifications", () => {
  const black = record("a", { event: "black_mitic_plus", rarity: "mythic" });
  assert.equal(matchesCollectionFilter(black, "black"), true);
  assert.equal(matchesCollectionFilter(black, "mythic"), true);
  assert.equal(matchesCollectionFilter(black, "ancestral"), false);
  assert.equal(matchesCollectionFilter(record("b", { species: "latias_ancestral" }), "ancestral"), true);
});
test("filters compose favorites, protection, accented search and status", () => {
  const records = [record("a", { name: "Mítico", locked: true }), record("b", { seen: false, caught: false })];
  assert.deepEqual(filterPokemon(records, { filter: "all", query: "MITICO", sort: "dex", favorites: new Set(["a"]), onlyLocked: true }).map(r => r.key), ["a"]);
  assert.deepEqual(filterPokemon(records, { filter: "all", query: "", sort: "dex", status: "unseen" }).map(r => r.key), ["b"]);
});
test("sorting never mutates the original collection or drops duplicates", () => {
  const records = [record("a", { number: 6 }), record("b", { number: 1 }), record("c", { number: 1 })];
  assert.deepEqual(filterPokemon(records, { filter: "all", query: "", sort: "dex" }).map(r => r.key), ["b", "c", "a"]);
  assert.equal(records[0].key, "a");
});
test("team members and protected entries are ineligible for fragmentation", () => {
  assert.equal(eligibleForFragment(record("a", { inTeam: true })), false);
  assert.equal(eligibleForFragment(record("a", { locked: true })), false);
  assert.equal(eligibleForFragment(record("a")), true);
});
test("reference grid renders ten cards and real pagination", () => {
  const html = render(Array.from({ length: 23 }, (_, i) => record(String(i))));
  assert.equal((html.match(/data-record=/g) ?? []).length, 10);
  assert.match(html, /1 \/ 3/);
  assert.match(html, /Ver Detalhes/);
  assert.match(html, /Buscar Pokémon/);
});
test("empty collection renders safe empty state and no invented rewards", () => {
  const html = render([]);
  assert.match(html, /Nenhum Pokémon encontrado/);
  assert.match(html, /1 \/ 1/);
  assert.doesNotMatch(html, /\+10%|186|721/);
});
test("Pokédex masks unknown sprites and disables their details", () => {
  const html = render([record("dex:a", { seen: false, caught: false })], { mode: "pokedex" });
  assert.match(html, /is-unseen/);
  assert.match(html, /Não registrado/);
  assert.match(html, /collection-details-button" disabled/);
  assert.doesNotMatch(html, />Fragmentar</);
});
test("known 4x4 sheets render cropped frames instead of an entire sprite atlas", () => {
  const html = render([record("sheet", { image: "/atlas.png", sheet: "/atlas.png" })]);
  assert.match(html, /collection-sheet/);
  assert.match(html, /background-image:url/);
  assert.doesNotMatch(html, /<img src="\/atlas.png"/);
});
