// ============================================================
// emergencyVault — Cofre de segurança do progresso (IndexedDB)
//
// Etapa 1: cópia local de EMERGÊNCIA do blob completo de progresso,
// gravada em segundo plano para reduzir perda em queda de conexão,
// fechamento inesperado do navegador ou indisponibilidade temporária
// do Supabase. Não substitui localSave.ts nem saveManager.ts — apenas
// mantém uma cópia extra, isolada por conta.
//
// Etapa 2: recuperação SEGURA — o envelope passa a guardar também a
// identidade local ({id, name}) da MESMA conta (validada por uid), para
// que o bootstrap possa restaurar identidade quando a rede cair; e a
// API recoverVaultIdentity() devolve essa identidade SOMENTE quando
// uid do cofre === uid vigente. Nada é restaurado automaticamente.
//
// Garantias:
// - Isolamento por uid: a gravação usa a chave = uid vigente
//   (rubym.currentUid, mesma convenção de pokemonMint). A leitura só
//   devolve o registro do uid vigente — progresso de uma conta nunca
//   é recuperado em outra.
// - Integridade: reutiliza isValidSnapshot + snapshotHash do
//   saveManager para validar o dado antes de devolvê-lo.
// - Conclusão: a gravação só é considerada concluída após o
//   tx.oncomplete do IndexedDB (meta local só é atualizado depois).
// - Anti-regressão: não sobrescreve um save mais recente por um mais
//   antigo (guarda por savedAt) e nunca restaura sozinho — readVault()
//   apenas expõe o dado validado.
// - Resiliência: debounce, flush em hide/unload e falhas do IndexedDB
//   engolidas (console.warn rate-limitado) — nunca bloqueiam o jogo
//   nem interrompem o salvamento atual.
// ============================================================
import { isValidSnapshot, snapshotHash } from "@/lib/saveManager";

const DB_NAME = "rubym-emergency-v1";
const STORE_NAME = "saves";
const FORMAT_VERSION = 1;
const DEBOUNCE_MS = 2000;
const UID_KEY = "rubym.currentUid";
const META_KEY = "rubym.emergency.meta.v1";
const IDENTITY_KEY = "rubym.identity.v1";
const PREV_SUFFIX = "::prev";

type VaultIdentity = { id: string; name: string };

type EmergencyEnvelope = {
  key: string;
  uid: string;
  formatVersion: number;
  savedAt: number;
  checksum: string;
  data: unknown;
  /** Opcional (etapa 2): identidade da MESMA conta. O checksum cobre
   * apenas `data`; a identidade é validada estruturalmente + por uid. */
  identity?: VaultIdentity;
};

type EmergencyMeta = {
  uid: string;
  savedAt: number;
  checksum: string;
  formatVersion: number;
  at: number;
};

export type VaultReadResult = { data: unknown; savedAt: number };

// ---------- estado interno ----------
let dbPromise: Promise<IDBDatabase> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let pending: { uid: string; data: unknown; savedAt: number } | null = null;
let writing = false;
let rewrite = false;
let listenersBound = false;
let lastWarnAt = 0;

function warn(msg: string, err?: unknown) {
  const now = Date.now();
  if (now - lastWarnAt < 4000) return;
  lastWarnAt = now;
  if (err !== undefined) console.warn(msg, err);
  else console.warn(msg);
}

// ---------- utils ----------
function currentUid(): string | null {
  try {
    const raw = localStorage.getItem(UID_KEY);
    if (raw && raw.trim().length > 0) return raw.trim();
  } catch {
    /* ignore */
  }
  return null;
}

function readSavedAt(data: unknown): number {
  const s = (data as { savedAt?: unknown } | null)?.savedAt;
  return typeof s === "number" && Number.isFinite(s) ? s : Date.now();
}

/** Identidade local SOMENTE se pertencer ao uid indicado (isolamento). */
function readLocalIdentity(uid: string): VaultIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { id?: unknown; name?: unknown };
    if (!o || o.id !== uid) return null;
    if (typeof o.name !== "string" || o.name.trim().length === 0) return null;
    return { id: uid, name: o.name };
  } catch {
    return null;
  }
}

function readMeta(): EmergencyMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<EmergencyMeta>;
    if (
      !o ||
      typeof o.uid !== "string" ||
      typeof o.savedAt !== "number" ||
      !Number.isFinite(o.savedAt)
    ) {
      return null;
    }
    return o as EmergencyMeta;
  } catch {
    return null;
  }
}

function writeMeta(meta: EmergencyMeta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

/** Valida envelope completo: uid (isolamento), versão de formato,
 * data e integridade (mecanismos existentes do saveManager). */
function isValidEnvelope(env: unknown, uid: string): env is EmergencyEnvelope {
  if (!env || typeof env !== "object" || Array.isArray(env)) return false;
  const e = env as Partial<EmergencyEnvelope>;
  if (e.uid !== uid) return false;
  if (e.key !== uid && e.key !== uid + PREV_SUFFIX) return false;
  if (e.formatVersion !== FORMAT_VERSION) return false;
  if (typeof e.savedAt !== "number" || !Number.isFinite(e.savedAt)) return false;
  if (typeof e.checksum !== "string" || e.checksum.length === 0) return false;
  if (!isValidSnapshot(e.data)) return false;
  if (snapshotHash(e.data) !== e.checksum) return false;
  return true;
}

// ---------- IndexedDB ----------
function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const factory = globalThis.indexedDB;
      if (!factory) {
        reject(new Error("indexeddb indisponivel"));
        return;
      }
      const req = factory.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          try {
            db.close();
          } catch {
            /* ignore */
          }
          dbPromise = null;
        };
        db.onclose = () => {
          dbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => reject(req.error ?? new Error("falha ao abrir indexeddb"));
      req.onblocked = () => reject(new Error("indexeddb bloqueado"));
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  }).catch((e) => {
    dbPromise = null;
    throw e;
  });
  return dbPromise;
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb request falhou"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb tx falhou"));
    tx.onabort = () => reject(tx.error ?? new Error("idb tx abortada"));
  });
}

