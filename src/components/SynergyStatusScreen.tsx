// Pixel-art Pokémon Status Screen — visual only, logic preserved
import { useState } from "react";
import type { PetInstance, Rarity, Species } from "@/game/systems";
import { SPECIES_BASE } from "@/game/systems";
import { computeTeamSynergies, ELEMENT_META, elementsOf } from "@/game/synergies";
import { aggregateTraits } from "@/game/traits";
import { SKILL_DISCS, STARTER_DISCS, discDefByItem } from "@/game/skillDiscs";

type Props = {
  team: PetInstance[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  leaderHp: number;
  gifMap: Partial<Record<Species, string>>;
  onReorderTeam: (next: PetInstance[]) => void;
  onViewCard: (p: PetInstance) => void;
  onClose?: () => void;
};

const RARITY_COLORS: Record<string, { c: string; label: string }> = {
  common: { c: "#c8b8d0", label: "COMUM" },
  uncommon: { c: "#7ef2a2", label: "INCOMUM" },
  rare: { c: "#6bd4ff", label: "RARO" },
  epic: { c: "#c084fc", label: "ÉPICO" },
  legendary: { c: "#f5cf6b", label: "LENDÁRIO" },
  mythic: { c: "#ff6b3d", label: "MÍTICO" },
  mythic_shiny: { c: "#ff97e1", label: "MÍTICO ✦" },
};

// Element -> synergy name/description (visual only, uses existing buffs)
const SYNERGY_INFO: Record<string, { name: string; desc: string }> = {
  fogo: { name: "CHAMA INTERIOR", desc: "Aumenta o ataque e a velocidade do Pokémon quando em sinergia com seu parceiro." },
  planta: { name: "FOTOSSÍNTESE", desc: "Regenera HP e aumenta XP ganho em sinergia com parceiro de planta." },
  agua: { name: "TORRENTE", desc: "Aumenta defesa e resistência passiva quando em sinergia." },
  eletrico: { name: "CARGA ESTÁTICA", desc: "Aumenta velocidade e chance crítica em sinergia elétrica." },
  pedra: { name: "MURALHA", desc: "Aumenta HP máximo e defesa em sinergia de pedra." },
  veneno: { name: "TOXINA", desc: "Aumenta dano tóxico contínuo em sinergia." },
  psiquico: { name: "FOCO MENTAL", desc: "Aumenta ouro e crítico em sinergia psíquica." },
  gelo: { name: "FRIO POLAR", desc: "Aumenta esquiva e controle em sinergia de gelo." },
  voador: { name: "VENTO LIVRE", desc: "Aumenta esquiva e XP em sinergia voadora." },
  inseto: { name: "ENXAME", desc: "Roubo de vida em sinergia de inseto." },
  lutador: { name: "PUNHO FIRME", desc: "Aumenta crítico e dano físico." },
  fantasma: { name: "SOMBRA", desc: "Aumenta esquiva fantasmagórica." },
  dragao: { name: "FÚRIA DRACÔNICA", desc: "Bônus universal em todas as estatísticas." },
  normal: { name: "VERSATILIDADE", desc: "Bônus equilibrado de time normal." },
  fada: { name: "ENCANTO", desc: "Regeneração e proteção mágica." },
};

function GenderIcon({ p }: { p: PetInstance }) {
  // Use existing data if available, else deterministic from uid
  const isFemale = (p as any).gender === "female" || (parseInt(p.uid.slice(-2), 16) % 2 === 0);
  return <span style={{ color: isFemale ? "#ff4d6d" : "#4ea8ff", fontSize: 18, lineHeight: 1 }}>{isFemale ? "♀" : "♂"}</span>;
}

export function SynergyStatusScreen({ team, selectedIndex, onSelect, leaderHp, gifMap, onViewCard, onClose }: Props) {
  const [bonusFilter, setBonusFilter] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"pokemon" | "sinergia" | "bonus" | "discos">("pokemon");
  if (team.length === 0) {
    return (
      <div style={{
        background: "#fde6a0", border: "4px solid #1a0f2a", borderRadius: 10, padding: 18,
        fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: "#1a0f2a", textAlign: "center"
      }}>
        NENHUM POKÉMON NO TIME
      </div>
    );
  }
  const main = team[selectedIndex] ?? team[0];
  const mainIdx = team.indexOf(main);
  const partner = team.find((_, i) => i !== mainIdx) ?? null;
  const leaderIsMain = mainIdx === 0;
  const rarity = RARITY_COLORS[main.rarity] ?? RARITY_COLORS.common;
  const petMax = (() => {
    const b = SPECIES_BASE[main.species];
    if (!b) return 100;
    return Math.floor(20 + main.level * 4 + (b.hp * 0.5));
  })();
  const petHp = leaderIsMain ? leaderHp : (main.hp ?? petMax);
  const hpPct = Math.max(0, Math.min(100, (petHp / petMax) * 100));
  const hpColor = hpPct > 55 ? "#2ecc71" : hpPct > 25 ? "#f5cf6b" : "#ff5252";

  // Stats derived exactly as idle.tsx did (preserve numbers)
  const baseMap: Record<string, number> = {
    common: 42, uncommon: 58, rare: 78, epic: 100, legendary: 130, mythic: 160, mythic_shiny: 200,
  };
  const base = baseMap[main.rarity] ?? 42;
  const lv = main.level;
  const stats = {
    hp: petMax,
    atk: Math.round(base + lv * 2.1),
    def: Math.round(base * 0.85 + lv * 1.6),
    spa: Math.round(base + lv * 1.9),
    spd: Math.round(base * 0.9 + lv * 1.7),
    spe: Math.round(base * 0.8 + lv * 2.2),
  };

  // Synergy pack (existing logic)
  const syn = computeTeamSynergies(team);
  const els = elementsOf(main.species);
  const primaryEl = els[0] ?? "normal";
  const meta = ELEMENT_META[primaryEl] ?? ELEMENT_META.normal;
  const info = SYNERGY_INFO[primaryEl] ?? SYNERGY_INFO.normal;

  // Level/EXP for synergy (use team synergy level proxy: count of primary element)
  const count = syn.byElement[primaryEl as any] ?? 0;
  const level = Math.min(10, Math.max(1, count * 2 + 1)); // visual 1-10, 2 per count, capped
  const expPct = Math.min(100, (count / 5) * 100);

  const traitAgg = (() => { try { return aggregateTraits(team); } catch { return { count: 0, labels: [] } as any; } })();

  // Bonus list from existing pack (visual only)
  const bonuses: { label: string }[] = [];
  if (syn.xpMult > 0) bonuses.push({ label: `+${Math.round(syn.xpMult * 100)}% EXP` });
  if (syn.goldMult > 0) bonuses.push({ label: `+${Math.round(syn.goldMult * 100)}% GOLD` });
  if (syn.dmgMult > 0) bonuses.push({ label: `+${Math.round(syn.dmgMult * 100)}% ATK` });
  if (syn.defMult > 0) bonuses.push({ label: `+${Math.round(syn.defMult * 100)}% DEF` });
  if (syn.hpMult > 0) bonuses.push({ label: `+${Math.round(syn.hpMult * 100)}% HP` });
  if (syn.critChance > 0) bonuses.push({ label: `+${Math.round(syn.critChance * 100)}% CRIT` });
  if (syn.atkSpeedMult > 0) bonuses.push({ label: `+${Math.round(syn.atkSpeedMult * 100)}% SPD` });
  if (syn.dodgeChance > 0) bonuses.push({ label: `+${Math.round(syn.dodgeChance * 100)}% ESQ` });
  if (bonuses.length === 0) bonuses.push({ label: "SEM BÔNUS ATIVO" });

  const src = gifMap[main.species];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", maxWidth: 600, margin: "0 auto", maxHeight: "calc(100vh - 210px)", overflowY: "hidden", padding: "2px 2px 4px", boxSizing: "border-box" as any, fontFamily: '"Press Start 2P", monospace', imageRendering: "pixelated" as any, zoom: 0.85 as any, transformOrigin: "top center" }}>
      {/* HEADER — muda com a aba */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg,#ffe9a8 0%,#f5d06a 100%)",
        border: "4px solid #1a0f2a", borderBottom: "none",
        padding: "8px 10px", borderRadius: "10px 10px 0 0",
        boxShadow: "inset 0 2px 0 rgba(255,255,255,0.7), 0 2px 0 #1a0f2a",
      }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#1a0f2a", letterSpacing: 1, textShadow: "1px 1px 0 #fff" }}>
          {activePanel === "pokemon" ? "POKÉMON" : activePanel === "sinergia" ? "SINERGIA" : activePanel === "bonus" ? "BÔNUS" : "DISCOS"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: "#1a0f2a" }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: activePanel==="pokemon" ? "#fff" : "#c9b8a0", border: "2px solid #1a0f2a" }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: activePanel==="sinergia" ? "#fff" : "#c9b8a0", border: "2px solid #1a0f2a" }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: activePanel==="bonus" ? "#fff" : "#c9b8a0", border: "2px solid #1a0f2a" }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: activePanel==="discos" ? "#fff" : "#c9b8a0", border: "2px solid #1a0f2a" }} />
          <span style={{ marginLeft: 8, fontWeight: 900 }}>⊕ PÁGINA</span>
        </div>
      </div>

      {/* TABS sem scroll */}
      <div style={{ display: "flex", gap: 4, padding: "4px 6px 6px", background: "#1a0f2a", border: "4px solid #1a0f2a", borderTop: "none", borderBottom: "none" }}>
        {(["pokemon","sinergia","bonus","discos"] as const).map(k=>(
          <button key={k} onClick={()=>setActivePanel(k)} style={{
            flex:1, padding: "6px 0", fontSize: 8, fontWeight: 900, borderRadius: 6,
            background: activePanel===k ? "#ffe9a8" : "rgba(255,255,255,0.12)",
            color: activePanel===k ? "#1a0f2a" : "#fff",
            border: activePanel===k ? "2px solid #f5cf6b" : "2px solid #1a0f2a",
            cursor: "pointer",
          }}>{k==="pokemon"?"POKÉMON":k==="sinergia"?"SINERGIA":k==="bonus"?"BÔNUS":"DISCOS"}</button>
        ))}
      </div>
      {activePanel==="pokemon" && (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.1fr)", gap: 6, border: "4px solid #1a0f2a", borderTop: "none", borderBottom: "none", background: "#1a0f2a", padding: "0 6px" }}>
        {/* Left Pokemon card */}
        <div style={{
          background: "#b8a8e8", borderRight: "4px solid #1a0f2a",
          padding: 8, display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", textShadow: "1px 1px 0 #1a0f2a", fontSize: 11, fontWeight: 900 }}>
              <span>Lv{main.level}</span>
              <span style={{ flex: 1, textAlign: "center", fontSize: 12 }}>{main.species.replace(/_/g, " ").toUpperCase()}</span>
              <GenderIcon p={main} />
            </div>
            <div style={{
              alignSelf: "flex-start",
              background: meta.color, color: "#fff", border: "2px solid #1a0f2a",
              borderRadius: 6, padding: "2px 6px", fontSize: 8, display: "flex", alignItems: "center", gap: 4, fontWeight: 900,
            }}>
              <span>{meta.emoji}</span> {meta.label}
            </div>
          </div>
          <div style={{
            background: "#fff", border: "3px solid #1a0f2a", borderRadius: 6,
            height: 84, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            boxShadow: "inset 0 0 0 3px #d8d0f0, 0 0 18px rgba(245,207,107,0.55), 0 0 42px rgba(255,151,225,0.35)",
          }}>
            {/* pokeball glow atrás do sprite */}
            <div style={{
              position: "absolute", width: 96, height: 96, borderRadius: 999,
              border: "8px solid #e8e0f8", background: "radial-gradient(circle at 50% 35%, #fff 0%, #ffe9a8 55%, #e8e0f8 100%)",
              opacity: 0.95, boxShadow: "0 0 24px rgba(245,207,107,0.7), 0 0 60px rgba(255,151,225,0.4)",
              animation: "rubym-ballspin 6s linear infinite",
            }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 5, background: "#1a0f2a", transform: "translateY(-50%)" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 17, height: 17, background: "#fff", border: "3px solid #1a0f2a", borderRadius: 999, transform: "translate(-50%,-50%)", boxShadow: "0 0 10px #fff" }} />
            </div>
            <style>{`@keyframes rubym-ballspin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
            {src ? <img src={src} alt="" width={92} height={92} style={{ imageRendering: "pixelated", position: "relative", zIndex: 1, filter: "drop-shadow(0 2px 0 #1a0f2a)" }} /> : <span style={{ fontSize: 10, color: "#1a0f2a" }}>SEM SPRITE</span>}
          </div>
          {/* 💿 Slot de disco do Pokémon — mostra qual disco está em uso e a habilidade */}
          {(() => {
            const disc = discDefByItem(main.skillDisc);
            return (
              <div style={{ background: disc ? "#fff8dc" : "rgba(0,0,0,0.25)", border: "2px solid #1a0f2a", borderRadius: 6, padding: 4, display: "flex", alignItems: "center", gap: 6 }}>
                {disc ? (
                  <>
                    <img src={disc.img} alt={disc.name} width={40} height={34} style={{ imageRendering: "pixelated", borderRadius: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 8, fontWeight: 900, color: "#1a0f2a" }}>💿 {disc.name}</div>
                      <div style={{ fontSize: 7, color: "#0b5a2a", fontWeight: 700 }}>{disc.bonus}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 7, fontWeight: 900, color: "#fff", textShadow: "1px 1px 0 #1a0f2a", textAlign: "center", width: "100%" }}>💿 SLOT VAZIO — equipe pela mochila</div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right stats */}
        <div style={{ background: "#ffe9a8", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* HP row */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                background: "#5a4a6a", color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: 9, fontWeight: 900,
                border: "2px solid #1a0f2a", minWidth: 70, textAlign: "center",
              }}>HP</div>
              <div style={{ flex: 1, textAlign: "right", fontSize: 12, color: "#1a0f2a", fontWeight: 900 }}>{petMax}/{petMax}</div>
            </div>
            <div style={{ height: 14, background: "#1a0f2a", borderRadius: 999, padding: 2, border: "2px solid #1a0f2a" }}>
              <div style={{ width: `${hpPct}%`, height: "100%", background: hpColor, borderRadius: 999, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }} />
            </div>
          </div>
          {[
            ["ATAQUE", stats.atk, "#ff8a8a"],
            ["DEFESA", stats.def, "#7ec4ff"],
            ["SP.ATK", stats.spa, "#c084fc"],
            ["SP.DEF", stats.spd, "#7ef2a2"],
            ["VELOCIDADE", stats.spe, "#f5cf6b"],
          ].map(([label, val, col]) => (
            <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                background: col, color: "#1a0f2a", padding: "4px 8px", borderRadius: 4, fontSize: 8, fontWeight: 900,
                border: "2px solid #1a0f2a", minWidth: 92, textAlign: "center", flexShrink: 0,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 3px 3px 0 #1a0f2a",
                textShadow: "0 1px 0 rgba(255,255,255,0.4)", imageRendering: "pixelated" as any,
              }}>{label}</div>
              <div style={{
                flex: 1, background: "#fff8dc", border: "2px solid #1a0f2a", borderRadius: 6,
                padding: "4px 8px", fontSize: 11, fontWeight: 900, color: "#1a0f2a", textAlign: "right",
              }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      )}
      {activePanel==="sinergia" && (
      <div style={{
        display: "grid", gridTemplateColumns: "1.6fr 0.9fr",
        background: "#ffe9a8", border: "4px solid #1a0f2a", borderTop: "none",
        padding: 8, gap: 8,
      }}>
        <div style={{ background: "#fff8dc", border: "3px solid #1a0f2a", borderRadius: 8, padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ background: "#5a4a6a", color: "#fff", padding: "4px 10px", borderRadius: 999, fontSize: 9, fontWeight: 900, border: "2px solid #1a0f2a" }}>SINERGIA</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#1a0f2a" }}>{info.name}</div>
          </div>
          <div style={{ fontSize: 10, color: "#1a0f2a", fontWeight: 700, lineHeight: 1.4 }}>{info.desc}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 8, color: "#5a4a6a", fontWeight: 900 }}>LEALDADE {main.species.replace(/_/g, " ").toUpperCase()}</span>
            <div style={{ flex: 1, height: 8, background: "#1a0f2a", borderRadius: 999, padding: 1, border: "1px solid #1a0f2a" }}>
              <div style={{ width: `${Math.max(0, Math.min(100, (main as any).lealdade ?? 100))}%`, height: "100%", background: "linear-gradient(90deg,#ff9de0,#ff5ec7)", borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: 8, fontWeight: 900, color: "#1a0f2a" }}>{Math.round((main as any).lealdade ?? 100)}%</span>
            <button onClick={() => onViewCard(main)} title="Abrir ficha para alimentar" style={{ fontSize: 8, color: "#1a0f2a", background: "#ffe9a8", border: "2px solid #1a0f2a", borderRadius: 6, padding: "3px 8px", fontWeight: 900, cursor: "pointer" }}>🍖 ALIMENTAR</button>
          </div>
        </div>
        <div style={{ background: "#fff8dc", border: "3px solid #1a0f2a", borderRadius: 8, padding: 8, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#1a0f2a", textAlign: "center", letterSpacing: 1 }}>BÔNUS ELEMENTAIS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            {(() => {
              const ents = (Object.entries(syn.byElement) as [string, number][]).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
              if (ents.length===0) return <span style={{fontSize:9, color:"#1a0f2a", fontWeight:700}}>SEM ELEMENTO</span>;
              return ents.map(([el,n])=>{
                const m=(ELEMENT_META as any)[el];
                return <span key={el} style={{fontSize:9, padding:"4px 8px", borderRadius:4, background:m.color, color:"#1a0f2a", border:"2px solid #1a0f2a", fontWeight:900, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.5), 2px 2px 0 #1a0f2a", imageRendering:"pixelated" as any}}>{m.emoji} {m.label} ×{n}</span>;
              });
            })()}
          </div>
          <div style={{ fontSize: 9, color: "#1a0f2a", fontWeight: 700, textAlign: "center", lineHeight: 1.35 }}>{syn.effects.slice(0,2).join(" • ") || "Monte um time para ativar"}</div>
        </div>
      </div>
      )}
      {activePanel==="bonus" && (
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1.3fr",
        background: "#b8a8e8", border: "4px solid #1a0f2a", borderTop: "none",
        borderRadius: "0 0 10px 10px", overflow: "hidden",
      }}>
        {/* Partner */}
        <div style={{ background: "#d8d0f0", borderRight: "4px solid #1a0f2a", padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            width: 72, height: 72, background: "#fff", border: "3px solid #1a0f2a", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {partner && gifMap[partner.species] ? (
              <img src={gifMap[partner.species]!} alt="" width={60} height={60} style={{ imageRendering: "pixelated" }} />
            ) : (
              <span style={{ fontSize: 8, color: "#5a4a6a", textAlign: "center" }}>SEM<br />PARCEIRO</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ background: "#5a4a6a", color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 8, fontWeight: 900, border: "2px solid #1a0f2a", alignSelf: "flex-start" }}>PARCEIRO</div>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#1a0f2a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {partner ? partner.species.replace(/_/g, " ").toUpperCase() : "—"}
            </div>
            {partner && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ background: ELEMENT_META[elementsOf(partner.species)[0] ?? "normal"].color, color: "#fff", fontSize: 7, padding: "2px 6px", borderRadius: 999, border: "2px solid #1a0f2a", fontWeight: 900 }}>
                  {ELEMENT_META[elementsOf(partner.species)[0] ?? "normal"].label}
                </span>
              </div>
            )}
            <div style={{
              marginTop: 2, background: syn.combos.length > 0 ? "#2ecc71" : "#8a7a9c",
              color: "#fff", fontSize: 8, fontWeight: 900, padding: "3px 8px", borderRadius: 999,
              border: "2px solid #1a0f2a", display: "inline-flex", alignItems: "center", gap: 4, alignSelf: "flex-start",
            }}>
              <span style={{ width: 12, height: 12, background: "#fff", borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", color: syn.combos.length > 0 ? "#2ecc71" : "#8a7a9c", fontSize: 8 }}>✓</span>
              {syn.combos.length > 0 ? "SINERGIA ATIVA" : "SEM SINERGIA"}
            </div>
          </div>
        </div>

        {/* Bonus */}
        <div style={{ background: "#1a1040", color: "#fff", padding: 10, display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, marginBottom: 4, color: "#ffe9a8" }}>BÔNUS DA SINERGIA</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
              {["TODOS","EXP","OURO","ATK","DEF","VEL"].map(f => (
                <button key={f} onClick={() => setBonusFilter(f==="TODOS"?null:f)} style={{
                  fontSize: 9, padding: "4px 8px", borderRadius: 999,
                  background: (bonusFilter===null && f==="TODOS") || bonusFilter===f ? "#ffe9a8" : "rgba(255,255,255,0.12)",
                  color: (bonusFilter===null && f==="TODOS") || bonusFilter===f ? "#1a1040" : "#fff",
                  border: "1px solid #ffe9a8", fontWeight: 900, cursor: "pointer",
                }}>{f}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, fontWeight: 700 }}>
              {(bonusFilter ? bonuses.filter(b=>b.label.includes(bonusFilter)) : bonuses).slice(0, 6).map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff" }}>
                  <span style={{ color: "#2ecc71" }}>✦</span> {b.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ width: 2, background: "#7a5cff", borderRadius: 999, opacity: 0.6 }} />
          <div style={{ flex: 0.9, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, border: "2px solid #7a5cff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7a5cff", fontSize: 14 }}>🔗</div>
            <div style={{ fontSize: 7, lineHeight: 1.3, color: "#c9c1ff" }}>
              Quanto maior o nível da sinergia, maiores os bônus!
            </div>
          </div>
        </div>
      </div>
      )}

      {activePanel==="discos" && (
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        background: "#1a1040", border: "4px solid #1a0f2a", borderTop: "none",
        borderRadius: "0 0 10px 10px", padding: 8, gap: 6, maxHeight: 320, overflowY: "auto",
      }}>
        {SKILL_DISCS.map(d => {
          const st = STARTER_DISCS.find(s => s.img === d.img) ?? null;
          const holder = st ? team.find(p => (p.skillDisc ?? null) === st.itemId) : null;
          const bonus = st ? st.bonus : d.bonus;
          return (
          <div key={d.id} title={`${d.name} — ${bonus}`} style={{
            background: "#fff8dc", border: holder ? "2px solid #2ecc71" : "2px solid #1a0f2a", borderRadius: 8,
            padding: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            boxShadow: holder ? "0 0 8px rgba(46,204,113,0.7)" : "none",
          }}>
            <img src={d.img} alt={d.name} width={64} height={52} style={{ imageRendering: "pixelated", borderRadius: 4 }} />
            <div style={{ fontSize: 6, fontWeight: 900, color: "#1a0f2a", textAlign: "center", lineHeight: 1.2 }}>{d.name}</div>
            <div style={{ fontSize: 6, color: "#0b5a2a", textAlign: "center", fontWeight: 700 }}>{bonus}</div>
            {st ? (holder ? (
              <div style={{ fontSize: 6, fontWeight: 900, color: "#0b2010", background: "#7dd87d", borderRadius: 4, padding: "1px 4px", textAlign: "center" }}>EM USO • {holder.species.replace(/_/g, " ").toUpperCase()} Lv{holder.level}</div>
            ) : (
              <div style={{ fontSize: 6, color: "#8a7a9c", textAlign: "center" }}>NA MOCHILA — equipe p/ usar</div>
            )) : (
              <div style={{ fontSize: 6, color: "#8a7a9c", textAlign: "center" }}>EM BREVE</div>
            )}
          </div>
          );
        })}
      </div>
      )}

      {/* Team strip: clique = ver, seta = líder, posição = ordem 1-6 */}
      <div style={{
        marginTop: 4, display: "flex", gap: 6, overflowX: "auto", padding: "4px 2px",
        background: "transparent", borderRadius: 8, border: "none",
      }}>
        {team.map((p, i) => {
          const sel = i === selectedIndex;
          const src2 = gifMap[p.species];
          const goLeader = (e: any) => {
            e.stopPropagation();
            e.preventDefault();
            const arr = [...team];
            const [x] = arr.splice(i, 1);
            if (!x) return;
            arr.unshift(x);
            onReorderTeam(arr);
            onSelect(0);
          };
          return (
            <div key={p.uid} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <button
              onClick={() => onSelect(i)}
              title={`Posição ${i + 1} — ver status`}
              style={{
                width: 48, height: 48, borderRadius: 8,
                background: sel ? "#ffe9a8" : "#d8d0f0",
                border: sel ? "3px solid #f5cf6b" : "2px solid #1a0f2a",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", position: "relative",
                boxShadow: sel ? "0 0 0 2px #1a0f2a, 0 0 10px rgba(245,207,107,0.6)" : "none",
              }}
            >
              {src2 ? <img src={src2} alt="" width={40} height={40} style={{ imageRendering: "pixelated" }} /> : <span style={{ fontSize: 7 }}>{p.species.slice(0,4)}</span>}
              <span style={{
                position: "absolute", bottom: -4, right: -4,
                background: "#1a0f2a", color: "#ffe9a8", fontSize: 7, padding: "1px 4px", borderRadius: 999, border: "1px solid #f5cf6b",
              }}>Lv{p.level}</span>
              <span style={{
                position: "absolute", top: -4, left: -4,
                background: "#1a0f2a", color: "#ffe9a8", fontSize: 7, padding: "1px 4px", borderRadius: 999, border: "1px solid #f5cf6b",
              }}>{i + 1}º</span>
            </button>
            {i === 0 ? (
              <span style={{ fontSize: 8, color: "#f5cf6b", fontWeight: 900, padding: "3px 8px", background: "rgba(245,207,107,0.15)", border: "1px solid #f5cf6b", borderRadius: 999 }}>LÍDER ★</span>
            ) : (
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                <button onClick={goLeader} title="Tornar líder" style={{ fontSize: 8, color: "#1a0f2a", background: "#ffe9a8", border: "2px solid #1a0f2a", borderRadius: 999, padding: "3px 8px", fontWeight: 900, cursor: "pointer" }}>LÍDER</button>
                <button onClick={(e)=>{e.stopPropagation(); e.preventDefault(); const arr=[...team]; const t=arr[i]; if(!t) return; arr.splice(i,1); onReorderTeam(arr); onSelect(Math.max(0,Math.min(i,arr.length-1))); }} title="Tirar do time" style={{ fontSize: 8, color: "#fff", background: "#e11d48", border: "2px solid #1a0f2a", borderRadius: 999, padding: "3px 7px", fontWeight: 900, cursor: "pointer", boxShadow: "2px 2px 0 #1a0f2a" }}>▼ TIRAR</button>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: 6, background: "#1a1040", border: "2px solid #1a0f2a", borderRadius: 8,
        padding: "6px 10px", display: "flex", alignItems: "center", gap: 8, color: "#ffe9a8", fontSize: 8,
      }}>
        <span>▶</span> Selecione um parceiro para fortalecer a sinergia.
        <button
          onClick={() => onClose?.()}
          style={{
            marginLeft: "auto", background: "#1a0f2a", color: "#fff", border: "2px solid #7a5cff",
            borderRadius: 6, padding: "4px 10px", fontSize: 8, cursor: "pointer",
          }}
        >
          → VOLTAR
        </button>
      </div>
    </div>
  );
}
