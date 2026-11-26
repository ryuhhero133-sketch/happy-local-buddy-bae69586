import { supabase } from "@/integrations/supabase/client";

export type MapEditorCloudPayload = {
  objects?: Record<string, unknown[]>;
  spawns?: Record<string, unknown[]>;
  teleports?: Record<string, unknown[]>;
  bots?: Record<string, unknown[]>;
};

const PUBLISHED_CACHE_KEY = "rubym.published-maps.v1";

/** Última publicação válida guardada no navegador (abre o mapa sem esperar rede). */
export function readCachedPublishedMapEditor(): MapEditorCloudPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PUBLISHED_CACHE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as MapEditorCloudPayload;
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

/** Publicação global feita pelo dono. Cai no cache local se a rede falhar. */
export async function loadPublishedMapEditor(): Promise<MapEditorCloudPayload | null> {
  try {
    const { data, error } = await (supabase as any).rpc("map_editor_published_data");
    if (error || !data || typeof data !== "object") return readCachedPublishedMapEditor();
    const payload = data as MapEditorCloudPayload;
    try { localStorage.setItem(PUBLISHED_CACHE_KEY, JSON.stringify(payload)); } catch { /* storage indisponível */ }
    return payload;
  } catch {
    return readCachedPublishedMapEditor();
  }
}

/** Lê a edição de mapas salva na conta (vale em qualquer navegador). */
export async function loadMapEditorCloud(userId: string): Promise<MapEditorCloudPayload | null> {
  const { data, error } = await supabase
    .from("map_editor_saves")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.data) return null;
  const payload = data.data as MapEditorCloudPayload;
  const temAlgo = Object.keys(payload.objects ?? {}).length + Object.keys(payload.spawns ?? {}).length + Object.keys(payload.teleports ?? {}).length + Object.keys(payload.bots ?? {}).length > 0;
  return temAlgo ? payload : null;
}

/** Salva (upsert) a edição de mapas na conta. */
export async function saveMapEditorCloud(userId: string, payload: MapEditorCloudPayload): Promise<void> {
  await supabase
    .from("map_editor_saves")
    .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}
