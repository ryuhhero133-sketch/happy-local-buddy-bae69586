import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildSync, transformSync } from "esbuild";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const mapJs = transformSync(read("../src/game/mapAccess.ts"), { loader: "ts", format: "esm" }).code;
const access = await import(`data:text/javascript;base64,${Buffer.from(mapJs).toString("base64")}`);
const idle = read("../src/routes/idle.tsx");

test("cinco mapas bloqueados recusam entrada sem consumir recursos", () => {
  const state = { currentMap: "laboratorio", bank: { gold: 5000, crystals: 30 }, items: { pepita: 20 } };
  for (const id of access.BLOCKED_LAB_MAPS) {
    assert.ok(access.isMapBlocked(id));
    assert.equal(access.applyMapEntry(state, id), state);
  }
  assert.equal(access.BLOCKED_LAB_MAPS.length, 5);
});
test("Safari cobra exatamente 1k + 10 pepitas atomicamente e em toda reentrada", () => {
  const state = { currentMap: "laboratorio", bank: { gold: 2000, crystals: 30 }, items: { pepita: 20, potion: 5 } };
  const entry = access.applyMapEntry(state, "sa");
  assert.equal(entry.currentMap, "sa");
  assert.equal(entry.bank.gold, 1000);
  assert.equal(entry.bank.crystals, 30);
  assert.equal(entry.items.pepita, 10);
  assert.equal(entry.items.potion, 5);
  assert.equal(access.applyMapEntry(entry, "sa"), entry);
  const again = access.applyMapEntry({ ...entry, currentMap: "laboratorio" }, "sa");
  assert.equal(again.bank.gold, 0);
  assert.equal(again.items.pepita, 0);
  assert.equal(state.bank.gold, 2000);
});
test("sem ouro OU sem pepitas: não cobra parcialmente e não entra", () => {
  for (const [gold, pepita] of [[999, 10], [1000, 9], [0, 0]]) {
    const state = { currentMap: "laboratorio", bank: { gold }, items: { pepita } };
    assert.equal(access.applyMapEntry(state, "sa"), state);
    assert.ok(access.mapEntryError(state, "sa"));
  }
});
test("outros mapas não cobram o ingresso do Safari", () => {
  const next = access.applyMapEntry({ currentMap: "sa", bank: { gold: 123 }, items: { pepita: 2 } }, "laboratorio");
  assert.equal(next.bank.gold, 123);
  assert.equal(next.items.pepita, 2);
});
test("produção não contém sandbox nem componente de LOGIN TEST", () => {
  const compile = (contents, loader) => buildSync({ stdin: { contents, loader }, bundle: true, external: ["*"], write: false, minify: true, format: "esm", define: { "import.meta.env.DEV": "false" } }).outputFiles[0].text;
  const stub = compile(read("../src/lib/offlineTest.ts"), "ts");
  assert.ok(!stub.includes("offlineTest.local"));
  assert.ok(!stub.includes("sessionStorage"));
  const auth = compile(read("../src/components/AuthGate.tsx"), "tsx");
  assert.ok(!auth.includes("LOGIN TEST"));
  assert.ok(!auth.includes("DevelopmentAuthGate"));
  assert.ok(read("../.gitignore").includes("src/lib/offlineTest.local.ts"));
});
test("treinador só é alvo sem líder vivo no Safari, com retorno ao laboratório", () => {
  assert.ok(idle.includes('const trainerTarget = idleRef.current.currentMap === "sa" && leaderHpRef.current <= 0'));
  assert.ok(idle.includes('if (trainerTarget && !safariCaster) continue;'));
  assert.ok(idle.includes('if (idleRef.current.currentMap !== "sa" || leaderHpRef.current > 0) return;'));
  assert.ok(idle.includes('safariTrainerHp: Math.max(0,'));
  assert.ok(idle.includes('currentMap: "laboratorio", safariTrainerHp: SAFARI_TRAINER_MAX_HP'));
  assert.ok(idle.includes('if (allFainted && idle.currentMap === "sa")'));
});
