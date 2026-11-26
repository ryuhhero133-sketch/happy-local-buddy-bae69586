import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const component = read("src/components/AmbientTrainers.tsx");
const idle = read("src/routes/idle.tsx");

test("30 treinadores ambiente: 6 na cidade e 3 em cada mapa de caça", () => {
  assert.ok(component.includes('["emerald", ...PVP_SCHEDULE_MAP_IDS]'));
  assert.ok(component.includes('[["emerald", 6]]'));
  assert.ok(component.includes("counts.set(mapId, 3)"));
  assert.ok(component.includes("ambient-${mapId}-${i}"));
  assert.ok(component.includes("BOTS_BY_MAP.get(mapId)"));
});

test("bots são 100% client-side: sem rede, banco, save ou chat global", () => {
  assert.ok(!/supabase|fetch\(|localStorage|sessionStorage|setIdle|pushChat|pushCloudSaveNow/.test(component));
  assert.ok(component.includes("window.setInterval"));
  assert.ok(!component.includes("requestAnimationFrame"));
  assert.ok(component.includes("memo(function AmbientTrainers"));
});

test("só o mapa atual é renderizado e o editor fica limpo", () => {
  assert.ok(component.includes("if (!BOT_MAP_SET.has(mapId)) return null"));
  assert.ok(component.includes("defs.map((def) =>"));
  assert.ok(idle.includes("<AmbientTrainers"));
  assert.ok(idle.includes("key={idle.currentMap}"));
  assert.ok(idle.includes("!mapEditorOpen"));
  assert.ok(idle.includes("worldW={curWorldW}"));
  assert.ok(idle.includes("worldH={curWorldH}"));
});

test("bots usam nomes fictícios, líderes da área e fala natural", () => {
  for (const name of ["Luna", "Ryu", "Mika", "Theo", "Nina", "Kai", "Juca"]) {
    assert.ok(component.includes(`"${name}"`), name);
  }
  assert.ok(component.includes("leaderPool(mapId)"));
  assert.ok(component.includes("zoneForMap(mapId)"));
  assert.ok(component.includes("Bora treinar!"));
  assert.ok(!/bot|fake|simulad/i.test(component.split("const SPEECH_LINES")[1]?.split("];")[0] ?? ""));
});
