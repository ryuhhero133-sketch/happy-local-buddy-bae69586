// Full-state cloud save via Supabase (game_saves JSONB blob).
// Fonte de verdade para tudo que não está nas tabelas normalizadas
// (items, missões, skins, party, restingBench, buffs, etc.).
import { supabase } from "@/integrations/supabase/client";

export const SAVE_KEY = "rubym.save.v2";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: unknown = null;
let lastCloudSaveError: string | null = null;

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

async function getAuthedRestHeaders() {
  const { data: sess } = await supabase.auth.getSession();
  const session = sess.session;
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

async function upsert(uid: string, snapshot: unknown) {
  const { headers } = await getAuthedRestHeaders();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ user_id: uid, data: snapshot, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(await parseRestError(response));
}

/** Grava com até 3 tentativas (rede instável não deve custar progresso). */
async function upsertWithRetry(uid: string, snapshot: unknown, attempts = 3) {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      await upsert(uid, snapshot);
      const at = snapshotSavedAt(snapshot);
      if (at > lastKnownSavedAt) lastKnownSavedAt = at;
      return;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Debounced push (1.5s) — usar durante gameplay. */
export function scheduleCloudSync(data: unknown) {
  if (!isFullCloudSave(data)) {
    console.warn("[cloudSave] ignored partial snapshot");
    return;
  }
  if (!canWrite(data)) return;
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
        return;
      }
      if (!canWrite(snapshot)) return;
      await upsertWithRetry(uid, snapshot);
      lastCloudSaveError = null;
    } catch (e) {
      lastCloudSaveError = e instanceof Error ? e.message : String(e);
      console.warn("[cloudSave] sync failed", e);
    }
  }, 1500);
}

/** Push imediato (botão Salvar, level-up, beforeunload, checkpoint 30min). */
export async function pushCloudSaveNow(data: unknown): Promise<boolean> {
  if (!isFullCloudSave(data)) {
    lastCloudSaveError = "snapshot incompleto";
    console.warn("[cloudSave] pushNow ignored partial snapshot");
    return false;
  }
  if (!canWrite(data)) return false;
  try {
    const { uid } = await getAuthedRestHeaders();
    await upsertWithRetry(uid, data);
    lastCloudSaveError = null;
    return true;
  } catch (e) {
    lastCloudSaveError = e instanceof Error ? e.message : String(e);
    console.warn("[cloudSave] pushNow failed", e);
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
      const { headers } = await getAuthedRestHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/game_saves?select=data&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
        { headers },
      );
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
