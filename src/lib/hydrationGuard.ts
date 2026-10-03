// Guarda anti-apagamento na hidratação — puro e testável (zero imports).
//
// Causa: getFullGameState() convertia erro de leitura em DTO zerado
// (gold=0, arrays vazios) e onHydrate() aplicava como verdade,
// zerando o banco local. Leitura que falha NUNCA pode virar estado válido.
export type ServerDtoSummary = {
  gold: number;
  crystals: number;
  trainerLevel: number;
  trainerXp: number;
  kills: number;
  teamSize: number;
  collectionSize: number;
};

export function isEmptyServerDto(d: ServerDtoSummary): boolean {
  return (
    (d.gold ?? 0) <= 0 &&
    (d.crystals ?? 0) <= 0 &&
    (d.trainerLevel ?? 1) <= 1 &&
    (d.trainerXp ?? 0) <= 0 &&
    (d.kills ?? 0) <= 0 &&
    (d.teamSize ?? 0) <= 0 &&
    (d.collectionSize ?? 0) <= 0
  );
}

export type LocalProgressSummary = {
  gold: number;
  level: number;
  xp: number;
  kills: number;
  captured: number;
  collectionSize: number;
  teamMaxLevel: number;
};

export function localHasProgress(l: LocalProgressSummary): boolean {
  if ((l.gold ?? 0) > 0) return true;
  if ((l.level ?? 1) > 1) return true;
  if ((l.xp ?? 0) > 0) return true;
  if ((l.kills ?? 0) > 0) return true;
  if ((l.captured ?? 0) > 0) return true;
  if ((l.collectionSize ?? 0) > 0) return true;
  if ((l.teamMaxLevel ?? 1) > 1) return true;
  return false;
}

/**
 * Deve aplicar o snapshot do servidor? NÃO quando ele está vazio e o
 * local tem progresso — aí o vazio é falha de leitura, não verdade.
 */
export function shouldApplyServerSnapshot(
  serverEmpty: boolean,
  localProgress: boolean,
): boolean {
  if (serverEmpty && localProgress) return false;
  return true;
}
