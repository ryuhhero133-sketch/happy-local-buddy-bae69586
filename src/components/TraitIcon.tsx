// Ícone bonito de trait estilo MMO — moldura por tier + SVG original por trait.
import { TRAITS, TIER_COLOR, type TraitTier } from "@/game/traits";

const TIER_GRADIENT: Record<TraitTier, string> = {
  common:   "radial-gradient(circle at 30% 25%, #f5eef7 0%, #c8b8d0 55%, #6a5a7c 100%)",
  uncommon: "radial-gradient(circle at 30% 25%, #d9ffe8 0%, #7ef2a2 55%, #1e6b3a 100%)",
  rare:     "radial-gradient(circle at 30% 25%, #e0f4ff 0%, #6bd4ff 55%, #1a5b8a 100%)",
  epic:     "radial-gradient(circle at 30% 25%, #f2e0ff 0%, #c084fc 55%, #5b21b6 100%)",
  purple:   "radial-gradient(circle at 30% 25%, #f3e2ff 0%, #b14bff 55%, #3b0764 100%)",
  gold:     "radial-gradient(circle at 30% 25%, #fff8d6 0%, #ffd94d 55%, #7a5200 100%)",
};

const TIER_LABEL: Record<TraitTier, string> = {
  common: "C", uncommon: "U", rare: "R", epic: "E", purple: "P", gold: "G",
};

