// Exercise the actual reload preparation from idle.tsx without real accounts/RPCs.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
const route = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");
const start = route.indexOf("  const canSafelyRestart =");
const end = route.indexOf("\n  // Nenhuma consulta periódica", start);
assert.ok(start > 0 && end > start);
const { outputText } = ts.transpileModule(route.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});

function fixture(extra = {}) {
  const storage = new Map();
  const events = [];
  let owner = "player-a";
  let busy = false;
  const deps = {
    cloudBlobReady: true, serverSync: { status: "ready" }, setupDone: true, starterChosen: true,
    identity: { id: "player-a" }, getSnapshotOwner: () => owner, isCheckpointBusy: () => busy,
    tab: "batalha", mapEditorOpen: false, mapLoading: false, teleportTransition: false,
    codeOpen: false, cashShopOpen: false, nevezinhaOpen: false, fishingOpen: false,
    blackEggHudOpen: false, emeraldEggHudOpen: false, forgeWindowOpen: false, preregBusy: false,
    levelResetBusyRef: { current: false }, starterPickPendingRef: { current: false },
    pvpTarget: null, captureAnim: null, auto: true, autoRef: { current: true },
    restartWasAutoRef: { current: null }, keysRef: { current: new Set(["w"]) },
    setAuto: (value) => events.push(["auto", value]), setMoving: () => {}, setWalkingTo: () => {},
    walkTargetRef: { current: { x: 10, y: 20 } }, onJoystickMove: () => {},
    persistTrainerPosition: () => events.push(["position"]),
    idleRef: { current: { bank: { gold: 100 }, currentMap: "mapinha6" } },
    teamRef: { current: [{ uid: "active", level: 18 }] },
    benchRef: { current: [{ uid: "resting", level: 10 }] },
    IDLE_KEY: "rubym.idle.v1",
    loadLatestValid: () => ({ music: true, party: [{ uid: "old" }] }),
    restoreLocalSave: (data) => storage.set("rubym.save.v2", JSON.stringify(data)),
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    scheduleCloudSync: (data) => events.push(["queue", structuredClone(data)]),
    vaultPut: () => {},
    pushCloudSaveNow: async (data) => { events.push(["cloud", structuredClone(data)]); return true; },
    requestAnimationFrame: (callback) => { queueMicrotask(callback); return 0; },
    ...extra,
  };
  const functions = new Function(...Object.keys(deps), `${outputText}; return { canSafelyRestart, prepareRestart, persistBeforeRestart, cancelPendingRestart };`)(...Object.values(deps));
  return { ...functions, deps, events, storage, setOwner: (value) => { owner = value; }, setBusy: (value) => { busy = value; } };
}

test("real preparation pauses runtime Auto, saves the full signed local shape, then checkpoints", async () => {
  const f = fixture();
  assert.equal(await f.prepareRestart(), true);
  assert.equal(f.deps.autoRef.current, false);
  assert.equal(f.deps.keysRef.current.size, 0);
  assert.equal(f.deps.walkTargetRef.current, null);
  const saved = JSON.parse(f.storage.get("rubym.save.v2"));
  assert.equal(saved.music, true); // Existing root data is not erased.
  assert.deepEqual(saved.activeTeam, f.deps.teamRef.current);
  assert.deepEqual(saved.party.map((pet) => pet.uid), ["active", "resting"]);
  assert.equal(JSON.parse(f.storage.get("rubym.idle.v1")).savedAt, saved.savedAt);
  assert.ok(f.events.findIndex(([event]) => event === "queue") < f.events.findIndex(([event]) => event === "cloud"));
});

test("final persistence includes gains after the cloud request and the latest bench ref", async () => {
  const f = fixture();
  assert.equal(await f.prepareRestart(), true);
  f.deps.idleRef.current = { ...f.deps.idleRef.current, bank: { gold: 125 } };
  f.deps.benchRef.current = [{ uid: "new-resting", level: 12 }];
  assert.equal(f.persistBeforeRestart(), true);
  const saved = JSON.parse(f.storage.get("rubym.save.v2"));
  assert.equal(saved.idle.bank.gold, 125);
  assert.deepEqual(saved.restingBench, [{ uid: "new-resting", level: 12 }]);
  assert.equal(f.events.filter(([event]) => event === "queue").at(-1)[1].idle.bank.gold, 125);
});

test("unready, wrong-account or busy clients cannot prepare or overwrite a save", async () => {
  for (const f of [fixture({ cloudBlobReady: false }), fixture({ tab: "market" }), fixture({ pvpTarget: {} }), fixture({ captureAnim: {} })]) {
    assert.equal(await f.prepareRestart(), false);
    assert.equal(f.storage.size, 0);
  }
  for (const change of [(f) => f.setOwner("player-b"), (f) => f.setBusy(true)]) {
    const f = fixture(); change(f);
    assert.equal(f.persistBeforeRestart(), false);
    assert.equal(await f.prepareRestart(), false);
    assert.equal(f.storage.size, 0);
  }
});

test("failed local persistence prevents RPC and cancellation restores Auto", async () => {
  const f = fixture({ localStorage: { getItem: () => null, setItem: () => { throw new Error("quota"); } } });
  assert.equal(await f.prepareRestart(), false);
  assert.ok(!f.events.some(([event]) => event === "cloud"));
  f.cancelPendingRestart();
  assert.equal(f.deps.autoRef.current, true);
  assert.deepEqual(f.events.filter(([event]) => event === "auto"), [["auto", false], ["auto", true]]);
});

test("a cancelled pre-save frame never starts a delayed checkpoint", async () => {
  const frames = [];
  const f = fixture({ requestAnimationFrame: (callback) => { frames.push(callback); return frames.length; } });
  const pending = f.prepareRestart();
  f.cancelPendingRestart();
  frames.shift()();
  frames.shift()();
  assert.equal(await pending, false);
  assert.equal(f.storage.size, 0);
  assert.ok(!f.events.some(([event]) => event === "cloud"));
});
