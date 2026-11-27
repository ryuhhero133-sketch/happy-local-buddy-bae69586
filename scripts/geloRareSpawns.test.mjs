import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const zones = read("src/game/grassZones.ts");
const idle = read("src/routes/idle.tsx");
const systems = read("src/game/systems.tsx");
const movesets = read("src/game/movesets.ts");
const collection = read("src/components/collection/collectionModel.ts");

function pngSize(path) {
  const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG", path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("Transição Gelo libera especiais nos marcos de 500 e 1000 abates", () => {
  assert.match(zones, /bobo_transicao_gelo:\s*\{/);
  assert.match(zones, /500:\s*\[\s*\{ species: "charizard_shiny", level: 90, weight: 1 \}/);
  assert.match(zones, /1000:\s*\[\s*\{ species: "dragonair_shiny", level: 92, weight: 3 \},\s*\{ species: "dragonite_primitive", level: 95, weight: 1 \}/);
  assert.match(idle, /geloRareKillsRef\.current % 500 === 0/);
  assert.match(idle, /geloRareKillsRef\.current % 1000 === 0 \? 1000 : 500/);
  assert.match(idle, /GRASS_RARE_SPAWNS\[idle\.currentMap\]/);
  assert.match(idle, /CHARIZARD SHINY[\s\S]*DRAGONAIR SHINY[\s\S]*DRAGONITE PRIMITIVE/);
});

test("Dragonite Primitive tem ID, stats míticos, dex 149 e moves de dragão", () => {
  assert.match(systems, /\| "dragonite_primitive"/);
  assert.match(systems, /dragonite_primitive: \{ hp: 100, atk: 145, def: 100, spa: 105, spd: 105, spe: 80, rarity: "mythic"/);
  assert.match(movesets, /dragonair_shiny: \{ types: \["Dragao"\]/);
  assert.match(movesets, /dragonite_primitive: \{ types: \["Dragao","Voador"\]/);
  assert.match(collection, /NUMBERS\.dragonite_primitive = 149/);
  assert.match(idle, /charizard_shiny: charizardShinySheetPng/);
  assert.match(idle, /dragonair_shiny: dragonairShinySheetPng/);
  assert.match(idle, /dragonite_primitive: dragonitePrimitiveSheetPng/);
});

test("especiais usam só Ultra Ball e chance muito menor que o mítico comum", () => {
  assert.match(idle, /idle\.currentMap === "bobo_transicao_gelo"[\s\S]{0,220}target\.sp === "charizard_shiny"/);
  assert.match(idle, /target\.sp === "dragonair_shiny" \? 0\.003/);
  assert.match(idle, /target\.sp === "dragonite_primitive" \? 0\.002/);
  assert.match(idle, /usedBall\.id !== "ultraball"[\s\S]{0,220}Só Ultra Ball!/);
});

test("os três sheets de movimento são 4x4 com frames de 64x64", () => {
  for (const path of [
    "src/ambiente/map/zonas/charizard_shiny.png",
    "src/ambiente/map/zonas/dragonair_shiny.png",
    "src/ambiente/map/zonas/dragonite_primitive.png",
  ]) {
    assert.deepEqual(pngSize(path), { width: 256, height: 256 }, path);
  }
});
