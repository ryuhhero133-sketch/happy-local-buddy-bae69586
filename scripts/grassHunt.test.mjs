import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/game/grassHunt.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
} }).outputText;
const hunt = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const { buildGrassPatches, createGrassHuntState, tickGrassHunt, grassTileCenter, isOnGrassTile,
  isInGrassPatch, nearestGrassPatch, findGrassPath, walkableSegment, grassHuntEnemies } = hunt;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const tile = (id, x, y, size = 40) => ({ id, x, y, w: size, h: size, stepGrass: 3 });
const grid = (x = 200, y = 240, cols = 4, rows = 3, size = 40, firstId = 1) =>
  Array.from({ length: cols * rows }, (_, i) => tile(firstId + i, x + i % cols * size, y + Math.floor(i / cols) * size, size));
const free = () => true;

function simulate(patches, start, ticks, getEnemies = () => [], canWalk = free, state = createGrassHuntState()) {
  let position = { ...start };
  const history = [];
  for (let i = 0; i < ticks; i++) {
    const action = tickGrassHunt(state, { patches, position, enemies: getEnemies(i, state, position), canWalk, now: i * 33 });
    if (action.kind === "walk") {
      const d = distance(position, action.point);
      const step = Math.min(d, 7 * 33 / 60);
      const next = { x: position.x + (action.point.x - position.x) / d * step,
        y: position.y + (action.point.y - position.y) / d * step };
      assert.ok(walkableSegment(position, next, canWalk), "movimento atravessou colisão");
      position = next;
    }
    history.push({ position: { ...position }, action, entered: state.entered });
  }
  return { state, history, position };
}

test("o destino usa os pés no desenho, não a base do objeto", () => {
  for (const size of [40, 45, 46, 48, 64]) {
    const t = tile(1, 200, 240, size);
    assert.ok(!isOnGrassTile(t, { x: t.x, y: t.y }));
    assert.ok(isOnGrassTile(t, grassTileCenter(t)));
    assert.ok(isOnGrassTile(t, grassTileCenter(t, 24), 24));
  }
});

test("tiles redimensionados de 48px formam um canteiro, sem juntar spots separados", () => {
  const patches = buildGrassPatches([...grid(200, 240, 4, 3, 48), ...grid(800, 240, 3, 3, 40, 100)]);
  assert.equal(patches.length, 2);
  assert.equal(patches[0].tiles.length, 12);
  assert.equal(patches[1].tiles.length, 9);
  assert.ok(isInGrassPatch(patches[0], patches[0].center));
});

test("GBA antigo sem stepGrass ainda é identificado pelo assetId", () => {
  const patches = buildGrassPatches([{ ...tile(1, 200, 240), stepGrass: undefined, assetId: "mato_verde" }]);
  assert.equal(patches.length, 1);
  assert.equal(buildGrassPatches([{ ...tile(1, 200, 240), stepGrass: undefined, assetId: "editor_tree" }]).length, 0);
});

test("a distância usa a borda do canteiro, não o centro de um canteiro grande", () => {
  const patches = buildGrassPatches(grid(200, 240, 25, 2));
  assert.equal(patches.length, 1);
  assert.equal(nearestGrassPatch(patches, { x: 170, y: 210 }, 420)?.id, patches[0].id);
  const result = simulate(patches, { x: 170, y: 210 }, 400);
  assert.ok(result.state.entered);
  for (const h of result.history.filter((h) => h.entered)) {
    assert.ok(distance(h.position, result.state.center) <= 172);
  }
});

test("entra de verdade no centro mesmo com inimigo vivo; não para 40px antes", () => {
  const patches = buildGrassPatches(grid());
  const enemy = { id: 99, hp: 100, ...grassTileCenter(patches[0].tiles[5], 24), grassPatchId: patches[0].id };
  const result = simulate(patches, { x: 350, y: 380 }, 180, () => [enemy]);
  const firstBattle = result.history.findIndex((h) => h.action.kind === "battle");
  assert.ok(firstBattle > 0);
  assert.ok(result.history.slice(0, firstBattle).some((h) => h.action.kind === "walk"));
  assert.ok(isInGrassPatch(patches[0], result.history[firstBattle].position));
  assert.ok(distance(result.history[firstBattle].position, result.state.center) <= 4);
});

test("um inimigo distante não bloqueia a entrada nem a patrulha", () => {
  const patches = buildGrassPatches(grid());
  const result = simulate(patches, { x: 350, y: 380 }, 650, () => [{ id: 999, hp: 10, x: 1600, y: 1600 }]);
  assert.ok(result.state.entered);
  assert.ok(!result.history.some((h) => h.action.kind === "battle"));
  const positions = result.history.filter((h) => h.entered).map((h) => `${Math.round(h.position.x)},${Math.round(h.position.y)}`);
  assert.ok(new Set(positions).size > 100, "não continuou andando no mato");
});

test("nunca troca de canteiro para buscar inimigo; não deriva enquanto patrulha", () => {
  const patches = buildGrassPatches([...grid(), ...grid(440, 240, 3, 3, 40, 100)]);
  const enemy = { id: 99, hp: 100, ...grassTileCenter(patches[1].tiles[0], 24), grassPatchId: patches[1].id };
  const result = simulate(patches, { x: 210, y: 360 }, 1500, () => [enemy]);
  assert.equal(result.state.patchId, patches[0].id);
  assert.ok(result.state.entered);
  assert.ok(!result.history.some((h) => h.action.kind === "battle"));
  for (const h of result.history.filter((h) => h.entered)) {
    assert.ok(isInGrassPatch(patches[0], h.position, 12));
    assert.ok(distance(h.position, result.state.center) <= 172);
  }
});

