import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const idsSource = read("src/game/nissanKlowIds.ts");
const transpiled = ts.transpileModule(idsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const idsModule = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);
const { NISSAN_KLOW_MAP_IDS, isNissanKlowMap } = idsModule;

const catalog = read("src/game/nissanKlowMaps.ts");
const mapAccess = read("src/game/mapAccess.ts");
const worldMap = read("src/components/WorldMapV2.tsx");
const idle = read("src/routes/idle.tsx");
const assetDir = new URL("../src/assets/nissan-klow/", import.meta.url);

test("16 mapas privados Nissan Klow, todos com arte completa e miniatura", () => {
  assert.equal(NISSAN_KLOW_MAP_IDS.length, 16);
  assert.equal(new Set(NISSAN_KLOW_MAP_IDS).size, 16);
  assert.equal(isNissanKlowMap("nissan_klow_0"), true);
  assert.equal(isNissanKlowMap("nissan_klow_florest_r3"), true);
  assert.equal(isNissanKlowMap("mapinha6"), false);

  const files = new Set(readdirSync(assetDir));
  for (const id of NISSAN_KLOW_MAP_IDS) {
    const slug = id.replaceAll("_", "-");
    const full = `${slug}.webp`;
    const thumb = `${slug}-thumb.webp`;
    assert.ok(files.has(full), `arte ausente: ${full}`);
    assert.ok(files.has(thumb), `miniatura ausente: ${thumb}`);
    assert.ok(statSync(new URL(full, assetDir)).size > 0);
    assert.ok(statSync(new URL(thumb, assetDir)).size > 0);
    assert.match(catalog, new RegExp(`"${id}"`));
  }
  const total = [...files].reduce((sum, file) => sum + statSync(new URL(file, assetDir)).size, 0);
  assert.ok(total < 9 * 1024 * 1024, `assets muito grandes: ${total}`);
});

test("acesso aos mapas Nissan Klow é exclusivo da conta do dono", () => {
  assert.match(mapAccess, /canSeeNissanKlowMaps = \(identityId\?: string \| null\) => identityId === TEST_MAP_OWNER_ID/);
  assert.match(mapAccess, /if \(isNissanKlowMap\(id\)\) return canSeeNissanKlowMaps\(identityId\)/);
  assert.match(mapAccess, /if \(isNissanKlowMap\(target\) && !canSeeNissanKlowMaps\(identityId\)\) return "🔒 Mapa privado — acesso restrito\."/);
  assert.match(worldMap, /canSeeNissanKlowMaps\(identityId\)/);
  assert.match(worldMap, /const visibleRegions = canSeePrivateMaps \? \[\.\.\.REGIONS, NISSAN_KLOW_REGION\] : REGIONS/);
  assert.match(idle, /identityId=\{identity\?\.id\}/);
  assert.match(idle, /isNissanKlowMap\(merged\.currentMap\) && !canSeeNissanKlowMaps\(identity\?\.id\)/);
});

test("mapa-múndi mostra o pino e a grade privada só quando o dono está logado", () => {
  assert.match(worldMap, /id: "nissan_klow"/);
  assert.match(worldMap, /name: "Nissan Klow"/);
  assert.match(worldMap, /sub: "Mapas privados"/);
  assert.match(worldMap, /selected\.id === "nissan_klow"/);
  assert.match(worldMap, /NISSAN_KLOW_MAPS\.map\(\(map\) =>/);
  assert.match(worldMap, /onTravelTo\?\.\(map\.id\)/);
  assert.match(worldMap, /Visível apenas para você/);
  assert.match(worldMap, /Visível só para a sua conta/);
  assert.match(worldMap, /Entrar em Nissan Klow/);
});

test("mapas entram no jogo como áreas livres, sem colisão e com dimensões nativas", () => {
  assert.match(idle, /import \{ NISSAN_KLOW_MAPS \}/);
  assert.match(idle, /const NISSAN_KLOW_IDLE_MAPS = Object\.fromEntries/);
  assert.match(idle, /\.\.\.NISSAN_KLOW_IDLE_MAPS/);
  assert.match(idle, /\.\.\.Object\.fromEntries\(NISSAN_KLOW_MAPS\.map\(\(map\) => \[map\.id, map\.bg\]\)\)/);
  assert.match(idle, /"map_0077", \.\.\.NISSAN_KLOW_MAP_IDS\]/);
  assert.match(idle, /FREE_WALK_MAPS/);
  assert.match(idle, /NO_HIGH_EVENT_MAPS/);
});
