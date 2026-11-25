import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const idle = read("src/routes/idle.tsx");
const hud = read("src/components/hud/GameHud.tsx");
const worldMap = read("src/components/WorldMapV2.tsx");
const require = createRequire(new URL("package.json", root));
const transpile = (source, module = ts.ModuleKind.CommonJS) => ts.transpileModule(source, {
  compilerOptions: { module, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const sourceFile = ts.createSourceFile("idle.tsx", idle, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
function initializer(name) {
  let found;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === name) found = node.initializer;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert.ok(found, `${name} deve existir no jogo`);
  return found.getText(sourceFile);
}
function actualHandler(name, globals) {
  return new Function(...Object.keys(globals), `${transpile(`const handler = ${initializer(name)};`)}\nreturn handler;`)(...Object.values(globals));
}
const resources = await import(`data:text/javascript;base64,${Buffer.from(
  transpile(read("src/game/resources.ts"), ts.ModuleKind.ESNext),
).toString("base64")}`);

function feedingFixture(items = {}, pets = [{ uid: "leader", species: "pikachu", fome: 20, lealdade: 0, needFeeding: true }]) {
  const idleRef = { current: { items } };
  const teamRef = { current: pets };
  const messages = [];
  const feed = actualHandler("feedLeaderWithFruit", {
    idleRef, teamRef, setTeam: () => {}, setIdle: () => {},
    feedPet: resources.feedPet, trustedNow: () => ({ now: 123456 }),
    trainerPos: { x: 1, y: 1 }, pushFxAt: () => {}, pushChat: (message) => messages.push(message),
  });
  return { idleRef, teamRef, messages, feed };
}

test("frutinha alimenta o líder e consome exatamente um item", () => {
  const fixture = feedingFixture({ morango: 1, limao: 2 });
  fixture.feed();
  assert.equal(fixture.idleRef.current.items.morango, 0);
  assert.equal(fixture.idleRef.current.items.limao, 2);
  assert.equal(fixture.teamRef.current[0].fome, 50);
  assert.equal(fixture.teamRef.current[0].needFeeding, false);
  assert.equal(fixture.teamRef.current[0].lastFedAt, 123456);
  assert.equal(fixture.teamRef.current[0].hungerUpdatedAt, 123456);
  fixture.feed();
  assert.equal(fixture.idleRef.current.items.morango, 0);
  assert.equal(fixture.idleRef.current.items.limao, 1);
  assert.equal(fixture.teamRef.current[0].fome, 70);
});

test("sem fruta, sem líder ou com fome cheia não consome item", () => {
  const absent = feedingFixture({});
  absent.feed();
  assert.equal(absent.teamRef.current[0].fome, 20);
  assert.match(absent.messages[0], /não tem Morango nem Limão/);
  const empty = feedingFixture({ morango: 2 }, []);
  empty.feed();
  assert.equal(empty.idleRef.current.items.morango, 2);
  const full = feedingFixture({ morango: 2 }, [{ uid: "leader", species: "pikachu", fome: 100 }]);
  full.feed();
  assert.equal(full.idleRef.current.items.morango, 2);
});

test("presença publica VIP, Nevezinha e montaria sem depender de quem observa", () => {
  const idleRef = { current: {
    buffs: { goldMult: 0.4, goldMultUntil: Date.now() + 60000 },
    items: { nevezinha_doll: 1 }, mountOn: true, mountUntil: Date.now() + 60000,
  } };
  const payload = actualHandler("payloadNow", {
    idleRef, meId: "player:session", meUserId: "player", meName: "Treinador VIP",
    trainerPosRef: { current: { x: 10, y: 20 } }, walkDirRef: { current: "down" },
    walkStepRef: { current: 2 }, leaderSpRef: { current: "pikachu" },
    skinUrlRef: { current: "/skin.png" }, snowmanFollowRef: { current: true },
    vipTierOf: (mult, until) => ({ tier: until > Date.now() && mult >= 0.4 ? "vip60" : null }),
  });
  const active = payload();
  assert.equal(active.vipTier, "vip60");
  assert.equal(active.hasNevezinha, true);
  assert.equal(active.mountActive, true);
  idleRef.current.buffs.goldMultUntil = 1;
  idleRef.current.mountUntil = 1;
  idleRef.current.items.nevezinha_doll = 0;
  const expired = payload();
  assert.equal(expired.vipTier, null);
  assert.equal(expired.mountActive, false);
  assert.equal(expired.hasNevezinha, false);
  assert.ok(idle.includes("cosmetics,updated_at"));
  assert.ok(idle.includes('alt="VIP"'));
  assert.ok(idle.includes("rp.hasNevezinha"));
  assert.ok(idle.includes("remoteMount ? sawsbuckMountPng"));
});

test("HUD sem calendário, relógio ou atalho de evento", () => {
  assert.ok(!hud.includes('label="Eventos"'));
  assert.ok(!hud.includes('className="revo-clock'));
  assert.ok(!hud.includes("ICONE DE EVENTO.webp"));
  assert.ok(idle.includes('false && tab === "evento"'));
  assert.ok(idle.includes("feedLeaderWithFruit();"));
});

const component = { exports: {} };
const images = [];
new Function("require", "module", "exports", transpile(worldMap))((path) => {
  if (path.endsWith(".css")) return {};
  if (path.startsWith("@/")) {
    const file = new URL(`src/${path.slice(2)}`, root);
    const bytes = readFileSync(file);
    images.push(file);
    const extension = path.split(".").at(-1);
    return `data:image/${extension === "jpg" ? "jpeg" : extension};base64,${bytes.toString("base64")}`;
  }
  return require(path);
}, component, component.exports);
const markup = renderToStaticMarkup(createElement(component.exports.WorldMapV2, {
  onClose: () => {}, onTravel: () => {}, onTravelTo: () => {},
}));

test("Mapa Mundi renderiza todos os ícones reais, com imagens válidas e rótulos", () => {
  assert.ok(images.length >= 10);
  assert.match(markup, /alt="Cristais"/);
  assert.match(markup, /Insígnia de Pedra/);
  assert.match(markup, /wm2-route__icon/);
  assert.match(markup, /wm2-pin__lock/);
  assert.ok(!markup.includes("🪨"));
  assert.ok(!markup.includes("🌀"));
});

if (process.env.PRESENTATION_PREVIEW) {
  writeFileSync(process.env.PRESENTATION_PREVIEW, `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mapa Mundi — verificação visual</title><style>*,*::before,*::after{box-sizing:border-box}body{margin:0}button{font-family:inherit}img{max-width:100%}${read("src/components/worldmap-v2.css")}</style>${markup}</html>`);
}
