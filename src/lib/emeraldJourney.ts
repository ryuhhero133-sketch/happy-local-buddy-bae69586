import { supabase } from "@/integrations/supabase/client";
import { adoptJourneyCheckpoint, claimSnapshotOwner } from "@/lib/saveManager";
import { loadLatestValid, restoreLocalSave } from "@/lib/localSave";
import { pushCloudSaveNow } from "@/lib/cloudSave";
import { JOURNEY_ARRIVAL, JOURNEY_DESTINATION, JOURNEY_LINES, JOURNEY_VERSION } from "@/game/journey";
import { clearBattleScene } from "@/lib/battleScenePersist";

export type JourneyStatus = {
  required: boolean; preview: boolean; version?: string; cursor?: number; page_count?: number;
  completed_at?: string | null; reset_applied_at?: string | null;
  has_save?: boolean;
};
type Snapshot = { idle: Record<string, unknown>; team: unknown[]; restingBench: unknown[]; savedAt?: number };
export type JourneyAdvance = {
  completed: boolean; cursor: number; preview: boolean; snapshot?: Snapshot; server_version?: number;
};
export async function journeyStatus(restartPreview = false): Promise<JourneyStatus> {
  const { data, error } = await (supabase as any).rpc("emerald_journey_status", { p_restart_preview: restartPreview });
  if (error) throw error;
  const status = data as JourneyStatus;
  if (!status || typeof status.required !== "boolean") throw new Error("Não foi possível confirmar sua jornada.");
  if (status.required && (status.page_count !== JOURNEY_LINES.length || !status.version)) {
    throw new Error("A abertura está sendo atualizada. Recarregue em instantes.");
  }
  return status;
}
export async function advanceJourney(version: string, cursor: number): Promise<JourneyAdvance> {
  const { data, error } = await (supabase as any).rpc("emerald_journey_advance",
    { p_version: version, p_expected_cursor: cursor });
  if (error) throw error;
  if (!data || typeof data.completed !== "boolean" || !Number.isInteger(data.cursor)) {
    throw new Error("Não consegui confirmar esta fala. Tente novamente.");
  }
  return data;
}

/** Antes do recomeço, sobe a cópia local mais recente escolhida pelo AuthGate.
 * Se não confirmar o save, a introdução não arrisca usar uma base antiga. */
export async function preserveLatestJourneySource(userId: string, force = false) {
  if (!force && localStorage.getItem("rubym.cloud.local_newer.v1") !== userId) return;
  // Durante a abertura o jogo/monitor de save ainda não montou: reivindica a
  // posse do snapshot só após confirmar que a sessão realmente é esta conta.
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.id !== userId) throw new Error("Sua sessão mudou. Entre novamente para continuar.");
  let idle: Record<string, unknown> | null = null;
  try { idle = JSON.parse(localStorage.getItem("rubym.idle.v1") ?? "null"); } catch { idle = null; }
  const local = loadLatestValid<{ activeTeam?: unknown[]; party?: unknown[]; restingBench?: unknown[] }>();
  if (!idle && !local) throw new Error("Aguardando sincronizar seu progresso antes da abertura.");
  if (!idle) {
    // Conta antiga sem blob local: cria a base mínima do jogo para o reset ter
    // onde gravar. Só acontece quando o servidor também não tem save.
    const { freshIdle } = await import("@/routes/idle");
    idle = freshIdle() as unknown as Record<string, unknown>;
  }
  claimSnapshotOwner(userId);
  const team = local?.activeTeam ?? local?.party?.slice(0, 5) ?? [];
  const restingBench = local?.restingBench ?? [];
  if (!await pushCloudSaveNow({ idle, team, restingBench, savedAt: Date.now() })) {
    throw new Error("Não foi possível salvar seu progresso anterior. Reconecte e tente novamente.");
  }
  localStorage.removeItem("rubym.cloud.local_newer.v1");
}

export async function hydrateJourneyArrival(userId: string, response?: JourneyAdvance) {
  let snapshot = response?.snapshot, version = response?.server_version;
  if (!snapshot || version == null) {
    const { data, error } = await (supabase as any).rpc("checkpoint_fetch");
    if (error || !data?.ok || !data?.exists) throw new Error("Reconecte para confirmar sua chegada em Emerald.");
    snapshot = data.data; version = data.server_version;
  }
  if (!snapshot?.idle || !Array.isArray(snapshot.team) || !Array.isArray(snapshot.restingBench) || version == null) {
    throw new Error("O servidor ainda está preparando seu progresso. Tente novamente.");
  }
  await adoptJourneyCheckpoint(userId, snapshot, version);
  localStorage.setItem("rubym.idle.v1", JSON.stringify(snapshot.idle));
  restoreLocalSave({ party: [...snapshot.team, ...snapshot.restingBench],
    activeTeam: snapshot.team, restingBench: snapshot.restingBench });
  localStorage.setItem("rubym.cloud.preloaded.v1", userId);
  localStorage.removeItem("rubym.cloud.local_newer.v1");
  localStorage.setItem("rubym.trainer-position.v1", JSON.stringify({
    map: JOURNEY_DESTINATION, ...JOURNEY_ARRIVAL, savedAt: Date.now(),
  }));
  clearBattleScene();
}
export function hasJourneyResetLocally(): boolean {
  try { return JSON.parse(localStorage.getItem("rubym.idle.v1") ?? "{}").journey?.version === JOURNEY_VERSION; }
  catch { return false; }
}
