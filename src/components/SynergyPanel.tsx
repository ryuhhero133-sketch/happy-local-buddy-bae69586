// Painel compacto de sinergias ativas do time.
import type { PetInstance } from "@/game/systems";
import { computeTeamSynergies, ELEMENT_META, type Element } from "@/game/synergies";

export function SynergyPanel({ team }: { team: PetInstance[] }) {
  if (team.length === 0) return null;
  const syn = computeTeamSynergies(team);
  const entries = (Object.entries(syn.byElement) as [Element, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div style={{
      padding: 12, borderRadius: 12,
      background: "linear-gradient(135deg, #180a24 0%, #241040 100%)",
      border: "2px solid #6b3fa0",
      boxShadow: "0 4px 14px rgba(0,0,0,0.6), 0 0 18px rgba(107,63,160,0.35)",
      marginTop: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "#c084fc" }}>
          🧬 SINERGIAS ELEMENTAIS
        </div>
        <div style={{ fontSize: 9, color: "#b8a8c8", letterSpacing: 1 }}>
          {entries.length} elemento{entries.length !== 1 ? "s" : ""} ativos
        </div>
      </div>

      {/* Contadores por elemento */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {entries.map(([el, n]) => {
          const m = ELEMENT_META[el];
          return (
            <div key={el} title={m.label} style={{
              padding: "4px 8px", fontSize: 10, fontWeight: 900,
              borderRadius: 999,
              background: `${m.color}22`, border: `1px solid ${m.color}88`, color: m.color,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <span>{m.emoji}</span>
              <span>{m.label}</span>
              <span style={{ background: m.color, color: "#0b0510", padding: "0 5px", borderRadius: 999, fontSize: 9 }}>×{n}</span>
            </div>
          );
        })}
      </div>

      {/* Buffs numéricos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4, fontSize: 9, color: "#eadfe8" }}>
        {syn.xpMult > 0        && <div>✧ XP <b style={{ color: "#7ef2a2" }}>+{Math.round(syn.xpMult*100)}%</b></div>}
        {syn.goldMult > 0      && <div>💰 Ouro <b style={{ color: "#f5cf6b" }}>+{Math.round(syn.goldMult*100)}%</b></div>}
        {syn.dmgMult > 0       && <div>⚔ Dano <b style={{ color: "#ff9558" }}>+{Math.round(syn.dmgMult*100)}%</b></div>}
        {syn.defMult > 0       && <div>🛡 Def <b style={{ color: "#7ec4ff" }}>+{Math.round(syn.defMult*100)}%</b></div>}
        {syn.hpMult > 0        && <div>❤ HP <b style={{ color: "#ff7a7a" }}>+{Math.round(syn.hpMult*100)}%</b></div>}
        {syn.atkSpeedMult > 0  && <div>⚡ Vel <b style={{ color: "#f5cf6b" }}>+{Math.round(syn.atkSpeedMult*100)}%</b></div>}
        {syn.regenPct > 0      && <div>🌿 Regen <b style={{ color: "#5ec26a" }}>{Math.round(syn.regenPct*100)}%/3s</b></div>}
        {syn.critChance > 0    && <div>✦ Crit <b style={{ color: "#ff97e1" }}>{Math.round(syn.critChance*100)}%</b></div>}
        {syn.dodgeChance > 0   && <div>💨 Esquiva <b style={{ color: "#c9c1ff" }}>{Math.round(syn.dodgeChance*100)}%</b></div>}
        {syn.lifeSteal > 0     && <div>🩸 Life <b style={{ color: "#ff5ec7" }}>{Math.round(syn.lifeSteal*100)}%</b></div>}
        {syn.paraResist > 0    && <div>🧲 Anti-paralisia <b style={{ color: "#ffe27a" }}>{Math.round(Math.min(0.99,syn.paraResist)*100)}%</b></div>}
      </div>

      {syn.combos.length > 0 && (
        <div style={{
          marginTop: 8, padding: 8, borderRadius: 8,
          background: "rgba(255,151,225,0.10)", border: "1px solid rgba(255,151,225,0.4)",
        }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: "#ff97e1", marginBottom: 4 }}>◆ COMBOS ATIVOS</div>
          {syn.combos.map((c, i) => (
            <div key={i} style={{ fontSize: 9, color: "#ffd0f0" }}>• {c}</div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <div style={{ fontSize: 9, color: "#8a7a9c", fontStyle: "italic" }}>
          Monte um time com diferentes elementos para ativar bônus.
        </div>
      )}
    </div>
  );
}
