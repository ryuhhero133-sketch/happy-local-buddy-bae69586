import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import eggSprite from "@/assets/black-mitic-egg.png";

// ============================================================================
// Black Mitic Egg — pet system
// - Sprite flutuante seguindo o treinador
// - Aura roxa animada + raios + partículas
// - Ao clicar abre HUD premium
// - Alimentação com Elemental Stones existentes (50 unidades)
// - Cooldown de digestão: 7 horas
// - Armazena afinidade por elemento (para uso futuro no nascimento)
// ============================================================================

export const BLACK_EGG_ITEM_ID = "black_mitic_egg";
export const BLACK_EGG_ITEM_NAME = "Black Mitic Egg 🥚";
export const BLACK_EGG_ITEM_DESC =
  "Black Mitic Egg — ovo lendário que flutua ao seu lado. Alimente com Elemental Stones (50 por vez) para influenciar o elemento do futuro Pokémon. Cooldown de 7 horas por alimentação.";

const DIGEST_MS = 7 * 60 * 60 * 1000; // 7h
const FEED_COST = 50;

const ELEMENTS = [
  { id: "grass",    stone: "stone_grass",    label: "Planta",    color: "#3fd06b", emoji: "🌿" },
  { id: "fire",     stone: "stone_fire",     label: "Fogo",      color: "#ff6b3d", emoji: "🔥" },
  { id: "water",    stone: "stone_water",    label: "Água",      color: "#4fb8ff", emoji: "💧" },
  { id: "electric", stone: "stone_electric", label: "Elétrico",  color: "#ffd84d", emoji: "⚡" },
  { id: "dark",     stone: "stone_dark",     label: "Sombrio",   color: "#a066ff", emoji: "🌑" },
  { id: "dragon",   stone: "stone_dragon",   label: "Dragão",    color: "#ff5aa8", emoji: "🐉" },
] as const;

type ElementId = typeof ELEMENTS[number]["id"];
type StoneId = typeof ELEMENTS[number]["stone"];

export type BlackEggState = {
  affinity: Record<ElementId, number>;
  totalFed: number;
  digestUntil: number; // ts ms
  history: { ts: number; element: ElementId; amount: number }[];
};

function emptyState(): BlackEggState {
  return {
    affinity: { grass: 0, fire: 0, water: 0, electric: 0, dark: 0, dragon: 0 },
    totalFed: 0,
    digestUntil: 0,
    history: [],
  };
}

function storageKey(uid: string) {
  return `rubym.blackMiticEgg.v1.${uid}`;
}

function loadState(uid: string): BlackEggState {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return emptyState();
    const p = JSON.parse(raw);
    return {
      affinity: { ...emptyState().affinity, ...(p?.affinity ?? {}) },
      totalFed: Number(p?.totalFed ?? 0),
      digestUntil: Number(p?.digestUntil ?? 0),
      history: Array.isArray(p?.history) ? p.history.slice(0, 20) : [],
    };
  } catch {
    return emptyState();
  }
}

function saveState(uid: string, s: BlackEggState) {
  try { localStorage.setItem(storageKey(uid), JSON.stringify(s)); } catch { /* ignore */ }
}

