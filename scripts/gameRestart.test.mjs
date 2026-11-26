import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
async function load(path) {
  const { outputText } = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { startGameRestart, RESTART_NOTICE_MS, RESTART_RETRY_MS, RESTART_SAVE_TIMEOUT_MS } = await load("src/lib/gameRestart.ts");

function fixture() {
  const timers = new Map();
  let sequence = 0;
  let time = 1_000;
  const values = { safe: true, saved: true, persisted: true };
  const events = [];
  const phases = [];
  const options = {
    canRestart: () => values.safe,
    prepareRestart: async () => { events.push("save"); return values.saved; },
    persistLatest: () => { events.push("persist"); return values.persisted; },
    cancelRestart: () => events.push("resume"),
    reload: () => events.push("reload"),
    onState: (state) => phases.push(state.phase),
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
  return { options, values, events, phases, timers, next, start: () => startGameRestart(options) };
}

test("no trigger means no requests and no reload", async () => {
  const f = fixture(); f.start();
  assert.deepEqual(f.events, []);
  assert.equal(f.timers.size, 0);
});

test("only a new positive integer version triggers the manual restart", () => {
  for (const value of [0, -1, NaN, Infinity, 1.5, "2", null, undefined]) {
    const f = fixture(); const monitor = f.start(); monitor.trigger(value);
    assert.equal(f.timers.size, 0); assert.deepEqual(f.phases, []);
  }
  const f = fixture(); const monitor = f.start(); monitor.trigger(2); monitor.trigger(2); monitor.trigger(1);
  assert.equal(f.phases.at(-1), "pending");
  assert.equal([...f.timers.values()][0].at - 1_000, RESTART_NOTICE_MS);
});

test("owner-triggered restart waits, saves, persists and reloads once", async () => {
  const f = fixture(); const monitor = f.start(); monitor.trigger(7);
  await f.next();
  assert.deepEqual(f.events, ["save", "persist", "reload"]);
  monitor.trigger(8);
  assert.deepEqual(f.events, ["save", "persist", "reload"]);
});

test("purchases/dialogs defer both save and reload until the action ends", async () => {
  const f = fixture(); f.values.safe = false; const monitor = f.start(); monitor.trigger(3);
  await f.next();
  assert.equal(f.phases.at(-1), "pending");
  assert.ok(!f.events.includes("save"));
  f.values.safe = true;
  await f.next();
  assert.equal(f.events.at(-1), "reload");
});

test("a failed save resumes Auto and retries locally, never forcing reload", async () => {
  const f = fixture(); f.values.saved = false; const monitor = f.start(); monitor.trigger(4);
  await f.next();
  assert.equal(f.phases.at(-1), "save-error");
  assert.equal(f.events.at(-1), "resume");
  assert.equal([...f.timers.values()][0].at - 1_000, RESTART_NOTICE_MS + RESTART_RETRY_MS);
  assert.ok(!f.events.includes("reload"));
});

test("a stalled save times out and releases the overlay", async () => {
  const f = fixture();
  f.options.prepareRestart = () => new Promise(() => {});
  const monitor = f.start(); monitor.trigger(5);
  const pending = f.next();
  await f.next();
  await pending;
  assert.equal(f.phases.at(-1), "save-error");
  assert.ok(!f.events.includes("reload"));
});

test("save timeout constant is a deadline, not periodic version polling", () => {
  assert.equal(RESTART_SAVE_TIMEOUT_MS, 20_000);
  assert.equal(RESTART_RETRY_MS, 15_000);
});

test("a new version during saving can only be handled after the current reload path", async () => {
  const f = fixture(); let finish;
  f.options.prepareRestart = () => new Promise((resolve) => { finish = resolve; });
  const monitor = f.start(); monitor.trigger(9);
  const pending = f.next();
  monitor.trigger(10);
  assert.equal(f.phases.at(-1), "saving");
  finish(true); await pending;
  assert.equal(f.events.at(-1), "reload");
  assert.ok(f.events.includes("persist"));
});

test("disposing cancels pending reconnect or retry timers", () => {
  const f = fixture(); const monitor = f.start(); monitor.trigger(11);
  monitor.dispose();
  assert.equal(f.timers.size, 0);
  assert.equal(f.events.at(-1), "resume");
});

test("client has no periodic version request: only one Realtime subscription and one owner RPC", () => {
  const idle = read("src/routes/idle.tsx");
  assert.match(idle, /game-client-restart-v1/);
  assert.match(idle, /postgres_changes/);
  assert.match(idle, /request_game_client_refresh/);
  assert.doesNotMatch(idle, /\/__app-version|setInterval\([^)]*fetch|readVersion|pollMs/);
  assert.match(idle, /canRestartPlayers=\{canUseMapEditor\}/);
  assert.match(idle, /Todos online/);
  assert.match(idle, /Só meu jogo/);
  const menu = read("src/components/hud/MainMenu.tsx");
  assert.match(menu, /Reiniciar jogadores/);
  assert.match(menu, /hud\.canRestartPlayers/);
});

test("migration is owner-only, read-only for clients and published to Realtime", () => {
  const sql = read("supabase/migrations/20261126120000_game_client_restart.sql");
  assert.match(sql, /auth\.uid\(\) is distinct from '16d47359-8fbb-4a81-9596-918b2d53b75b'::uuid/);
  assert.match(sql, /revoke all on table public\.game_client_refresh from anon, authenticated/);
  assert.match(sql, /grant select on table public\.game_client_refresh to authenticated/);
  assert.match(sql, /alter publication supabase_realtime add table public\.game_client_refresh/);
  assert.match(sql, /grant execute on function public\.request_game_client_refresh\(text\) to authenticated/);
  assert.doesNotMatch(sql, /grant (insert|update|delete)/i);
});
