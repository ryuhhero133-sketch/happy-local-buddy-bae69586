import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const { outputText } = ts.transpileModule(read("src/components/hud/hudPositions.ts"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { hudAnchorFromPoint, hudPointFromAnchor, clampHudPoint, parseHudPositions, hudPositionKey } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("HUD layout is isolated by account, desktop and mobile orientation", () => {
  const keys = ["desktop", "touch-landscape", "touch-portrait"].flatMap((device) =>
    ["alice", "bob", undefined].map((account) => hudPositionKey(account, device)));
  assert.equal(new Set(keys).size, 9);
});

test("every drop position round-trips without snapping to a grid", () => {
  const frame = { left: 122.2, top: 91.2, width: 1121.6, height: 897.6 };
  const size = { width: 85.7, height: 70.1 };
  for (const point of [{ x: 311.43, y: 502.17 }, { x: 751.9, y: 207.63 }]) {
    const result = hudPointFromAnchor(hudAnchorFromPoint(point, frame, size), frame, size);
    assert.ok(Math.abs(result.x - point.x) < .00001);
    assert.ok(Math.abs(result.y - point.y) < .00001);
  }
});

test("saved blocks stay visible after zoom, viewport changes and expanding panels", () => {
  for (const frame of [
    { left: 0, top: 0, width: 1366, height: 768 },
    { left: 122.2, top: 91.2, width: 1121.6, height: 897.6 },
    { left: 0, top: 0, width: 844, height: 390 },
    { left: 0, top: 0, width: 390, height: 844 },
  ]) {
    for (const size of [{ width: 85, height: 64 }, { width: 320, height: 96 }]) {
      for (const anchor of [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: .48, y: .63 }]) {
        const point = hudPointFromAnchor(anchor, frame, size);
        assert.ok(point.x >= frame.left + 8 && point.y >= frame.top + 8);
        assert.ok(point.x + size.width <= frame.left + frame.width - 8.00001 + .001);
        assert.ok(point.y + size.height <= frame.top + frame.height - 8.00001 + .001);
      }
    }
  }
});

test("dragging outside the map cannot lose the controls", () => {
  const frame = { left: 100, top: 50, width: 800, height: 400 };
  const size = { width: 100, height: 60 };
  assert.deepEqual(clampHudPoint({ x: -9999, y: -9999 }, frame, size), { x: 108, y: 58 });
  assert.deepEqual(clampHudPoint({ x: 9999, y: 9999 }, frame, size), { x: 792, y: 382 });
  assert.deepEqual(clampHudPoint({ x: 900, y: 600 }, { left: 0, top: 0, width: 1, height: 1 }, size), { x: 8, y: 8 });
});

test("broken or malicious local storage never creates invalid transforms", () => {
  for (const raw of [null, "", "{broken", "null", "[]", "42"]) assert.deepEqual(parseHudPositions(raw), {});
  assert.deepEqual(parseHudPositions('{"profile":{"x":-2,"y":4},"auto":{"x":"2","y":0},"x y":{"x":0,"y":0},"potion":{"x":0.25,"y":0.75},"__proto__":{"x":1,"y":1}}'), {
    profile: { x: 0, y: 1 }, potion: { x: .25, y: .75 },
  });
});

test("drag uses pointer capture and animation frames, saves on drop and suppresses clicks", () => {
  const source = read("src/components/hud/useHudDrag.ts");
  for (const token of ["setPointerCapture", "releasePointerCapture", "requestAnimationFrame(paintDrag)", "event.stopImmediatePropagation()", 'window.addEventListener("click", click, true)', 'window.addEventListener("pointercancel"', 'window.addEventListener("blur"', "element.style.translate", "localStorage.setItem(key, JSON.stringify(positions))", "tapButton.click()", "ignoredClicks.has(event.pointerId)"]) assert.ok(source.includes(token), token);
  const paint = source.slice(source.indexOf("const paintDrag"), source.indexOf("const activate"));
  assert.doesNotMatch(paint, /setState|setItem/);
});

test("all main HUD controls can move; scrolling and the joystick retain their own gestures", () => {
  const game = read("src/components/hud/GameHud.tsx");
  for (const id of ["profile", "resources", "minimap", "systems", "auto", "potion", "combat-shortcuts"]) assert.ok(game.includes(`data-hud-id="${id}"`), id);
  const menu = read("src/components/hud/MainMenu.tsx");
  for (const id of ["menu", "bag", "mount"]) assert.ok(menu.includes(`data-hud-id="${id}"`), id);
  assert.ok(menu.includes("Restaurar HUD"));
  for (const file of ["ChatHud", "TeamHud"]) assert.ok(read(`src/components/hud/${file}.tsx`).includes("data-hud-no-drag"));
  assert.ok(!read("src/components/hud/TouchJoystick.tsx").includes("data-hud-id"));
});

test("six compact cloud resources include red crystals but no pepitas or throws", () => {
  const game = read("src/components/hud/GameHud.tsx");
  const route = read("src/routes/idle.tsx");
  assert.match(game, /label: "Cristais vermelhos".*redCrystalIcon.*hud\.redCrystals/);
  const resources = game.slice(game.indexOf("const resources = ["), game.indexOf("];", game.indexOf("const resources = [")));
  assert.equal((resources.match(/label:/g) ?? []).length, 6);
  assert.doesNotMatch(resources, /Pepitas|Arremessos|pepitaIcon|hud\.throws/);
  const css = read("src/components/hud/personal-hud.css");
  assert.match(css, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(css, /grid-template-columns: repeat\([48],/);
  assert.ok(route.includes("redCrystals={idle.items?.cr_red ?? 0}"));
  assert.ok(game.includes('useHudCollapsed(hud.layoutAccountId, "profile", false)'));
  assert.ok(game.includes('useHudCollapsed(hud.layoutAccountId, "resources", true)'));
  assert.ok(statSync(new URL("../src/assets/hud-resource-cloud.webp", import.meta.url)).size < 20000);
  assert.ok(!game.includes('ANCESTRAIS/nv.png'));
});
