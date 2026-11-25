import { supabase } from "@/integrations/supabase/client";
import { adoptAuthoritativeCheckpoint } from "@/lib/saveManager";

export type WelcomePotionGrant = {
  ok: boolean;
  reason?: string;
  granted?: number;
  potions?: number;
  snapshot?: unknown;
  server_version?: number;
};

/** Concede 200 Poções uma única vez por conta. Seguro para chamar em todo login. */
export async function claimWelcomePotions(userId: string): Promise<WelcomePotionGrant> {
  const { data, error } = await (supabase as any).rpc("claim_welcome_potions");
  if (error) return { ok: false, reason: error.message || "network" };
  const result = data as WelcomePotionGrant | null;
  if (!result || typeof result !== "object") return { ok: false, reason: "invalid_response" };
  if (result.ok && result.snapshot && typeof result.server_version === "number") {
    await adoptAuthoritativeCheckpoint(userId, result.snapshot, result.server_version, "before-welcome-potions");
  }
  return result;
}
