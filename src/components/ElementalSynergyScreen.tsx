import { useState, type CSSProperties } from "react";
import { CRYSTAL_MAX_LEVEL, CRYSTAL_NODES, CRYSTAL_ORDER, crystalBonuses, crystalCost, type CrystalElement, type CrystalNetwork } from "@/game/elementalNetwork";
import parchment from "@/New folder/BG.png";
import header from "@/assets/synergy/header.png";
import sidebar from "@/assets/synergy/sidebar.png";
import wheel from "@/assets/synergy/wheel.png";
import stonePanel from "@/assets/synergy/panel-stones.png";
import bonusPanel from "@/assets/synergy/panel-bonus.png";
import buttons from "@/assets/synergy/buttons.png";
import fireCrystal from "@/assets/synergy/fire.png";
import waterCrystal from "@/assets/synergy/water.png";
import natureCrystal from "@/assets/synergy/nature.png";
import earthCrystal from "@/assets/synergy/earth.png";
import electricCrystal from "@/assets/synergy/electric.png";
import coreCrystal from "@/assets/synergy/core.png";

type Props = { network: CrystalNetwork; items: Record<string, number>; onUpgrade: (element: CrystalElement) => void; onClose: () => void };
const pct = (value: number, full: number) => `${value / full * 100}%`;
const piece = (x: number, y: number, w: number, h: number): CSSProperties => ({ position: "absolute", left: pct(x, 1448), top: pct(y, 1086), width: pct(w, 1448), height: pct(h, 1086), pointerEvents: "none" });
const NODE_POSITION: Record<CrystalElement, { x: number; y: number; labelX: number; labelY: number }> = {
  fire: { x: 650, y: 281, labelX: 810, labelY: 277 },
  electric: { x: 381, y: 508, labelX: 291, labelY: 445 },
  water: { x: 904, y: 508, labelX: 977, labelY: 445 },
  earth: { x: 477, y: 777, labelX: 294, labelY: 740 },
  nature: { x: 820, y: 777, labelX: 958, labelY: 740 },
};
const CRYSTAL_ART: Record<CrystalElement, string> = { fire: fireCrystal, water: waterCrystal, nature: natureCrystal, earth: earthCrystal, electric: electricCrystal };

