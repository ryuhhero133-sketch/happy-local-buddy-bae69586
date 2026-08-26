// Robust local save with rotating backups, debounced auto-save and
// page-unload flush. Used as a drop-in replacement for the previous
// inline localStorage read/write in src/routes/index.tsx.
//
// Layout in localStorage:
//   rubym.save.v2          -> latest save
//   rubym.save.bak.1       -> most recent backup
//   rubym.save.bak.2       -> previous
//   rubym.save.bak.3       -> oldest kept
//
// Each backup is a JSON envelope: { savedAt: number, data: <SaveState> }.

import { toast } from "sonner";

export const SAVE_KEY = "rubym.save.v2";
const BACKUP_KEYS = ["rubym.save.bak.1", "rubym.save.bak.2", "rubym.save.bak.3"] as const;
const SIG_KEY = "rubym.save.v2.sig";
const DEBOUNCE_MS = 600;

type Envelope<T> = { savedAt: number; data: T };

let pending: unknown = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastSerialized: string | null = null;
let initialized = false;

/**
 * Anti-tamper: assinatura local do save. Não é criptografia forte, mas
 * impede edição manual do localStorage (valores de ouro/cristal/nível),
 * porque qualquer alteração invalida a assinatura e o save é descartado
 * — obrigando o cliente a recarregar o estado da nuvem.
 */
const SIG_SALT = "rubym::save::integrity::v1";
function signPayload(serialized: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const s = SIG_SALT + serialized + SIG_SALT;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x01000193) >>> 0;
    h2 = (((h2 + c) * 0x85ebca6b) ^ (h2 >>> 13)) >>> 0;
  }
  return `${h1.toString(36)}.${h2.toString(36)}.${serialized.length.toString(36)}`;
}

function markTampered() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SIG_KEY);
    for (const k of BACKUP_KEYS) localStorage.removeItem(k);
    sessionStorage.setItem("rubym.save.tampered", "1");
  } catch { /* ignore */ }
  try { toast.error("Save local inválido — recarregando dados da nuvem."); } catch { /* ignore */ }
  console.warn("[localSave] integrity check failed — local save discarded");
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}


function rotateBackups(serialized: string) {
  try {
    // shift bak.2 -> bak.3, bak.1 -> bak.2, current -> bak.1
    const b1 = localStorage.getItem(BACKUP_KEYS[0]);
    const b2 = localStorage.getItem(BACKUP_KEYS[1]);
    if (b2) localStorage.setItem(BACKUP_KEYS[2], b2);
    if (b1) localStorage.setItem(BACKUP_KEYS[1], b1);
    const env: Envelope<unknown> = { savedAt: Date.now(), data: JSON.parse(serialized) };
    localStorage.setItem(BACKUP_KEYS[0], JSON.stringify(env));
  } catch { /* ignore */ }
}

/**
 * Reads the latest valid save. Falls back to backups if the primary
 * slot is missing or corrupted (e.g. crash mid-write, quota error).
 * Saves com assinatura inválida são descartados (anti-tamper).
 */
export function loadLatestValid<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    const sig = localStorage.getItem(SIG_KEY);
    if (sig && sig !== signPayload(raw)) {
      markTampered();
      return null;
    }
    const primary = safeParse<T>(raw);
    if (primary) {
      // Save legado sem assinatura → assina agora.
      if (!sig) { try { localStorage.setItem(SIG_KEY, signPayload(raw)); } catch { /* ignore */ } }
      return primary;
    }
  }
  for (const k of BACKUP_KEYS) {
    const env = safeParse<Envelope<T>>(localStorage.getItem(k));
    if (env?.data) {
      console.warn(`[localSave] restored from backup ${k}`);
      writeSigned(JSON.stringify(env.data));
      return env.data;
    }
  }
  return null;
}

/** Verdadeiro se o save local foi detectado como adulterado nesta sessão. */
export function wasSaveTampered(): boolean {
  if (typeof window === "undefined") return false;
  try { return sessionStorage.getItem("rubym.save.tampered") === "1"; } catch { return false; }
}

function writeSigned(serialized: string) {
  try {
    localStorage.setItem(SAVE_KEY, serialized);
    localStorage.setItem(SIG_KEY, signPayload(serialized));
    rotateBackups(serialized);
  } catch (e) {
    console.warn("[localSave] write failed", e);
  }
}

function flush() {
  if (typeof window === "undefined" || pending == null) return;
  try {
    const serialized = JSON.stringify(pending);
    if (serialized === lastSerialized) { pending = null; return; }
    writeSigned(serialized);
    lastSerialized = serialized;
  } catch (e) {
    console.warn("[localSave] flush failed", e);
  } finally {
    pending = null;
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const onFlush = () => { if (timer) { clearTimeout(timer); timer = null; } flush(); };
  window.addEventListener("beforeunload", onFlush);
  window.addEventListener("pagehide", onFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") onFlush();
  });
  // Edição externa do localStorage (outra aba / DevTools) invalida o save.
  window.addEventListener("storage", (e) => {
    if (e.key !== SAVE_KEY && e.key !== SIG_KEY) return;
    const raw = localStorage.getItem(SAVE_KEY);
    const sig = localStorage.getItem(SIG_KEY);
    if (raw && sig && sig !== signPayload(raw)) markTampered();
  });
}

/** Debounced save. Persists ~600ms after the last call. */
export function saveNow(state: unknown) {
  if (typeof window === "undefined") return;
  ensureInit();
  pending = state;
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
}

/** Manual save invoked from a UI button. Bypasses debounce and toasts. */
export function manualSave(state: unknown) {
  if (typeof window === "undefined") return;
  ensureInit();
  pending = state;
  if (timer) { clearTimeout(timer); timer = null; }
  flush();
  try { toast.success("Jogo salvo!"); } catch { /* ignore */ }
}

/** Exports the current save as a JSON string (for future export button). */
export function exportSave(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SAVE_KEY);
}

/** Import manual desativado — impedia injeção de saves editados. */
export function importSave(_json: string): boolean {
  console.warn("[localSave] importSave disabled (anti-cheat)");
  return false;
}
