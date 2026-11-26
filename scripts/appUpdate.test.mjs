import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
async function load(path) {
  const { outputText } = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { startAppUpdate, recordAppReload, UPDATE_CONFIRM_MS, UPDATE_NOTICE_MS, UPDATE_DEFER_MS } = await load("src/lib/appUpdate.ts");
const { appVersionResponse, parseAppRelease, APP_RELEASE_ID } = await load("src/lib/appRelease.ts");

function fixture() {
  let time = 1_000;
  let sequence = 0;
  const timers = new Map();
  const values = { version: "release-b", safe: true, online: true, visible: true, saved: true, persisted: true, allowed: true };
  const events = [];
  const phases = [];
  const options = {
    currentVersion: "release-a",
    readVersion: async () => { events.push("read"); return values.version; },
    canReload: () => values.safe, online: () => values.online, visible: () => values.visible,
    prepareReload: async () => { events.push("save"); return values.saved; },
    persistLatest: () => { events.push("persist"); return values.persisted; },
    cancelReload: () => events.push("resume"),
    recordReload: () => { events.push("record"); return values.allowed; },
    reload: () => events.push("reload"),
    onState: (state) => phases.push(state.phase),
    pollMs: 75_000,
    now: () => time,
    setTimer: (fn, delay) => { const id = ++sequence; timers.set(id, { fn, at: time + delay }); return id; },
    clearTimer: (id) => timers.delete(id),
  };
  const next = () => {
    const entry = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
    assert.ok(entry, "a timer should be scheduled");
    timers.delete(entry[0]);
    time = entry[1].at;
    return entry[1].fn();
  };
  return { options, values, events, phases, next, timers, now: () => time, start: () => startAppUpdate(options) };
}

test("release endpoint is public, non-cacheable, GET/HEAD only and never handles other paths", async () => {
  assert.equal(appVersionResponse(new Request("https://game.test/idle")), null);
  const response = appVersionResponse(new Request("https://game.test/__app-version?fresh=1"));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.deepEqual(await response.json(), { version: APP_RELEASE_ID });
  assert.equal(await appVersionResponse(new Request("https://game.test/__app-version", { method: "HEAD" })).text(), "");
  assert.equal(appVersionResponse(new Request("https://game.test/__app-version", { method: "POST" })).status, 405);
});

test("version parsing rejects HTML, arrays, URLs and invalid payloads", () => {
  for (const value of [null, "", "<html>", [], {}, { version: 2 }, { version: "" }, { version: "https://evil.test" }, { version: "x".repeat(129) }]) {
    assert.equal(parseAppRelease(value), null);
  }
  assert.equal(parseAppRelease({ version: "a1234.release-2" }), "a1234.release-2");
});

test("same version never reloads, no matter how many checks run", async () => {
  const f = fixture(); f.values.version = "release-a";
  f.start();
  for (let i = 0; i < 8; i++) await f.next();
  assert.ok(f.phases.every((phase) => phase === "idle"));
  assert.ok(!f.events.includes("save") && !f.events.includes("reload"));
});

test("a deployment needs two confirmations, a warning, a successful save, and a final check", async () => {
  const f = fixture(); f.start();
  await f.next();
  assert.deepEqual(f.phases, []);
  assert.equal([...f.timers.values()][0].at - f.now(), UPDATE_CONFIRM_MS);
  await f.next();
  assert.equal(f.phases.at(-1), "countdown");
  assert.equal([...f.timers.values()][0].at - f.now(), UPDATE_NOTICE_MS);
  await f.next();
  assert.deepEqual(f.events, ["read", "read", "save", "read", "persist", "record", "reload"]);
});

test("transient old edge responses reset confirmation instead of reloading", async () => {
  const f = fixture(); f.start();
  await f.next();
  f.values.version = "release-a";
  await f.next();
  assert.equal(f.phases.at(-1), "idle");
  assert.ok(!f.events.includes("save"));
});

test("hidden/offline tabs do not poll or reload and resume when visible", async () => {
  const f = fixture(); f.values.visible = false;
  const monitor = f.start();
  await f.next();
  assert.deepEqual(f.events, []);
  f.values.visible = true; f.values.online = false; monitor.wake();
  await f.next();
  assert.deepEqual(f.events, []);
  f.values.online = true; monitor.wake();
  await f.next(); await f.next(); await f.next();
  assert.equal(f.events.at(-1), "reload");
});

test("purchases, input and dialogs postpone both the countdown and its final attempt", async () => {
  const f = fixture(); f.values.safe = false; f.start();
  await f.next(); await f.next();
  assert.equal(f.phases.at(-1), "waiting");
  f.values.safe = true;
  await f.next();
  assert.equal(f.phases.at(-1), "countdown");
  f.values.safe = false;
  await f.next();
  assert.equal(f.phases.at(-1), "waiting");
  assert.ok(!f.events.includes("save"));
});

test("a save still in flight cannot trigger reload before its acknowledgement", async () => {
  const f = fixture();
  let finish;
  f.options.prepareReload = () => new Promise((resolve) => { finish = resolve; });
  f.start(); await f.next(); await f.next();
  const pending = f.next();
  assert.equal(f.phases.at(-1), "saving");
  assert.ok(!f.events.includes("reload"));
  finish(true); await pending;
  assert.equal(f.events.at(-1), "reload");
});

test("a stalled save releases the overlay after 20 seconds without forcing a reload", async () => {
  const f = fixture();
  let finish;
  f.options.prepareReload = () => new Promise((resolve) => { finish = resolve; });
  f.start(); await f.next(); await f.next();
  const pending = f.next();
  await f.next(); // save deadline, not a forced navigation
  await pending;
  assert.equal(f.phases.at(-1), "save-error");
  assert.equal(f.events.at(-1), "resume");
  finish(true);
  await Promise.resolve();
  assert.ok(!f.events.includes("reload") && !f.events.includes("persist"));
});

test("failed cloud/local saves resume the game and never reload", async () => {
  for (const key of ["saved", "persisted"]) {
    const f = fixture(); f.values[key] = false; f.start();
    await f.next(); await f.next(); await f.next();
    assert.equal(f.phases.at(-1), "save-error");
    assert.equal(f.events.at(-1), "resume");
    assert.ok(!f.events.includes("reload"));
  }
});

test("a second deployment during saving must be confirmed before any reload", async () => {
  const f = fixture();
  f.options.prepareReload = async () => { f.values.version = "release-c"; return true; };
  f.start(); await f.next(); await f.next(); await f.next();
  assert.equal(f.phases.at(-1), "waiting");
  assert.ok(!f.events.includes("record") && !f.events.includes("reload"));
});

test("network failure after saving keeps the page and resumes Auto", async () => {
  const f = fixture();
  f.options.prepareReload = async () => { f.options.readVersion = async () => { throw new Error("offline"); }; return true; };
  f.start(); await f.next(); await f.next(); await f.next();
  assert.equal(f.phases.at(-1), "save-error");
  assert.equal(f.events.at(-1), "resume");
  assert.ok(!f.events.includes("reload"));
});

test("disposing while saving prevents any delayed reload", async () => {
  const f = fixture();
  let finish;
  f.options.prepareReload = () => new Promise((resolve) => { finish = resolve; });
  const monitor = f.start(); await f.next(); await f.next();
  const pending = f.next();
  monitor.dispose();
  finish(true); await pending;
  assert.ok(!f.events.includes("reload") && !f.events.includes("persist"));
  assert.equal(f.timers.size, 0);
});

test("players can defer for five minutes without a background reload", async () => {
  const f = fixture(); const monitor = f.start();
  await f.next(); await f.next();
  const before = f.now();
  monitor.defer();
  assert.equal(f.phases.at(-1), "deferred");
  assert.equal([...f.timers.values()][0].at - before, UPDATE_DEFER_MS);
  assert.ok(!f.events.includes("save"));
  await f.next();
  assert.equal(f.phases.at(-1), "countdown");
});

test("session guard prevents stale HTML reload loops and rapid deployment storms", () => {
  let raw = null;
  const storage = { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
  assert.equal(recordAppReload(storage, "a", "b", 100), true);
  assert.equal(recordAppReload(storage, "a", "b", 110), false);
  assert.equal(recordAppReload(storage, "b", "c", 120), true);
  assert.equal(recordAppReload(storage, "c", "d", 130), true);
  assert.equal(recordAppReload(storage, "d", "e", 140), false);
  assert.equal(recordAppReload(storage, "a", "b", 11 * 60_000), true);
  assert.equal(recordAppReload({ getItem: () => "[]", setItem: () => { throw new Error("full"); } }, "a", "b"), false);
});

test("reload guard failure keeps the already saved game open", async () => {
  const f = fixture(); f.values.allowed = false; f.start();
  await f.next(); await f.next(); await f.next();
  assert.equal(f.phases.at(-1), "blocked");
  assert.ok(!f.events.includes("reload"));
});

test("game integration uses the existing checkpoint, signed save and last-frame durable queue", () => {
  const idle = read("src/routes/idle.tsx");
  const body = idle.slice(idle.indexOf("const canAutomaticallyUpdate"), idle.indexOf('      {temporarilyClosed'));
  for (const text of ["getSnapshotOwner() === identity.id", "!isCheckpointBusy()", "!pvpTarget", "!captureAnim", "restoreLocalSave(", "scheduleCloudSync(blob)", "pushCloudSaveNow(", "appUpdateWasAutoRef", "keysRef.current.clear()", "isOfflineTest()"]) assert.ok(body.includes(text), text);
  const component = read("src/components/GameAutoUpdate.tsx");
  assert.ok(component.includes('cache: "no-store"'));
  assert.ok(component.includes('document.visibilityState === "visible"'));
  assert.doesNotMatch(component, /signOut|localStorage\.clear|service_role|\.navigate\(/);
  assert.match(read("src/server.ts"), /const version = appVersionResponse\(request\)/);
  assert.match(read("vite.config.ts"), /__APP_RELEASE_ID__: JSON\.stringify\(appReleaseId\)/);
});