// ================================================================
// Sprite (in-world) — segue o treinador, aura + raios + partículas
// ================================================================
export function BlackMiticEggSprite(props: {
  trainerX: number;
  trainerY: number;
  visible: boolean;
  onClick: () => void;
}) {
  const { trainerX, trainerY, visible, onClick } = props;
  const [pos, setPos] = useState({ x: trainerX - 42, y: trainerY - 8 });
  const posRef = useRef(pos);
  const targetRef = useRef({ x: trainerX - 42, y: trainerY - 8 });
  const rafRef = useRef<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    targetRef.current = { x: trainerX - 46, y: trainerY - 10 };
  }, [trainerX, trainerY]);

  useEffect(() => {
    if (!visible) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = targetRef.current;
      const cur = posRef.current;
      const nx = cur.x + (t.x - cur.x) * Math.min(1, dt * 5);
      const ny = cur.y + (t.y - cur.y) * Math.min(1, dt * 5);
      posRef.current = { x: nx, y: ny };
      setPos(posRef.current);
      setTick((v) => (v + 1) % 3600);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [visible]);

  if (!visible) return null;

  const bob = Math.sin(tick * 0.09) * 5;
  const rot = Math.sin(tick * 0.05) * 6;
  const auraPulse = 0.7 + Math.sin(tick * 0.08) * 0.3;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y + bob,
        width: 46, height: 46,
        transform: "translate(-50%, -50%)",
        zIndex: Math.round(trainerY) + 1,
        cursor: "pointer",
        pointerEvents: "auto",
      }}
      title="Black Mitic Egg — clique para abrir"
    >
      {/* Aura pulsando */}
      <div style={{
        position: "absolute", inset: -18,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(160,80,255,${0.45 * auraPulse}) 0%, rgba(120,40,220,${0.25 * auraPulse}) 40%, transparent 70%)`,
        filter: "blur(4px)",
        pointerEvents: "none",
      }} />
      {/* Raios elétricos roxos */}
      {[0, 1, 2, 3].map((i) => {
        const ang = (tick * 0.04 + i * (Math.PI / 2)) % (Math.PI * 2);
        const r = 22 + Math.sin(tick * 0.15 + i) * 4;
        const x = 23 + Math.cos(ang) * r;
        const y = 23 + Math.sin(ang) * r;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: 3, height: 3,
            background: "#c58bff",
            boxShadow: "0 0 6px #a066ff, 0 0 12px #7020c0",
            borderRadius: 1,
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }} />
        );
      })}
      {/* Partículas */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const p = ((tick * 0.6 + i * 24) % 60) / 60;
        const ang = i * (Math.PI / 3);
        const rad = 8 + p * 22;
        const x = 23 + Math.cos(ang) * rad;
        const y = 23 + Math.sin(ang) * rad - p * 6;
        const op = 1 - p;
        return (
          <div key={`p${i}`} style={{
            position: "absolute", left: x, top: y,
            width: 2, height: 2,
            background: "#e0b8ff",
            boxShadow: "0 0 3px #a066ff",
            opacity: op,
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }} />
        );
      })}
      {/* Sprite */}
      <img
        src={eggSprite}
        alt=""
        draggable={false}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          imageRendering: "pixelated",
          transform: `rotate(${rot}deg)`,
          filter: "drop-shadow(0 3px 4px rgba(90,20,180,0.7)) drop-shadow(0 0 6px rgba(160,80,255,0.6))",
        }}
      />
    </div>
  );
}

// ================================================================
// HUD Modal
// ================================================================
export function BlackMiticEggHud(props: {
  open: boolean;
  onClose: () => void;
  uid: string;
  stones: Partial<Record<StoneId, number>>;
  onConsumeStone: (stoneId: StoneId, qty: number) => boolean;
  onNotify?: (msg: string) => void;
}) {
  const { open, onClose, uid, stones, onConsumeStone, onNotify } = props;
  const [state, setState] = useState<BlackEggState>(() => loadState(uid));
  const [now, setNow] = useState(Date.now());

  // Recarrega quando abrir ou trocar de uid
  useEffect(() => { if (open) setState(loadState(uid)); }, [open, uid]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [open]);

  const digesting = state.digestUntil > now;
  const digestRemain = Math.max(0, state.digestUntil - now);
  const digestPct = digesting ? 1 - digestRemain / DIGEST_MS : 1;

  const total = Math.max(1, Object.values(state.affinity).reduce((a, b) => a + b, 0));
  const dominant = useMemo(() => {
    let best: ElementId = "grass"; let bv = -1;
    for (const el of ELEMENTS) {
      const v = state.affinity[el.id] ?? 0;
      if (v > bv) { bv = v; best = el.id; }
    }
    return best;
  }, [state]);

  const feed = (el: typeof ELEMENTS[number]) => {
    if (digesting) { onNotify?.("O ovo ainda está em digestão."); return; }
    const have = stones[el.stone] ?? 0;
    if (have < FEED_COST) { onNotify?.(`Você precisa de ${FEED_COST}× ${el.label} Stone.`); return; }
    const ok = onConsumeStone(el.stone, FEED_COST);
    if (!ok) { onNotify?.("Falha ao consumir a Stone."); return; }
    const next: BlackEggState = {
      ...state,
      affinity: { ...state.affinity, [el.id]: (state.affinity[el.id] ?? 0) + FEED_COST },
      totalFed: state.totalFed + FEED_COST,
      digestUntil: Date.now() + DIGEST_MS,
      history: [{ ts: Date.now(), element: el.id, amount: FEED_COST }, ...state.history].slice(0, 12),
    };
    setState(next);
    saveState(uid, next);
    onNotify?.(`Alimentado com ${FEED_COST}× ${el.label}. Digestão iniciada (7h).`);
  };

  if (!open) return null;

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const node = (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(30,10,60,0.65), rgba(0,0,0,0.85))",
        zIndex: 999998,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(760px, 96vw)", maxHeight: "92vh", overflowY: "auto",
          background: "linear-gradient(180deg, #1a0a30 0%, #0f0620 100%)",
          border: "2px solid #7d3fd6",
          boxShadow: "0 0 32px rgba(160,80,255,0.55), inset 0 0 24px rgba(60,20,120,0.4)",
          borderRadius: 14,
          color: "#f0e6ff",
          fontFamily: "'Press Start 2P', monospace, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 18px",
          background: "linear-gradient(90deg, rgba(120,40,220,0.35), rgba(60,15,120,0.1))",
          borderBottom: "1px solid rgba(160,80,255,0.4)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 14, color: "#e0b8ff", letterSpacing: 2 }}>✦ BLACK MITIC EGG ✦</div>
            <div style={{ fontSize: 10, color: "#a888c8", marginTop: 4 }}>Elemento dominante: <b style={{ color: ELEMENTS.find(e => e.id === dominant)?.color }}>{ELEMENTS.find(e => e.id === dominant)?.label}</b></div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(120,40,220,0.3)", color: "#fff",
            border: "1px solid #a066ff", borderRadius: 6,
            padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11,
          }}>FECHAR ✕</button>
        </div>

        {/* Corpo */}
        <div style={{ padding: 18, display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
          {/* Esquerda: sprite grande + status */}
          <div style={{
            background: "rgba(30,10,60,0.6)",
            border: "1px solid rgba(160,80,255,0.35)",
            borderRadius: 10, padding: 12,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <div style={{ position: "relative", width: 160, height: 160 }}>
              <div style={{
                position: "absolute", inset: -10,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(160,80,255,0.5), transparent 70%)",
                animation: "blackEggPulse 2s ease-in-out infinite",
              }} />
              <img src={eggSprite} alt="" style={{
                position: "relative",
                width: "100%", height: "100%",
                imageRendering: "pixelated",
                filter: "drop-shadow(0 0 8px rgba(160,80,255,0.9))",
                animation: "blackEggFloat 3s ease-in-out infinite",
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#d8bfff", textAlign: "center" }}>
              Total alimentado: <b>{state.totalFed}</b><br />
              Alimentações: <b>{state.history.length}</b>
            </div>
            <div style={{ width: "100%", fontSize: 9, color: "#c8a0e8" }}>
              <div style={{ marginBottom: 4 }}>{digesting ? "🌙 Digestão" : "✅ Pronto para alimentar"}</div>
              <div style={{ height: 10, background: "rgba(0,0,0,0.5)", borderRadius: 5, overflow: "hidden", border: "1px solid rgba(160,80,255,0.4)" }}>
                <div style={{
                  height: "100%", width: `${digestPct * 100}%`,
                  background: digesting
                    ? "linear-gradient(90deg, #7d3fd6, #a066ff)"
                    : "linear-gradient(90deg, #4fd66b, #a0ff8f)",
                  transition: "width 0.4s ease",
                }} />
              </div>
              {digesting && <div style={{ marginTop: 4, textAlign: "center", color: "#e0b8ff" }}>{fmt(digestRemain)}</div>}
            </div>
          </div>

          {/* Direita: afinidades + alimentação */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              background: "rgba(30,10,60,0.5)",
              border: "1px solid rgba(160,80,255,0.3)",
              borderRadius: 10, padding: 12,
            }}>
              <div style={{ fontSize: 11, color: "#e0b8ff", marginBottom: 8, letterSpacing: 1 }}>◆ AFINIDADE ELEMENTAL</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ELEMENTS.map((el) => {
                  const val = state.affinity[el.id] ?? 0;
                  const pct = Math.round((val / total) * 100);
                  return (
                    <div key={el.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 44px", gap: 8, alignItems: "center", fontSize: 10 }}>
                      <span style={{ color: el.color }}>{el.emoji} {el.label}</span>
                      <div style={{ height: 10, background: "rgba(0,0,0,0.5)", borderRadius: 5, overflow: "hidden", border: `1px solid ${el.color}55` }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: el.color, boxShadow: `0 0 6px ${el.color}` }} />
                      </div>
                      <span style={{ textAlign: "right", color: "#d8bfff" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              background: "rgba(30,10,60,0.5)",
              border: "1px solid rgba(160,80,255,0.3)",
              borderRadius: 10, padding: 12,
            }}>
              <div style={{ fontSize: 11, color: "#e0b8ff", marginBottom: 8, letterSpacing: 1 }}>◆ ALIMENTAR ({FEED_COST} Stones)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {ELEMENTS.map((el) => {
                  const have = stones[el.stone] ?? 0;
                  const canFeed = !digesting && have >= FEED_COST;
                  return (
                    <button
                      key={el.id}
                      onClick={() => feed(el)}
                      disabled={!canFeed}
                      style={{
                        background: canFeed
                          ? `linear-gradient(180deg, ${el.color}44, ${el.color}22)`
                          : "rgba(40,20,60,0.5)",
                        border: `1px solid ${canFeed ? el.color : "#4a2a6a"}`,
                        color: canFeed ? "#fff" : "#7a5a9a",
                        borderRadius: 8,
                        padding: "8px 6px",
                        cursor: canFeed ? "pointer" : "not-allowed",
                        fontSize: 10,
                        display: "flex", flexDirection: "column", gap: 3, alignItems: "center",
                        boxShadow: canFeed ? `0 0 8px ${el.color}55` : "none",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{el.emoji}</span>
                      <span style={{ fontWeight: 700 }}>{el.label}</span>
                      <span style={{ fontSize: 9, color: have >= FEED_COST ? "#c8ffd0" : "#ff9090" }}>{have}/{FEED_COST}</span>
                    </button>
                  );
                })}
              </div>
              {digesting && (
                <div style={{ marginTop: 10, fontSize: 10, color: "#ffb857", textAlign: "center" }}>
                  Ovo em digestão — aguarde para alimentar novamente.
                </div>
              )}
            </div>

            <div style={{
              background: "rgba(30,10,60,0.5)",
              border: "1px solid rgba(160,80,255,0.3)",
              borderRadius: 10, padding: 12,
            }}>
              <div style={{ fontSize: 11, color: "#e0b8ff", marginBottom: 8, letterSpacing: 1 }}>◆ HISTÓRICO</div>
              {state.history.length === 0 ? (
                <div style={{ fontSize: 10, color: "#8a6ab0", textAlign: "center", padding: 8 }}>Nenhuma alimentação ainda.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 140, overflowY: "auto" }}>
                  {state.history.map((h, i) => {
                    const el = ELEMENTS.find(e => e.id === h.element)!;
                    const ago = Math.floor((now - h.ts) / 60000);
                    return (
                      <div key={i} style={{ fontSize: 9, color: "#c8a0e8", display: "flex", justifyContent: "space-between", padding: "2px 4px", background: "rgba(0,0,0,0.25)", borderRadius: 4 }}>
                        <span><span style={{ color: el.color }}>{el.emoji} {el.label}</span> +{h.amount}</span>
                        <span>{ago < 1 ? "agora" : ago < 60 ? `${ago}min` : `${Math.floor(ago/60)}h`}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes blackEggFloat {
            0%,100% { transform: translateY(0) rotate(-4deg); }
            50% { transform: translateY(-10px) rotate(4deg); }
          }
          @keyframes blackEggPulse {
            0%,100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.15); }
          }
        `}</style>
      </div>
    </div>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}
