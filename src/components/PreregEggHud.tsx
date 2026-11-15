import { createPortal } from "react-dom";
import eggSprite from "@/assets/black-mitic-egg.png";

type Reward = { hatch_at: string; hatched_at: string | null };

export function PreregEggHud({
  open, onClose, reward, now, busy, error, delivered, onHatch,
}: {
  open: boolean;
  onClose: () => void;
  reward: Reward | null;
  now: number;
  busy: boolean;
  error: string;
  delivered: boolean;
  onHatch: () => void;
}) {
  if (!open || !reward || typeof document === "undefined") return null;
  const remaining = Math.max(0, Date.parse(reward.hatch_at) - now);
  const pct = Math.max(0, Math.min(100, 100 * (1 - remaining / (30 * 60 * 1000))));
  const ready = remaining === 0;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.ceil((remaining % 60000) / 1000);
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999998, display: "grid", placeItems: "center", padding: 16, background: "radial-gradient(ellipse at center, rgba(10,60,35,0.65), rgba(0,0,0,0.9))" }}>
      <section onClick={(event) => event.stopPropagation()} aria-label="Ovo épico de pré-registro" style={{ width: "min(480px, 94vw)", maxHeight: "90dvh", overflowY: "auto", padding: 16, border: "2px solid #3fdc82", borderRadius: 12, background: "linear-gradient(180deg, #0d2b1d, #06170f)", boxShadow: "0 0 30px rgba(60,220,130,0.35)", color: "#d8ffe8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ color: "#7dffbe", letterSpacing: 1 }}>💚 OVO ÉPICO DE PRÉ-REGISTRO</strong>
          <button type="button" onClick={onClose} aria-label="Fechar ovo" style={{ background: "#102a1b", color: "#7dffbe", border: "1px solid #3fdc82", borderRadius: 6, cursor: "pointer" }}>×</button>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.5 }}>Este ovo acompanha você. Depois de 30 minutos, nasce um Pokémon inicial aleatório de fogo, planta ou água, sempre épico e nunca lendário.</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, border: "1px solid #3fdc8266", borderRadius: 8, background: "#06170f" }}>
          <img src={eggSprite} alt="Ovo de pré-registro" width={48} height={48} style={{ imageRendering: "pixelated", filter: "hue-rotate(70deg) saturate(1.3)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ color: "#7dffbe", fontSize: 12 }}>{reward.hatched_at ? "✨ Eclosão concluída" : ready ? "✨ Pronto para chocar!" : "🥚 Incubando..."}</strong>
            <div role="progressbar" aria-label="Incubação" aria-valuenow={reward.hatched_at ? 100 : Math.floor(pct)} aria-valuemin={0} aria-valuemax={100} style={{ height: 10, marginTop: 8, background: "#09150d", border: "1px solid #3fdc8266", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: `${reward.hatched_at ? 100 : pct}%`, height: "100%", background: "#3fdc82" }} />
            </div>
            <small>{reward.hatched_at ? delivered ? "Pokémon na Coleção" : "Libere espaço na Coleção para receber" : ready ? "Aguardando eclosão" : `${minutes} min ${String(seconds).padStart(2, "0")} s restantes`}</small>
          </div>
        </div>
        {ready && !reward.hatched_at && <button type="button" disabled={busy} onClick={onHatch} style={{ display: "block", margin: "14px auto 0", padding: "9px 16px", borderRadius: 8, background: "#3fdc82", color: "#092015", border: 0, fontWeight: 800, cursor: "pointer" }}>Chocar ovo ✨</button>}
        {error && <p role="alert" style={{ color: "#ff9b9b", fontSize: 12 }}>{error}</p>}
      </section>
    </div>,
    document.body,
  );
}
