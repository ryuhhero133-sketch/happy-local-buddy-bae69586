import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { transformSync } from "esbuild";

const source = readFileSync(new URL("../src/game/safari.ts", import.meta.url), "utf8");
const code = transformSync(source, { loader: "ts", format: "esm" }).code;
const rules = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const idle = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");

test("Safari: níveis discretos e níveis 10/50 raros", () => {
  const counts = new Map();
  for (let n = 0; n < 10000; n++) {
    const lv = rules.safariLevel(n / 10000);
    counts.set(lv, (counts.get(lv) ?? 0) + 1);
  }
  assert.deepEqual([...counts.keys()], [10, 50, 100, 300, 500, 640]);
  assert.equal(counts.get(10), 100);
  assert.equal(counts.get(50), 200);
});
test("Ultra: nenhuma chance até 70; crescente depois, sem garantia", () => {
  for (let n = 0; n <= 70; n++) assert.equal(rules.safariCatchChance("ultraball", n), 0);
  assert.equal(rules.safariCatchChance("ultraball", 71), 0.02);
  assert.equal(rules.safariCatchChance("ultraball", 80), 0.20);
  assert.equal(rules.safariCatchChance("ultraball", 900), 0.20);
});
test("Safari Ball livre; demais bolas bloqueadas, incluindo Master", () => {
  assert.equal(rules.safariCatchChance("safariball", 0), 0.02);
  for (const ball of ["pokeball", "greatball", "masterball", "fastball"]) assert.equal(rules.safariCatchChance(ball, 500), 0);
});
test("encontros e raridades restritos ao Safari", () => {
  for (const sp of rules.SAFARI_SPECIES) {
    assert.equal(rules.isSafariEncounter("sa", sp), true);
    assert.equal(rules.isSafariEncounter("mapinha13", sp), false);
  }
  assert.equal(rules.isSafariEncounter("sa", "venusaur"), false);
  assert.equal(rules.safariRarity("snorlax"), "mythic_shiny");
  assert.equal(rules.safariRarity("snorlax_mythic"), "mythic");
  assert.equal(rules.safariEvent("kabutops"), "safari:black_mitic");
});
test("sprites: grades 4x4 e ícones de um frame para a coleção", () => {
  for (const name of ["Snorlax", "Snorlax Mitico", "Kabutops", "Kabutops Shiny", "aerodactyl"]) {
    const sheet = readFileSync(new URL(`../src/ambiente/xz/${name}.png`, import.meta.url));
    const icon = readFileSync(new URL(`../src/ambiente/xz/${name}-icon.png`, import.meta.url));
    assert.equal(sheet.readUInt32BE(16), icon.readUInt32BE(16) * 4);
    assert.equal(sheet.readUInt32BE(20), icon.readUInt32BE(20) * 4);
  }
  assert.ok(idle.includes('up: 3, down: 0, left: 1, right: 2'));
});
test("captura manual e automática usam a mesma regra e persistem o contador", () => {
  assert.equal((idle.match(/safariCatchChance\(usedBall.id, safariUltraThrows\)/g) ?? []).length, 2);
  assert.ok(idle.includes('safariUltraThrows?: number'));
  assert.ok(idle.includes('safariDefeats % 10 === 0'));
  assert.ok(idle.includes('currency: "crystals"'));
  assert.ok(idle.includes('collectedCrystalDropsRef.current.has(uid)'));
});
