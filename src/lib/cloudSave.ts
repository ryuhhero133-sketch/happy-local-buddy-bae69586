// Full-state cloud save via Supabase (game_saves JSONB blob).
// Fonte de verdade para tudo que não está nas tabelas normalizadas
// (items, missões, skins, party, restingBench, buffs, etc.).
import { supabase } from "@/integrations/supabase/client";
import { securePushSave } from "./game.functions";

export const SAVE_KEY = "rubym.save.v2";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: unknown = null;
let lastCloudSaveError: string | null = null;

/**
 * Trava de segurança contra perda de progresso:
 * se o carregamento do save da nuvem falhar, NENHUM push é permitido —
 * assim um estado vazio/default nunca sobrescreve o save correto.
 */
let saveWritesBlocked = false;
let blockReason: string | null = null;

export function blockCloudSaveWrites(reason: string) {
  saveWritesBlocked = true;
  blockReason = reason;
  console.warn("[cloudSave] escrita bloqueada:", reason);
}

export function allowCloudSaveWrites() {
  saveWritesBlocked = false;
  blockReason = null;
}

export function isCloudSaveBlocked() {
  return saveWritesBlocked ? (blockReason ?? "bloqueado") : null;
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

async function upsert(_uid: string, snapshot: any) {
  if (saveWritesBlocked) {
    throw new Error(`save bloqueado (${blockReason ?? "carregamento falhou"})`);
  }
  const res = await securePushSave({ data: snapshot });
  if (!res.ok) throw new Error((res as any).reason || "Erro desconhecido no servidor");
}


/** Debounced push (1.5s) — usar durante gameplay. */
export function scheduleCloudSync(data: unknown) {
  if (!isFullCloudSave(data)) {
    console.warn("[cloudSave] ignored partial snapshot");
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
        return;
      }
      await upsert(uid, snapshot);
      lastCloudSaveError = null;
    } catch (e) {
      lastCloudSaveError = e instanceof Error ? e.message : String(e);
      console.warn("[cloudSave] sync failed", e);
    }
  }, 1500);
}

/** Push imediato (botão Salvar, level-up, beforeunload). */
export async function pushCloudSaveNow(data: unknown): Promise<boolean> {
  if (!isFullCloudSave(data)) {
    lastCloudSaveError = "snapshot incompleto";
    console.warn("[cloudSave] pushNow ignored partial snapshot");
    return false;
  }
  try {
    const { uid } = await getAuthedRestHeaders();
    await upsert(uid, data);
    lastCloudSaveError = null;
    return true;
  } catch (e) {
    lastCloudSaveError = e instanceof Error ? e.message : String(e);
    console.warn("[cloudSave] pushNow failed", e);
    return false;
  }
}

export async function fetchCloudSave(userId: string): Promise<unknown | null> {
  try {
    const { headers } = await getAuthedRestHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/game_saves?select=data&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      { headers },
    );
    if (!response.ok) throw new Error(await parseRestError(response));
    const rows = (await response.json()) as Array<{ data?: unknown }>;
    lastCloudSaveError = null;
    return rows[0]?.data ?? null;
  } catch (e) {
    lastCloudSaveError = e instanceof Error ? e.message : String(e);
    console.warn("[cloudSave] fetch failed", e);
    return null;
  }
}

export async function deleteCloudSave(userId: string): Promise<void> {
  const { headers } = await getAuthedRestHeaders();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?user_id=eq.${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
  });
  if (!response.ok) throw new Error(await parseRestError(response));
}
