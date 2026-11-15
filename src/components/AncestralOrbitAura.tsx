import type { CSSProperties } from "react";

/** Anéis e esferas orbitais para o ancestral; animação só em CSS. */
export function AncestralOrbitAura() {
  return (
    <div className="anc-orbit-field" aria-hidden="true">
      <span className="anc-orbit-ring anc-orbit-ring--outer" />
      <span className="anc-orbit-ring anc-orbit-ring--inner" />
      {[0, 60, 120, 180, 240, 300].map((angle, index) => (
        <span
          key={angle}
          className={`anc-orbit-orb${index % 3 === 0 ? " anc-orbit-orb--large" : ""}`}
          style={{
            "--orbit-angle": `${angle}deg`,
            animationDuration: `${index % 2 === 0 ? 7 : 9}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
