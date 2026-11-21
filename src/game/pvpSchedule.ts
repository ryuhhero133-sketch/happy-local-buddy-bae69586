/** Agenda global de PvP: Emerald Global alterna 1h PvP / 1h Paz em São Paulo. */
export const PVP_SCHEDULE_MAP_ID = "arv";
export const PVP_SCHEDULE_TIME_ZONE = "America/Sao_Paulo";

export type PvpWindow = {
  active: boolean;
  phaseKey: string;
  remainingMs: number;
  endsAt: number;
};

function clockPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  return Number(parts.find((part) => part.type === type)?.value ?? 0);
}

/** A mesma regra usada no banco: horas pares são PvP; horas ímpares são Paz. */
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
  const remainingMs = Math.max(1, (60 - minute) * 60_000 - second * 1_000 - date.getMilliseconds());

  return {
    active: hour % 2 === 0,
    phaseKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}`,
    remainingMs,
    endsAt: now + remainingMs,
  };
}

export function isScheduledPvpMap(mapId: string): boolean {
  return mapId === PVP_SCHEDULE_MAP_ID;
}

export function isPvpActiveOnMap(mapId: string, now = Date.now()): boolean {
  return isScheduledPvpMap(mapId) && getGlobalPvpWindow(now).active;
}
