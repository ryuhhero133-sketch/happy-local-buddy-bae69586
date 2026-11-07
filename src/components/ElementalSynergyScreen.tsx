import type { CSSProperties } from "react";
import type { PetInstance } from "@/game/systems";
import { ELEMENT_META, computeTeamSynergies, type Element } from "@/game/synergies";
import synergyBg from "@/New folder/BG.png";
import synergyFrame from "@/New folder/hD1'.png";

type Props = { team: PetInstance[]; items: Record<string, number>; gifMap: Partial<Record<string, string>>; onClose: () => void };
const focusElements: Element[] = ["fogo", "eletrico", "agua", "pedra", "planta"];
const stoneFor: Partial<Record<Element, string>> = { fogo: "stone_fire", eletrico: "stone_electric", agua: "stone_water", pedra: "stone_earth", planta: "stone_grass" };
const stoneLabel: Partial<Record<Element, string>> = { fogo: "Pedra de Fogo", eletrico: "Pedra Elétrica", agua: "Pedra d'Água", pedra: "Pedra da Terra", planta: "Pedra da Natureza" };

export function ElementalSynergyScreen({ team, items, gifMap, onClose }: Props) {
  const syn = computeTeamSynergies(team);
  const active = focusElements.filter((element) => (syn.byElement[element] ?? 0) > 0);
  const total = active.length;
  const bonusRows = [
    ["HP", syn.hpMult], ["ATK", syn.dmgMult], ["DEF", syn.defMult], ["VEL", syn.atkSpeedMult], ["EXP", syn.xpMult], ["OURO", syn.goldMult],
  ].filter(([, value]) => (value as number) > 0) as [string, number][];
  const positions: Record<Element, CSSProperties> = {
    fogo: { left: "50%", top: "10%", transform: "translateX(-50%)" }, eletrico: { left: "16%", top: "37%" }, agua: { right: "16%", top: "37%" }, pedra: { left: "24%", bottom: "16%" }, planta: { right: "24%", bottom: "16%" },
  } as Record<Element, React.CSSProperties>;
  return <section style={{ position: "relative", width: "min(1120px, 100%)", aspectRatio: "1448 / 1086", margin: "0 auto", overflow: "hidden", borderRadius: 18, fontFamily: '"Trebuchet MS", sans-serif', color: "#30200d", background: "#f6dfaa", boxShadow: "0 20px 60px #0009" }}>
    <img src={synergyBg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    <div style={{ position: "absolute", top: "8%", left: "22%", right: "22%", textAlign: "center", zIndex: 2 }}>
      <h2 style={{ margin: 0, color: "#fff5c7", fontSize: "clamp(18px, 3vw, 42px)", letterSpacing: 2, textShadow: "0 3px 0 #513000, 0 0 12px #ffcb4d" }}>SINERGIA ELEMENTAL</h2>
      <p style={{ margin: "2% 0", fontSize: "clamp(8px, 1.15vw, 16px)", fontWeight: 800 }}>Conecte os elementos do seu time para fortalecer sua jornada.</p>
    </div>
    <div style={{ position: "absolute", left: "5%", top: "24%", width: "10%", zIndex: 3, display: "grid", gap: 7 }}>
      {team.slice(0, 6).map((pet) => <div key={pet.uid} title={pet.species.replace(/_/g, " ")} style={{ aspectRatio: 1.35, borderRadius: 8, border: "2px solid #d9aa39", background: "linear-gradient(#155a3a,#06331f)", display: "grid", placeItems: "center", overflow: "hidden" }}><img src={gifMap[pet.species]} alt="" style={{ width: "88%", height: "88%", objectFit: "contain", imageRendering: "pixelated" }} /></div>)}
    </div>
    <div style={{ position: "absolute", left: "18%", top: "21%", width: "57%", height: "62%", zIndex: 2 }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "24%", aspectRatio: 1, borderRadius: "50%", display: "grid", placeItems: "center", background: "radial-gradient(circle,#fff8b3,#ffd63b 36%,#94530a 72%)", border: "4px solid #fff0a1", boxShadow: "0 0 22px #ffbb24" }}><span style={{ fontSize: "clamp(22px,4vw,58px)" }}>✦</span></div>
      {focusElements.map((element) => { const meta = ELEMENT_META[element]; const count = syn.byElement[element] ?? 0; return <button type="button" key={element} title={`${meta.label}: ${count} Pokémon`} style={{ position: "absolute", ...positions[element], width: "23%", aspectRatio: 1, borderRadius: "50%", border: `4px solid ${count ? meta.color : "#8e795c"}`, background: count ? `radial-gradient(circle,#fffbe2,#f5d47d 55%,${meta.color})` : "radial-gradient(circle,#d0c1a2,#73634e)", boxShadow: count ? `0 0 18px ${meta.color}` : "none", cursor: "default", display: "grid", placeItems: "center", color: "#3e2208", fontWeight: 900 }}><span style={{ fontSize: "clamp(18px,3.2vw,45px)" }}>{meta.emoji}</span><span style={{ fontSize: "clamp(7px,.85vw,13px)" }}>{meta.label}<br />Nv. {Math.min(5, count || 1)} · {count}/5</span></button>; })}
    </div>
    <aside style={{ position: "absolute", right: "5%", top: "24%", width: "19%", zIndex: 3, fontSize: "clamp(7px,.95vw,13px)" }}>
      <div style={{ border: "3px solid #b88413", borderRadius: 10, padding: "7%", background: "#fff1c7cc", marginBottom: "7%" }}><b style={{ display: "block", textAlign: "center", fontSize: "1.25em", marginBottom: 6 }}>PEDRAS ELEMENTAIS</b>{focusElements.map((element) => <div key={element} style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #d8bb78", padding: "4px 0" }}><span>{ELEMENT_META[element].emoji} {stoneLabel[element]}</span><b>× {items[stoneFor[element] ?? ""] ?? 0}</b></div>)}</div>
      <div style={{ border: "3px solid #b88413", borderRadius: 10, padding: "7%", background: "#fff1c7cc" }}><b style={{ display: "block", textAlign: "center", fontSize: "1.25em", marginBottom: 6 }}>BÔNUS ATIVOS</b>{bonusRows.length ? bonusRows.map(([label, value]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #d8bb78", padding: "3px 0" }}><span>{label}</span><b style={{ color: "#16823a" }}>+{Math.round(value * 100)}%</b></div>) : <div style={{ textAlign: "center", padding: 8 }}>Monte seu time para ativar bônus.</div>}</div>
    </aside>
    <div style={{ position: "absolute", right: "8%", bottom: "16%", zIndex: 3, width: "15%", textAlign: "center", fontSize: "clamp(8px,1vw,15px)", fontWeight: 800 }}><div>PROGRESSO DA REDE</div><div style={{ height: 13, borderRadius: 8, border: "2px solid #583e16", background: "#3e352a", overflow: "hidden", margin: 5 }}><div style={{ height: "100%", width: `${total / focusElements.length * 100}%`, background: "linear-gradient(90deg,#60d95f,#d7ff6c)" }} /></div>{total}/{focusElements.length} elementos ativos</div>
    <button onClick={onClose} style={{ position: "absolute", right: "17%", bottom: "4%", zIndex: 5, width: "21%", height: "8%", border: "2px solid #7b160f", borderRadius: 14, background: "linear-gradient(#ff7564,#b51e1d)", color: "#fff9d3", fontWeight: 900, fontSize: "clamp(10px,1.4vw,20px)", textShadow: "0 2px #611" }}>✕ FECHAR</button>
    <img src={synergyFrame} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 4 }} />
  </section>;
}