/** Grava o envelope e rotaciona o registro anterior para a chave
 * "::prev" (backup de 1 geração). Resolve somente após tx.oncomplete. */
async function writeEnvelope(job: {
  uid: string;
  data: unknown;
  savedAt: number;
}): Promise<boolean> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const done = txDone(tx);
    const store = tx.objectStore(STORE_NAME);
    const env: EmergencyEnvelope = {
      key: job.uid,
      uid: job.uid,
      formatVersion: FORMAT_VERSION,
      savedAt: job.savedAt,
      checksum: snapshotHash(job.data),
      data: job.data,
    };
    const ident = readLocalIdentity(job.uid);
    if (ident) env.identity = ident;
    const prev = await idbRequest(store.get(job.uid));
    if (prev && typeof prev === "object" && !Array.isArray(prev)) {
      store.put({ ...(prev as EmergencyEnvelope), key: job.uid + PREV_SUFFIX });
    }
    store.put(env);
    await done;
    return true;
  } catch (e) {
    warn("[emergencyVault] gravacao falhou — salvamento atual segue intacto", e);
    return false;
  }
}

async function runWrite(): Promise<boolean> {
  if (writing) {
    rewrite = true;
    return false;
  }
  const job = pending;
  pending = null;
  if (!job) return true;
  writing = true;
  try {
    const ok = await writeEnvelope(job);
    if (ok) {
      writeMeta({
        uid: job.uid,
        savedAt: job.savedAt,
        checksum: snapshotHash(job.data),
        formatVersion: FORMAT_VERSION,
        at: Date.now(),
      });
    } else if (!pending) {
      // Falhou (ex.: IndexedDB indisponível): mantém pendente para o
      // próximo flush tentar de novo — sem retry automático agressivo.
      pending = job;
    }
    return ok;
  } finally {
    writing = false;
    if (rewrite) {
      rewrite = false;
      if (pending) void runWrite();
    }
  }
}

function bindListeners() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    void runWrite();
  };
  window.addEventListener("beforeunload", flush);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

// ---------- API ----------

/**
 * Agenda a cópia de emergência do blob (debounce de 2s). Não bloqueia
 * nem lança: retorna false se o dado foi recusado (sem uid vigente ou
 * snapshot inválido) ou se é mais antigo que o último cofre gravado.
 */
export function vaultPut(data: unknown): boolean {
  if (typeof window === "undefined") return false;
  const uid = currentUid();
  if (!uid) return false;
  if (!isValidSnapshot(data)) {
    warn("[emergencyVault] put ignorado: snapshot invalido");
    return false;
  }
  const savedAt = readSavedAt(data);
  const meta = readMeta();
  // Anti-regressão por conta: nunca substituir save mais recente por antigo.
  if (meta && meta.uid === uid && savedAt < meta.savedAt) return false;
  bindListeners();
  pending = { uid, data, savedAt };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void runWrite();
  }, DEBOUNCE_MS);
  return true;
}

/**
 * Grava o que estiver pendente IMEDIATAMENTE e só resolve com true
 * após a confirmação do IndexedDB (tx.oncomplete). Idempotente.
 */
export async function vaultFlushNow(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  return runWrite();
}

/** Lê o envelope válido do uid vigente (principal com fallback "::prev").
 * Retorna null quando não há registro válido. Nunca lança. */
async function readValidEnvelope(uid: string): Promise<EmergencyEnvelope | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const primary = await idbRequest(store.get(uid));
    if (isValidEnvelope(primary, uid)) return primary;
    const prev = await idbRequest(store.get(uid + PREV_SUFFIX));
    if (isValidEnvelope(prev, uid)) return prev;
    return null;
  } catch (e) {
    warn("[emergencyVault] leitura falhou", e);
    return null;
  }
}

/**
 * Lê a cópia de emergência do uid vigente, validada (uid + formato +
 * checksum + formato do save). Fallback para a geração "::prev" se a
 * principal estiver corrompida. Retorna null quando não há dado
 * válido — nunca lança, nunca restaura nada automaticamente.
 */
export async function readVault(): Promise<VaultReadResult | null> {
  if (typeof window === "undefined") return null;
  const uid = currentUid();
  if (!uid) return null;
  const env = await readValidEnvelope(uid);
  if (!env) return null;
  return { data: env.data, savedAt: env.savedAt };
}

/**
 * Recupera a identidade local guardada no cofre da conta vigente.
 * Revalida isolamento (identity.id === uid) mesmo após o envelope ser
 * aprovado. Retorna null quando não há identidade válida — nunca lança,
 * nunca grava nada no localStorage (o chamador decide).
 */
export async function recoverVaultIdentity(): Promise<VaultIdentity | null> {
  if (typeof window === "undefined") return null;
  const uid = currentUid();
  if (!uid) return null;
  try {
    const env = await readValidEnvelope(uid);
    const ident = env?.identity;
    if (
      !ident ||
      ident.id !== uid ||
      typeof ident.name !== "string" ||
      ident.name.trim().length === 0
    ) {
      return null;
    }
    return { id: ident.id, name: ident.name };
  } catch {
    return null;
  }
}
