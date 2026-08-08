import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminUpdateSchema = z.object({
  targetUserId: z.string(),
  level: z.number(),
  xp: z.number(),
  snapshot: z.any(),
  username: z.string(),
  craftPoints: z.number(),
  guildName: z.string().nullable(),
});

export const updatePlayerStatsAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => adminUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const lockUntil = new Date(Date.now() + 20000).toISOString();

    const results = await Promise.all([
      (supabaseAdmin.from("game_saves") as any).upsert({
        user_id: data.targetUserId,
        data: data.snapshot,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" }),
      (supabaseAdmin.from("trainer_state") as any).upsert({
        user_id: data.targetUserId,
        trainer_level: data.level,
        trainer_xp: data.xp,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" }),
      (supabaseAdmin.from("ranked_scores") as any).upsert({
        user_id: data.targetUserId,
        username: data.username,
        trainer_level: data.level,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" }),
      (supabaseAdmin.from("profiles") as any).update({
        trainer_level: data.level,
        updated_at: new Date().toISOString(),
        lock_until: lockUntil,
        account_status: 'active'
      }).eq("id", data.targetUserId)
    ]);

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      throw new Error(`Admin update failed: ${errors[0].error?.message}`);
    }

    return { success: true };
  });
