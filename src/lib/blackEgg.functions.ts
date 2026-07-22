// Server functions para persistir o progresso do Black Mitic Plus Egg.
// Cada jogador tem UMA linha em public.black_egg_saves com o snapshot JSON
// completo do estado do painel (ovos, afinidades, diário, incubação).
//
// Rode o SQL em SUPABASE_BLACK_EGG_SAVE.sql antes de usar.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type BlackEggCloudPayload = {
  data: Record<string, any> | null;
  updated_at: string | null;
};

export const getBlackEggSave = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BlackEggCloudPayload> => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const { data, error } = await supabase
      .from("black_egg_saves")
      .select("data, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { data: data?.data ?? null, updated_at: data?.updated_at ?? null };
  });

const SaveSchema = z.object({
  data: z.record(z.string(), z.any()),
});

export const saveBlackEggSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true; updated_at: string }> => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const updated_at = new Date().toISOString();
    const { error } = await supabase
      .from("black_egg_saves")
      .upsert(
        { user_id: userId, data: data.data ?? {}, updated_at },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, updated_at };
  });