export function ElementalSynergyScreen({ network, items, onUpgrade, onClose }: Props) {
  const [selected, setSelected] = useState<CrystalElement>("fire");
  const [showDetails, setShowDetails] = useState(false);
  const node = CRYSTAL_NODES[selected];
  const level = network[selected] ?? 0;
  const cost = crystalCost(level);
  const owned = items[node.stone] ?? 0;
  const unlocked = CRYSTAL_ORDER.filter((element) => (network[element] ?? 0) > 0).length;
  const bonuses = crystalBonuses(network);
  const values = [
    ["♥", "HP", bonuses.hpMult], ["⚔", "Atk", bonuses.dmgMult], ["⬟", "Def", bonuses.defMult], ["➜", "Vel", bonuses.atkSpeedMult],
  ] as const;
  const labelStyle: CSSProperties = { position: "absolute", color: "#fff5dd", fontWeight: 900, textShadow: "-2px -2px #351507, 2px 2px #351507, 0 2px 5px #000", textAlign: "center", fontSize: "1.2cqw", zIndex: 3, lineHeight: 1.25 };
  const cardTitle: CSSProperties = { position: "absolute", right: "3.2%", width: "22%", color: "#fff8d5", textShadow: "1px 2px 2px #092e0d", textAlign: "center", fontSize: "1.65cqw", fontWeight: 900, zIndex: 3 };
  return <section className="revo-synergy-stage" aria-label="Sinergia elemental de cristais" style={{ fontFamily: "Georgia, serif", color: "#322009", backgroundImage: `url(${parchment})`, backgroundSize: "100% 100%" }}>
    <img alt="" src={header} style={piece(0, 0, 1448, 187)} />
    <img alt="" src={sidebar} style={piece(0, 185, 235, 765)} />
    <img alt="" src={wheel} style={piece(230, 180, 805, 745)} />
    <img alt="" src={stonePanel} style={piece(1035, 211, 413, 280)} />
    <img alt="" src={bonusPanel} style={piece(1035, 491, 413, 206)} />
    <img alt="" src={bonusPanel} style={piece(1035, 701, 413, 193)} />
    <img alt="" src={buttons} style={piece(208, 906, 1100, 180)} />
    <h2 style={{ position: "absolute", top: "6.2%", left: "23%", width: "54%", margin: 0, color: "#fff4cb", textShadow: "0 2px #682a00, 0 4px #451300, 0 0 12px #ffaa0a", fontSize: "4.2cqw", textAlign: "center", letterSpacing: ".06em", zIndex: 3, whiteSpace: "nowrap" }}>SINERGIA ELEMENTAL</h2>
    <div style={{ position: "absolute", left: "20%", right: "19%", top: "17.2%", zIndex: 3, textAlign: "center", fontSize: "1.6cqw", fontWeight: 900 }}>Desbloqueie e conecte os cristais para fortalecer ainda mais sua jornada!</div>
    {(["Bolsa", "Cristais", "Detalhes", "Rede", "Sinergia"] as const).map((label, index) => <button key={label} type="button" onClick={() => { if (index === 2) setShowDetails(true); else if (index === 0 || index === 1) setSelected(CRYSTAL_ORDER[index]); }} style={{ position: "absolute", left: "2.3%", top: pct(257 + index * 117, 1086), width: "11.5%", height: "7.7%", background: "transparent", border: "none", color: "#fff8db", fontSize: "1.65cqw", fontWeight: 900, textShadow: "1px 2px #022a13, 0 0 4px #022a13", zIndex: 3, cursor: "pointer" }}><span style={{ display: "block", fontSize: "2.4cqw" }}>{["🎒", "💎", "📖", "✦", "🔗"][index]}</span>{label}</button>)}
    {CRYSTAL_ORDER.map((element) => { const item = CRYSTAL_NODES[element]; const pos = NODE_POSITION[element]; const lv = network[element] ?? 0; return <div key={element}>
      <button type="button" onClick={() => { setSelected(element); setShowDetails(false); }} aria-label={`${item.label}, nível ${lv}, selecionar cristal`} aria-pressed={selected === element} style={{ position: "absolute", left: pct(pos.x, 1448), top: pct(pos.y, 1086), transform: "translate(-50%, -50%)", width: "10.2%", aspectRatio: "1", border: "none", background: "transparent", cursor: "pointer", zIndex: 3, filter: lv ? `drop-shadow(0 0 8px ${item.color})` : "grayscale(.5)" }}><img src={CRYSTAL_ART[element]} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></button>
      <button type="button" onClick={() => { setSelected(element); setShowDetails(false); }} style={{ ...labelStyle, left: pct(pos.labelX - 99, 1448), top: pct(pos.labelY - 18, 1086), width: pct(198, 1448), border: `2px solid ${selected === element ? "#ffe082" : item.color}`, background: `linear-gradient(#382015, ${item.color})`, borderRadius: 9, padding: "0.2%", cursor: "pointer" }}>{item.icon} {item.label}<span style={{ display: "block", background: "#fff0cf", color: "#3d260e", textShadow: "none", fontSize: "1cqw" }}>{lv ? `Nv. ${lv}` : "Bloqueado"} · {items[item.stone] ?? 0}/{crystalCost(lv)}</span></button>
    </div>; })}
    <img src={coreCrystal} alt="Rede elemental" style={{ ...piece(550, 500, 175, 170), zIndex: 3, filter: "drop-shadow(0 0 10px #fff689)" }} />
    <div style={{ ...cardTitle, top: "20.5%" }}>✦ Pedras Elementais ✦</div>
    <div style={{ position: "absolute", right: "4.3%", top: "25%", width: "19.7%", zIndex: 3, fontSize: "1.24cqw", fontWeight: 800 }}>
      {CRYSTAL_ORDER.map((element) => { const item = CRYSTAL_NODES[element]; return <div key={element} style={{ height: "2.65cqw", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #d7b977" }}><span>{item.icon} Pedra {element === "earth" ? "sombria" : item.label.toLowerCase()}</span><strong>× {items[item.stone] ?? 0}</strong></div>; })}
    </div>
    <div style={{ ...cardTitle, top: "46.5%" }}>✦ Bônus de Sinergia ✦</div>
    <div style={{ position: "absolute", right: "4.3%", top: "51%", width: "19.7%", zIndex: 3, fontSize: "1.3cqw", fontWeight: 800 }}>{values.map(([icon, label, value]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #d7b977", padding: ".2cqw 0" }}><span>{icon} {label}</span><strong style={{ color: "#17793a" }}>+{Math.round(value * 100)}%</strong></div>)}</div>
    <div style={{ ...cardTitle, top: "66%" }}>✦ Progresso da Rede ✦</div>
    <div style={{ position: "absolute", right: "5%", top: "70.5%", width: "18.7%", zIndex: 3, fontSize: "1.5cqw", fontWeight: 900, textAlign: "center" }}><div style={{ height: "1.5cqw", background: "#57432e", borderRadius: 10, border: "2px solid #4b2c17" }}><div style={{ height: "100%", width: `${unlocked * 20}%`, background: "linear-gradient(#bdff62,#43d943)", borderRadius: 10 }} /></div>{unlocked}/5<br />{CRYSTAL_ORDER.map((element) => <span key={element} style={{ fontSize: "2.25cqw", opacity: (network[element] ?? 0) ? 1 : .35 }}>{CRYSTAL_NODES[element].icon}</span>)}</div>
    <button type="button" onClick={() => setShowDetails((value) => !value)} style={footerButton(235, 307)}>📖 Detalhes</button>
    <button type="button" onClick={() => onUpgrade(selected)} disabled={level >= CRYSTAL_MAX_LEVEL || owned < cost} title={level >= CRYSTAL_MAX_LEVEL ? "Nível máximo" : `Precisa de ${cost} ${node.stone}`} style={{ ...footerButton(553, 340), opacity: level >= CRYSTAL_MAX_LEVEL || owned < cost ? .65 : 1 }}>💎 {level >= CRYSTAL_MAX_LEVEL ? "Nível máximo" : "Aprimorar"}</button>
    <button type="button" onClick={onClose} style={footerButton(940, 315)}>✕ Fechar</button>
    {showDetails && <div style={{ position: "absolute", left: "20%", top: "27%", width: "51%", height: "52%", background: "#fff0cbf5", border: "5px ridge #b48026", borderRadius: 18, padding: "3%", boxSizing: "border-box", zIndex: 8, boxShadow: "0 12px 30px #30160099", fontSize: "1.65cqw", overflowY: "auto" }}><button type="button" onClick={() => setShowDetails(false)} style={{ float: "right", fontSize: "2cqw", cursor: "pointer" }}>✕</button><h3>{node.icon} Cristal {node.label}</h3><p>Nível: {level}/{CRYSTAL_MAX_LEVEL} · Saldo: {owned} pedras · Próximo nível: {level >= CRYSTAL_MAX_LEVEL ? "máximo" : `${cost} pedras`}</p><p>Bônus permanente: {node.bonus} +{(node.bonus === "ATK" || node.bonus === "DEF" ? 4 : 3) * level}%.</p><p>Esta rede de cristais é separada das sinergias do time. O nível fica salvo na sua conta local junto com o progresso.</p></div>}
  </section>;
}

function footerButton(x: number, width: number): CSSProperties {
  return { position: "absolute", left: pct(x, 1448), top: "86%", width: pct(width, 1448), height: "8%", zIndex: 5, background: "transparent", border: "none", color: "#fff8df", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "2.65cqw", cursor: "pointer", textShadow: "-2px -2px #3d1d15, 2px 3px #3d1d15" };
}
