import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Test the actual TypeScript helper without adding a runner or changing the lockfile.
const source = readFileSync(new URL("../src/components/hud/hudLayout.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { getHudMapBounds, getHudScale } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} != ${expected}`);

test("large world: HUD uses the viewport, not offscreen world coordinates", () => {
  const bounds = getHudMapBounds({ w: 1366, h: 768 }, { w: 3000, h: 2400 }, 1, { x: 500, y: 300 }, { x: 0, y: 0 });
  assert.deepEqual(bounds, { left: 0, top: 0, width: 1366, height: 768 });
});

test("80% zoom: left and right black margins are excluded", () => {
  const bounds = getHudMapBounds({ w: 1366, h: 768 }, { w: 1402, h: 1122 }, 0.8, { x: 0, y: 100 }, { x: 122.2, y: 0 });
  close(bounds.left, 122.2);
  close(bounds.width, 1121.6);
  assert.equal(bounds.top, 0);
  assert.equal(bounds.height, 768);
});

test("small map on a large monitor: all four black margins are excluded", () => {
  const bounds = getHudMapBounds({ w: 1920, h: 1080 }, { w: 1402, h: 1122 }, 0.8, { x: 0, y: 0 }, { x: 399.2, y: 91.2 });
  close(bounds.left, 399.2);
  close(bounds.top, 91.2);
  close(bounds.width, 1121.6);
  close(bounds.height, 897.6);
});

test("zoom and viewport changes recalculate the anchor instead of retaining stale margins", () => {
  for (const zoom of [0.8, 0.9, 1, 1.25, 2]) {
    for (const [w, h] of [[1920, 1080], [1366, 768], [800, 614], [390, 844]]) {
      const center = { x: Math.max(0, (w - 1402 * zoom) / 2), y: Math.max(0, (h - 1122 * zoom) / 2) };
      const bounds = getHudMapBounds({ w, h }, { w: 1402, h: 1122 }, zoom, { x: 0, y: 0 }, center);
      close(bounds.left, center.x);
      close(bounds.top, center.y);
      close(bounds.width, Math.min(w, 1402 * zoom));
      close(bounds.height, Math.min(h, 1122 * zoom));
    }
  }
});

test("HUD becomes smaller on small maps without forcing a higher game zoom", () => {
  const scale = getHudScale({ left: 0, top: 0, width: 700, height: 500 }, 1920);
  close(scale, 0.7);
  assert.ok(700 / scale >= 1000);
  assert.ok(500 / scale >= 680);
});

test("preferred desktop and mobile scales stay readable when enough map space exists", () => {
  assert.equal(getHudScale({ left: 0, top: 0, width: 1366, height: 768 }, 1366), 0.8);
  assert.equal(getHudScale({ left: 0, top: 0, width: 390, height: 844 }, 390), 1);
});
