// Full-state cloud save via Supabase (game_saves JSONB blob).
// Fonte de verdade para tudo que não está nas tabelas normalizadas
// (items, missões, skins, party, restingBench, buffs, etc.).
import { supabase } from "@/integrations/supabase/client";

export const SAVE_KEY = "rubym.save.v2";
const CLOUD_PENDING_KEY = "rubym.cloud.pending.v1";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: unknown = null;
let lastCloudSaveError: string | null = null;
let retryDelayMs = 5000;

// ===== Guarda de versão =====
// Guarda o savedAt do último snapshot conhecido (lido da nuvem ou escrito por nós).
// Qualquer tentativa de gravar um snapshot MAIS ANTIGO que esse é rejeitada —
// impede que uma aba velha / outro dispositivo sobrescreva progresso novo.
let lastKnownSavedAt = 0;
let saveLockedReason: string | null = null;

function snapshotSavedAt(data: unknown): number {
  const v = (data as { savedAt?: unknown } | null)?.savedAt;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

type PendingCloudEnvelope = {
  queuedAt: number;
  snapshotSavedAt: number;
  snapshot: unknown;
};

function readPendingEnvelope(): PendingCloudEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLOUD_PENDING_KEY);
    if (!raw) return null;
    const env = JSON.parse(raw) as PendingCloudEnvelope;
    if (!env || !isFullCloudSave(env.snapshot)) return null;
    return env;
  } catch {
    return null;
  }
}

function writePendingSnapshot(snapshot: unknown) {
  if (typeof window === "undefined" || !isFullCloudSave(snapshot)) return;
  try {
    const env: PendingCloudEnvelope = {
      queuedAt: Date.now(),
      snapshotSavedAt: snapshotSavedAt(snapshot),
      snapshot,
    };
    window.localStorage.setItem(CLOUD_PENDING_KEY, JSON.stringify(env));
  } catch (e) {
    console.warn("[cloudSave] pending queue write failed", e);
  }
}

function clearPendingSnapshot(savedAt: number) {
  if (typeof window === "undefined") return;
  try {
    const env = readPendingEnvelope();
    if (!env || env.snapshotSavedAt <= savedAt) window.localStorage.removeItem(CLOUD_PENDING_KEY);
  } catch { /* ignore */ }
}

export function getPendingCloudSaveInfo() {
  const env = readPendingEnvelope();
  if (!env) return null;
  return { queuedAt: env.queuedAt, snapshotSavedAt: env.snapshotSavedAt };
}

/** Registra o savedAt vindo da nuvem na hidratação inicial. */
export function noteRemoteSavedAt(at: number) {
  if (Number.isFinite(at) && at > lastKnownSavedAt) lastKnownSavedAt = at;
}

/**
 * Bloqueia/desbloqueia toda gravação na nuvem. Usado quando a leitura inicial
 * falha: sem saber o estado remoto, gravar significaria apagar progresso.
 */
export function setCloudSaveLock(reason: string | null) {
  saveLockedReason = reason;
}
export function isCloudSaveLocked() {
  return saveLockedReason;
}

function canWrite(data: unknown): boolean {
  if (saveLockedReason) {
    lastCloudSaveError = `gravação bloqueada: ${saveLockedReason}`;
    return false;
  }
  const at = snapshotSavedAt(data);
  if (at && lastKnownSavedAt && at < lastKnownSavedAt) {
    lastCloudSaveError = "snapshot antigo ignorado (proteção de progresso)";
    console.warn("[cloudSave] stale snapshot rejected", { at, lastKnownSavedAt });
    return false;
  }
  return true;
}

export function getCloudSaveLastError() {
  return lastCloudSaveError;
}

