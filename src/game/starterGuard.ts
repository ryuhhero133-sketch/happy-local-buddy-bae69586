/** A party vazia não significa conta nova: o líder pode estar derrotado ou
 * descansando. Nunca semear um segundo inicial quando já há progresso. */
export function hasStarterProgress(snapshot: unknown): boolean {
  if (!snapshot || typeof snapshot !== "object") return false;
  const blob = snapshot as {
    team?: unknown; party?: unknown; activeTeam?: unknown; restingBench?: unknown;
    idle?: { collection?: unknown; pvpFaintedLeader?: unknown; trainerLevel?: number; totals?: { captured?: number } };
  };
  return [blob.team, blob.party, blob.activeTeam, blob.restingBench, blob.idle?.collection]
    .some((list) => Array.isArray(list) && list.length > 0)
    || !!blob.idle?.pvpFaintedLeader
    || (blob.idle?.trainerLevel ?? 1) > 1
    || (blob.idle?.totals?.captured ?? 0) > 0;
}