// SVG originais — cada trait tem símbolo próprio (viewBox 0 0 24 24).
// Trocamos os emojis por vetores desenhados na mão, com paleta coerente.
function TraitGlyph({ id, color }: { id: string; color: string }) {
  const stroke = "#0b0510";
  const sw = 1.4;
  const common: React.SVGAttributes<SVGSVGElement> = {
    viewBox: "0 0 24 24", width: "62%", height: "62%",
    style: { filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.55))", overflow: "visible" },
  };
  switch (id) {
    // ===== Comuns =====
    case "feroz": // adaga cruzada
      return (
        <svg {...common}>
          <path d="M4 4 L14 14 L12 16 L10 18 L2 20 L4 12 L4 4Z" fill="#ffd0d0" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M20 4 L10 14 L12 16 L14 18 L22 20 L20 12 L20 4Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      );
    case "resistente": // escudo com cruz
      return (
        <svg {...common}>
          <path d="M12 2 L20 5 V12 C20 17 16 21 12 22 C8 21 4 17 4 12 V5 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M12 7 V17 M7 12 H17" stroke="#fff" strokeWidth={sw + 0.6} strokeLinecap="round"/>
        </svg>
      );
    case "agil": // asa/curva de vento
      return (
        <svg {...common}>
          <path d="M3 8 C9 6 14 10 21 6" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round"/>
          <path d="M3 13 C9 11 14 15 21 11" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round"/>
          <path d="M3 18 C9 16 14 20 21 16" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round"/>
        </svg>
      );
    case "sortudo": // trevo 4 folhas
      return (
        <svg {...common}>
          {[0,90,180,270].map((r) => (
            <ellipse key={r} cx="12" cy="7" rx="4" ry="5.5" fill={color} stroke={stroke} strokeWidth={sw} transform={`rotate(${r} 12 12)`}/>
          ))}
          <circle cx="12" cy="12" r="1.6" fill="#3d7a2a"/>
        </svg>
      );

    // ===== Incomuns =====
    case "sabio": // livro aberto
      return (
        <svg {...common}>
          <path d="M2 5 C6 4 10 5 12 7 C14 5 18 4 22 5 V19 C18 18 14 19 12 21 C10 19 6 18 2 19 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M12 7 V21 M5 9 H10 M5 13 H10 M14 9 H19 M14 13 H19" stroke="#fff" strokeWidth={sw} strokeLinecap="round"/>
        </svg>
      );
    case "curador": // folha com cruz
      return (
        <svg {...common}>
          <path d="M4 20 C4 10 12 3 20 4 C21 12 14 20 4 20 Z" fill={color} stroke={stroke} strokeWidth={sw}/>
          <path d="M10 14 V18 M8 16 H12" stroke="#fff" strokeWidth={2} strokeLinecap="round"/>
        </svg>
      );
    case "venenoso": // caveira/gota tóxica
      return (
        <svg {...common}>
          <path d="M12 2 C7 2 4 6 4 11 C4 14 6 16 8 17 V20 H16 V17 C18 16 20 14 20 11 C20 6 17 2 12 2 Z" fill={color} stroke={stroke} strokeWidth={sw}/>
          <circle cx="9" cy="11" r="1.4" fill={stroke}/>
          <circle cx="15" cy="11" r="1.4" fill={stroke}/>
          <path d="M10 15 H14" stroke={stroke} strokeWidth={sw}/>
        </svg>
      );
    case "brutal": // explosão/estrela
      return (
        <svg {...common}>
          <path d="M12 2 L14 9 L21 8 L16 13 L21 20 L13 17 L12 22 L11 17 L3 20 L8 13 L3 8 L10 9 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      );
    case "guardiao": // torre/muralha
      return (
        <svg {...common}>
          <path d="M4 8 V4 H7 V6 H10 V4 H14 V6 H17 V4 H20 V8 L18 10 V20 H6 V10 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M10 20 V14 H14 V20" fill="#fff" stroke={stroke} strokeWidth={sw}/>
        </svg>
      );

    // ===== Raros =====
    case "eletrizado": // raio duplo
      return (
        <svg {...common}>
          <path d="M11 2 L4 13 H10 L7 22 L18 10 H12 L15 2 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      );
    case "precioso": // gema/diamante
      return (
        <svg {...common}>
          <path d="M6 3 H18 L22 9 L12 22 L2 9 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M2 9 H22 M12 22 L6 3 M12 22 L18 3 M6 9 L12 3 L18 9" stroke="#fff" strokeWidth={sw*0.8} fill="none"/>
        </svg>
      );
    case "prodigio": // estrela cintilante
      return (
        <svg {...common}>
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="1.6" fill="#fff"/>
        </svg>
      );
    case "mistico": // orbe com anel
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={stroke} strokeWidth={sw} transform="rotate(-25 12 12)"/>
          <circle cx="12" cy="12" r="6" fill={color} stroke={stroke} strokeWidth={sw}/>
          <circle cx="10" cy="10" r="1.4" fill="#fff"/>
        </svg>
      );
    case "esquivo": // vórtice
      return (
        <svg {...common}>
          <path d="M12 3 C18 3 21 8 21 12 C21 17 17 21 12 21 C8 21 5 18 5 15 C5 12 8 10 11 10 C13 10 15 12 15 14"
                fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round"/>
        </svg>
      );
    case "vampirico": // gota de sangue com presas
      return (
        <svg {...common}>
          <path d="M12 2 C15 8 20 12 20 16 C20 20 16 22 12 22 C8 22 4 20 4 16 C4 12 9 8 12 2 Z" fill={color} stroke={stroke} strokeWidth={sw}/>
          <path d="M9 12 L10 17 L11 12 M13 12 L14 17 L15 12" fill="#fff" stroke={stroke} strokeWidth={sw*0.7}/>
        </svg>
      );
    case "colosso": // rocha
      return (
        <svg {...common}>
          <path d="M4 12 L8 5 H16 L20 12 L16 20 H8 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M8 5 L11 12 L8 20 M16 5 L13 12 L16 20 M4 12 H20" stroke={stroke} strokeWidth={sw*0.7} fill="none"/>
        </svg>
      );

    // ===== Épicos =====
    case "alpha": // coroa
      return (
        <svg {...common}>
          <path d="M3 18 L4 8 L9 12 L12 5 L15 12 L20 8 L21 18 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <circle cx="4" cy="8" r="1.4" fill="#ffd66b" stroke={stroke} strokeWidth={sw*0.7}/>
          <circle cx="12" cy="5" r="1.5" fill="#ff6b3d" stroke={stroke} strokeWidth={sw*0.7}/>
          <circle cx="20" cy="8" r="1.4" fill="#ffd66b" stroke={stroke} strokeWidth={sw*0.7}/>
          <rect x="3" y="18" width="18" height="2.5" fill="#ffd66b" stroke={stroke} strokeWidth={sw*0.7}/>
        </svg>
      );
    case "prismatico": // prisma/arco-íris
      return (
        <svg {...common}>
          <path d="M12 3 L21 20 H3 Z" fill="#fff" stroke={stroke} strokeWidth={sw}/>
          <path d="M12 3 L8 20" stroke="#ff5252" strokeWidth={sw}/>
          <path d="M12 3 L12 20" stroke="#ffd66b" strokeWidth={sw}/>
          <path d="M12 3 L16 20" stroke="#7ef2a2" strokeWidth={sw}/>
          <path d="M12 3 L4 20" stroke="#6bd4ff" strokeWidth={sw}/>
          <path d="M12 3 L20 20" stroke="#c084fc" strokeWidth={sw}/>
        </svg>
      );
    case "ceifador": // foice
      return (
        <svg {...common}>
          <path d="M3 6 C10 4 18 8 20 15" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round"/>
          <path d="M20 15 L17 20 L14 18 Z" fill={color} stroke={stroke} strokeWidth={sw}/>
          <rect x="2" y="6" width="3" height="16" fill="#6b4a10" stroke={stroke} strokeWidth={sw}/>
        </svg>
      );
    case "eterno": // infinito
      return (
        <svg {...common}>
          <path d="M6 12 C6 8 10 8 12 12 C14 16 18 16 18 12 C18 8 14 8 12 12 C10 16 6 16 6 12 Z"
                fill={color} stroke={stroke} strokeWidth={sw}/>
        </svg>
      );
    case "dourado": // moeda com $
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill={color} stroke={stroke} strokeWidth={sw}/>
          <circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" strokeWidth={sw}/>
          <path d="M12 7 V17 M9.5 9.5 C9.5 8 10.5 7.5 12 7.5 C14 7.5 14.5 9 13 10.5 C11.5 12 9.5 12.5 9.5 14 C9.5 15.5 10.5 16.5 12 16.5 C13.5 16.5 14.5 15.5 14.5 14.5"
                stroke={stroke} strokeWidth={sw+0.4} fill="none" strokeLinecap="round"/>
        </svg>
      );
    // ===== ROXO (ancestral) =====
    case "titanico": // colosso/monólito
      return (
        <svg {...common}>
          <path d="M6 21 L8 7 H16 L18 21 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M9 7 L10 3 H14 L15 7" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M7 15 H17" stroke="#fff" strokeWidth={sw*0.9}/>
        </svg>
      );
    case "predador": // garra
      return (
        <svg {...common}>
          <path d="M4 3 C6 9 8 14 8 21 M10 2 C11 8 12 14 12 21 M16 3 C15 9 14 14 14 21 M21 6 C18 10 17 15 17 21"
                fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round"/>
        </svg>
      );
    case "tempestade": // nuvem com raio
      return (
        <svg {...common}>
          <path d="M6 13 C4 13 3 11 4 9 C5 7 7 7 8 8 C9 5 13 5 14 8 C17 7 19 9 19 11 C20 13 18 15 16 15 Z" fill="#e8e8f5" stroke={stroke} strokeWidth={sw*0.7}/>
          <path d="M12 13 L9 21 H12 L10 26" fill="none" stroke={color} strokeWidth={2.6} strokeLinejoin="round"/>
        </svg>
      );
    case "sombra": // lua cheia sombria
      return (
        <svg {...common}>
          <path d="M15 3 A9 9 0 1 0 15 21 A7 7 0 1 1 15 3 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <circle cx="7" cy="7" r="1" fill={color}/><circle cx="5" cy="17" r="0.9" fill={color}/><circle cx="19" cy="6" r="0.8" fill={color}/>
        </svg>
      );
    case "arcane": // rune em losango
      return (
        <svg {...common}>
          <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke={color} strokeWidth={2}/>
          <path d="M8 16 C10 10 14 10 16 8 M9 9 L15 15" stroke="#fff" strokeWidth={sw+0.4} strokeLinecap="round"/>
        </svg>
      );
    case "abissal": // onda dupla
      return (
        <svg {...common}>
          <path d="M2 10 C6 6 8 14 12 10 C16 6 18 14 22 10" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round"/>
          <path d="M2 17 C6 13 8 21 12 17 C16 13 18 21 22 17" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round"/>
        </svg>
      );
    case "fulgurante": // raio grosso
      return (
        <svg {...common}>
          <path d="M13 1 L4 14 H11 L8 23 L20 9 H13 L16 1 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      );
    case "vitalicio": // cruz de vida/hoja pulsante
      return (
        <svg {...common}>
          <path d="M12 21 C4 15 3 8 7 5 C10 3 12 6 12 6 C12 6 14 3 17 5 C21 8 20 15 12 21 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M6 12 H10 L12 9 L14 15 L16 12 H19" fill="none" stroke="#fff" strokeWidth={sw*0.9} strokeLinecap="round"/>
        </svg>
      );

    // ===== DOURADO (ancestral) =====
    case "soberano": // coroa real dupla
      return (
        <svg {...common}>
          <path d="M3 19 L4 7 L9 12 L12 4 L15 12 L20 7 L21 19 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <rect x="3" y="19" width="18" height="3" fill={color} stroke={stroke} strokeWidth={sw*0.7}/>
          <circle cx="12" cy="4" r="1.6" fill="#fff"/>
        </svg>
      );
    case "aniquilador": // caveira dourada
      return (
        <svg {...common}>
          <path d="M12 2 C6 2 3 6 3 11 C3 14 5 16 7 17 V21 H17 V17 C19 16 21 14 21 11 C21 6 18 2 12 2 Z" fill={color} stroke={stroke} strokeWidth={sw}/>
          <circle cx="9" cy="11" r="2" fill={stroke}/><circle cx="15" cy="11" r="2" fill={stroke}/>
          <path d="M10 16 L12 13 L14 16" stroke={stroke} strokeWidth={sw} fill="none"/>
        </svg>
      );
    case "primordial": // espiral
      return (
        <svg {...common}>
          <path d="M12 12 C12 9 15 9 15 12 C15 16 10 17 9 12 C8 6 15 4 19 8 C23 13 19 21 12 21 C5 21 2 15 3 10"
                fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round"/>
        </svg>
      );
    case "temporal": // ampulheta
      return (
        <svg {...common}>
          <path d="M6 3 H18 M6 21 H18" stroke={stroke} strokeWidth={2} strokeLinecap="round"/>
          <path d="M7 3 C7 9 11 10 12 12 C13 14 17 15 17 21 M17 3 C17 9 13 10 12 12 C11 14 7 15 7 21"
                fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
          <path d="M9 19 C10 16 14 16 15 19 Z" fill={color}/>
        </svg>
      );
    case "astral": // cometa
      return (
        <svg {...common}>
          <circle cx="16" cy="8" r="5" fill={color} stroke={stroke} strokeWidth={sw}/>
          <path d="M11 13 L3 21 M13 15 L7 21 M9 11 L3 17" stroke={color} strokeWidth={2} strokeLinecap="round"/>
          <circle cx="14.5" cy="6.5" r="1.4" fill="#fff"/>
        </svg>
      );
    case "perpetuo": // brilho/estrela de 4 pontas
      return (
        <svg {...common}>
          <path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      );
    case "ourobranco": // lingote duplo
      return (
        <svg {...common}>
          <path d="M4 14 L7 9 H17 L20 14 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M6 20 L8 16 H16 L18 20 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <path d="M8 11 L16 11" stroke="#fff" strokeWidth={sw*0.8}/>
        </svg>
      );
    case "divino": // estrela com halo
      return (
        <svg {...common}>
          <path d="M12 4 L14 10 L20 12 L14 14 L12 20 L10 14 L4 12 L10 10 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
          <ellipse cx="12" cy="5" rx="8" ry="2.4" fill="none" stroke="#fff" strokeWidth={sw*0.8} transform="rotate(-15 12 5)"/>
        </svg>
      );
    default:
      // fallback — círculo com inicial
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill={color} stroke={stroke} strokeWidth={sw}/>
          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff">?</text>
        </svg>
      );
  }
}

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
        lineHeight: 1, zIndex: 2,
      }}>{TIER_LABEL[t.tier]}</div>
      {/* Glyph SVG original */}
      <TraitGlyph id={id} color={col} />
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
