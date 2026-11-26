import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const scheduleSource = read("src/game/pvpSchedule.ts");
const schedule = await import(`data:text/javascript;base64,${Buffer.from(
  ts.transpileModule(scheduleSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText,
).toString("base64")}`);
const migration = read("supabase/migrations/20261125234500_pvp_hourly_ten_minutes_grass_maps.sql");

// 2026-11-25 em São Paulo (UTC-3): 12:00Z = 09:00 local.
const at = (iso) => schedule.getGlobalPvpWindow(Date.parse(iso));

test("PvP abre nos 10 primeiros minutos de cada hora", () => {
  const start = at("2026-11-25T12:00:00Z");
  assert.equal(start.active, true);
  assert.equal(start.remainingMs, 10 * 60_000);
  assert.equal(at("2026-11-25T12:09:00Z").active, true);
  assert.equal(at("2026-11-25T12:09:59Z").active, true);
  assert.equal(at("2026-11-25T12:10:00Z").active, false);
  assert.equal(at("2026-11-25T12:59:59Z").active, false);
  assert.equal(at("2026-11-25T13:00:00Z").active, true);
});

test("Paz dura até a próxima hora cheia e a janela PvP dura 10 minutos", () => {
  const peace = at("2026-11-25T12:10:00Z");
  assert.equal(peace.active, false);
  assert.equal(peace.remainingMs, 50 * 60_000);
  const active = at("2026-11-25T12:09:00Z");
  assert.equal(active.remainingMs, 60_000);
  assert.equal(schedule.PVP_WINDOW_MINUTES, 10);
});

test("PvP só existe nos 8 mapas de caça com Pokémon", () => {
  for (const map of schedule.PVP_SCHEDULE_MAP_IDS) {
    assert.equal(schedule.isScheduledPvpMap(map), true, map);
  }
  for (const map of ["arv", "mapinha6", "arena", "emerald", "laboratorio"]) {
    assert.equal(schedule.isScheduledPvpMap(map), false, map);
  }
  assert.equal(schedule.isPvpActiveOnMap("rota1", Date.parse("2026-11-25T12:00:00Z")), true);
  assert.equal(schedule.isPvpActiveOnMap("rota1", Date.parse("2026-11-25T12:10:00Z")), false);
  assert.equal(schedule.isPvpActiveOnMap("arv", Date.parse("2026-11-25T12:00:00Z")), false);

  const zones = read("src/game/grassZones.ts");
  const zoneBlock = zones.slice(
    zones.indexOf("GRASS_ZONE_BY_MAP"),
    zones.indexOf("};", zones.indexOf("GRASS_ZONE_BY_MAP")),
  );
  const zoneMaps = [...zoneBlock.matchAll(/^\s*([a-z0-9_]+):\s*\d+,/gm)].map((match) => match[1]);
  assert.deepEqual([...schedule.PVP_SCHEDULE_MAP_IDS].sort(), zoneMaps.sort());
});

test("servidor espelha os 10 minutos e os mesmos 8 mapas", () => {
  assert.ok(migration.includes("private.pvp_window_open"));
  assert.ok(migration.includes("< 10"));
  assert.ok(migration.includes("private.pvp_map_allowed"));
  assert.ok(migration.includes("private.pvp_map_allowed(attacker.map_id)"));
  assert.ok(migration.includes("private.pvp_map_allowed(target.map_id)"));
  assert.ok(!migration.includes("map_id <> 'arv'"));
  for (const map of schedule.PVP_SCHEDULE_MAP_IDS) {
    assert.ok(migration.includes(`'${map}'`), map);
  }
});
