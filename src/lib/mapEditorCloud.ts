import { supabase } from "@/integrations/supabase/client";

export type MapEditorCloudPayload = {
  objects?: Record<string, unknown[]>;
  spawns?: Record<string, unknown[]>;
  teleports?: Record<string, unknown[]>;
};

/** Lê a edição de mapas salva na conta (vale em qualquer navegador). */
export async function loadMapEditorCloud(userId: string): Promise<MapEditorCloudPayload | null> {
  const { data, error } = await supabase
    .from("map_editor_saves")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.data) return null;
  const payload = data.data as MapEditorCloudPayload;
  const temAlgo = Object.keys(payload.objects ?? {}).length + Object.keys(payload.spawns ?? {}).length + Object.keys(payload.teleports ?? {}).length > 0;
  return temAlgo ? payload : null;
}

/** Salva (upsert) a edição de mapas na conta. */
export async function saveMapEditorCloud(userId: string, payload: MapEditorCloudPayload): Promise<void> {
  await supabase
    .from("map_editor_saves")
    .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}
