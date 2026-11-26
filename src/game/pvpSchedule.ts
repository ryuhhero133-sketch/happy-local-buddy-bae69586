/**
 * Agenda global de PvP: a cada hora, os 10 primeiros minutos são PvP e os
 * 50 minutos restantes são Paz, no horário de São Paulo. O banco repete esta
 * mesma regra em public.pvp_attack.
 */
export const PVP_SCHEDULE_TIME_ZONE = "America/Sao_Paulo";
export const PVP_WINDOW_MINUTES = 10;
export const PVP_WINDOW_MS = PVP_WINDOW_MINUTES * 60_000;

/**
 * Os 8 mapas de caça que possuem Pokémon (espelho de GRASS_ZONE_BY_MAP em
 * src/game/grassZones.ts). PvP não abre nos demais mapas.
 */
export const PVP_SCHEDULE_MAP_IDS = [
  "rota1",
  "bobo_rota2",
  "bobo_uuid",
  "bobo_transicao",
  "bobo_g11ds",
  "bobo_rota_gelo",
  "bobo_transicao_gelo",
  "bobo_mmmm",
] as const;

export type PvpWindow = {
  active: boolean;
  phaseKey: string;
  remainingMs: number;
  endsAt: number;
};

function clockPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  return Number(parts.find((part) => part.type === type)?.value ?? 0);
}

/** A mesma regra usada no banco: PvP do minuto 0 ao 9 de cada hora. */
export function getGlobalPvpWindow(now = Date.now()): PvpWindow {
  const date = new Date(now);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PVP_SCHEDULE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const year = clockPart(parts, "year");
  const month = clockPart(parts, "month");
  const day = clockPart(parts, "day");
  const hour = clockPart(parts, "hour");
  const minute = clockPart(parts, "minute");
  const second = clockPart(parts, "second");
  const active = minute < PVP_WINDOW_MINUTES;
  const msIntoHour = (minute * 60 + second) * 1_000 + date.getMilliseconds();
  const remainingMs = active
    ? Math.max(1, PVP_WINDOW_MS - msIntoHour)
    : Math.max(1, 60 * 60_000 - msIntoHour);

  return {
    active,
    phaseKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}`,
    remainingMs,
    endsAt: now + remainingMs,
  };
}

export function isScheduledPvpMap(mapId: string): boolean {
  return (PVP_SCHEDULE_MAP_IDS as readonly string[]).includes(mapId);
}

export function isPvpActiveOnMap(mapId: string, now = Date.now()): boolean {
  return isScheduledPvpMap(mapId) && getGlobalPvpWindow(now).active;
}
