import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/hud/TargetHud.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
});
const componentModule = { exports: {} };
const require = createRequire(new URL("../package.json", import.meta.url));
new Function("require", "module", "exports", outputText)(require, componentModule, componentModule.exports);
const { TargetHud } = componentModule.exports;

const fixture = {
  id: 1, name: "Caterpie", level: 7, rarity: "common", hp: 222, maxHp: 278,
  image: "/fixture-pokemon.png", frame: 0, direction: 0, flip: false, elite: true,
};
const render = (patch = {}) => renderToStaticMarkup(createElement(TargetHud, { target: { ...fixture, ...patch } }));

test("visible target content contains only level, portrait and HP bar", () => {
  const html = render();
  assert.equal(html.replace(/<[^>]*>/g, "").trim(), "Lv. 7");
  assert.match(html, /<img /);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-valuenow="222"/);
  assert.match(html, /aria-label="Alvo: Caterpie/);
  assert.match(html, /Elite/); // Kept in the accessible description, not on the screen.
});

for (const [rarity, color] of Object.entries({
  common: "#72d79c", uncommon: "#4dd5b2", rare: "#62b7ff", epic: "#bc91ff",
  legendary: "#ffad64", mythic: "#ff82b4", mythic_shiny: "#f6a2eb",
})) {
  test(`target tier color: ${rarity}`, () => {
    assert.ok(render({ rarity }).includes(`--target-tier:${color}`));
  });
}

test("HP values are clamped safely", () => {
  assert.match(render({ hp: -5 }), /aria-valuenow="0"/);
  assert.match(render({ hp: 999 }), /aria-valuenow="278"/);
  assert.doesNotMatch(render({ hp: 0, maxHp: 0 }), /NaN|Infinity/);
});

test("sprite sheets keep their original frame and direction", () => {
  const html = render({ sheet: "/fixture-sheet.png", frame: 1, direction: 3 });
  assert.match(html, /revo-target__sheet/);
  assert.match(html, /background-image:url\(\/fixture-sheet.png\)/);
  assert.match(html, /background-position:33.333% 99.999%/);
});
