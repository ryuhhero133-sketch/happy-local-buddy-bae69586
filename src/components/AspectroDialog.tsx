// ============================================================
// IDLEMON REVO — Diálogo cinematográfico do ASPECTRO.
// Conversa de verdade: NPC fala na barra roxa (typewriter),
// JOGADOR pergunta em botões azuis (toque para enviar),
// pausas dramáticas no meio. Botões de quest aparecem SÓ no fim.
// ============================================================
import { useNpcTypewriter, NpcAdvanceArrow } from "@/components/NpcDialog";
import type { AspectroStep } from "@/game/aspectroQuest";

const NPC_BAR = "linear-gradient(90deg, #2e1065 0%, #4c1d95 60%, #2e1065 100%)";
const PLAYER_BAR = "linear-gradient(90deg, #0c2a4d 0%, #155e9c 60%, #0c2a4d 100%)";

export function AspectroDialog({
  portraitUrl,
  steps,
  page,
  questLabel,
  onAdvance,
  onClose,
  footer,
}: {
  portraitUrl?: string;
  steps: AspectroStep[];
  page: number;
  questLabel?: string;
  onAdvance: () => void;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  const step = steps[page] ?? steps[steps.length - 1];
  const isLast = page >= steps.length - 1;
  const { shown, done, complete } = useNpcTypewriter(step.text);
  const isNpc = step.who === "npc";
  const isPlayer = step.who === "player";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (isPlayer) return; // jogador avança pelo botão de pergunta
        if (!done) complete();
        else onAdvance();
      }}
      style={{
        position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)",
        width: "min(560px, 92vw)",
        background: "linear-gradient(180deg, #150b28 0%, #0a0514 100%)",
        border: "3px solid #7c3aed",
        outline: "2px solid #2e1065",
        borderRadius: 8,
        boxShadow: "0 0 0 2px #0b0510, 0 0 30px rgba(124,58,237,0.5), 0 8px 24px rgba(0,0,0,0.55)",
        padding: 10, display: "flex", gap: 10, alignItems: "flex-start",
        zIndex: 9990, cursor: isPlayer ? "default" : "pointer",
        imageRendering: "pixelated",
      }}
    >
      <style>{`@keyframes aspectroSpeak { 0%,100% { box-shadow: 0 0 6px rgba(124,58,237,0.5); } 50% { box-shadow: 0 0 18px rgba(167,139,250,0.95); } } @keyframes aspectroDots { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }`}</style>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "absolute", top: -10, right: -10, width: 22, height: 22, borderRadius: "50%",
          background: "#b91c1c", border: "2px solid #7c3aed", color: "#fff",
          fontWeight: 900, fontSize: 12, display: "grid", placeItems: "center",
          cursor: "pointer", zIndex: 1, boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        }}
        title="Fechar"
      >✕</button>

      {portraitUrl && (
        <div style={{
          width: 56, height: 56, border: "2px solid #7c3aed", borderRadius: 6,
          overflow: "hidden", background: "#0b0510", flexShrink: 0,
          animation: isNpc ? "aspectroSpeak 1.6s ease-in-out infinite" : "none",
        }}>
          <div style={{
            width: "100%", height: "100%",
            backgroundImage: `url(${portraitUrl})`,
            backgroundSize: "400% 400%", backgroundPosition: "0% 0%",
            imageRendering: "pixelated",
          }} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, position: "relative", paddingBottom: isNpc && !isLast ? 14 : 2 }}>
        {/* Barra do falante — diferente para NPC e jogador */}
        <div style={{
          display: "inline-block", fontSize: 10, fontWeight: 900, letterSpacing: 2,
          color: "#fff", background: isPlayer ? PLAYER_BAR : NPC_BAR,
          border: `1px solid ${isPlayer ? "#38bdf8" : "#a78bfa"}`,
          padding: "2px 10px", borderRadius: 4, marginBottom: 6,
          boxShadow: "1px 1px 0 #000",
        }}>
          {isPlayer ? "🎒 VOCÊ" : step.who === "pause" ? "🌑 ..." : "🌑 ASPECTRO"}
        </div>

        {isPlayer ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAdvance(); }}
            style={{
              display: "block", width: "100%", textAlign: "left",
              background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.55)",
              color: "#e0f2fe", padding: "8px 10px", borderRadius: 8,
              cursor: "pointer", fontSize: 12, fontWeight: 700, lineHeight: 1.5,
              fontFamily: "'Courier New', monospace", textShadow: "1px 1px 0 #000",
            }}
          >
            <span style={{ color: "#7dd3fc", fontWeight: 900 }}>❝ {step.text}</span>
            <span style={{ display: "block", textAlign: "right", marginTop: 6, color: "#7dd3fc", fontSize: 10, fontWeight: 900 }}>
              TOQUE PARA PERGUNTAR ◆
            </span>
          </button>
        ) : step.who === "pause" ? (
          <div style={{
            color: "#a78bfa", fontSize: 22, fontWeight: 900, letterSpacing: 8,
            textAlign: "center", padding: "2px 0",
            animation: "aspectroDots 1.2s ease-in-out infinite",
            fontFamily: "'Courier New', monospace",
          }}>
            ...
          </div>
        ) : (
          <div style={{
            color: "#f3e8ff", fontSize: 12, lineHeight: 1.55,
            fontFamily: "'Courier New', monospace",
            textShadow: "1px 1px 0 #000", whiteSpace: "pre-wrap", minHeight: 36,
            background: "rgba(124,58,237,0.10)",
            borderLeft: "3px solid #7c3aed",
            padding: "6px 8px", borderRadius: "0 6px 6px 0",
          }}>
            {shown}
          </div>
        )}

        {/* Quest SÓ no fim do diálogo */}
        {isLast && footer}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{ color: "#8b7bb8", fontSize: 9, fontWeight: 800 }}>
            {questLabel ?? ""}
          </span>
          <span style={{ color: "#a78bfa", fontSize: 10, fontWeight: 900, paddingRight: 18 }}>
            fala {page + 1}/{steps.length}
          </span>
        </div>
        <NpcAdvanceArrow visible={isNpc && done && !isLast} color="#a78bfa" />
      </div>
    </div>
  );
}