test("para no mato para combater, mantém o alvo e retoma a patrulha após morrer", () => {
  const patches = buildGrassPatches(grid());
  let battleAt = null;
  const result = simulate(patches, { x: 350, y: 380 }, 550, (i, state) => {
    if (!state.entered) return [];
    if (battleAt === null) battleAt = i;
    if (i - battleAt >= 70) return [];
    return [
      { id: 70, hp: 100, ...grassTileCenter(patches[0].tiles[5], 24), grassPatchId: patches[0].id },
      { id: 71, hp: 100, ...grassTileCenter(patches[0].tiles[6], 24), grassPatchId: patches[0].id },
    ];
  });
  const battles = result.history.filter((h) => h.action.kind === "battle");
  assert.ok(battles.length > 50);
  assert.equal(new Set(battles.map((h) => h.action.targetId)).size, 1, "trocou de alvo sem necessidade");
  assert.ok(battles.every((h) => distance(h.position, battles[0].position) === 0));
  assert.ok(result.history.slice(battleAt + 75).some((h) => h.action.kind === "walk"));
});

test("alvo que sai do leash do treinador não puxa o spot pelo follower", () => {
  const patches = buildGrassPatches(grid());
  const { state, position } = simulate(patches, { x: 350, y: 380 }, 160);
  const enemy = { id: 9, hp: 10, x: position.x + 300, y: position.y, grassPatchId: state.patchId };
  assert.equal(grassHuntEnemies(state, patches, [enemy], position).length, 0);
});

test("caminho local contorna obstáculo, não atravessa máscara rosa nem corta diagonal", () => {
  const from = { x: 100, y: 200 }, to = { x: 340, y: 200 };
  const canWalk = ({ x, y }) => !(x >= 180 && x <= 245 && y >= 120 && y <= 245);
  const path = findGrassPath(from, to, canWalk);
  assert.ok(path && path.length > 1);
  let previous = from;
  for (const point of path) { assert.ok(walkableSegment(previous, point, canWalk)); previous = point; }
  assert.deepEqual(path.at(-1), to);
});

test("canteiro em L não usa o buraco da bounding box como destino ou atalho", () => {
  const objects = grid(200, 240, 5, 5).filter((_, i) => i % 5 <= 1 || Math.floor(i / 5) >= 3);
  const patches = buildGrassPatches(objects);
  const result = simulate(patches, { x: 200, y: 400 }, 1800);
  assert.ok(result.state.entered);
  for (const h of result.history.filter((h) => h.entered)) assert.ok(isInGrassPatch(patches[0], h.position, 12), JSON.stringify(h));
});

test("sem mato próximo fica parado; dados que chegam da nuvem passam a valer", () => {
  const state = createGrassHuntState(), position = { x: 200, y: 300 };
  assert.equal(tickGrassHunt(state, { patches: [], position, enemies: [], canWalk: free, now: 0 }).kind, "wait");
  assert.equal(state.patchId, null);
  assert.equal(tickGrassHunt(state, { patches: buildGrassPatches(grid(1800, 1800)), position, enemies: [], canWalk: free, now: 33 }).kind, "wait");
  const action = tickGrassHunt(state, { patches: buildGrassPatches(grid()), position, enemies: [], canWalk: free, now: 66 });
  assert.equal(action.kind, "walk");
});

test("spot bloqueado não causa teleporte, troca de mato ou loop de busca por frame", () => {
  const patches = buildGrassPatches([...grid(), ...grid(700, 240, 3, 3, 40, 100)]);
  const state = createGrassHuntState(), position = { x: 200, y: 400 };
  let calls = 0;
  const blocked = () => { calls++; return false; };
  assert.equal(tickGrassHunt(state, { patches, position, enemies: [], canWalk: blocked, now: 0 }).kind, "wait");
  const firstCalls = calls;
  for (let i = 1; i < 30; i++) tickGrassHunt(state, { patches, position, enemies: [], canWalk: blocked, now: i * 33 });
  assert.equal(calls, firstCalls);
  assert.equal(state.patchId, patches[0].id);
});

test("um tile isolado ainda tem uma patrulha interna e contínua", () => {
  const patches = buildGrassPatches([tile(1, 200, 240)]);
  const result = simulate(patches, { x: 200, y: 340 }, 500);
  assert.ok(result.state.entered);
  const positions = result.history.filter((h) => h.entered);
  assert.ok(positions.every((h) => isInGrassPatch(patches[0], h.position)));
  assert.ok(new Set(positions.map((h) => h.position.x.toFixed(1))).size > 3);
});

test("integração mantém versão privada e usa só um controlador de caçada", () => {
  const idle = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");
  assert.ok(idle.includes("newHud\n"));
  assert.ok(idle.includes("{mapTeleportOpen && ("));
  assert.ok(idle.includes("<WorldMapV2"));
  assert.ok(!idle.includes("enemiesRef.current.some((enemy) => enemy.hp > 0)) return; // briga"));
  assert.ok(!idle.includes("huntPatchRef"));
  assert.ok(idle.includes("if (grassHuntMap) { if (moving) setMoving(false); return; }"));
  assert.ok(idle.includes("arrivalRadius: GRASS_ARRIVAL_RADIUS"));
  assert.ok(idle.includes("grassPatchesRef.current"));
  assert.ok(idle.includes("spawnZoneEnemiesRef.current"));
  assert.ok(idle.includes("<= GRASS_SPOT_RADIUS"));
  assert.ok(idle.includes("return zoneForMap(idle.currentMap) ? prev : spawnEnemies()"));
  assert.ok(!idle.includes("trainerPosRef.current.x + fx * FOLLOW_DIST"));
  assert.ok(!idle.includes("}, [enemies, moving, obstacles, chests, idle.currentMap, arvEpicPlants]"));
});
