// ============================================================
// EGG Emerald — ovo simples que segue o jogador
// - 5 stones DO MESMO TIPO para desbloquear → choca em 1 hora.
// - Nasce pokémon Comum (65%) / Raro (25%) / Épico (10%) do elemento.
// - Sem lendários/míticos. Sempre 3 traits (pool modesta, sem épicos).
// - Nada comparado ao Black Mítico: sem diário, sem bônus, sem PLUS.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import eggSprite from "@/assets/black-mitic-egg.png";
import { ELEMENTS } from "@/components/BlackMiticEggPet";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";

export const EMERALD_EGG_ITEM_ID = "emerald_egg";
export const EMERALD_EGG_DESCRIPTION =
  "EGG Emerald — alimente com 5 Elemental Stones DO MESMO TIPO e choca em 1 hora. Nasce pokémon Comum (65%), Raro (25%) ou Épico (10%) do elemento, sempre com 3 traits.";

export const EMERALD_FEED_COST = 5;
export const EMERALD_HATCH_MS = 60 * 60 * 1000; // 1h incubação
const EMERALD_TRAIT_SLOTS = 3;

type EmeraldElementId = (typeof ELEMENTS)[number]["id"];
type EmeraldStoneId = (typeof ELEMENTS)[number]["stone"];

// Sorte da raridade ao chocar.
const EMERALD_RATES = { common: 0.65, rare: 0.25, epic: 0.1 } as const;

// Pools por elemento — SÓ comum/raro/épico (sem lendários/míticos).
const EMERALD_POOLS: Record<EmeraldElementId, { common: string[]; rare: string[]; epic: string[] }> = {
  grass: {
    common: ["caterpie", "weedle", "metapod", "kakuna"],
    rare: ["butterfree", "ivysaur", "tangela", "gloom", "weepinbell"],
    epic: ["venusaur", "victreebel", "vileplume"],
  },
  fire: {
    common: ["charmander", "vulpix", "growlithe"],
    rare: ["charmeleon", "magmar"],
    epic: ["charizard", "arcanine", "flareon"],
  },
  water: {
    common: ["squirtle", "poliwag", "psyduck"],
    rare: ["wartortle"],
    epic: ["blastoise", "vaporeon", "lapras", "gyarados"],
  },
  electric: {
    common: ["pikachu", "voltorb", "magnemite"],
    rare: ["electabuzz"],
    epic: ["jolteon", "raichu", "magneton"],
  },
  dark: {
    common: ["ekans", "gastly", "meowth"],
    rare: ["arbok", "haunter", "muk"],
    epic: ["gengar", "umbreon"],
  },
  dragon: {
    common: [],
    rare: [],
    epic: ["dragonair", "exeggutor_alola"],
  },
};

// Traits modestos (sem épicos — nada comparado ao Black Mítico).
const EMERALD_TRAITS_COMMON = ["feroz", "resistente", "agil", "sortudo"];
const EMERALD_TRAITS_UNCOMMON = ["sabio", "curador", "venenoso", "brutal", "guardiao"];
const EMERALD_TRAITS_RARE = ["eletrizado", "precioso", "prodigio", "mistico", "esquivo", "vampirico", "colosso"];

