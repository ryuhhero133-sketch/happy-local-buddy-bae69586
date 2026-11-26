export type HudAnchor = { x: number; y: number };
export type HudPositions = Record<string, HudAnchor>;
export type HudRect = { left: number; top: number; width: number; height: number };
export type HudDeviceLayout = "desktop" | "touch-landscape" | "touch-portrait";

export const HUD_HOLD_MS = 220;
export const HUD_DRAG_SLOP = 7;
export const HUD_EDGE = 8;
const unit = (value: number) => Math.max(0, Math.min(1, value));

export function hudPositionKey(accountId: string | undefined, device: HudDeviceLayout): string {
  return `rubym.hud-positions.v1:${accountId ?? "local"}:${device}`;
}

/** Positions are fractions of the available travel, not of the world/map size. */
export function hudPointFromAnchor(anchor: HudAnchor, frame: HudRect, size: { width: number; height: number }): HudAnchor {
  return {
    x: frame.left + HUD_EDGE + unit(anchor.x) * Math.max(0, frame.width - size.width - HUD_EDGE * 2),
    y: frame.top + HUD_EDGE + unit(anchor.y) * Math.max(0, frame.height - size.height - HUD_EDGE * 2),
  };
}

export function hudAnchorFromPoint(point: HudAnchor, frame: HudRect, size: { width: number; height: number }): HudAnchor {
  return {
    x: unit((point.x - frame.left - HUD_EDGE) / Math.max(1, frame.width - size.width - HUD_EDGE * 2)),
    y: unit((point.y - frame.top - HUD_EDGE) / Math.max(1, frame.height - size.height - HUD_EDGE * 2)),
  };
}

export function clampHudPoint(point: HudAnchor, frame: HudRect, size: { width: number; height: number }): HudAnchor {
  return hudPointFromAnchor(hudAnchorFromPoint(point, frame, size), frame, size);
}

export function parseHudPositions(raw: string | null): HudPositions {
  try {
    const data: unknown = JSON.parse(raw ?? "{}");
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const positions: HudPositions = {};
    for (const [id, value] of Object.entries(data)) {
      if (!/^[a-z][a-z0-9-]{0,48}$/.test(id) || !value || typeof value !== "object") continue;
      const { x, y } = value as HudAnchor;
      if (typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)) {
        positions[id] = { x: unit(x), y: unit(y) };
      }
    }
    return positions;
  } catch {
    return {};
  }
}
