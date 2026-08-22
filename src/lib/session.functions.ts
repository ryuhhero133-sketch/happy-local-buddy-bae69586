import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const updateActiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    await supabase.from("active_sessions").upsert(
      { user_id: userId, session_token: data.token, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    return { ok: true };
  });

export const getActiveSessionToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    const { data } = await supabase
      .from("active_sessions")
      .select("session_token")
      .eq("user_id", userId)
      .maybeSingle();

    return { token: data?.session_token ?? null };
  });
