// ============================================================
// SaveManager — persistência segura e econômica (Supabase Free)
// Fluxo: MEMORY → DIRTY → QUEUE → CHECKPOINT → BACKEND
//
// - Uma gravação por checkpoint (debounce 6s; imediata em hide/unload/Salvar).
// - Versionamento otimista: servidor só aceita expected_version == atual
//   (anti-rollback, anti duas-abas, anti replay de save antigo).
// - Idempotência: cada checkpoint tem actionId estável; replay não duplica.
// - Retry seguro com backoff + fila durável (sobrevive reload/offline).
// - Leader election entre abas: só 1 aba empurra (sem concorrência).
// - Nunca substitui estado válido por estado antigo/inválido.
// - Zero polling, zero realtime, zero heartbeat de rede.
// ============================================================
import { supabase } from "@/integrations/supabase/client";

export type CheckpointStatus =
  | "idle"
  | "local-only"
  | "dirty"
  | "pushing"
  | "ok"
  | "conflict"
  | "offline"
  | "backend-missing"
  | "error";

const DEBOUNCE_MS = 6000;
const RETRY_BASE_MS = 5000;
const RETRY_MAX_MS = 60000;
const LOCK_TTL_MS = 8000;
const LOCK_BEAT_MS = 2500;

const versionKey = (uid: string) => `rubym.save.version.${uid}`;
const lastGoodKey = (uid: string) => `rubym.checkpoint.lastgood.${uid}`;
const pendingKey = (uid: string) => `rubym.checkpoint.pending.${uid}`;
const recoveryKey = (uid: string) => `rubym.checkpoint.recovery.${uid}`;
const LOCK_KEY = "rubym.save.leader";

type PendingSlot = {
  expectedVersion: number;
  snapshot: unknown;
  actionId: string;
  hash: string;
  at: number;
  attempts: number;
};

type LastGood = { version: number; snapshot: unknown; hash: string; at: number };

// ---------- utils puras ----------
export function snapshotHash(snapshot: unknown): string {
  let json = "";
  try {
    json = JSON.stringify(snapshot) ?? "";
  } catch {
    return "unserializable";
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < json.length; i++) {
    const c = json.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x01000193) >>> 0;
    h2 = (((h2 + c) * 0x85ebca6b) ^ (h2 >>> 13)) >>> 0;
  }
  return `${h1.toString(36)}.${h2.toString(36)}.${json.length.toString(36)}`;
}

/** Snapshot mínimo viável: objeto com `idle` objeto. Nunca adota nada fora disso. */
export function isValidSnapshot(data: unknown): data is { idle: Record<string, unknown> } {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const idle = (data as Record<string, unknown>)["idle"];
  return !!idle && typeof idle === "object" && !Array.isArray(idle);
}

/** Tetos (espelham o trigger no banco — última palavra é do servidor). */
const CAPS = {
  trainerLevel: 1_000_000,
  pokemonLevel: 1_000_000,
  gold: 50_000_000,
  crystal: 1_000_000,
  esmeralda: 1_000_000,
  safira: 1_000_000,
  collection: 500,
  itemQty: 999_999,
} as const;

function clampNum(v: unknown, max: number, min = 0): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/** Sanitiza snapshot antes de subir (defesa em profundidade; servidor revalida). */
export function sanitizeSnapshot(snapshot: unknown): unknown {
  if (!snapshot || typeof snapshot !== "object") return snapshot;
  const root = { ...(snapshot as Record<string, unknown>) };
  const idle = root["idle"];
  if (idle && typeof idle === "object") {
    const s = { ...(idle as Record<string, unknown>) };
    const caps: Array<[string, number]> = [
      ["trainerLevel", CAPS.trainerLevel],
      ["trainer_level", CAPS.trainerLevel],
      ["gold", CAPS.gold],
      ["crystal", CAPS.crystal],
      ["esmeralda", CAPS.esmeralda],
      ["safira", CAPS.safira],
    ];
    for (const [key, max] of caps) {
      if (s[key] === undefined) continue;
      const v = clampNum(s[key], max);
      if (v !== null) s[key] = v;
      else delete s[key];
    }
    const bank = s["bank"];
    if (bank && typeof bank === "object" && !Array.isArray(bank)) {
      const b = { ...(bank as Record<string, unknown>) };
      const bg = clampNum(b["gold"], CAPS.gold);
      if (bg !== null) b["gold"] = bg;
      const bc = clampNum(b["crystals"], CAPS.crystal);
      if (bc !== null) b["crystals"] = bc;
      s["bank"] = b;
    }
    const items = s["items"];
    if (items && typeof items === "object" && !Array.isArray(items)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(items as Record<string, unknown>)) {
        const n = clampNum(v, CAPS.itemQty);
        if (n !== null) out[k] = n;
      }
      s["items"] = out;
    }
    const col = s["collection"];
    if (Array.isArray(col) && col.length > CAPS.collection) s["collection"] = col.slice(0, CAPS.collection);
    root["idle"] = s;
  }
  for (const key of ["team", "restingBench"] as const) {
    const arr = root[key];
    if (!Array.isArray(arr)) continue;
    root[key] = arr.slice(0, 200).map((mon) => {
      if (!mon || typeof mon !== "object") return mon;
      const m = { ...(mon as Record<string, unknown>) };
      if (m["level"] !== undefined) {
        const lv = clampNum(m["level"], CAPS.pokemonLevel, 1);
        if (lv !== null) m["level"] = lv;
      }
      return m;
    });
  }
  return root;
}

