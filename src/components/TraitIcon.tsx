// Ícone bonito de trait estilo MMO — moldura por tier, gradiente radial, brilho e shine.
import { TRAITS, TIER_COLOR, type TraitTier } from "@/game/traits";

const TIER_GRADIENT: Record<TraitTier, string> = {
  common:   "radial-gradient(circle at 30% 25%, #f5eef7 0%, #c8b8d0 55%, #6a5a7c 100%)",
  uncommon: "radial-gradient(circle at 30% 25%, #d9ffe8 0%, #7ef2a2 55%, #1e6b3a 100%)",
  rare:     "radial-gradient(circle at 30% 25%, #e0f4ff 0%, #6bd4ff 55%, #1a5b8a 100%)",
  epic:     "radial-gradient(circle at 30% 25%, #f2e0ff 0%, #c084fc 55%, #5b21b6 100%)",
};

const TIER_LABEL: Record<TraitTier, string> = {
  common: "C", uncommon: "U", rare: "R", epic: "E",
};

interface Props {
  id: string;
  size?: number;
  showLabel?: boolean;
}

export function TraitIcon({ id, size = 34, showLabel = false }: Props) {
  const t = TRAITS[id];
  if (!t) return null;
  const col = TIER_COLOR[t.tier];
  const grad = TIER_GRADIENT[t.tier];

  return (
    <div
      title={`${t.name} — ${t.desc}`}
      style={{
        position: "relative",
        width: size, height: size,
        borderRadius: 10,
        background: grad,
        border: `2px solid ${col}`,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.55),
          inset 0 -3px 6px rgba(0,0,0,0.35),
          0 0 8px ${col}88,
          0 2px 4px rgba(0,0,0,0.45)
        `,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Shine diagonal */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(140deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.15) 100%)",
      }} />
      {/* Selinho no canto com a inicial do tier */}
      <div style={{
        position: "absolute", top: 1, right: 2,
        fontSize: Math.max(7, size * 0.22), fontWeight: 900, letterSpacing: 0.5,
        color: "#fff", textShadow: "0 1px 0 rgba(0,0,0,0.7)",
        lineHeight: 1,
      }}>{TIER_LABEL[t.tier]}</div>
      {/* Emoji central com sombra */}
      <div style={{
        fontSize: size * 0.58, lineHeight: 1,
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.65))",
        transform: "translateY(1px)",
      }}>{t.icon}</div>
      {showLabel && (
        <div style={{
          position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
          fontSize: 8, fontWeight: 900, color: col, whiteSpace: "nowrap",
          textShadow: "0 1px 0 rgba(0,0,0,0.7)", letterSpacing: 0.5,
        }}>{t.name.toUpperCase()}</div>
      )}
    </div>
  );
}
