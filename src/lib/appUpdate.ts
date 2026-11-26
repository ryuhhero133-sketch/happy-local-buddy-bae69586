export type AppUpdatePhase = "idle" | "waiting" | "countdown" | "saving" | "save-error" | "deferred" | "blocked" | "reloading";
export type AppUpdateState = { phase: AppUpdatePhase; version: string | null };
export const UPDATE_NOTICE_MS = 6_000;
export const UPDATE_CONFIRM_MS = 5_000;
export const UPDATE_RETRY_MS = 30_000;
export const UPDATE_DEFER_MS = 5 * 60_000;
export const UPDATE_SAVE_TIMEOUT_MS = 20_000;
const LOOP_WINDOW_MS = 10 * 60_000;
const RELOAD_GUARD_KEY = "rubym.app-update-attempts.v1";

/** A stale HTML response/CDN edge must never trap a player in a reload loop. */
export function recordAppReload(storage: Pick<Storage, "getItem" | "setItem">, current: string, target: string, now = Date.now()): boolean {
  try {
    const raw: unknown = JSON.parse(storage.getItem(RELOAD_GUARD_KEY) ?? "[]");
    const attempts = (Array.isArray(raw) ? raw : []).filter((value) =>
      value && typeof value === "object" && typeof value.at === "number"
      && Number.isFinite(value.at) && now - value.at >= 0 && now - value.at < LOOP_WINDOW_MS);
    if (attempts.length >= 3 || attempts.some((value) => value.current === current && value.target === target)) return false;
    storage.setItem(RELOAD_GUARD_KEY, JSON.stringify([...attempts, { current, target, at: now }]));
    return true;
  } catch {
    // If sessionStorage is unavailable, don't risk an unbounded automatic reload.
    return false;
  }
}

type UpdateOptions = {
  currentVersion: string;
  readVersion: (signal: AbortSignal) => Promise<string | null>;
  online: () => boolean;
  visible: () => boolean;
  canReload: () => boolean;
  prepareReload: () => Promise<boolean>;
  persistLatest: () => boolean;
  cancelReload: () => void;
  recordReload: (version: string) => boolean;
  reload: () => void;
  onState: (state: AppUpdateState) => void;
  pollMs?: number;
  now?: () => number;
  setTimer?: (callback: () => unknown, ms: number) => unknown;
  clearTimer?: (timer: unknown) => void;
};

/** Framework-free state machine, shared by the real UI and deterministic tests. */
export function startAppUpdate(options: UpdateOptions) {
  const now = options.now ?? Date.now;
  const setTimer = options.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
  const clearTimer = options.clearTimer ?? ((timer) => clearTimeout(timer as ReturnType<typeof setTimeout>));
  const pollMs = options.pollMs ?? 75_000 + Math.floor(Math.random() * 15_000);
  let state: AppUpdateState = { phase: "idle", version: null };
  let candidate: string | null = null;
  let confirmations = 0;
  let deferredUntil = 0;
  let timer: unknown;
  let request: AbortController | null = null;
  let disposed = false;
  let busy = false;
  const ready = () => options.online() && options.visible() && options.canReload();
  const emit = (phase: AppUpdatePhase, version = candidate) => {
    state = { phase, version };
    if (!disposed) options.onState(state);
  };
  const schedule = (callback: () => unknown, ms: number) => {
    if (timer !== undefined) clearTimer(timer);
    if (!disposed) timer = setTimer(callback, ms);
  };
  const read = async () => {
    request = new AbortController();
    try { return await options.readVersion(request.signal); }
    finally { request = null; }
  };
  const retry = (phase: "waiting" | "save-error" | "blocked") => {
    options.cancelReload();
    if (disposed) return;
    emit(phase);
    schedule(check, phase === "blocked" ? LOOP_WINDOW_MS : UPDATE_RETRY_MS);
  };
  async function attempt() {
    if (disposed || busy || !candidate) return;
    if (!ready()) { emit("waiting"); schedule(check, UPDATE_RETRY_MS); return; }
    busy = true;
    const target = candidate;
    emit("saving", target);
    let saveTimeout: unknown;
    try {
      const saved = await Promise.race([
        options.prepareReload(),
        new Promise<boolean>((resolve) => { saveTimeout = setTimer(() => resolve(false), UPDATE_SAVE_TIMEOUT_MS); }),
      ]);
      if (saveTimeout !== undefined) clearTimer(saveTimeout);
      if (!saved) { retry("save-error"); return; }
      if (disposed) { options.cancelReload(); return; }
      // Reconfirm deployment/network AFTER saving, not just before the countdown.
      const latest = await read();
      if (disposed) { options.cancelReload(); return; }
      if (latest !== target || !ready()) {
        options.cancelReload();
        candidate = latest && latest !== options.currentVersion ? latest : null;
        confirmations = candidate ? 1 : 0;
        emit(candidate ? "waiting" : "idle");
        schedule(check, UPDATE_RETRY_MS);
        return;
      }
      if (!options.persistLatest()) { retry("save-error"); return; }
      if (!options.recordReload(target)) { retry("blocked"); return; }
      emit("reloading", target);
      options.reload();
    } catch {
      retry("save-error");
    } finally {
      if (saveTimeout !== undefined) clearTimer(saveTimeout);
      busy = false;
    }
  }
  async function check() {
    if (disposed || busy || state.phase === "reloading") return;
    if (now() < deferredUntil) {
      emit("deferred");
      schedule(check, deferredUntil - now());
      return;
    }
    if (!options.online() || !options.visible()) { schedule(check, pollMs); return; }
    busy = true;
    try {
      const latest = await read();
      if (disposed) return;
      if (!latest) { schedule(check, pollMs); return; }
      if (latest === options.currentVersion) {
        candidate = null; confirmations = 0;
        emit("idle", null);
        schedule(check, pollMs);
        return;
      }
      confirmations = latest === candidate ? confirmations + 1 : 1;
      candidate = latest;
      if (confirmations < 2) { schedule(check, UPDATE_CONFIRM_MS); return; }
      if (!ready()) { emit("waiting"); schedule(check, UPDATE_RETRY_MS); return; }
      emit("countdown");
      schedule(attempt, UPDATE_NOTICE_MS);
    } catch {
      schedule(check, pollMs);
    } finally {
      busy = false;
    }
  }
  schedule(check, 0);
  return {
    wake() {
      if (!busy && !["countdown", "saving", "reloading", "blocked"].includes(state.phase)) schedule(check, 0);
    },
    defer() {
      if (busy || ["saving", "reloading"].includes(state.phase)) return;
      deferredUntil = now() + UPDATE_DEFER_MS;
      emit("deferred");
      schedule(check, UPDATE_DEFER_MS);
    },
    dispose() {
      disposed = true;
      if (timer !== undefined) clearTimer(timer);
      request?.abort();
      options.cancelReload();
    },
  };
}
