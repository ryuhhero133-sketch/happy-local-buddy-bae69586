// ============================================================
// IDLEMON REVO — Caixa de diálogo NPC estilo RPG pixel clássico
// (Pokémon/GBA) com identidade visual própria do IDLE MON REVO.
// - Compacta, sem fullscreen; jogador e NPC seguem visíveis.
// - Texto digitado caractere por caractere (typewriter), mesmo
//   padrão do diálogo vivo do Black Mítico / Egg da Incubadora.
// - Clique durante a digitação completa a fala; próximo clique avança.
// - Seta pixel-art animada indica avanço (sem botão retangular grande).
// - Recompensa só aparece no fim, com botão RECEBER RECOMPENSA.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";

export type NpcThemeKind =
  | "boby" | "san" | "nanizinha" | "payka" | "pan"
  | "gordin" | "luluzinha" | "bulbaOrange" | "bulbaFlower"
  | "pokemarktClerk" | "default";

export type NpcTheme = {
  label: string;
  name: string;
  frame: string;   // cor da borda externa
  inner: string;   // cor da borda interna
  bg: string;      // fundo da caixa
  accent: string;  // nome do NPC / detalhes
  glow: string;    // sombra externa
};

export const NPC_THEMES: Record<NpcThemeKind, NpcTheme> = {
  boby:         { label: "BOBY · O Companheiro das Pokébolas", name: "BOBY",      frame: "#f5cf6b", inner: "#7a5d15", bg: "linear-gradient(180deg, #1c2f5e 0%, #101c3d 100%)", accent: "#f5cf6b", glow: "rgba(245,207,107,0.35)" },
  san:          { label: "SAN · O Especialista em Orbs",       name: "SAN",       frame: "#7fd8ff", inner: "#1d5f86", bg: "linear-gradient(180deg, #0e2f45 0%, #081c2c 100%)", accent: "#7fd8ff", glow: "rgba(127,216,255,0.35)" },
  nanizinha:    { label: "NANIZINHA · A Cozinheira",           name: "NANIZINHA", frame: "#ffb84d", inner: "#8a4a10", bg: "linear-gradient(180deg, #3d2410 0%, #241305 100%)", accent: "#ffb84d", glow: "rgba(255,184,77,0.35)" },
  payka:        { label: "PAYKA · O Negociador",               name: "PAYKA",     frame: "#f5cf6b", inner: "#6b5a10", bg: "linear-gradient(180deg, #2e2a10 0%, #171405 100%)", accent: "#f5cf6b", glow: "rgba(245,207,107,0.30)" },
  pan:          { label: "PAN · A Informante",                 name: "PAN",       frame: "#c084fc", inner: "#5a2794", bg: "linear-gradient(180deg, #241536 0%, #120818 100%)", accent: "#c084fc", glow: "rgba(192,132,252,0.35)" },
  gordin:       { label: "GORDIN · Caçador de Raridades",      name: "GORDIN",    frame: "#5ec26a", inner: "#1f6b2a", bg: "linear-gradient(180deg, #12351f 0%, #0a1f12 100%)", accent: "#5ec26a", glow: "rgba(94,194,106,0.35)" },
  luluzinha:    { label: "LULUZINHA · Exploradora",            name: "LULUZINHA", frame: "#ff8bd0", inner: "#8f2b5f", bg: "linear-gradient(180deg, #3a1530 0%, #200a1a 100%)", accent: "#ff8bd0", glow: "rgba(255,139,208,0.35)" },
  bulbaOrange:  { label: "BULBASAUR · Laranja",               name: "BULBASAUR", frame: "#fb923c", inner: "#8a4a10", bg: "linear-gradient(180deg, #3a2410 0%, #201105 100%)", accent: "#fb923c", glow: "rgba(251,146,60,0.30)" },
  bulbaFlower:  { label: "BULBASAUR · Florido",               name: "BULBASAUR", frame: "#6bd66b", inner: "#1f6b2a", bg: "linear-gradient(180deg, #12351f 0%, #081c0e 100%)", accent: "#6bd66b", glow: "rgba(107,214,107,0.30)" },
  pokemarktClerk:{ label: "ATENDENTE · Pokémarkt",            name: "LOJA",      frame: "#7fd8ff", inner: "#1d5f86", bg: "linear-gradient(180deg, #10294d 0%, #0a1830 100%)", accent: "#7fd8ff", glow: "rgba(127,216,255,0.30)" },
  default:      { label: "NPC",                                name: "???",       frame: "#e9d5ff", inner: "#4a3560", bg: "linear-gradient(180deg, #241536 0%, #120818 100%)", accent: "#e9d5ff", glow: "rgba(233,213,255,0.25)" },
};

