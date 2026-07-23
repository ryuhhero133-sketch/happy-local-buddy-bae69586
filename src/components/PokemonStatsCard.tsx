// Card de status estilo MMO/RPG para exibir um pokémon do time/coleção.
import type { PetInstance } from "@/game/systems";
import { SPECIES_BASE, RARITY_NAME } from "@/game/systems";
import { computePower, elementsOf, ELEMENT_META, computeTeamSynergies } from "@/game/synergies";
import { TRAITS, TIER_COLOR } from "@/game/traits";
import { TraitIcon } from "@/components/TraitIcon";
import blackMiticBg from "@/assets/black-mitic-card-bg.jpg";

interface Props {
  pet: PetInstance;
  gifSrc?: string;
  team: PetInstance[];
  onClose: () => void;
  onMakeLeader?: () => void;
  onSell?: () => void;
  onToggleTeam?: () => void;
  inTeam?: boolean;
}

const RARITY_COLOR: Record<string, string> = {
  common: "#c8b8d0", uncommon: "#7ef2a2", rare: "#6bd4ff",
  epic: "#c084fc", legendary: "#f5cf6b", mythic: "#ff6b3d", mythic_shiny: "#ff97e1",
};

export function PokemonStatsCard({ pet, gifSrc, team, onClose, onMakeLeader, onSell, onToggleTeam, inTeam }: Props) {
  const base = SPECIES_BASE[pet.species];
  const elems = elementsOf(pet.species);
  const mainElem = elems[0];
  const meta = ELEMENT_META[mainElem];
  const rc = RARITY_COLOR[pet.rarity] ?? "#c8b8d0";
  const power = computePower(pet);
  const syn = computeTeamSynergies(team);

  const boost = pet.statBoost ?? 1;
  const scale = (v: number) => Math.round(v * (1 + pet.level / 15) * boost);
  const stats = base ? {
    hp: scale(base.hp), atk: scale(base.atk), def: scale(base.def),
    spa: scale(base.spa), spd: scale(base.spd), spe: scale(base.spe),
  } : null;

  const maxStat = stats ? Math.max(stats.hp, stats.atk, stats.def, stats.spa, stats.spd, stats.spe) : 1;

  const bar = (label: string, val: number, col: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 46, fontSize: 10, fontWeight: 900, letterSpacing: 1, color: "#c8b8d0" }}>{label}</div>
      <div style={{ flex: 1, height: 12, background: "rgba(0,0,0,0.55)", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(0,0,0,0.7)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.7)" }}>
        <div style={{
          width: `${(val / maxStat) * 100}%`, height: "100%",
          background: `linear-gradient(90deg, ${col}, ${col}bb)`,
          boxShadow: `0 0 6px ${col}aa`, transition: "width 400ms",
        }} />
      </div>
      <div style={{ width: 44, textAlign: "right", fontFamily: "monospace", fontSize: 11, color: col, fontWeight: 900 }}>{val}</div>
    </div>
  );

  const isBMP = !!pet.event && pet.event.startsWith("black_mitic_plus");
  const isBrilhant = !!pet.event && pet.event.includes("brilhant");
  const bmpLabel = isBrilhant ? "BLACK MITIC BRILHANT PLUS" : "BLACK MITIC PLUS";

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(560px, 96vw)", maxHeight: "92vh", overflowY: "auto",
        background: isBMP
          ? "linear-gradient(160deg, #1a0530 0%, #0a021a 55%, #050010 100%)"
          : `linear-gradient(160deg, ${meta.color}22 0%, #1a0f26 40%, #0b0510 100%)`,
        border: `3px solid ${isBMP ? "#a066ff" : rc}`,
        borderRadius: 20,
        boxShadow: isBMP
          ? "0 20px 60px rgba(0,0,0,0.85), 0 0 60px rgba(160,80,255,0.55), inset 0 1px 0 rgba(200,140,255,0.4)"
          : `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${rc}55, inset 0 1px 0 ${rc}44`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Fundo animado Black Mitic Plus */}
        {isBMP && (
          <>
            <div className="bmp-card-bg" style={{ backgroundImage: `url(${blackMiticBg})` }} />
            <div style={{
              position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
              background: "radial-gradient(circle at 50% 30%, rgba(160,80,255,0.35), transparent 65%)",
            }} />
            {/* Estrelas negras orbitando */}
            {[
              { a: 0,   r: 180, d: 9,  cls: "" },
              { a: 45,  r: 220, d: 11, cls: "s-lg" },
              { a: 90,  r: 160, d: 8,  cls: "" },
              { a: 135, r: 210, d: 12, cls: "" },
              { a: 180, r: 190, d: 10, cls: "s-lg" },
              { a: 225, r: 230, d: 13, cls: "" },
              { a: 270, r: 170, d: 9,  cls: "" },
              { a: 315, r: 200, d: 11, cls: "s-lg" },
            ].map((s, i) => (
              <span key={i} className={`bmp-star ${s.cls}`} style={{
                ["--a" as string]: `${s.a}deg`,
                ["--r" as string]: `${s.r}px`,
                animationDuration: `${s.d}s`,
              } as React.CSSProperties} />
            ))}
          </>
        )}
        {/* Halo elemental */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          background: `radial-gradient(circle at 50% 15%, ${meta.color}33, transparent 55%)`,
        }} />

        {/* Header */}
        <div style={{
          padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: `2px solid ${rc}55`, position: "relative",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#f7ecf7", textShadow: "0 2px 0 #000", textTransform: "uppercase", letterSpacing: 2 }}>
              {pet.species.replace(/_/g, " ")}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                background: isBMP
                  ? "linear-gradient(180deg, #a066ff, #4a1080)"
                  : `linear-gradient(180deg, ${rc}, ${rc}aa)`,
                color: isBMP ? "#fff5ff" : "#0b0510",
                fontSize: 9, fontWeight: 900, letterSpacing: 1,
                padding: "3px 8px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.4)",
                boxShadow: isBMP ? "0 0 10px rgba(160,80,255,0.8)" : undefined,
              }}>{isBMP ? bmpLabel : RARITY_NAME[pet.rarity]}</span>
              <span style={{ fontSize: 11, color: "#f5cf6b", fontWeight: 900 }}>Lv {pet.level}</span>
              {elems.map((e) => {
                const em = ELEMENT_META[e];
                return (
                  <span key={e} style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: 1,
                    padding: "3px 8px", borderRadius: 999,
                    background: `${em.color}22`, border: `1px solid ${em.color}88`, color: em.color,
                  }}>{em.emoji} {em.label}</span>
                );
              })}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: "1px solid #6a5a7c",
            background: "#2a1638", color: "#f7ecf7", fontSize: 16, fontWeight: 900, cursor: "pointer",
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Portrait + Power */}
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              width: 140, height: 140, borderRadius: 20,
              background: `radial-gradient(circle at 30% 25%, ${meta.color}55, ${meta.color}15 60%, rgba(0,0,0,0.6))`,
              border: `2.5px solid ${meta.color}`,
              boxShadow: `inset 0 0 24px ${meta.color}55, 0 0 24px ${meta.color}88`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {gifSrc && <img src={gifSrc} alt="" width={110} height={110} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.8))" }} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: "#c8b8d0", marginBottom: 2 }}>PODER TOTAL</div>
              <div style={{
                fontSize: 40, fontWeight: 900, fontFamily: "monospace",
                background: "linear-gradient(180deg, #ffe084, #b8862a)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                textShadow: `0 0 20px ${rc}66`, lineHeight: 1,
              }}>{power.toLocaleString()}</div>
              <div style={{ fontSize: 9, color: "#8a7a9c", marginTop: 6, letterSpacing: 1 }}>
                XP: {pet.xp} · HP: {Math.floor(pet.hp)}/{pet.maxHp}
              </div>
              {boost > 1 && (
                <div style={{ fontSize: 9, color: "#7ef2a2", marginTop: 2 }}>★ Bônus de status +{Math.round((boost-1)*100)}%</div>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{
              padding: 14, borderRadius: 12,
              background: "rgba(0,0,0,0.35)", border: "1px solid rgba(245,207,107,0.25)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: "#f5cf6b", marginBottom: 10 }}>⚔ ATRIBUTOS</div>
              {bar("HP",    stats.hp,  "#ff7a7a")}
              {bar("ATK",   stats.atk, "#ff9558")}
              {bar("DEF",   stats.def, "#7ec4ff")}
              {bar("S.ATK", stats.spa, "#c084fc")}
              {bar("S.DEF", stats.spd, "#7ef2a2")}
              {bar("VEL",   stats.spe, "#f5cf6b")}
            </div>
          )}

          {/* Traits (atributos bônus da captura) */}
          {(pet.traits && pet.traits.length > 0) && (
            <div style={{
              padding: 12, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(192,132,252,0.18), rgba(0,0,0,0.4))",
              border: "1px solid #c084fc66",
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: "#c084fc", marginBottom: 8 }}>
                ✨ TRAITS ({pet.traits.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {pet.traits.map((id) => {
                  const t = TRAITS[id]; if (!t) return null;
                  const col = TIER_COLOR[t.tier];
                  return (
                    <div key={id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px 6px 6px", borderRadius: 10,
                      background: `linear-gradient(135deg, ${col}22, rgba(0,0,0,0.35))`,
                      border: `1px solid ${col}88`,
                      minWidth: 160, flex: "1 1 220px",
                    }}>
                      <TraitIcon id={id} size={38} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: col, letterSpacing: 0.5 }}>{t.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: "#c8b8d0", lineHeight: 1.3 }}>{t.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sinergias que contribui */}
          <div style={{
            padding: 12, borderRadius: 12,
            background: `linear-gradient(135deg, ${meta.color}22, rgba(0,0,0,0.4))`,
            border: `1px solid ${meta.color}66`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: meta.color, marginBottom: 8 }}>
              {meta.emoji} SINERGIAS CONTRIBUÍDAS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {elems.map((e) => {
                const em = ELEMENT_META[e];
                const count = syn.byElement[e] ?? 0;
                return (
                  <div key={e} style={{
                    fontSize: 10, padding: "6px 10px", borderRadius: 8,
                    background: `${em.color}22`, border: `1px solid ${em.color}88`, color: em.color,
                    fontWeight: 900, letterSpacing: 0.5,
                  }}>{em.emoji} {em.label} <span style={{ opacity: 0.7 }}>({count}/5 no time)</span></div>
                );
              })}
            </div>
            {syn.effects.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 9, color: "#b8a8c8", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 900, color: "#f5cf6b", marginBottom: 4, letterSpacing: 2 }}>EFEITOS ATIVOS DO TIME</div>
                {syn.effects.map((s, i) => <div key={i}>• {s}</div>)}
                {syn.combos.map((s, i) => <div key={`c${i}`} style={{ color: "#ff97e1", fontWeight: 700 }}>◆ {s}</div>)}
              </div>
            )}
          </div>

          {/* Ações */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {onMakeLeader && !inTeam !== true && (
              <button onClick={onMakeLeader} style={btnGold}>★ TORNAR LÍDER</button>
            )}
            {onToggleTeam && (
              <button onClick={onToggleTeam} style={btnDark}>
                {inTeam ? "→ MOVER P/ COLEÇÃO" : "← ADICIONAR AO TIME"}
              </button>
            )}
            {onSell && !inTeam && (
              <button onClick={onSell} style={btnRed}>💰 VENDER</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const btnGold: React.CSSProperties = {
  padding: "8px 14px", fontSize: 11, fontWeight: 900, letterSpacing: 1,
  background: "linear-gradient(180deg, #ffd66b, #b8862a)", color: "#0b0510",
  border: "1px solid #fff4d0", borderRadius: 8, cursor: "pointer",
  boxShadow: "0 3px 8px rgba(184,134,42,0.5)",
};
const btnDark: React.CSSProperties = {
  padding: "8px 14px", fontSize: 11, fontWeight: 900, letterSpacing: 1,
  background: "linear-gradient(180deg, #3a2450, #241634)", color: "#eadfe8",
  border: "1px solid #5a3d78", borderRadius: 8, cursor: "pointer",
};
const btnRed: React.CSSProperties = {
  padding: "8px 14px", fontSize: 11, fontWeight: 900, letterSpacing: 1,
  background: "linear-gradient(180deg, #ff5a5a, #8a1a1a)", color: "#fff",
  border: "1px solid #ffb8b8", borderRadius: 8, cursor: "pointer",
};