function isFullCloudSave(data: unknown): data is { idle: unknown; team: unknown; restingBench: unknown } {
  if (!data || typeof data !== "object") return false;
  const value = data as { idle?: unknown; team?: unknown; restingBench?: unknown };
  return Boolean(value.idle && Array.isArray(value.team) && Array.isArray(value.restingBench));
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}: tempo esgotado`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function getAuthedRestHeaders(forceRefresh = false) {
  let session = (await withTimeout(supabase.auth.getSession(), 8000, "sessão")).data.session;

  // Token expirado/quase expirando é a causa nº1 de "não salvou" em sessões
  // longas: o PostgREST devolve 401 e o save era descartado. Renovamos antes.
  const expSoon = session?.expires_at ? session.expires_at * 1000 - Date.now() < 60_000 : false;
  if (forceRefresh || !session || expSoon) {
    try {
      const refreshed = await withTimeout(supabase.auth.refreshSession(), 8000, "renovar sessão");
      if (refreshed.data.session) session = refreshed.data.session;
    } catch (e) {
      console.warn("[cloudSave] refreshSession falhou", e);
    }
  }

  if (!session?.user?.id || !session.access_token) {
    throw new Error("sem sessão/login ativo");
  }
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase não configurado no app publicado");
  }
  return {
    uid: session.user.id,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  };
}

async function parseRestError(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const json = JSON.parse(text) as { message?: string; hint?: string; details?: string; code?: string };
    return [json.message, json.hint, json.details, json.code].filter(Boolean).join(" · ");
  } catch {
    return text || `HTTP ${response.status}`;
  }
}

// ===== Diagnóstico =====
// Guarda a causa real da última falha para conseguirmos distinguir
// sessão (401), permissão/RLS (403/42501), trigger do banco (400/500),
// rede/timeout e quota de localStorage.
export type CloudSaveDiagnostics = {
  at: number;
  stage: "write" | "read";
  status: number | null;
  category: "sessao" | "permissao" | "banco" | "rede" | "config" | "local" | "desconhecido";
  message: string;
};
let lastDiagnostics: CloudSaveDiagnostics | null = null;

export function getCloudSaveDiagnostics() {
  return lastDiagnostics;
}

function classify(status: number | null, message: string): CloudSaveDiagnostics["category"] {
  const m = message.toLowerCase();
  if (status === 401 || m.includes("sem sessão") || m.includes("jwt")) return "sessao";
  if (status === 403 || m.includes("row-level security") || m.includes("42501") || m.includes("permission denied")) return "permissao";
  if (status === 400 || status === 409 || (status !== null && status >= 500)) return "banco";
  if (m.includes("tempo esgotado") || m.includes("timeout") || m.includes("failed to fetch") || m.includes("abort") || m.includes("network")) return "rede";
  if (m.includes("não configurado")) return "config";
  if (m.includes("quota") || m.includes("exceeded")) return "local";
  return "desconhecido";
}

function noteDiagnostics(stage: CloudSaveDiagnostics["stage"], status: number | null, message: string) {
  lastDiagnostics = { at: Date.now(), stage, status, category: classify(status, message), message };
  lastCloudSaveError = message;
  console.warn(`[cloudSave] ${stage} falhou (${lastDiagnostics.category})`, { status, message });
}

async function upsertOnce(snapshot: unknown, forceRefresh: boolean) {
  const { uid, headers } = await getAuthedRestHeaders(forceRefresh);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ user_id: uid, data: snapshot, updated_at: new Date().toISOString() }),
    signal: AbortSignal.timeout(15000),
  });
  return response;
}

/**
 * Caminho alternativo pelo próprio supabase-js. Ele monta headers/refresh
 * sozinho, então cobre casos em que o fetch cru falha (apikey, CORS, token).
 */
async function upsertViaClient(uid: string, snapshot: unknown) {
  const { error } = await supabase
    .from("game_saves")
    .upsert({ user_id: uid, data: snapshot as never, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error([error.message, error.hint, error.details, error.code].filter(Boolean).join(" · "));
}

async function upsert(uid: string, snapshot: unknown) {
  let response = await upsertOnce(snapshot, false);
  // 401/403 => token vencido ou trocado: renova e tenta uma vez mais.
  if (response.status === 401 || response.status === 403) {
    response = await upsertOnce(snapshot, true);
  }
  if (!response.ok) {
    const message = await parseRestError(response);
    noteDiagnostics("write", response.status, message);
    // Última cartada: gravar pelo cliente oficial antes de desistir.
    try {
      await upsertViaClient(uid, snapshot);
      lastCloudSaveError = null;
      return;
    } catch (fallbackError) {
      const fbMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      noteDiagnostics("write", response.status, `${message} | fallback: ${fbMessage}`);
      throw new Error(message);
    }
  }
  lastDiagnostics = null;
}



/** Grava com até 3 tentativas (rede instável não deve custar progresso). */
async function upsertWithRetry(uid: string, snapshot: unknown, attempts = 3) {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      await upsert(uid, snapshot);
      const at = snapshotSavedAt(snapshot);
      if (at > lastKnownSavedAt) lastKnownSavedAt = at;
      clearPendingSnapshot(at || Date.now());
      retryDelayMs = 5000;
      return;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function schedulePendingRetry() {
  if (typeof window === "undefined") return;
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void attemptPendingCloudSave();
  }, retryDelayMs);
  retryDelayMs = Math.min(120000, Math.floor(retryDelayMs * 1.6));
}

function ensureRetryListeners() {
  if (typeof window === "undefined") return;
  const w = window as typeof window & { __rubymCloudRetryListeners?: boolean };
  if (w.__rubymCloudRetryListeners) return;
  w.__rubymCloudRetryListeners = true;
  window.addEventListener("online", () => void attemptPendingCloudSave());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void attemptPendingCloudSave();
  });
}

export async function attemptPendingCloudSave(): Promise<boolean> {
  ensureRetryListeners();
  const env = readPendingEnvelope();
  if (!env) return true;
  if (saveLockedReason) {
    lastCloudSaveError = `save aguardando nuvem: ${saveLockedReason}`;
    schedulePendingRetry();
    return false;
  }
  const snapshot = env.snapshot;
  const at = snapshotSavedAt(snapshot);
  if (at && lastKnownSavedAt && at < lastKnownSavedAt) {
    lastCloudSaveError = "snapshot antigo ignorado (proteção de progresso)";
    clearPendingSnapshot(at);
    return true;
  }
  try {
    const { uid } = await getAuthedRestHeaders();
    await upsertWithRetry(uid, snapshot, 2);
    lastCloudSaveError = null;
    return true;
  } catch (e) {
    lastCloudSaveError = e instanceof Error ? e.message : String(e);
    console.warn("[cloudSave] pending retry failed", e);
    schedulePendingRetry();
    return false;
  }
}

/** Debounced push (1.5s) — usar durante gameplay. */
export function scheduleCloudSync(data: unknown) {
  ensureRetryListeners();
  if (!isFullCloudSave(data)) {
    console.warn("[cloudSave] ignored partial snapshot");
    return;
  }
  // Primeiro guarda localmente em uma fila durável. Se a rede/banco falhar,
  // o snapshot continua no navegador e será reenviado automaticamente.
  writePendingSnapshot(data);
  if (!canWrite(data)) {
    schedulePendingRetry();
    return;
  }
  pendingData = data;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    syncTimer = null;
    const snapshot = pendingData;
    pendingData = null;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid || !snapshot) {
        lastCloudSaveError = "sem sessão/login ativo";
        schedulePendingRetry();
        return;
      }
      if (!canWrite(snapshot)) {
        schedulePendingRetry();
        return;
      }
      await upsertWithRetry(uid, snapshot);
      lastCloudSaveError = null;
      void attemptPendingCloudSave();
    } catch (e) {
      lastCloudSaveError = e instanceof Error ? e.message : String(e);
      console.warn("[cloudSave] sync failed", e);
      schedulePendingRetry();
    }
  }, 1500);
}

/** Push imediato (botão Salvar, level-up, beforeunload, checkpoint 30min). */
export async function pushCloudSaveNow(data: unknown): Promise<boolean> {
  ensureRetryListeners();
  if (!isFullCloudSave(data)) {
    lastCloudSaveError = "snapshot incompleto";
    console.warn("[cloudSave] pushNow ignored partial snapshot");
    return false;
  }
  writePendingSnapshot(data);
  if (!canWrite(data)) {
    schedulePendingRetry();
    return false;
  }
  try {
    const { uid } = await getAuthedRestHeaders();
    await upsertWithRetry(uid, data);
    lastCloudSaveError = null;
    void attemptPendingCloudSave();
    return true;
  } catch (e) {
    lastCloudSaveError = e instanceof Error ? e.message : String(e);
    console.warn("[cloudSave] pushNow failed", e);
    schedulePendingRetry();
    return false;
  }
}

export type CloudFetchResult =
  | { status: "ok"; data: unknown }
  | { status: "empty" }
  | { status: "error"; message: string };

/**
 * Leitura da nuvem que DISTINGUE "conta nova (vazio)" de "falha de leitura".
 * Essencial: em caso de erro o jogo NÃO pode gravar, senão apaga o save bom.
 */
export async function fetchCloudSaveResult(userId: string, attempts = 3): Promise<CloudFetchResult> {
  let lastMessage = "falha de leitura";
  for (let i = 0; i < attempts; i++) {
    try {
      const { headers } = await getAuthedRestHeaders(i > 0);
      let response = await fetch(
        `${SUPABASE_URL}/rest/v1/game_saves?select=data&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
        { headers, signal: AbortSignal.timeout(12000) },
      );
      if (response.status === 401 || response.status === 403) {
        const retryAuth = await getAuthedRestHeaders(true);
        response = await fetch(
          `${SUPABASE_URL}/rest/v1/game_saves?select=data&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
          { headers: retryAuth.headers, signal: AbortSignal.timeout(12000) },
        );
      }
      if (!response.ok) throw new Error(await parseRestError(response));

      const rows = (await response.json()) as Array<{ data?: unknown }>;
      lastCloudSaveError = null;
      const data = rows[0]?.data ?? null;
      if (!data) return { status: "empty" };
      noteRemoteSavedAt(snapshotSavedAt(data));
      return { status: "ok", data };
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : String(e);
      lastCloudSaveError = lastMessage;
      console.warn("[cloudSave] fetch failed", e);
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  return { status: "error", message: lastMessage };
}

export async function fetchCloudSave(userId: string): Promise<unknown | null> {
  const r = await fetchCloudSaveResult(userId);
  return r.status === "ok" ? r.data : null;
}

export async function deleteCloudSave(userId: string): Promise<void> {
  const { headers } = await getAuthedRestHeaders();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?user_id=eq.${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
  });
  if (!response.ok) throw new Error(await parseRestError(response));
}
