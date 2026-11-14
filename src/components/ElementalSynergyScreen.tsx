import { useState, type CSSProperties, type ReactNode } from "react";
import {
  CRYSTAL_MAX_LEVEL, CRYSTAL_NODES, CRYSTAL_ORDER, CRYSTAL_TIER_NODES, CRYSTAL_TIER_ORDER,
  crystalBonuses, crystalCost, crystalTierBonuses, crystalTierCost,
  type CrystalElement, type CrystalNetwork, type CrystalTier, type CrystalTiers,
} from "@/game/elementalNetwork";
import background from "@/ambiente/aba/backgroud.png";
import header from "@/ambiente/aba/hud cima.png";
import buttonClose from "@/assets/synergy2/btn-close.png";
import fire from "@/ambiente/aba/Cristal Ember.gif";
import water from "@/ambiente/aba/Cristal raro.gif";
import nature from "@/ambiente/aba/Cristal Natural.gif";
import earth from "@/ambiente/aba/Cristal terra01.gif";
import electric from "@/ambiente/aba/Cristal Epico.gif";
import legendary from "@/ambiente/aba/Cristal Lendario.gif";
import ancestral from "@/ambiente/aba/Cristal ancestral.gif";
import upgradeOrb from "@/ambiente/aba/Aprimoramento.gif";
import "./elemental-synergy.css";

type Props = {
  network: CrystalNetwork;
  tiers: CrystalTiers;
  items: Record<string, number>;
  onUpgrade: (element: CrystalElement) => void;
  onUpgradeTier: (tier: CrystalTier) => void;
  onClose: () => void;
};

const ART: Record<CrystalElement, string> = { fire, water, nature, earth, electric };
const TIER_ART: Record<CrystalTier, string> = { legendary, epic: electric, ancestral };
const POS: Record<CrystalElement, { x: string; y: string; label: string }> = {
  fire: { x: "44%", y: "30.4%", label: "synergy-node--fire" },
  electric: { x: "29.6%", y: "48.8%", label: "synergy-node--electric" },
  water: { x: "57.5%", y: "48.8%", label: "synergy-node--water" },
  earth: { x: "33.5%", y: "70.9%", label: "synergy-node--earth" },
  nature: { x: "54%", y: "70.9%", label: "synergy-node--nature" },
};

const STAT_ROWS = [
  ["♥", "HP", "hpMult"],
  ["⚔", "Atk", "dmgMult"],
  ["⬟", "Def", "defMult"],
  ["➟", "Vel", "atkSpeedMult"],
] as const;

