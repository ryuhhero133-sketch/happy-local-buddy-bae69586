export type HudMapBounds = { left: number; top: number; width: number; height: number };

/** Visible intersection of the real world image and the game viewport, in CSS pixels. */
export function getHudMapBounds(
  viewport: { w: number; h: number },
  world: { w: number; h: number },
  zoom: number,
  camera: { x: number; y: number },
  center: { x: number; y: number },
): HudMapBounds {
  const x = -camera.x * zoom + center.x;
  const y = -camera.y * zoom + center.y;
  const left = Math.max(0, x);
  const top = Math.max(0, y);
  return {
    left,
    top,
    width: Math.max(1, Math.min(viewport.w, x + world.w * zoom) - left),
    height: Math.max(1, Math.min(viewport.h, y + world.h * zoom) - top),
  };
}

/** Preserve the compact HUD size, scaling down further only when the map needs it. */
export function getHudScale(bounds: HudMapBounds, viewportWidth: number): number {
  const mobile = viewportWidth <= 768;
  const preferred = mobile ? 1 : viewportWidth <= 1000 ? 0.9 : 0.8;
  return Math.min(preferred, bounds.width / (mobile ? 360 : 1000), bounds.height / (mobile ? 600 : 680));
}
