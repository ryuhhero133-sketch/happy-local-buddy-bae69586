import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const idle = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");
const res = readFileSync(new URL("../src/game/resources.ts", import.meta.url), "utf8");
const prof = readFileSync(new URL("../src/components/professorLabData.ts", import.meta.url), "utf8");

/** Fatia o bloco que começa em `key` até o fecho de mesmo nível. */
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

/** Linha simples que contém `needle`. */
function lineWith(source, needle) {
  const line = source.split("\n").find((l) => l.includes(needle));
  assert.ok(line, `linha ausente: ${needle}`);
  return line;
}

const PNG_PATH = "../src/ambiente/mascara colisao/sa.png";

test("sa.png existe e é um PNG de 4071x3258", () => {
  const buf = readFileSync(new URL(PNG_PATH, import.meta.url));
  assert.equal(buf.toString("ascii", 1, 4), "PNG", "sa.png inválido");
  assert.equal(buf.readUInt32BE(16), 4071, "largura");
  assert.equal(buf.readUInt32BE(20), 3258, "altura");
});

test("sa: fundo importado e registrado em IDLE_MAPS com nível livre", () => {
  assert.ok(idle.includes('import saUrl from "@/ambiente/mascara colisao/sa.png"'), "import ausente");
  const def = blockOf(idle, "sa: {");
  assert.match(def, /name: "Safari"/);
  assert.match(def, /bg: saUrl/);
  assert.match(def, /minLevel: 1/);
  assert.match(def, /maxLevel: 640/);
  assert.match(def, /rate: 1\.0/);
  assert.match(def, /element: "Planta"/);
});

test("sa: presente em customMapUrls (carrega a arte do mapa)", () => {
  assert.match(lineWith(idle, "    sa: saUrl,"), /sa: saUrl,/);
});

test("sa: entra pelo Mapa Mundi (lista base do painel)", () => {
  const base = lineWith(idle, 'const base = ["mapinha6"');
  assert.ok(base.includes('"sa"'), "fora do array base do Mapa Mundi");
});

test("sa: teleporte SEM custo de energia", () => {
  const fn = blockOf(res, "export function teleportEnergyCostFor");
  assert.match(fn, /if \(mapId === "sa"\) return 0;/);
});

test("sa: fora de FREE_WALK_MAPS (tem obstáculos e spawn) e dentro de NO_HIGH_EVENT_MAPS", () => {
  const free = lineWith(idle, "const FREE_WALK_MAPS");
  assert.ok(!/(^|[",\s])"sa"([",\s]|$)/.test(free.replace(/.*= \[/, "")), "não deve estar em FREE_WALK_MAPS");
  const noHigh = lineWith(idle, "const NO_HIGH_EVENT_MAPS");
  assert.ok(noHigh.includes('"sa"'), "deve estar em NO_HIGH_EVENT_MAPS");
});

test("sa: buildObstacles gera árvores (visual) e pedras (colisão) no campo", () => {
  const branch = blockOf(idle, 'if (mapId === "sa") {');
  assert.match(branch, /treeOakUrl/);
  assert.match(branch, /treePineUrl/);
  assert.match(branch, /rockBoulderUrl/);
  assert.match(branch, /blocks: false/, "árvores devem ser atravessáveis");
  assert.match(branch, /blocks: true/, "pedras devem bloquear");
  assert.match(branch, /SPAWN = \{ x: 1900, y: 1150 \}/, "livre perto do spawn");
  assert.match(branch, /list\.length < 20/, "quantidade espalhada");
});

test("sa: limites andáveis ficam no grande campo aberto (não invade cidade/bordas)", () => {
  const bounds = blockOf(idle, "const getPlayableBounds");
  assert.match(bounds, /if \(mapId === "sa"\)/);
  assert.match(bounds, /minX: w \* 0\.35, maxX: w \* 0\.70, minY: h \* 0\.27, maxY: h \* 0\.54/);
  // Spawn do jogador dentro dos limites (4071x3258).
  const w = 4071, h = 3258;
  assert.ok(1900 >= w * 0.35 && 1900 <= w * 0.70, "spawn X fora dos limites");
  assert.ok(1150 >= h * 0.27 && 1150 <= h * 0.54, "spawn Y fora dos limites");
});

test("sa: spawn do jogador registrado no ponto de grama", () => {
  assert.match(lineWith(prof, "  sa: { x: 1900, y: 1150 },"), /sa: \{ x: 1900, y: 1150 \}/);
});

test("sa: pool estrita com Venusaur em destaque", () => {
  const allowed = lineWith(idle, 'if (mapId === "sa") return [');
  assert.ok(allowed.includes('"venusaur"'), "pool sem venusaur");
  assert.ok(allowed.includes('"ivysaur"') && allowed.includes('"bulbasaur"'), "linha evolutiva ausente");
});

test("sa: spawnOneEnemy sorteia da pool do mapa e nasce só no campo", () => {
  assert.match(lineWith(idle, "// SA (Mapa Mundi): Venusaur em destaque"), /Venusaur em destaque/);
  assert.match(lineWith(idle, 'pool = ["venusaur", "venusaur", "venusaur"'), /"vileplume"/);
  assert.match(idle, /const saField = idle\.currentMap === "sa";/);
  assert.match(idle, /spawnMinX = saField \? useW \* 0\.36/);
  assert.match(idle, /spawnMaxY = saField \? useH \* 0\.53/);
});

test("sa: entra na contagem inicial de selvagens e no efeito de spawn do mapa", () => {
  assert.match(lineWith(idle, "const initial = isGrassOddish"), /currentMap === "sa" \? 6 \+ Math\.floor/);
  const effect = lineWith(idle, 'idle.currentMap === "caverna_brok" || idle.currentMap === "sa"');
  assert.ok(effect.includes('"sa"'), "fora do efeito de spawn ao trocar de mapa");
});

test("sa: Venusaur nasce garantido (fixa raridade ANTES do gate de valiosos)", () => {
  assert.match(lineWith(idle, 'if (idle.currentMap === "sa" && sp === "venusaur" && !forcedRarity)'), /sp === "venusaur"/);
  assert.match(lineWith(idle, 'SA: Venusaur'), /destaque do campo/);
  const fixAt = idle.indexOf('if (idle.currentMap === "sa" && sp === "venusaur"');
  const gateAt = idle.indexOf("FILTRO DE VALIOSOS");
  assert.ok(fixAt > -1 && gateAt > -1 && fixAt < gateAt, "fix deve estar antes do gate");
});
