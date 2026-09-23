// Full-state cloud save via SaveManager (checkpoints versionados no Supabase).
// Fonte de verdade para tudo que não está nas tabelas normalizadas
// (items, missões, skins, party, restingBench, buffs, etc.).
// Mesmas assinaturas de antes — o jogo não muda; só o motor por baixo.
import {
  markDirty,
  flushNow,
  fetchServer,
  deleteServerSave,
  getLastError,
  sanitizeSnapshot,
} from "@/lib/saveManager";

export const SAVE_KEY = "rubym.save.v2";

export function getCloudSaveLastError() {
  return getLastError();
}

function isFullCloudSave(data: unknown): data is { idle: unknown; team: unknown; restingBench: unknown } {
  if (!data || typeof data !== "object") return false;
  const value = data as { idle?: unknown; team?: unknown; restingBench?: unknown };
  return Boolean(value.idle && Array.isArray(value.team) && Array.isArray(value.restingBench));
}

/** Debounced push (via SaveManager, ~6s) — usar durante gameplay. */
export function scheduleCloudSync(data: unknown) {
  if (!isFullCloudSave(data)) {
    console.warn("[cloudSave] ignored partial snapshot");
    return;
  }
  markDirty(sanitizeSnapshot(data));
}

/** Push imediato (botão Salvar, level-up, beforeunload). */
export async function pushCloudSaveNow(data: unknown): Promise<boolean> {
  if (!isFullCloudSave(data)) {
    console.warn("[cloudSave] pushNow ignored partial snapshot");
    return false;
  }
  return flushNow(sanitizeSnapshot(data));
}

export async function fetchCloudSave(userId: string): Promise<unknown | null> {
  try {
    const res = await fetchServer(userId);
    return res?.snapshot ?? null;
  } catch (e) {
    console.warn("[cloudSave] fetch failed", e);
    return null;
  }
}

export async function deleteCloudSave(_userId: string): Promise<void> {
  await deleteServerSave();
}

export { sanitizeSnapshot };
