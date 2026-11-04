import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const idle = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/components/hud/hud.css", import.meta.url), "utf8");

for (const [name, width, height] of [["mato", 344, 96], ["grama", 344, 96], ["flores", 352, 88], ["folhas", 360, 96]]) {
  test(`${name}: faixa RGBA com quatro frames alinhados`, () => {
    const png = readFileSync(new URL(`../src/ambiente/xz/${name}-frames.png`, import.meta.url));
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
    assert.equal(png[25], 6, "RGBA com transparência");
    assert.ok(idle.includes(`${name}-frames.png`));
  });
}

test("SA usa plantas recortadas, sem animafl nem flutuação artificial", () => {
  assert.ok(!idle.includes("animafl"));
  assert.ok(!idle.includes("o.anim"));
  const start = idle.indexOf('if (mapId === "sa") {');
  const end = idle.indexOf("return list;", start);
  const branch = idle.slice(start, end);
  assert.ok(branch.includes("p < 32"));
  assert.ok(branch.includes("cols: 4, rows: 1, frames: 4"));
  assert.ok(branch.includes("blocks: false, collideR: 0"));
});

test("animação percorre frames inteiros em pixels e reinicia sem frame vazio", () => {
  assert.ok(idle.includes("steps(${frames}, end)"));
  assert.ok(idle.includes("${-o.w * cols}px"));
  assert.match(css, /@keyframes saPlantFrames/);
  assert.match(css, /to \{ background-position: var\(--sa-plant-end\) 0px; \}/);
});