export function rollEmeraldTraits(): string[] {
  const picked: string[] = [];
  while (picked.length < EMERALD_TRAIT_SLOTS) {
    const r = Math.random();
    const pool = r < 0.5 ? EMERALD_TRAITS_COMMON : r < 0.82 ? EMERALD_TRAITS_UNCOMMON : EMERALD_TRAITS_RARE;
    const candidates = pool.filter((t) => !picked.includes(t));
    if (candidates.length === 0) break;
    picked.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  return picked;
}

export function rollEmeraldSpecies(element: EmeraldElementId): { species: string; tier: "common" | "rare" | "epic" } {
  const pools = EMERALD_POOLS[element];
  const r = Math.random();
  const tier: "common" | "rare" | "epic" = r < EMERALD_RATES.common ? "common" : r < EMERALD_RATES.common + EMERALD_RATES.rare ? "rare" : "epic";
  let pool = pools[tier];
  if (pool.length === 0) pool = [...pools.common, ...pools.rare, ...pools.epic];
  return { species: pool[Math.floor(Math.random() * pool.length)], tier };
}

type EmeraldEggState = {
  element: EmeraldElementId | null;
  activatedAt: number; // 0 = ainda não ativado
};

function storageKey(uid: string) {
  return `rubym.emeraldEgg.v1.${uid}`;
}

function loadEmeraldState(uid: string): EmeraldEggState | null {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return null;
    const p = JSON.parse(raw) as EmeraldEggState;
    if (!p || !p.element || !p.activatedAt) return null;
    return p;
  } catch {
    return null;
  }
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ================================================================
// Sprite (pet flutuante — lado direito do treinador, aura verde)
// ================================================================
export function EmeraldEggSprite(props: {
  trainerX: number;
  trainerY: number;
  visible: boolean;
  onClick: () => void;
}) {
  const { trainerX, trainerY, visible, onClick } = props;
  const [pos, setPos] = useState({ x: trainerX + 44, y: trainerY + 6 });
  const posRef = useRef(pos);
  const targetRef = useRef({ x: trainerX + 44, y: trainerY + 6 });
  const rafRef = useRef<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => { targetRef.current = { x: trainerX + 44, y: trainerY + 6 }; }, [trainerX, trainerY]);

  useEffect(() => {
    if (!visible) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = targetRef.current; const cur = posRef.current;
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

  const bob = Math.sin(tick * 0.09 + 1.5) * 5;
  const rot = Math.sin(tick * 0.05 + 1) * 6;
  const auraPulse = 0.7 + Math.sin(tick * 0.08) * 0.3;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", left: pos.x, top: pos.y + bob,
        width: 40, height: 40,
        transform: "translate(-50%, -50%)",
        zIndex: Math.round(trainerY) + 1,
        cursor: "pointer", pointerEvents: "auto",
      }}
      title="EGG Emerald — clique para abrir"
    >
      <div style={{
        position: "absolute", inset: -16, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(60,220,130,${0.45 * auraPulse}) 0%, rgba(20,140,80,${0.25 * auraPulse}) 40%, transparent 70%)`,
        filter: "blur(4px)", pointerEvents: "none",
      }} />
      <img
        src={eggSprite} alt="" draggable={false}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          imageRendering: "pixelated",
          transform: `rotate(${rot}deg)`,
          filter: "hue-rotate(70deg) saturate(1.3) drop-shadow(0 3px 4px rgba(10,90,50,0.7)) drop-shadow(0 0 6px rgba(60,220,130,0.6))",
        }}
      />
    </div>
  );
}

// ================================================================
// HUD Modal — 1 ovo ativo por vez
// ================================================================
export function EmeraldEggHud(props: {
  open: boolean;
  onClose: () => void;
  uid: string;
  itemCount: number;
  stones: Partial<Record<EmeraldStoneId, number>>;
  onConsumeStone: (stoneId: EmeraldStoneId, qty: number) => boolean;
  onHatched: (species: string, element: EmeraldElementId, traits: string[]) => void;
  onNotify?: (msg: string) => void;
}) {
  const { open, onClose, uid, itemCount, stones, onConsumeStone, onHatched, onNotify } = props;
  const [egg, setEgg] = useState<EmeraldEggState | null>(() => loadEmeraldState(uid));
  const [picked, setPicked] = useState<EmeraldElementId | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    setEgg(loadEmeraldState(uid));
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open, uid]);

  if (!open) return null;

  const persist = (next: EmeraldEggState | null) => {
    setEgg(next);
    try {
      if (!next) localStorage.removeItem(storageKey(uid));
      else localStorage.setItem(storageKey(uid), JSON.stringify(next));
    } catch { /* ignore */ }
  };

  const feed = (element: EmeraldElementId) => {
    if (egg) { onNotify?.("Já há um ovo incubando. Aguarde chocar."); return; }
    if (itemCount <= 0) { onNotify?.("Você não tem EGG Emerald na mochila."); return; }
    const stone = ELEMENTS.find((e) => e.id === element)!.stone;
    const have = stones[stone] ?? 0;
    if (have < EMERALD_FEED_COST) { onNotify?.(`Você precisa de ${EMERALD_FEED_COST}× Stone (${have}/${EMERALD_FEED_COST}).`); return; }
    if (!onConsumeStone(stone, EMERALD_FEED_COST)) { onNotify?.("Falha ao consumir as Stones."); return; }
    persist({ element, activatedAt: Date.now() });
    onNotify?.(`💚 +${EMERALD_FEED_COST} Stone → ovo desbloqueado! Choca em 1 hora.`);
  };

  const hatch = () => {
    if (!egg || !egg.element) return;
    const remain = Math.max(0, (egg.activatedAt + EMERALD_HATCH_MS) - now);
    if (remain > 0) { onNotify?.(`Ainda faltam ${fmt(remain)} para chocar.`); return; }
    const { species, tier } = rollEmeraldSpecies(egg.element);
    const traits = rollEmeraldTraits();
    const element = egg.element;
    persist(null);
    onHatched(species, element, traits);
    const tierLabel = tier === "common" ? "COMUM" : tier === "rare" ? "RARO" : "ÉPICO";
    onNotify?.(`💚 Nasceu ${species.toUpperCase()} (${tierLabel}) com 3 traits!`);
  };

  const remain = egg ? Math.max(0, (egg.activatedAt + EMERALD_HATCH_MS) - now) : 0;
  const ready = !!egg && remain <= 0;
  const pct = egg ? Math.min(1, (now - egg.activatedAt) / EMERALD_HATCH_MS) : 0;

  const node = (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(10,60,35,0.65), rgba(0,0,0,0.9))",
        zIndex: 999998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 94vw)", maxHeight: "90vh", overflowY: "auto",
          background: "linear-gradient(180deg, #0d2b1d 0%, #06170f 100%)",
          border: "2px solid #3fdc82", borderRadius: 12,
          boxShadow: "0 0 30px rgba(60,220,130,0.35)",
          padding: 16, color: "#d8ffe8",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, color: "#7dffbe" }}>💚 EGG EMERALD</div>
          <button onClick={onClose} style={{
            background: "rgba(0,0,0,0.4)", border: "1px solid #3fdc82", color: "#7dffbe",
            borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontWeight: 900,
          }}>×</button>
        </div>
        <div style={{ fontSize: 10, color: "#9adbb6", textAlign: "center", marginBottom: 10, lineHeight: 1.6 }}>
          Ovos na mochila: <b style={{ color: "#fff" }}>{itemCount}</b> · 5 stones DO MESMO TIPO desbloqueiam · choca em <b>1 hora</b> · sempre <b>3 traits</b>
        </div>
        <div style={{
          fontSize: 9, color: "#7dffbe", textAlign: "center", marginBottom: 12, lineHeight: 1.6,
          padding: "6px 8px", background: "rgba(125,255,190,0.07)",
          border: "1px dashed rgba(125,255,190,0.45)", borderRadius: 8,
        }}>
          🍀 Sorte ao chocar: <b>Comum 65%</b> · <b>Raro 25%</b> · <b>Épico 10%</b> — sem lendários!
        </div>

        {egg ? (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: 10,
              background: "rgba(0,0,0,0.35)", borderRadius: 8,
              border: "1px solid rgba(125,255,190,0.3)", marginBottom: 10,
            }}>
              <img src={eggSprite} alt="" width={44} height={44} style={{
                imageRendering: "pixelated",
                filter: "hue-rotate(70deg) saturate(1.3)",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#7dffbe" }}>
                  {ELEMENTS.find((e) => e.id === egg.element)?.emoji} {ELEMENTS.find((e) => e.id === egg.element)?.label.toUpperCase()} — incubando
                </div>
                <div style={{ height: 10, background: "rgba(0,0,0,0.5)", borderRadius: 5, overflow: "hidden", marginTop: 6, border: "1px solid rgba(125,255,190,0.4)" }}>
                  <div style={{
                    height: "100%", width: `${pct * 100}%`,
                    background: "linear-gradient(90deg, #1f8a50, #7dffbe)",
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <div style={{ fontSize: 9, color: "#9adbb6", marginTop: 4 }}>
                  {ready ? "✦ PRONTO PARA CHOCAR!" : `⏱ ${fmt(remain)} restantes`}
                </div>
              </div>
            </div>
            <button
              onClick={hatch}
              disabled={!ready}
              style={{
                width: "100%", padding: "10px 8px",
                background: ready ? "linear-gradient(180deg, #3fdc82, #1f8a50)" : "rgba(40,60,50,0.5)",
                border: "1px solid #7dffbe", borderRadius: 8,
                color: ready ? "#062a13" : "#7a9a88",
                fontWeight: 900, fontSize: 11, letterSpacing: 1,
                cursor: ready ? "pointer" : "not-allowed",
                boxShadow: ready ? "0 0 12px rgba(125,255,190,0.7)" : "none",
              }}
            >{ready ? "💚 CHOCAR AGORA" : "AGUARDE A INCUBAÇÃO"}</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 9, color: "#9adbb6", letterSpacing: 1, marginBottom: 8, textAlign: "center" }}>
              ESCOLHA O ELEMENTO E ALIMENTE COM 5 STONES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ELEMENTS.map((el) => {
                const have = stones[el.stone] ?? 0;
                const canFeed = itemCount > 0 && have >= EMERALD_FEED_COST;
                const isPicked = picked === el.id;
                return (
                  <div key={el.id} style={{
                    display: "grid", gridTemplateColumns: "40px 1fr auto", gap: 10, alignItems: "center",
                    padding: "8px 10px",
                    background: isPicked ? `linear-gradient(90deg, ${el.color}22, rgba(0,0,0,0.25))` : "rgba(0,0,0,0.25)",
                    border: `1px solid ${isPicked ? el.color + "77" : "rgba(125,255,190,0.18)"}`,
                    borderRadius: 8,
                  }}>
                    <button
                      onClick={() => setPicked(el.id)}
                      title={`${el.label}`}
                      style={{
                        width: 40, height: 40, borderRadius: 8, cursor: "pointer",
                        background: `radial-gradient(circle, ${el.color}44, ${el.color}11)`,
                        border: `1px solid ${el.color}88`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <ItemPixelIcon id={el.stone} size={28} />
                    </button>
                    <div style={{ minWidth: 0 }} onClick={() => setPicked(el.id)}>
                      <div style={{ fontSize: 10, color: el.color, fontWeight: 900, letterSpacing: 1 }}>
                        {el.emoji} {el.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 9, color: have >= EMERALD_FEED_COST ? "#c8ffd0" : "#ff9a9a", marginTop: 2 }}>
                        Stones: {have}/{EMERALD_FEED_COST}
                      </div>
                    </div>
                    <button
                      onClick={() => feed(el.id)}
                      disabled={!canFeed}
                      title={itemCount <= 0 ? "Sem EGG Emerald na mochila" : have < EMERALD_FEED_COST ? `Faltam ${EMERALD_FEED_COST - have} stones` : `Alimentar (${EMERALD_FEED_COST}× ${el.label})`}
                      style={{
                        minWidth: 72, padding: "8px 6px",
                        background: canFeed ? `linear-gradient(180deg, ${el.color}66, ${el.color}22)` : "rgba(40,50,45,0.5)",
                        border: `1px solid ${canFeed ? el.color : "#3a5a48"}`,
                        color: canFeed ? "#fff" : "#7a9a88",
                        borderRadius: 7, cursor: canFeed ? "pointer" : "not-allowed",
                        fontSize: 9, fontWeight: 800,
                        boxShadow: canFeed ? `0 0 10px ${el.color}66` : "none",
                      }}
                    >
                      ALIMENTAR 5×
                    </button>
                  </div>
                );
              })}
            </div>
            {itemCount <= 0 && (
              <div style={{ fontSize: 9, color: "#ffb857", textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
                Compre EGG Emerald na loja do Pokémarkt para começar.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
