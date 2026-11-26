import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  clampHudPoint, HUD_DRAG_SLOP, HUD_HOLD_MS, hudAnchorFromPoint, hudPointFromAnchor,
  hudPositionKey, parseHudPositions, type HudAnchor, type HudDeviceLayout,
} from "./hudPositions";

function deviceLayout(): HudDeviceLayout {
  if (!window.matchMedia("(pointer: coarse)").matches) return "desktop";
  return window.matchMedia("(orientation: landscape)").matches ? "touch-landscape" : "touch-portrait";
}

/** Delegation keeps drag frames out of React (and out of the game's render loop). */
export function useHudDrag(rootRef: RefObject<HTMLDivElement | null>, accountId?: string) {
  const resetRef = useRef<() => void>(() => {});
  useEffect(() => {
    const root = rootRef.current;
    const frameElement = root?.parentElement;
    if (!root || !frameElement) return;
    let key = hudPositionKey(accountId, deviceLayout());
    const read = () => {
      try { return parseHudPositions(localStorage.getItem(key)); } catch { return {}; }
    };
    let positions = read();
    const offsets = new WeakMap<HTMLElement, HudAnchor>();
    let layoutFrame = 0;
    let dragFrame = 0;
    let suppressClickUntil = 0;
    const ignoredClicks = new Set<number>();
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    type Drag = {
      element: HTMLElement; id: string; pointerId: number; active: boolean;
      pointerType: string; tapButton: HTMLButtonElement | null;
      start: HudAnchor; latest: HudAnchor; origin: HudAnchor; initialOffset: HudAnchor;
      scale: number; width: number; height: number;
    };
    let drag: Drag | null = null;
    const elements = () => Array.from(root.querySelectorAll<HTMLElement>("[data-hud-id]"));
    const scaleOf = () => root.getBoundingClientRect().width / Math.max(1, root.offsetWidth);
    const translate = (element: HTMLElement, offset: HudAnchor) => {
      offsets.set(element, offset);
      // The independent translate property preserves CSS scale/centering/hover transforms.
      element.style.translate = `${offset.x}px ${offset.y}px`;
    };
    const reflow = () => {
      layoutFrame = 0;
      if (drag) return;
      const nextKey = hudPositionKey(accountId, deviceLayout());
      if (key !== nextKey) {
        key = nextKey;
        positions = read();
        for (const element of elements()) {
          element.style.removeProperty("translate");
          offsets.delete(element);
        }
      }
      const frame = frameElement.getBoundingClientRect();
      const scale = scaleOf();
      for (const element of elements()) {
        if (!element.getClientRects().length) continue;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const offset = offsets.get(element) ?? { x: 0, y: 0 };
        const origin = { x: rect.left - offset.x * scale, y: rect.top - offset.y * scale };
        const anchor = positions[element.dataset.hudId!];
        const point = anchor ? hudPointFromAnchor(anchor, frame, rect) : clampHudPoint(origin, frame, rect);
        translate(element, { x: (point.x - origin.x) / scale, y: (point.y - origin.y) / scale });
      }
    };
    const scheduleLayout = () => {
      if (!layoutFrame) layoutFrame = requestAnimationFrame(reflow);
    };
    const clearHold = () => { clearTimeout(holdTimer); holdTimer = undefined; };
    const ignoreClick = (pointerId: number) => {
      ignoredClicks.add(pointerId);
      if (ignoredClicks.size > 32) ignoredClicks.delete(ignoredClicks.values().next().value!);
      suppressClickUntil = performance.now() + 450;
    };
    const paintDrag = () => {
      dragFrame = 0;
      if (!drag?.active) return;
      const point = clampHudPoint({
        x: drag.origin.x + drag.latest.x - drag.start.x,
        y: drag.origin.y + drag.latest.y - drag.start.y,
      }, frameElement.getBoundingClientRect(), drag);
      translate(drag.element, {
        x: drag.initialOffset.x + (point.x - drag.origin.x) / drag.scale,
        y: drag.initialOffset.y + (point.y - drag.origin.y) / drag.scale,
      });
    };
    const activate = () => {
      clearHold();
      if (!drag || !drag.element.isConnected) return;
      drag.active = true;
      drag.element.classList.add("is-hud-dragging");
      root.classList.add("is-rearranging");
      try { drag.element.setPointerCapture(drag.pointerId); } catch { /* Pointer already ended. */ }
      paintDrag();
    };
    const finish = (save: boolean) => {
      clearHold();
      if (!drag) return;
      if (dragFrame) { cancelAnimationFrame(dragFrame); dragFrame = 0; }
      const current = drag;
      if (current.active) {
        if (save) {
          paintDrag();
          const rect = current.element.getBoundingClientRect();
          const anchor = hudAnchorFromPoint({ x: rect.left, y: rect.top }, frameElement.getBoundingClientRect(), rect);
          positions[current.id] = anchor;
          // Merge other blocks/tabs, and write only once when the pointer is released.
          try {
            positions = { ...read(), ...positions, [current.id]: anchor };
            localStorage.setItem(key, JSON.stringify(positions));
          } catch { /* Private mode/storage full: the in-session position still works. */ }
        } else {
          translate(current.element, current.initialOffset);
        }
        ignoreClick(current.pointerId);
      }
      drag = null;
      current.element.classList.remove("is-hud-dragging");
      root.classList.remove("is-rearranging");
      if (current.element.hasPointerCapture(current.pointerId)) current.element.releasePointerCapture(current.pointerId);
      scheduleLayout();
    };
    const down = (event: PointerEvent) => {
      // A new real press is always allowed, including a world/joystick press.
      ignoredClicks.delete(event.pointerId);
      suppressClickUntil = 0;
      if (event.button !== 0 || !event.isPrimary || drag) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target || target.closest("[data-hud-no-drag], input, textarea, select, [contenteditable='true']")) return;
      const element = target.closest<HTMLElement>("[data-hud-id]");
      if (!element || !root.contains(element)) return;
      if (element.hasAttribute("data-hud-scrollable") && !target.closest("button, header, .revo-chat__tabs")) return;
      const rect = element.getBoundingClientRect();
      drag = {
        element, id: element.dataset.hudId!, pointerId: event.pointerId, active: false,
        pointerType: event.pointerType, tapButton: target.closest<HTMLButtonElement>("button"),
        start: { x: event.clientX, y: event.clientY }, latest: { x: event.clientX, y: event.clientY },
        origin: { x: rect.left, y: rect.top }, initialOffset: offsets.get(element) ?? { x: 0, y: 0 },
        scale: scaleOf(), width: rect.width, height: rect.height,
      };
      holdTimer = setTimeout(activate, HUD_HOLD_MS);
      event.stopPropagation(); // Never send a HUD press to the world's movement handlers.
    };
    const move = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.latest = { x: event.clientX, y: event.clientY };
      if (!drag.active && Math.hypot(event.clientX - drag.start.x, event.clientY - drag.start.y) >= HUD_DRAG_SLOP) activate();
      if (drag.active) {
        event.preventDefault();
        event.stopPropagation();
        if (!dragFrame) dragFrame = requestAnimationFrame(paintDrag);
      }
    };
    const up = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const tapButton = !drag.active && drag.pointerType === "touch" ? drag.tapButton : null;
      if (drag.active || tapButton) { event.preventDefault(); event.stopPropagation(); }
      drag.latest = { x: event.clientX, y: event.clientY };
      finish(true);
      if (tapButton?.isConnected && !tapButton.disabled) {
        // Normalize short touch taps at pointerup: after a translated drag some
        // mobile browsers omit the compatibility click. Block that click if it
        // does arrive, so the existing React callback runs exactly once.
        ignoreClick(event.pointerId);
        tapButton.click();
      }
    };
    const cancel = (event: PointerEvent) => { if (event.pointerId === drag?.pointerId) finish(false); };
    const blur = () => finish(false);
    const click = (event: MouseEvent) => {
      // A drag/drop must not also toggle AUTO, use a potion or open a menu.
      const suppressed = event instanceof PointerEvent
        ? ignoredClicks.has(event.pointerId)
        : performance.now() < suppressClickUntil;
      if (suppressed && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };
    const contextMenu = (event: Event) => {
      if ((event.target as Element)?.closest("[data-hud-id]")) event.preventDefault();
    };
    const nativeDrag = (event: Event) => {
      if ((event.target as Element)?.closest("[data-hud-id]")) event.preventDefault();
    };
    const resized = new ResizeObserver(scheduleLayout);
    const observed = new Set<HTMLElement>();
    const observeElements = () => {
      for (const element of observed) if (!root.contains(element)) { resized.unobserve(element); observed.delete(element); }
      for (const element of elements()) if (!observed.has(element)) { resized.observe(element); observed.add(element); }
      scheduleLayout();
    };
    const mounted = new MutationObserver(observeElements);
    mounted.observe(root, { childList: true, subtree: true });
    resized.observe(frameElement);
    observeElements();
    // Opening a panel, showing a target or collapsing chat changes default CSS anchors.
    const attributes = new MutationObserver(scheduleLayout);
    attributes.observe(root, { attributes: true, attributeFilter: ["class"] });
    const onStorage = (event: StorageEvent) => { if (event.key === key) { positions = read(); scheduleLayout(); } };
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointermove", move, { capture: true, passive: false });
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", cancel, true);
    root.addEventListener("lostpointercapture", cancel, true);
    window.addEventListener("click", click, true);
    root.addEventListener("contextmenu", contextMenu);
    root.addEventListener("dragstart", nativeDrag);
    window.addEventListener("resize", scheduleLayout);
    window.addEventListener("blur", blur);
    window.addEventListener("storage", onStorage);
    resetRef.current = () => {
      finish(false);
      positions = {};
      try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
      for (const element of elements()) { element.style.removeProperty("translate"); offsets.delete(element); }
      scheduleLayout();
    };
    return () => {
      finish(false);
      cancelAnimationFrame(layoutFrame);
      cancelAnimationFrame(dragFrame);
      resized.disconnect(); mounted.disconnect(); attributes.disconnect();
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", cancel, true);
      root.removeEventListener("lostpointercapture", cancel, true);
      window.removeEventListener("click", click, true);
      root.removeEventListener("contextmenu", contextMenu);
      root.removeEventListener("dragstart", nativeDrag);
      window.removeEventListener("resize", scheduleLayout);
      window.removeEventListener("blur", blur);
      window.removeEventListener("storage", onStorage);
      for (const element of elements()) element.style.removeProperty("translate");
      resetRef.current = () => {};
    };
  }, [rootRef, accountId]);
  return useCallback(() => resetRef.current(), []);
}

export function useHudCollapsed(accountId: string | undefined, panel: string, initial: boolean) {
  const key = `rubym.hud-panels.v1:${accountId ?? "local"}:${panel}`;
  const [collapsed, setCollapsed] = useState(initial);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      setCollapsed(saved === null ? initial : saved === "true");
    } catch { setCollapsed(initial); }
  }, [key, initial]);
  const toggle = () => setCollapsed((value) => {
    try { localStorage.setItem(key, String(!value)); } catch { /* Storage is optional. */ }
    return !value;
  });
  return [collapsed, toggle] as const;
}
