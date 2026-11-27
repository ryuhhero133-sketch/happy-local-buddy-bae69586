import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const source = read("src/game/eventNotice.ts");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const notice = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);
const {
  EVENT_NOTICE_INTERVAL_MS,
  EVENT_NOTICE_WINDOW_MS,
  EVENT_NOTICE_COOLDOWN_MS,
  EVENT_NOTICE_STORAGE_KEY,
  eventNoticeStatus,
  eventNoticeIsDue,
  readEventNoticeLastOpened,
  writeEventNoticeLastOpened,
} = notice;

const MIN = 60_000;
const HOUR = 60 * MIN;
// Início de uma janela de 30 minutos (o valor exato não importa, só o alinhamento).
const T0 = 500 * EVENT_NOTICE_INTERVAL_MS;
const at = (minutes) => T0 + minutes * MIN;

test("janela de 30 min, aviso de 10 min e cooldown de 2 h", () => {
  assert.equal(EVENT_NOTICE_INTERVAL_MS, 30 * MIN);
  assert.equal(EVENT_NOTICE_WINDOW_MS, 10 * MIN);
  assert.equal(EVENT_NOTICE_COOLDOWN_MS, 2 * HOUR);
  assert.equal(EVENT_NOTICE_STORAGE_KEY, "rubym.evento-desembarque.last-opened.v1");
});

test("primeira visita acende na hora, mesmo fora da janela", () => {
  const status = eventNoticeStatus(at(15), null);
  assert.equal(status.due, true);
  assert.equal(status.flashing, true);
  assert.equal(status.firstTime, true);
  assert.equal(eventNoticeIsDue(at(15), null), true);
});

test("depois de abrir, o banner fica 2 horas sem aparecer", () => {
  const opened = at(5);
  assert.equal(eventNoticeStatus(opened, opened).due, false);
  assert.equal(eventNoticeStatus(at(6), opened).due, false);
  assert.equal(eventNoticeStatus(opened + EVENT_NOTICE_COOLDOWN_MS - 1, opened).due, false);
  // Exatamente 2 h depois, a primeira janela abre.
  assert.equal(eventNoticeStatus(opened + EVENT_NOTICE_COOLDOWN_MS, opened).due, true);
  // A janela dura 10 min; depois só volta no próximo ciclo de 30 min.
  assert.equal(eventNoticeStatus(opened + EVENT_NOTICE_COOLDOWN_MS + EVENT_NOTICE_WINDOW_MS, opened).due, false);
  assert.equal(eventNoticeStatus(opened + EVENT_NOTICE_COOLDOWN_MS + EVENT_NOTICE_INTERVAL_MS, opened).due, true);
});

test("se perder a janela, o aviso volta 30 min depois", () => {
  const opened = at(20);
  const readyAt = opened + EVENT_NOTICE_COOLDOWN_MS;
  assert.equal(eventNoticeStatus(readyAt + 5 * MIN, opened).due, true);
  const missed = eventNoticeStatus(readyAt + 15 * MIN, opened);
  assert.equal(missed.due, false);
  assert.equal(missed.nextAt, readyAt + EVENT_NOTICE_INTERVAL_MS);
  assert.equal(eventNoticeStatus(readyAt + EVENT_NOTICE_INTERVAL_MS, opened).due, true);
});

test("fora da janela de aviso a Pokébola abre as Missões 20", () => {
  const opened = T0 - 3 * HOUR;
  assert.equal(eventNoticeStatus(at(5), opened).due, true);
  assert.equal(eventNoticeStatus(at(15), opened).due, false);
  assert.equal(eventNoticeStatus(at(29), opened).due, false);
  assert.equal(eventNoticeStatus(at(30), opened).due, true);
});

test("relógio voltando no tempo não prende o jogador por mais de 2 h", () => {
  const now = at(5);
  const data = new Map([[EVENT_NOTICE_STORAGE_KEY, String(now + HOUR)]]);
  const storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  const opened = readEventNoticeLastOpened(storage, now);
  assert.equal(opened, now);
  assert.equal(data.get(EVENT_NOTICE_STORAGE_KEY), String(now));

  const status = eventNoticeStatus(now, opened);
  assert.equal(status.cooldownUntil, now + EVENT_NOTICE_COOLDOWN_MS);
  assert.equal(status.due, false);
  assert.equal(eventNoticeStatus(now + EVENT_NOTICE_COOLDOWN_MS + MIN, opened).due, true);
});

test("cooldown salvo no navegador sobrevive ao reload", () => {
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  assert.equal(readEventNoticeLastOpened(null), null);
  assert.equal(readEventNoticeLastOpened(storage), null);

  writeEventNoticeLastOpened(1234.6, storage);
  assert.equal(data.get(EVENT_NOTICE_STORAGE_KEY), "1235");
  assert.equal(readEventNoticeLastOpened(storage), 1235);

  storage.setItem(EVENT_NOTICE_STORAGE_KEY, "abc");
  assert.equal(readEventNoticeLastOpened(storage), null);
  writeEventNoticeLastOpened(0, storage);
  assert.equal(readEventNoticeLastOpened(storage), null);
});

test("HUD liga o banner na Pokébola e mantém a quest normal como fallback", () => {
  const hud = read("src/components/hud/CaptureQuestHud.tsx");
  const css = read("src/components/hud/event-notice.css");

  assert.match(hud, /import eventoDesembarqueImg from "@\/assets\/evento-desembarque\.webp"/);
  assert.match(hud, /data-event-notice=\{eventDue \? "due" : "idle"\}/);
  assert.match(hud, /if \(eventNoticeStatus\(now, lastOpenedAt\)\.due\)/);
  assert.ok(hud.indexOf("setEventBannerOpen(true)") < hud.indexOf("setOpen(true);"));
  assert.match(hud, /role="dialog" aria-modal="true" aria-labelledby="evento-desembarque-title"/);
  assert.match(hud, />\s*Fechar\s*</);
  assert.match(hud, /aria-label="Fechar aviso do evento"/);
  assert.match(css, /capture-event-orb-glow/);
  assert.match(css, /prefers-reduced-motion: reduce/);

  const asset = statSync(new URL("../src/assets/evento-desembarque.webp", import.meta.url));
  assert.ok(asset.size > 0 && asset.size < 400 * 1024, `banner muito grande: ${asset.size}`);
});
