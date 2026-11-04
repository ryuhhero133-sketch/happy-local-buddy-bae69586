import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { transformSync } from "esbuild";

const source = readFileSync(new URL("../src/game/safari.ts", import.meta.url), "utf8");
const code = transformSync(source, { loader: "ts", format: "esm" }).code;
const rules = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const idle = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");

test("Safari: nascimentos cobrem os quatro quadrantes, longe dos existentes", () => {
  let seed = 517;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const bounds = { minX: 1466, maxX: 2809, minY: 912, maxY: 1727 };
  const placed = [];
  for (let i = 0; i < 12; i++) {
    const point = rules.safariSpreadPoint(bounds, placed, random);
    assert.ok(point.x >= bounds.minX && point.x <= bounds.maxX);
    assert.ok(point.y >= bounds.minY && point.y <= bounds.maxY);
    for (const other of placed) assert.ok(Math.hypot(point.x - other.x, point.y - other.y) > 200);
    placed.push(point);
  }
  const quadrants = new Set(placed.map(p => `${p.x > 2137.5}:${p.y > 1319.5}`));
  assert.equal(quadrants.size, 4);
  assert.match(idle, /const MIN_DIST = saField \? 240/);
  assert.match(idle, /\? safariSpreadPoint\(/);
});

test("Safari: aura Black Mitic Plus pulsante com orbes rosas e estrelas, sem chamas", () => {
  const css = readFileSync(new URL("../src/components/hud/hud.css", import.meta.url), "utf8");
  assert.ok(idle.includes('className="bmp-aura-glow safari-aura-nebula"'));
  assert.ok(idle.includes('className="safari-aura-orb"'));
  assert.ok(idle.includes('className="safari-aura-star"'));
  assert.ok(css.includes("safariAuraRipple"));
  assert.ok(css.includes("safariOrbPulse"));
  assert.ok(!idle.includes("safari-aura-flame"));
  assert.ok(!css.includes("safariFlameRise"));
});

test("Safari: todos os níveis inteiros de 30 a 600 têm a mesma faixa de sorteio", () => {
  for (let n = 0; n < 571; n++) assert.equal(rules.safariLevel((n + 0.5) / 571), 30 + n);
  assert.equal(rules.safariLevel(0), 30);
  assert.equal(rules.safariLevel(1), 600);
  assert.ok(idle.includes('if (idle.currentMap === "sa") lv = safariLevel(Math.random())'));
});
test("Safari: um especial por vinte derrotas, sem sorteio de 40%", () => {
  for (const [kills, earned] of [[0, 0], [19, 0], [20, 1], [39, 1], [40, 2], [100, 5]]) {
    assert.equal(rules.safariSpecialsEarned(kills), earned);
  }
  assert.ok(idle.includes('safariSpecialsEarned(idleRef.current.safariMapDefeats ?? 0) > spawned'));
  assert.ok(idle.includes('safariMapDefeats: (s.safariMapDefeats ?? 0) + (s.currentMap === "sa" ? 1 : 0)'));
  assert.ok(idle.includes('safariSpecialSpawnsRef.current = spawned + 1'));
  assert.ok(!idle.includes('Math.random() < 0.40) pool = [...SAFARI_SPECIES]'));
  assert.ok(rules.SAFARI_PLANT_SPECIES.includes("victreebel"));
  assert.ok(rules.SAFARI_PLANT_SPECIES.includes("exeggutor"));
  assert.ok(idle.includes('const allowEpic = idle.currentMap === "sa" || leaderLv >= 50'));
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
