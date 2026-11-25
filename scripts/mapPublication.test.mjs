import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const idle = read("../src/routes/idle.tsx");
const labels = read("../src/game/mapLabels.ts");
const zones = read("../src/game/grassZones.ts");
const access = read("../src/game/mapAccess.ts");
const cloud = read("../src/lib/mapEditorCloud.ts");
const atlas = read("../src/components/WorldMapV2.tsx");
const migration = read("../supabase/migrations/20261125021423_publish_map_editor_defaults.sql");

test("jogadores veem MP1, MP2, MP3... nos avisos e no HUD", () => {
  assert.ok(labels.includes("`MP${index + 1}`"));
  assert.ok(labels.includes("publicMapName"));
  for (const id of ["bobo_mmmm", "bobo_viridian", "emerald", "rota1", "mapinha6"]) {
    assert.ok(labels.includes(`"${id}"`), `código público ausente para ${id}`);
  }
  assert.ok(idle.includes("publicMapName(idle.currentMap)"));
  assert.ok(idle.includes("publicMapName(mapId)"));
  assert.ok(!atlas.includes("Object.keys(IDLE_MAPS)"));
});

test("mapas BOBO publicados, ARV removido e eventos continuam bloqueados", () => {
  assert.ok(access.includes("bobo_mmmm"));
  assert.ok(access.includes("bobo_viridian"));
  assert.ok(!access.includes('"arv"'));
  assert.ok(access.includes('TEST_MAP_IDS = ["emerald_01"]'));
  assert.ok(access.includes("WORLD_MAP_LOCKED_IDS"));
  assert.ok(!idle.includes("WorldMapTeleportHud"));
  assert.ok(!idle.includes("oldAtlasOpen"));
  assert.ok(!idle.includes("arv: arvUrl"));
  assert.ok(!idle.includes("ddtVideoUrl"));
});

test("caverna BOBO MMM tem mato e Pokémon próprios", () => {
  assert.ok(zones.includes("bobo_mmmm: 9"));
  assert.ok(zones.includes("9: ["));
  for (const species of ["zubat", "geodude", "diglett", "machop", "onix"]) {
    assert.ok(zones.includes(`species: "${species}"`));
  }
  assert.ok(idle.includes("boboMmmmUrl"));
  assert.ok(idle.includes('ensureCollision("bobo_mmmm"'));
});

test("publicação global é lida do banco e mantém prioridade da conta", () => {
  assert.ok(cloud.includes("map_editor_published_data"));
  assert.ok(cloud.includes("readCachedPublishedMapEditor"));
  assert.ok(cloud.includes("rubym.published-maps.v1"));
  assert.ok(idle.includes("loadPublishedMapEditor"));
  assert.ok(idle.includes("readCachedPublishedMapEditor"));
  assert.ok(idle.includes("{ ...normalizeMapEditorObjects(published.objects), ...prev }"));
  assert.ok(idle.includes("canUseMapEditor ? loadMapEditorCloud"));
  assert.ok(migration.includes("create table public.map_editor_published"));
  assert.ok(migration.includes("cave_objects") === false);
  assert.ok(migration.includes("'bobo_mmmm', jsonb_build_array"));
  assert.ok(migration.includes("'arv'"));
  assert.ok(migration.includes("create or replace function public.publish_map_editor_defaults"));
});

test("Mapa Mundi mantém ginásios, insígnias, continente e recompensas", () => {
  assert.ok(atlas.includes("Ginásios"));
  assert.ok(atlas.includes("Insígnias"));
  assert.ok(atlas.includes("Recompensas"));
  assert.ok(atlas.includes("Kanto"));
  assert.ok(atlas.includes("Temporada"));
  assert.ok(atlas.includes("BADGES"));
  assert.ok(atlas.includes("REWARDS"));
  assert.ok(atlas.includes("onTravelTo"));
  assert.ok(idle.includes("<WorldMapV2"));
  assert.ok(!idle.includes("destinations={Object.keys(IDLE_MAPS)"));
  assert.ok(!atlas.includes("onOldMap"));
  assert.ok(!atlas.includes("Todos os mapas (atlas antigo)"));
  assert.ok(!idle.includes("WorldMapTeleportHud"));
});

test("Rota 1 e mapas BOBO usam só os objetos publicados, sem árvores automáticas", () => {
  assert.ok(idle.includes('mapId === "rota1"'));
  assert.ok(idle.includes('mapId.startsWith("bobo_")'));
  assert.ok(idle.includes("const editorScenery = editorObstacles.some"));
  assert.ok(idle.includes("editorScenery ? [] : buildObstacles"));
});
