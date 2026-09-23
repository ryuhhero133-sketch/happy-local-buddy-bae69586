import { supabase } from "@/integrations/supabase/client";

export async function serverHatchEgg(p_egg: string, p_element: string, p_action_id: string) {
  try {
    const { data, error } = await supabase.rpc("hatch_egg", { p_egg, p_element, p_action_id });
    if (error) return { ok: false, error: error.message };
    return { ok: true, pet: (data as any)?.pet ?? null };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
