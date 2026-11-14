import { useEffect, useRef, useState, type PointerEvent } from "react";

/** Sends a normalized analog direction; the game owns movement and collision. */
export function TouchJoystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const moveRef = useRef(onMove);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  moveRef.current = onMove;

  const update = (event: PointerEvent<HTMLDivElement>) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    const radius = rect.width * 0.32;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const magnitude = Math.hypot(dx, dy);
    const ratio = magnitude > radius ? radius / magnitude : 1;
    const x = dx * ratio / radius;
    const y = dy * ratio / radius;
    setOffset({ x: dx * ratio, y: dy * ratio });
    moveRef.current(Math.abs(x) < .1 ? 0 : x, Math.abs(y) < .1 ? 0 : y);
  };
  const stop = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== activePointer.current) return;
    activePointer.current = null;
    setOffset({ x: 0, y: 0 });
    moveRef.current(0, 0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => () => moveRef.current(0, 0), []);

  return <div ref={base} className="revo-touch-stick" role="group" aria-label="Joystick para mover o personagem"
    onPointerDown={(event) => {
      if (activePointer.current !== null) return;
      event.preventDefault();
      activePointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      update(event);
    }}
    onPointerMove={(event) => { if (event.pointerId === activePointer.current) update(event); }}
    onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
    <span className="revo-touch-stick__ring" aria-hidden="true" />
    <span className="revo-touch-stick__knob" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} aria-hidden="true" />
  </div>;
}