export function npcThemeFor(kind: string): NpcTheme {
  return NPC_THEMES[kind as NpcThemeKind] ?? NPC_THEMES.default;
}

// ------------------------------------------------------------
// Hook typewriter — mesmo padrão do ovo vivo do Black Mítico:
// revela 1 caractere por tick; complete() mostra tudo de uma vez.
// ------------------------------------------------------------
export function useNpcTypewriter(text: string, speedMs = 18) {
  const [shown, setShown] = useState("");
  const idxRef = useRef(0);
  const done = shown.length >= text.length;

  useEffect(() => {
    idxRef.current = 0;
    setShown("");
  }, [text]);

  useEffect(() => {
    if (!text) return;
    if (idxRef.current >= text.length) return;
    const t = setTimeout(() => {
      idxRef.current = Math.min(text.length, idxRef.current + 1);
      setShown(text.slice(0, idxRef.current));
    }, speedMs);
    return () => clearTimeout(t);
  }, [text, shown, speedMs]);

  const complete = () => {
    idxRef.current = text.length;
    setShown(text);
  };

  return { shown, done, complete };
}

// ------------------------------------------------------------
// Seta pixel-art animada — indica que dá para avançar.
// ------------------------------------------------------------
export function NpcAdvanceArrow({ visible, color = "#ffcc33" }: { visible: boolean; color?: string }) {
  if (!visible) return null;
  return (
    <>
      <style>{`@keyframes npcArrowBob { 0%,100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(3px); opacity: 0.45; } }`}</style>
      <span
        aria-hidden
        style={{
          position: "absolute", right: 10, bottom: 6,
          width: 0, height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: `9px solid ${color}`,
          filter: "drop-shadow(1px 1px 0 #000)",
          animation: "npcArrowBob 0.9s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

// ------------------------------------------------------------
// Texto digitado (reutilizável dentro de qualquer diálogo).
// ------------------------------------------------------------
export function NpcTypeText({ text, speedMs = 18 }: { text: string; speedMs?: number }) {
  const { shown } = useNpcTypewriter(text, speedMs);
  return <>{shown}</>;
}

// ------------------------------------------------------------
// Linha paginada: digita o texto; clique completa a fala e o
// próximo clique avança (via onAdvance). Seta pixel-art indica.
// Reutilizada pelos diálogos da saga (recompensas/choices ficam
// no footer, fora desta área clicável ou com stopPropagation).
// ------------------------------------------------------------
export function NpcPagedLine({
  text,
  pageLabel,
  onAdvance,
  accent = "#ffcc33",
  minHeight = 36,
}: {
  text: string;
  pageLabel?: string;
  onAdvance: () => void;
  accent?: string;
  minHeight?: number;
}) {
  const { shown, done, complete } = useNpcTypewriter(text);
  return (
    <div
      onClick={() => { if (!done) complete(); else onAdvance(); }}
      style={{ cursor: "pointer", position: "relative", paddingBottom: 16 }}
    >
      <div style={{
        color: "#fff", fontSize: 12, lineHeight: 1.5,
        fontFamily: "'Courier New', monospace",
        textShadow: "1px 1px 0 #000", whiteSpace: "pre-wrap", minHeight,
      }}>
        {shown}
      </div>
      {pageLabel && (
        <div style={{ textAlign: "right", marginTop: 4, color: accent, fontSize: 10, fontWeight: 900, paddingRight: 18 }}>
          {pageLabel}
        </div>
      )}
      <NpcAdvanceArrow visible={done} color={accent} />
    </div>
  );
}

// ------------------------------------------------------------
// Painel de recompensa — item + nome + qtd + RECEBER RECOMPENSA.
// Entrega só acontece no onClaim (clique explícito do jogador).
// ------------------------------------------------------------
export type NpcRewardItem = { itemId: string; qty: number } | { gold: number };

export function NpcRewardPanel({
  rewards,
  claimed,
  onClaim,
  accent = "#f5cf6b",
}: {
  rewards: NpcRewardItem[];
  claimed: boolean;
  onClaim: () => void;
  accent?: string;
}) {
  const labelOf = (r: NpcRewardItem) =>
    "gold" in r ? `${r.gold.toLocaleString()} ouro` : `${r.qty}× ${r.itemId.replace(/_/g, " ").toUpperCase()}`;
  return (
    <div
      style={{
        marginTop: 8, padding: 8, borderRadius: 8,
        background: "rgba(0,0,0,0.45)",
        border: `2px solid ${accent}`,
        boxShadow: `0 0 14px ${accent}55, inset 0 0 12px rgba(0,0,0,0.5)`,
      }}
    >
      <style>{`@keyframes npcRewardGlow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.35); } }`}</style>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: accent, marginBottom: 6, textAlign: "center" }}>
        ✦ RECOMPENSA ✦
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
        {rewards.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, padding: "4px 8px",
              animation: "npcRewardGlow 1.8s ease-in-out infinite",
            }}
          >
            {"gold" in r
              ? <span style={{ fontSize: 20 }}>🪙</span>
              : <ItemPixelIcon id={r.itemId} size={28} />}
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>{labelOf(r)}</span>
          </div>
        ))}
      </div>
      {!claimed ? (
        <button
          onClick={(e) => { e.stopPropagation(); onClaim(); }}
          style={{
            width: "100%", padding: "9px",
            background: `linear-gradient(180deg, ${accent}, ${accent}99)`,
            color: "#0b0510", border: `2px solid #fff3`,
            borderRadius: 8, fontWeight: 900, fontSize: 12, letterSpacing: 1,
            cursor: "pointer", boxShadow: `0 3px 0 rgba(0,0,0,0.55), 0 0 16px ${accent}66`,
          }}
        >
          🎁 RECEBER RECOMPENSA
        </button>
      ) : (
        <div style={{ textAlign: "center", fontSize: 11, color: "#5ec26a", fontWeight: 800 }}>
          ✓ Recompensa recebida!
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Caixa de diálogo completa (NPCs simples: gordin/luluzinha/etc).
// Compacta, ancorada na base; não cobre a tela.
// ------------------------------------------------------------
export function NpcDialog({
  kind,
  name,
  portraitUrl,
  text,
  pageLabel,
  canAdvance,
  onAdvance,
  onClose,
  footer,
}: {
  kind: string;
  name?: string;
  portraitUrl?: string;
  text: string;
  pageLabel?: string;
  canAdvance: boolean;
  onAdvance: () => void;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  const theme = npcThemeFor(kind);
  const { shown, done, complete } = useNpcTypewriter(text);

  return (
    <div
      onClick={() => { if (!done) complete(); else onAdvance(); }}
      style={{
        position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)",
        width: "min(560px, 92vw)",
        background: theme.bg,
        border: `3px solid ${theme.frame}`,
        outline: `2px solid ${theme.inner}`,
        borderRadius: 8,
        boxShadow: `0 0 0 2px #0b0510, 0 0 26px ${theme.glow}, 0 8px 24px rgba(0,0,0,0.55)`,
        padding: 10, display: "flex", gap: 10, alignItems: "flex-start",
        zIndex: 9990, cursor: "pointer",
        imageRendering: "pixelated",
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "absolute", top: -10, right: -10, width: 22, height: 22, borderRadius: "50%",
          background: "#b91c1c", border: `2px solid ${theme.frame}`, color: "#fff",
          fontWeight: 900, fontSize: 12, display: "grid", placeItems: "center",
          cursor: "pointer", zIndex: 1, boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        }}
        title="Fechar"
      >✕</button>

      {portraitUrl && (
        <div style={{
          width: 56, height: 56, border: `2px solid ${theme.frame}`, borderRadius: 6,
          overflow: "hidden", background: "#0b0510", flexShrink: 0,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
        }}>
          <div style={{
            width: "100%", height: "100%",
            backgroundImage: `url(${portraitUrl})`,
            backgroundSize: "400% 400%", backgroundPosition: "0% 0%",
            imageRendering: "pixelated",
          }} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, position: "relative", paddingBottom: 14 }}>
        <div style={{
          display: "inline-block", fontSize: 10, fontWeight: 900, letterSpacing: 2,
          color: "#0b0510", background: theme.accent,
          padding: "1px 8px", borderRadius: 4, marginBottom: 5,
          boxShadow: "1px 1px 0 #000",
        }}>
          {name ?? theme.name}
        </div>
        <div style={{
          color: "#fff", fontSize: 12, lineHeight: 1.5,
          fontFamily: "'Courier New', monospace",
          textShadow: "1px 1px 0 #000", whiteSpace: "pre-wrap", minHeight: 36,
        }}>
          {shown}
        </div>
        {footer}
        {pageLabel && (
          <div style={{ textAlign: "right", marginTop: 4, color: theme.accent, fontSize: 10, fontWeight: 900, paddingRight: 18 }}>
            {pageLabel}
          </div>
        )}
        <NpcAdvanceArrow visible={done && canAdvance} color={theme.accent} />
      </div>
    </div>
  );
}
