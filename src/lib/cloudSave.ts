// Full-state cloud save via Supabase (game_saves JSONB blob).
// Fonte de verdade para tudo que não está nas tabelas normalizadas
// (items, missões, skins, party, restingBench, buffs, etc.).
import { supabase } from "@/integrations/supabase/client";

export const SAVE_KEY = "rubym.save.v2";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: unknown = null;
let lastCloudSaveError: string | null = null;

export function getCloudSaveLastError() {
  return lastCloudSaveError;
}

function isFullCloudSave(data: unknown): data is { idle: unknown; team: unknown; restingBench: unknown } {
  if (!data || typeof data !== "object") return false;
  const value = data as { idle?: unknown; team?: unknown; restingBench?: unknown };
  return Boolean(value.idle && Array.isArray(value.team) && Array.isArray(value.restingBench));
}

async function upsert(uid: string, snapshot: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("game_saves")
    .upsert({ user_id: uid, data: snapshot, updated_at: new Date().toISOString() });
  if (error) throw error;
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
      if (!uid || !snapshot) return;
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
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) {
      lastCloudSaveError = "sem sessão/login ativo";
      return false;
    }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("game_saves")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[cloudSave] fetch failed", error);
    return null;
  }
  return data?.data ?? null;
}

export async function deleteCloudSave(userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("game_saves").delete().eq("user_id", userId);
}
