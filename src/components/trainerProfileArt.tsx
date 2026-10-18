// Arte da aba PERFIL DE TREINADOR.
// Todo caminho vem de PROFILE_SPRITES (src/game/trainerProfile.ts): se uma URL
// for preenchida ali, a imagem substitui o fallback SVG/procedural sem tocar
// neste arquivo. Sem arte própria no projeto → SVGs inline (coroa, asas).
import type { CSSProperties } from "react";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";
import {
  PATENTES,
  PROFILE_SPRITES,
  type PatenteId,
  type SpiritStateId,
  type VipBookId,
} from "@/game/trainerProfile";

/** Livro VIP: PNG do registro ou desenho procedural do ItemPixelIcon. */
export function BookArt({ id, size = 44, dim = false }: { id: VipBookId; size?: number; dim?: boolean }) {
  const src = PROFILE_SPRITES.books[id];
  const style: CSSProperties = {
    opacity: dim ? 0.32 : 1,
    filter: dim ? "grayscale(0.85)" : "drop-shadow(0 0 6px rgba(255,217,77,0.45))",
    lineHeight: 0,
  };
  return (
    <div style={style}>
      {src ? <img src={src} width={size} height={size} alt="" /> : <ItemPixelIcon id={id} size={size} />}
    </div>
  );
}

const WING_PATH = "M24 5 C17 6 9 9 3 15 C9 13 14 14 17 15 C12 17 7 20 3 23 C10 21 17 18 24 16 Z";

const WING_STYLE: Record<SpiritStateId, { fill: string; stroke: string; glow: string }> = {
  luz: { fill: "#fff6d8", stroke: "#e8c66a", glow: "rgba(255,233,163,0.8)" },
  equilibrio: { fill: "#bfeeff", stroke: "#2a9dc0", glow: "rgba(126,230,255,0.7)" },
  sombras: { fill: "#241438", stroke: "#8b5cf0", glow: "rgba(139,92,240,0.8)" },
};

/** Asas espirituais: imagem do registro ou par de asas em SVG. */
export function SpiritWings({ state, size = 64 }: { state: SpiritStateId; size?: number }) {
  const src = PROFILE_SPRITES.wings[state];
  if (src) return <img src={src} height={size} alt="" style={{ lineHeight: 0 }} />;
  const m = WING_STYLE[state];
  return (
    <svg
      viewBox="0 0 48 24"
      width={size * 2}
      height={size}
      style={{ display: "block", filter: `drop-shadow(0 0 6px ${m.glow})` }}
      aria-hidden
    >
      <g fill={m.fill} stroke={m.stroke} strokeWidth={1} strokeLinejoin="round">
        <path d={WING_PATH} />
        <path d={WING_PATH} transform="translate(48,0) scale(-1,1)" />
      </g>
    </svg>
  );
}

const CROWN_GEM: Record<PatenteId, string> = {
  emerald: "#0f6b46",
  purpura: "#6a1fb0",
  diamante: "#7ee6ff",
  lendario: "#fff2b0",
};

/** Coroa da patente: imagem do registro ou SVG colorido pela patente. */
export function PatenteCrown({ id, size = 34 }: { id: PatenteId; size?: number }) {
  const src = PROFILE_SPRITES.crowns[id];
  if (src) return <img src={src} width={size} height={size} alt="" style={{ lineHeight: 0 }} />;
  const color = PATENTES.find((p) => p.id === id)?.color ?? "#ffd94d";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: "block", filter: `drop-shadow(0 0 6px ${color})` }}
      aria-hidden
    >
      <path
        d="M3 17 L3 7 L8 11 L12 5 L16 11 L21 7 L21 17 Z"
        fill={color}
        stroke="#0b0b12"
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <rect x="3" y="17" width="18" height="3.4" fill={color} stroke="#0b0b12" strokeWidth={1.3} />
      <circle cx="12" cy="14" r="1.7" fill={CROWN_GEM[id]} stroke="#0b0b12" strokeWidth={0.8} />
    </svg>
  );
}