export function ElementalSynergyScreen({ network, tiers, items, onUpgrade, onUpgradeTier, onClose }: Props) {
  const [view, setView] = useState<"elemental" | "upgrade">("elemental");
  const [selected, setSelected] = useState<CrystalElement>("fire");
  const [selectedTier, setSelectedTier] = useState<CrystalTier>("legendary");
  const completed = CRYSTAL_ORDER.filter((element) => (network[element] ?? 0) > 0).length;
  const bonus = crystalBonuses(network);
  const tier = CRYSTAL_TIER_NODES[selectedTier];
  const tierLevel = tiers[selectedTier] ?? 0;
  const tierCost = crystalTierCost(selectedTier, tierLevel);
  const tierBonus = crystalTierBonuses(tiers);
  const tierProgress = CRYSTAL_TIER_ORDER.filter((entry) => (tiers[entry] ?? 0) > 0).length;

  return <section className={`elemental-synergy ${view === "upgrade" ? "elemental-synergy--upgrade" : ""}`} aria-label="Sinergia Elemental">
    <img className="elemental-synergy__bg" src={background} alt="" />
    <img className="elemental-synergy__header" src={header} alt="" />

    <h1>{view === "elemental" ? "SINERGIA ELEMENTAL" : "APRIMORAMENTO"}</h1>
    <button type="button" className="elemental-synergy__switch" onClick={() => setView(view === "elemental" ? "upgrade" : "elemental")} aria-label={view === "elemental" ? "Ir para aprimoramento" : "Voltar para sinergia elemental"}>
      <img src={upgradeOrb} alt="" /><span>{view === "elemental" ? "›" : "‹"}</span><b>{view === "elemental" ? "APRIMORAMENTO" : "VOLTAR"}</b>
    </button>

    {view === "elemental" && CRYSTAL_ORDER.map((element) => {
      const data = CRYSTAL_NODES[element];
      const nodeLevel = network[element] ?? 0;
      const unlocked = element !== "earth" || completed >= 3;
      return <div className={`synergy-node ${POS[element].label} ${selected === element ? "is-selected" : ""} ${!unlocked ? "is-locked" : ""}`} key={element} style={{ left: POS[element].x, top: POS[element].y, "--element-color": data.color } as CSSProperties}>
        <button className="synergy-node__crystal" type="button" aria-label={`Aprimorar cristal ${data.label}`} title={`Aprimorar ${data.label}: ${crystalCost(nodeLevel)} pedras`} aria-pressed={selected === element} onMouseEnter={() => setSelected(element)} onFocus={() => setSelected(element)} onClick={() => { setSelected(element); onUpgrade(element); }}>
          <img src={ART[element]} alt="" />
        </button>
        <button type="button" className="synergy-node__label" style={{ "--element-color": data.color } as CSSProperties} onClick={() => setSelected(element)}>
          <strong>{data.icon} {data.label} {data.icon}</strong>
          <span>{!unlocked ? "Bloqueado" : `Nv. ${nodeLevel}`}</span>
          <i><b>{data.icon}</b><em><u style={{ width: `${Math.min(100, (items[data.stone] ?? 0) / Math.max(1, crystalCost(nodeLevel)) * 100)}%` }} /></em>{items[data.stone] ?? 0}/{unlocked ? crystalCost(nodeLevel) : 10}</i>
        </button>
      </div>;
    })}

    {view === "upgrade" && <div className="elemental-synergy__tiers" aria-label="Cristais de aprimoramento">
      {CRYSTAL_TIER_ORDER.map((entry) => { const data = CRYSTAL_TIER_NODES[entry]; return <button type="button" key={entry} className={`synergy-tier ${selectedTier === entry ? "is-selected" : ""}`} aria-label={`Aprimorar cristal ${data.label}`} title={`Aprimorar ${data.label}: ${crystalTierCost(entry, tiers[entry] ?? 0)} de cada pedra`} aria-pressed={selectedTier === entry} onMouseEnter={() => setSelectedTier(entry)} onFocus={() => setSelectedTier(entry)} onClick={() => { setSelectedTier(entry); onUpgradeTier(entry); }} style={{ "--tier-color": data.color } as CSSProperties}>
        <img src={TIER_ART[entry]} alt="" /><strong>{data.label}</strong><span>Nv. {tiers[entry] ?? 0}/{CRYSTAL_MAX_LEVEL}</span>
      </button>; })}
    </div>}

    {view === "elemental" ? <aside className="elemental-synergy__right" aria-label="Resumo dos cristais">
      <SummaryCard title="🌿 Pedras Elementais" className="synergy-summary--stones">
        {CRYSTAL_ORDER.map((element) => { const entry = CRYSTAL_NODES[element]; return <div className="synergy-stone" key={element}><span>{entry.icon} Pedra {element === "nature" ? "da Natureza" : element === "earth" ? "da Terra" : `de ${entry.label[0] + entry.label.slice(1).toLowerCase()}`}</span><b>× {items[entry.stone] ?? 0}</b></div>; })}
      </SummaryCard>
      <SummaryCard title="Bônus Elemental" className="synergy-summary--bonus">
        {STAT_ROWS.map(([icon, name, prop]) => <div className="synergy-stat" key={name}><span>{icon} {name}</span><b>+{Math.round(bonus[prop] * 100)}%</b></div>)}
      </SummaryCard>
      <SummaryCard title="Progresso Elemental" className="synergy-summary--progress">
        <div className="synergy-progress"><i><em style={{ width: `${completed * 20}%` }} /></i><b>{completed}/5</b></div>
        <div className="synergy-progress__icons">{CRYSTAL_ORDER.map((element) => <span className={(network[element] ?? 0) > 0 ? "is-on" : ""} key={element}>{(network[element] ?? 0) > 0 ? CRYSTAL_NODES[element].icon : "🔒"}</span>)}</div>
      </SummaryCard>
    </aside> : <aside className="elemental-synergy__right" aria-label="Resumo do aprimoramento">
      <SummaryCard title="Pedras Necessárias" className="synergy-summary--stones">
        {tier.stones.map((stone) => <div className="synergy-stone" key={stone}><span>{stone === "stone_dragon" ? "🐉 Dracônica" : stone === "stone_dark" ? "🌑 Sombria" : stone === "stone_fire" ? "🔥 Fogo" : stone === "stone_water" ? "💧 Água" : "🌿 Natureza"}</span><b>{items[stone] ?? 0}/{tierCost}</b></div>)}
      </SummaryCard>
      <SummaryCard title="Bônus de Cristais" className="synergy-summary--bonus">
        <div className="synergy-stat"><span>♥ HP</span><b>+{Math.round(tierBonus.hpMult * 100)}%</b></div>
        <div className="synergy-stat"><span>⚔ Atk</span><b>+{Math.round(tierBonus.dmgMult * 100)}%</b></div>
        <div className="synergy-stat"><span>⬟ Def</span><b>+{Math.round(tierBonus.defMult * 100)}%</b></div>
      </SummaryCard>
      <SummaryCard title="Progresso dos Cristais" className="synergy-summary--progress">
        <div className="synergy-progress"><i><em style={{ width: `${tierProgress / 3 * 100}%` }} /></i><b>{tierProgress}/3</b></div>
        <div className="synergy-progress__icons">{CRYSTAL_TIER_ORDER.map((entry) => <span className={(tiers[entry] ?? 0) > 0 ? "is-on" : ""} key={entry}>{(tiers[entry] ?? 0) > 0 ? "◆" : "🔒"}</span>)}</div>
      </SummaryCard>
    </aside>}

    <footer className="elemental-synergy__footer">
      <button type="button" onClick={onClose}><img src={buttonClose} alt="" /><span>Fechar</span></button>
    </footer>
  </section>;
}

function SummaryCard({ title, className, children }: { title: string; className: string; children: ReactNode }) {
  return <section className={`synergy-summary ${className}`}><h2>{title}</h2><div>{children}</div></section>;
}
