import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const updateActiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;

    // Check if there's already a different session for this user
    const { data: existing } = await supabase
      .from("active_sessions")
      .select("session_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing && existing.session_token !== data.token) {
      // Another session already exists - reject this new one
      return { ok: false, error: "SESSION_TAKEN", message: "Esta conta já está logada em outro local." };
    }

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

export const clearActiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    await supabase.from("active_sessions").delete().eq("user_id", userId);
    return { ok: true };
  });
