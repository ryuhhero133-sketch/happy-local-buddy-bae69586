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

/** Tetos absolutos (espelham os caps do trigger no banco). */
const CAPS = {
  trainerLevel: 10000,
  pokemonLevel: 10000,
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

/**
 * Sanitiza o snapshot antes de subir: mesmo que alguém edite o estado no
 * front (DevTools/localStorage), os valores enviados ao banco ficam dentro
 * dos tetos. O trigger no Postgres é a última linha de defesa.
 */
function sanitizeSnapshot(snapshot: unknown): unknown {
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
      if (v !== null) s[key] = v; else delete s[key];
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

async function upsert(uid: string, snapshot: unknown) {
  const { headers } = await getAuthedRestHeaders();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ user_id: uid, data: sanitizeSnapshot(snapshot), updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(await parseRestError(response));
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
