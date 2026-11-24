import { useState } from "react";
import mundiBg from "@/ambiente/mundi/mundi-bg.jpg";
import kantoThumb from "@/ambiente/mundi/kanto-thumb.jpg";
import "./worldmap-v2.css";

type Region = {
  id: string;
  name: string;
  sub: string;
  icon: string;
  x: number;
  y: number;
  locked: boolean;
};

const REGIONS: Region[] = [
  { id: "kanto", name: "Kanto", sub: "Temporada Atual", icon: "🌿", x: 23, y: 70, locked: false },
  { id: "johto", name: "Johto", sub: "Em breve", icon: "⛩️", x: 19, y: 15, locked: true },
  { id: "sinnoh", name: "Sinnoh", sub: "Temporada 03 🔒", icon: "❄️", x: 39, y: 16, locked: true },
  { id: "hoenn", name: "Hoenn", sub: "Temporada 02 🔒", icon: "🌋", x: 61, y: 47, locked: true },
  { id: "ancestral", name: "Ilha Ancestral", sub: "Evento Especial", icon: "💎", x: 79, y: 14, locked: true },
  { id: "paldea", name: "Paldea", sub: "Em breve", icon: "🏜️", x: 73, y: 74, locked: true },
];

const BADGES = ["🪨", "💧", "⚡", "🌱", "❤️", "🕷️", "🔥", "🍃"];
const REWARDS = ["🔴", "💎", "🪙", "🥚", "📕"];
const TABS = ["Campanha", "Ginásios", "Temporada", "Recompensas"] as const;

export function WorldMapV2({ onClose, onTravel }: { onClose: () => void; onTravel: () => void }) {
  const [selectedId, setSelectedId] = useState("kanto");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Campanha");
  const [notice, setNotice] = useState<string | null>(null);
  // Painel lateral sempre visível (fecha só se o jogador quiser ver o mapa inteiro).
  const [panelOpen, setPanelOpen] = useState(true);
  const selected = REGIONS.find((region) => region.id === selectedId) ?? REGIONS[0];

  const pick = (region: Region) => {
    if (region.locked) {
      setNotice(`🔒 ${region.name} — ${region.sub}`);
      window.setTimeout(() => setNotice(null), 2200);
      return;
    }
    setSelectedId(region.id);
    setPanelOpen(true);
  };

  return <div className="wm2-backdrop" onClick={onClose}>
    <div className="wm2" onClick={(event) => event.stopPropagation()}>
      <header className="wm2-head">
        <div className="wm2-logo"><b>POKE</b><span>EMERALD</span><em>SAGA</em></div>
        <div className="wm2-title"><span>🌀</span> Mapa Mundial</div>
        <button type="button" className="wm2-close" onClick={onClose} aria-label="Fechar mapa">✕</button>
      </header>

      <div className="wm2-stage">
        <img className="wm2-bg" src={mundiBg} alt="" draggable={false} />
        <div className="wm2-vignette" />

        {REGIONS.map((region) => (
          <button
            type="button"
            key={region.id}
            className={`wm2-pin ${region.locked ? "is-locked" : ""} ${selectedId === region.id ? "is-active" : ""}`}
            style={{ left: `${region.x}%`, top: `${region.y}%` }}
            onClick={() => pick(region)}
          >
            <span className="wm2-pin__badge">{region.locked ? "🔒" : region.icon}</span>
            <span className="wm2-pin__name">{region.name}</span>
            <span className="wm2-pin__sub">{region.sub}</span>
          </button>
        ))}

        {notice && <div className="wm2-toast">{notice}</div>}

        {!panelOpen && <button type="button" className="wm2-openpanel" onClick={() => setPanelOpen(true)}>☰ Regiões</button>}
        {panelOpen && <aside className="wm2-panel">
          <header className="wm2-panel__head">
            <span className="wm2-panel__ball" />
            <strong>Região de {selected.name}</strong>
            <button type="button" className="wm2-panel__x" onClick={() => setPanelOpen(false)} aria-label="Fechar detalhes">✕</button>
          </header>
          <p className="wm2-panel__tag">A Jornada das Insígnias</p>

          <div className="wm2-hero">
            <img src={kantoThumb} alt={`Mapa de ${selected.name}`} draggable={false} />
          </div>

          <nav className="wm2-tabs">
            {TABS.map((item) => (
              <button type="button" key={item} className={tab === item ? "is-on" : ""} onClick={() => setTab(item)}>{item}</button>
            ))}
          </nav>

          {tab === "Campanha" ? <>
            <div className="wm2-card">
              <div className="wm2-card__thumb"><img src={kantoThumb} alt="" draggable={false} /></div>
              <div className="wm2-card__info">
                <h4>Cidade de Pewter</h4>
                <p>O primeiro desafio da Liga! Derrote Brock e conquiste a Insígnia de Pedra!</p>
                <span className="wm2-card__req">⚔ Nível recomendado: 12 – 18</span>
              </div>
            </div>

            <div className="wm2-block">
              <div className="wm2-block__head"><strong>Progresso da Região</strong><b>1/8 Insígnias</b></div>
              <div className="wm2-badges">
                {BADGES.map((badge, index) => (
                  <span key={index} className={`wm2-badge ${index === 0 ? "is-on" : ""}`}>{index === 0 ? badge : "•"}</span>
                ))}
              </div>
            </div>

            <div className="wm2-block">
              <div className="wm2-block__head"><strong>Recompensas da Conquista</strong></div>
              <div className="wm2-rewards">
                {REWARDS.map((reward, index) => <span key={index}>{reward}</span>)}
              </div>
            </div>
          </> : <p className="wm2-soon">{tab} — em breve.</p>}

          <button type="button" className="wm2-go" onClick={onTravel}>⚔ Ir para o Mapa</button>
        </aside>}
      </div>

      <footer className="wm2-foot">
        <div className="wm2-season">
          <span className="wm2-season__icon">🏅</span>
          <div>
            <strong>Temporada 01</strong>
            <em>Liga de Kanto</em>
            <small>⏱ Duração: 30 dias</small>
          </div>
        </div>
        <div className="wm2-season__rewards">
          <strong>Recompensas da Temporada</strong>
          <div>{REWARDS.map((reward, index) => <span key={index}>{reward}</span>)}</div>
        </div>
      </footer>
    </div>
  </div>;
}