// ---------- estado interno ----------
let memSnapshot: unknown = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let needsFlush = false;
let needsRebase = false;
let retryCount = 0;
let status: CheckpointStatus = "idle";
let lastError: string | null = null;
const listeners = new Set<(s: CheckpointStatus) => void>();
const tabId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
let isLeader = false;
let beatTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function setStatus(s: CheckpointStatus, err: string | null = null) {
  status = s;
  if (err !== null) lastError = err;
  listeners.forEach((cb) => {
    try {
      cb(s);
    } catch {
      /* ignore */
    }
  });
}

export function onCheckpointStatus(cb: (s: CheckpointStatus) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getCheckpointStatus(): CheckpointStatus {
  return status;
}

export function getLastError(): string | null {
  return lastError;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadVersion(uid: string): number {
  try {
    const v = Number(localStorage.getItem(versionKey(uid)));
    if (Number.isFinite(v) && v >= 0) return Math.floor(v);
  } catch {
    /* ignore */
  }
  const lg = readJson<LastGood>(lastGoodKey(uid));
  return lg && Number.isFinite(lg.version) ? Math.max(0, Math.floor(lg.version)) : 0;
}

function storeVersion(uid: string, v: number) {
  try {
    localStorage.setItem(versionKey(uid), String(Math.max(0, Math.floor(v))));
  } catch {
    /* ignore */
  }
}

function readLock(): { tab: string; beat: number } | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { tab?: unknown; beat?: unknown };
    if (typeof o.tab !== "string" || typeof o.beat !== "number") return null;
    return { tab: o.tab, beat: o.beat };
  } catch {
    return null;
  }
}

/** Eleição de líder entre abas (só o líder empurra checkpoints). */
function ensureLeadership(): boolean {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  const lock = readLock();
  if (!lock || lock.tab === tabId || now - lock.beat > LOCK_TTL_MS) {
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify({ tab: tabId, beat: now }));
    } catch {
      /* ignore */
    }
    if (!isLeader) {
      isLeader = true;
      startBeat();
      // Ao assumir a liderança, rebaseia: busca versão do servidor antes de empurrar.
      void rebaseOnLeadership();
    }
    return true;
  }
  if (isLeader) {
    isLeader = false;
    if (beatTimer) {
      clearInterval(beatTimer);
      beatTimer = null;
    }
  }
  return false;
}

function startBeat() {
  if (beatTimer) clearInterval(beatTimer);
  beatTimer = setInterval(() => {
    if (!isLeader) return;
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify({ tab: tabId, beat: Date.now() }));
    } catch {
      /* ignore */
    }
  }, LOCK_BEAT_MS);
}

