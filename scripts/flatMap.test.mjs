import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const idle = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");
const prof = readFileSync(new URL("../src/components/professorLabData.ts", import.meta.url), "utf8");
const panel = readFileSync(new URL("../src/components/ProfessorLabPanel.tsx", import.meta.url), "utf8");

const MAPS = [
  { id: "map_0000", url: "mapa0000Url", def: "M_MAP_0000", png: "0000.png" },
  { id: "map_0055", url: "mapa0055Url", def: "M_MAP_0055", png: "0055.png" },
  { id: "map_0066", url: "mapa0066Url", def: "M_MAP_0066", png: "0066.png" },
  { id: "map_0077", url: "mapa0077Url", def: "M_MAP_0077", png: "0077.png" },
  { id: "map_xz", url: "mapaXzUrl", def: "M_MAP_XZ", png: "xz/xz.png" },
];

/** Fatia o objeto/registro que começa em `key` até o fecho de mesmo nível. */
function blockOf(source, key) {
  const at = source.indexOf(key);
  assert.notEqual(at, -1, `chave ausente: ${key}`);
  const open = source.indexOf("{", at);
  assert.notEqual(open, -1, `objeto ausente para: ${key}`);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`objeto não fechado: ${key}`);
}

/** Extrai um array literal pelo nome da constante. */
function listOf(source, name) {
  const at = source.indexOf(`const ${name} = [`);
  assert.notEqual(at, -1, `lista ausente: ${name}`);
  const open = source.indexOf("[", at);
  const close = source.indexOf("]", open);
  return source.slice(open, close + 1);
}

/** Bloco `const X: ProfMapDef = { ... }` que contém `id: "<id>"`. */
function defBlockOf(source, id) {
  const keyAt = source.indexOf(`id: "${id}"`);
  assert.notEqual(keyAt, -1, `def ausente: ${id}`);
  const start = source.lastIndexOf("= {", keyAt);
  assert.notEqual(start, -1, `início do def ausente: ${id}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`def não fechado: ${id}`);
}

for (const { id, url, def: defConst, png } of MAPS) {
  test(`${id}: registrado em IDLE_MAPS com nível livre`, () => {
    const def = blockOf(idle, `${id}: {`);
    assert.match(def, /diff: "Especial"/);
    assert.match(def, /minLevel: 1/);
    assert.match(def, /maxLevel: 1/);
    assert.match(def, /rate: 1\.0/);
    assert.match(def, /bg: /);
  });

  test(`${id}: andar livre, sem eventos de alto nível e sem obstáculos`, () => {
    assert.ok(listOf(idle, "FREE_WALK_MAPS").includes(`"${id}"`), "fora de FREE_WALK_MAPS");
    assert.ok(listOf(idle, "NO_HIGH_EVENT_MAPS").includes(`"${id}"`), "fora de NO_HIGH_EVENT_MAPS");
    // buildObstacles devolve [] para os mapas limpos (lista inline do guarda).
    const guardAt = idle.indexOf("Novos mapas grátis + evento Torre");
    const guard = idle.slice(guardAt, idle.indexOf("]", guardAt) + 1);
    assert.ok(guard.includes(`"${id}"`), "geraria obstáculos/objetos");
  });

  test(`${id}: fundo PNG carregado e presente no registro de mapas custom`, () => {
    assert.ok(idle.includes(`import ${url} from`), "import ausente no idle.tsx");
    assert.ok(idle.includes(`    ${id}: ${url},`), "fora de customMapUrls");
    assert.ok(prof.includes(`import ${url} from`), "import ausente no professorLabData.ts");
    void png;
  });

  test(`${id}: sem máscara de colisão (nenhum ensureCollision)`, () => {
    assert.ok(!idle.includes(`ensureCollision("${id}"`), "roda ensureCollision");
    assert.ok(!idle.includes(`ensureCollision(${id}`), "roda ensureCollision");
  });

  test(`${id}: no Professor — viagem grátis, sem pontos e sem nível`, () => {
    assert.ok(prof.includes(`  | "${id}"`), "fora de ProfMapId");
    const def = defBlockOf(prof, id);
    assert.match(def, /free: true/);
    assert.ok(!def.includes("reqLevel:"), "exige nível");
    assert.ok(!def.includes("reqPts:"), "exige pontos de sucata");
    assert.ok(!def.includes("mask:"), "declara máscara de colisão");
    assert.match(def, /spawn: \{ x: \d+, y: \d+ \}/);
    assert.ok(prof.includes(`  ${id}: { x: `), "fora de PROF_SPAWNS");
    assert.ok(prof.includes(`  ${id}: M_`), "fora de PROF_MAP_BY_ID");
  });

  test(`${id}: listado na aba MAPAS do Professor`, () => {
    const list = prof.slice(prof.indexOf("export const PROF_MAPS"), prof.indexOf("export const PROF_MAP_BY_ID"));
    assert.ok(list.includes(defConst), "fora de PROF_MAPS");
    assert.match(panel, /PROF_MAPS\.map\(/);
    assert.match(panel, /VIAJAR · GRÁTIS/);
  });
}

test("todos os PNGs lisos existem em src/ambiente", () => {
  for (const { png, id } of MAPS) {
    const path = new URL(`../src/ambiente/${png}`, import.meta.url);
    const buf = readFileSync(path);
    assert.equal(buf.toString("ascii", 1, 4), "PNG", `${png} inválido`);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    assert.ok(w > 0 && h > 0, `${png} sem dimensões`);
    void id;
  }
});

test("profTravelTo não cobra energia em mapas free e não checa nível sem def", () => {
  const at = idle.indexOf("const profTravelTo");
  const fn = idle.slice(at, idle.indexOf("\n  };", at));
  assert.match(fn, /const payableDef = def && !def\.free \? def : null;/);
  assert.match(fn, /if \(payableDef && trainerEnergy < LAB_MAP_ENERGY_COST\)/);
  assert.ok(!fn.includes("TELEPORT_COST"), "cobra ouro no teleporte do Professor");
});

test("cabeçalho da aba MAPAS usa a contagem real de PROF_MAPS", () => {
  assert.ok(panel.includes("{PROF_MAPS.length} MAPAS PARA EXPLORAR"));
  assert.ok(!panel.includes("5 MAPAS PARA EXPLORAR"));
});