async function currentUid(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user?.id;
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

function isBackendMissingError(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.message} ${(e as { code?: unknown }).code ?? ""}` : String(e);
  return /PGRST202|not found|Could not find the function|404/i.test(msg);
}

function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /Failed to fetch|NetworkError|Network request failed|timeout|AbortError|Load failed/i.test(msg);
}

function scheduleRetry(uid: string) {
  if (retryTimer) return;
  retryCount += 1;
  const wait = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * Math.pow(2, Math.min(3, retryCount - 1)));
  setStatus("offline");
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushInternal(uid);
  }, wait);
}

function bindGlobalListeners(getUid: () => Promise<string | null>) {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  const kick = async () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    const uid = await getUid();
    if (uid && memSnapshot) void flushInternal(uid, true);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void kick();
  });
  window.addEventListener("pagehide", () => {
    void kick();
  });
  window.addEventListener("beforeunload", () => {
    void kick();
  });
  window.addEventListener("online", async () => {
    retryCount = 0;
    const uid = await getUid();
    if (!uid) return;
    // Retoma fila durável que sobreviveu ao reload/offline.
    const pend = readJson<PendingSlot>(pendingKey(uid));
    if (pend) void flushInternal(uid);
    else if (memSnapshot) void flushInternal(uid);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === LOCK_KEY) ensureLeadership();
  });
}

/** Marca snapshot como dirty (debounce de rede; fila durável é gravada na hora). */
export function markDirty(snapshot: unknown) {
  if (typeof window === "undefined" || !isValidSnapshot(snapshot)) return;
  memSnapshot = snapshot;
  bindGlobalListeners(currentUid);
  // Fila durável imediata: sobrevive a reload/fechamento/offline.
  void currentUid().then((uid) => {
    if (!uid) return;
    try {
      const expected = loadVersion(uid);
      const hash = snapshotHash(snapshot);
      localStorage.setItem(
        pendingKey(uid),
        JSON.stringify({ expectedVersion: expected, snapshot, actionId: `${uid}:v${expected + 1}:${hash}`, hash, at: Date.now(), attempts: 0 } satisfies PendingSlot),
      );
    } catch {
      /* ignore */
    }
  });
  setStatus("dirty");
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void currentUid().then((uid) => {
      if (uid) void flushInternal(uid);
    });
  }, DEBOUNCE_MS);
}

/** Força tentativa imediata (botão Salvar, level-up, hide/unload). */
export async function flushNow(snapshot?: unknown): Promise<boolean> {
  if (snapshot !== undefined && isValidSnapshot(snapshot)) memSnapshot = snapshot;
  const uid = await currentUid();
  if (!uid || !memSnapshot) return true; // local-only: nada a fazer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  return flushInternal(uid, true);
}

async function rebaseOnLeadership() {
  const uid = await currentUid();
  if (!uid) return;
  try {
    const { data, error } = await supabase
      .from("game_saves")
      .select("save_version")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) return; // backend ausente/tabela ausente: mantém local
    const sv = (data as { save_version?: unknown } | null)?.save_version;
    if (typeof sv === "number" && sv > loadVersion(uid)) {
      // Servidor à frente e esta aba tem base antiga: TRAVA pushes até
      // recarregar (nunca sobrescreve o oficial com estado defasado).
      // O estado local fica guardado como recuperação.
      needsRebase = true;
      try {
        if (memSnapshot && isValidSnapshot(memSnapshot)) {
          localStorage.setItem(recoveryKey(uid), JSON.stringify({ version: loadVersion(uid), snapshot: memSnapshot, at: Date.now() }));
        }
      } catch {
        /* ignore */
      }
      setStatus("conflict", "outra aba atualizou o save — recarregue para sincronizar");
    }
  } catch {
    /* offline/backend ausente: mantém local */
  }
}

async function flushInternal(uid: string, immediate = false): Promise<boolean> {
  bindGlobalListeners(currentUid);
  if (needsRebase) {
    // Base defasada + servidor à frente: não empurra nada até recarregar.
    setStatus("conflict", "outra aba atualizou o save — recarregue para sincronizar");
    return false;
  }
  if (!memSnapshot) {
    // Sem snapshot em memória: tenta a fila durável (reload/offline anterior),
    // verificando integridade (hash) antes de usar.
    const pend = readJson<PendingSlot>(pendingKey(uid));
    if (!pend || !isValidSnapshot(pend.snapshot) || pend.hash !== snapshotHash(pend.snapshot)) {
      if (pend) {
        try {
          localStorage.removeItem(pendingKey(uid));
        } catch {
          /* ignore */
        }
      }
      return true;
    }
    memSnapshot = pend.snapshot;
  }
  if (pushing) {
    needsFlush = true;
    return false;
  }
  if (!ensureLeadership()) {
    // Outra aba é líder: não empurra (sem concorrência).
    // A fila durável já foi gravada em markDirty — o líder usa a própria
    // base ao assumir; nada se perde.
    setStatus("ok");
    return true;
  }
  pushing = true;
  setStatus("pushing");
  try {
    const snap = sanitizeSnapshot(memSnapshot);
    const expected = loadVersion(uid);
    const hash = snapshotHash(snap);
    const actionId = `${uid}:v${expected + 1}:${hash}`;
    try {
      localStorage.setItem(
        pendingKey(uid),
        JSON.stringify({ expectedVersion: expected, snapshot: snap, actionId, hash, at: Date.now(), attempts: 0 } satisfies PendingSlot),
      );
    } catch {
      /* ignore */
    }
    let res: { ok: boolean; server_version?: number; reason?: string };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("checkpoint_save", {
        p_expected_version: expected,
        p_data: snap,
        p_action_id: actionId,
      });
      if (error) throw error;
      res = (data ?? {}) as { ok: boolean; server_version?: number; reason?: string };
    } catch (e) {
      if (isBackendMissingError(e)) {
        setStatus("backend-missing", "checkpoint_save ausente — rode a migration no Supabase");
        return false;
      }
      throw e;
    }
    if (res.ok) {
      const sv = typeof res.server_version === "number" ? res.server_version : expected + 1;
      storeVersion(uid, sv);
      try {
        localStorage.setItem(lastGoodKey(uid), JSON.stringify({ version: sv, snapshot: snap, hash, at: Date.now() } satisfies LastGood));
        localStorage.removeItem(pendingKey(uid));
      } catch {
        /* ignore */
      }
      retryCount = 0;
      setStatus("ok");
      lastError = null;
      return true;
    }
    if (res.reason === "duplicate") {
      // Replay seguro: já aplicado antes. Adota versão do servidor.
      if (typeof res.server_version === "number") storeVersion(uid, res.server_version);
      try {
        localStorage.removeItem(pendingKey(uid));
      } catch {
        /* ignore */
      }
      retryCount = 0;
      setStatus("ok");
      return true;
    }
    if (res.reason === "stale" || res.reason === "rate_limited" || res.reason === "rejected") {
      // Estado local defasado ou rejeitado: busca o oficial e valida antes de adotar.
      await adoptServerIfNewer(uid);
      setStatus("conflict", `checkpoint rejeitado (${res.reason}) — estado oficial preservado`);
      return false;
    }
    setStatus("error", `checkpoint rejeitado (${res.reason ?? "unknown"})`);
    return false;
  } catch (e) {
    if (isNetworkError(e)) {
      scheduleRetry(uid);
      return false;
    }
    setStatus("error", e instanceof Error ? e.message : String(e));
    return false;
  } finally {
    pushing = false;
    if (needsFlush) {
      needsFlush = false;
      if (memSnapshot) void flushInternal(uid);
    }
  }
}

/**
 * Busca o snapshot oficial e adota SOMENTE se válido e mais novo que o local.
 * Nunca sobrescreve estado válido com estado antigo/inválido.
 */
export async function adoptServerIfNewer(uid: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabase
      .from("game_saves")
      .select("data,save_version")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) return null;
    const row = data as { data?: unknown; save_version?: unknown } | null;
    if (!row || !isValidSnapshot(row.data)) return null;
    const sv = typeof row.save_version === "number" ? row.save_version : 0;
    const local = loadVersion(uid);
    if (sv < local) {
      // Servidor mais antigo: NÃO adota. Guarda cópia como recuperação.
      try {
        localStorage.setItem(recoveryKey(uid), JSON.stringify({ version: sv, snapshot: row.data, at: Date.now() }));
      } catch {
        /* ignore */
      }
      return null;
    }
    storeVersion(uid, sv);
    try {
      localStorage.setItem(lastGoodKey(uid), JSON.stringify({ version: sv, snapshot: row.data, hash: snapshotHash(row.data), at: Date.now() } satisfies LastGood));
    } catch {
      /* ignore */
    }
    return row.data;
  } catch {
    return null;
  }
}

/** Fetch oficial para hydrate de boot (valida antes de devolver). */
export async function fetchServer(uid: string): Promise<{ snapshot: unknown; version: number } | null> {
  const adopted = await adoptServerIfNewer(uid);
  if (!adopted) return null;
  return { snapshot: adopted, version: loadVersion(uid) };
}

/** Último checkpoint válido local (recuperação sem rede). */
export function loadLastGood(uid: string): { snapshot: unknown; version: number } | null {
  const lg = readJson<LastGood>(lastGoodKey(uid));
  if (!lg || !isValidSnapshot(lg.snapshot)) return null;
  return { snapshot: lg.snapshot, version: lg.version };
}

/** Cópia de recuperação guardada em conflito (nunca aplicada sozinha). */
export function loadRecovery(uid: string): unknown | null {
  try {
    const raw = localStorage.getItem(recoveryKey(uid));
    if (!raw) return null;
    const o = JSON.parse(raw) as { snapshot?: unknown };
    return o?.snapshot ?? null;
  } catch {
    return null;
  }
}

export async function deleteServerSave(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("delete_own_save");
  if (error) throw new Error(isBackendMissingError(error) ? "backend sem migração aplicada" : error.message);
}
