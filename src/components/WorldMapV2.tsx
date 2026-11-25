import { useState } from "react";
import { Bug, Clock, Droplets, Feather, Flame, Heart, Leaf, LockKeyhole, Menu, Mountain, Swords, X, Zap } from "lucide-react";
import mundiBg from "@/ambiente/mundi/mundi-bg.jpg";
import kantoThumb from "@/ambiente/mundi/kanto-thumb.jpg";
import mapIcon from "@/ambiente/aba/men ic/Mapa.webp";
import medalIcon from "@/ambiente/aba/men ic/Reward.webp";
import meadowImg from "@/assets/worldmap-meadow.webp";
import blossomImg from "@/assets/worldmap-blossom.webp";
import iceImg from "@/assets/worldmap-ice.webp";
import caveImg from "@/assets/worldmap-cave.webp";
import ruinsImg from "@/assets/worldmap-ruins.webp";
import hiveImg from "@/assets/worldmap-hive.webp";
import ballImg from "@/assets/items/icon-pokeball.webp";
import coinImg from "@/assets/emerald-coin.webp";
import eggImg from "@/assets/egg-dragonite-shiny.webp";
import bookImg from "@/assets/icons/book-exp.webp";
import crystalImg from "@/ambiente/aba/men ic/nhuni/10_Icones/gem_azul.png";
import "./worldmap-v2.css";

export type WorldMapDestination = {
  id: string;
  name: string;
  diff: string;
  minLevel: number;
  maxLevel?: number;
  element?: string;
  stars?: number;
  bg?: string;
};

type Region = {
  id: string;
  name: string;
  sub: string;
  image: string;
  x: number;
  y: number;
  locked: boolean;
};

const REGIONS: Region[] = [
  { id: "kanto", name: "Kanto", sub: "Temporada Atual", image: meadowImg, x: 23, y: 70, locked: false },
  { id: "johto", name: "Johto", sub: "Em breve", image: blossomImg, x: 19, y: 15, locked: true },
  { id: "sinnoh", name: "Sinnoh", sub: "Temporada 03", image: iceImg, x: 39, y: 16, locked: true },
  { id: "hoenn", name: "Hoenn", sub: "Temporada 02", image: caveImg, x: 61, y: 47, locked: true },
  { id: "ancestral", name: "Ilha Ancestral", sub: "Evento Especial", image: ruinsImg, x: 79, y: 14, locked: true },
  { id: "paldea", name: "Paldea", sub: "Em breve", image: hiveImg, x: 73, y: 74, locked: true },
];

const BADGES = [
  { label: "Pedra", Icon: Mountain },
  { label: "Cascata", Icon: Droplets },
  { label: "Trovão", Icon: Zap },
  { label: "Arco-íris", Icon: Leaf },
  { label: "Alma", Icon: Heart },
  { label: "Pântano", Icon: Bug },
  { label: "Vulcão", Icon: Flame },
  { label: "Terra", Icon: Feather },
];
const REWARDS = [
  { label: "Pokébolas", image: ballImg },
  { label: "Cristais", image: crystalImg },
  { label: "Moedas", image: coinImg },
  { label: "Ovos", image: eggImg },
  { label: "Livros de XP", image: bookImg },
];
const TABS = ["Campanha", "Ginásios", "Temporada", "Recompensas"] as const;

export function WorldMapV2({ onClose, onTravel, onTravelTo }: {
  onClose: () => void;
  onTravel: () => void;
  /** Viaja direto para um mapa (usado pelos pontos de rota). */
  onTravelTo?: (mapId: string) => void;
}) {
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
        <div className="wm2-title"><img src={mapIcon} alt="" draggable={false} /> Mapa Mundial</div>
        <button type="button" className="wm2-close" onClick={onClose} aria-label="Fechar mapa"><X aria-hidden="true" /></button>
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
            <span className="wm2-pin__badge">
              <img src={region.image} alt="" draggable={false} />
              {region.locked && <span className="wm2-pin__lock" aria-hidden="true"><LockKeyhole /></span>}
            </span>
            <span className="wm2-pin__name">{region.name}</span>
            <span className="wm2-pin__sub">{region.locked ? `${region.sub} · bloqueado` : region.sub}</span>
          </button>
        ))}

        {onTravelTo && (
          <button type="button" className="wm2-route" style={{ left: "30%", top: "82%" }} onClick={() => onTravelTo("rota1")}>
            <span className="wm2-route__icon"><img src={meadowImg} alt="" draggable={false} /></span> Rota 1
          </button>
        )}
        {notice && <div className="wm2-toast">{notice}</div>}

        {!panelOpen && <button type="button" className="wm2-openpanel" onClick={() => setPanelOpen(true)}><Menu aria-hidden="true" /> Regiões</button>}
        {panelOpen && <aside className="wm2-panel">
          <header className="wm2-panel__head">
            <span className="wm2-panel__ball" />
            <strong>Região de {selected.name}</strong>
            <button type="button" className="wm2-panel__x" onClick={() => setPanelOpen(false)} aria-label="Fechar detalhes"><X aria-hidden="true" /></button>
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
                <span className="wm2-card__req"><Swords aria-hidden="true" /> Nível recomendado: 12 – 18</span>
              </div>
            </div>

            <div className="wm2-block">
              <div className="wm2-block__head"><strong>Progresso da Região</strong><b>1/8 Insígnias</b></div>
              <div className="wm2-badges">
                {BADGES.map(({ label, Icon }, index) => (
                  <span key={label} title={`Insígnia de ${label}${index === 0 ? " · conquistada" : " · bloqueada"}`} className={`wm2-badge ${index === 0 ? "is-on" : ""}`}><Icon aria-label={`Insígnia de ${label}`} /></span>
                ))}
              </div>
            </div>

            <div className="wm2-block">
              <div className="wm2-block__head"><strong>Recompensas da Conquista</strong></div>
              <div className="wm2-rewards">
                {REWARDS.map((reward) => <span key={reward.label} title={reward.label}><img src={reward.image} alt={reward.label} draggable={false} /></span>)}
              </div>
            </div>
          </> : <p className="wm2-soon">{tab} — em breve.</p>}

          <button type="button" className="wm2-go" onClick={() => (onTravelTo ? onTravelTo("rota1") : onTravel())}><Swords aria-hidden="true" /> Ir para o Mapa</button>
        </aside>}
      </div>

      <footer className="wm2-foot">
        <div className="wm2-season">
          <span className="wm2-season__icon"><img src={medalIcon} alt="" draggable={false} /></span>
          <div>
            <strong>Temporada 01</strong>
            <em>Liga de Kanto</em>
            <small><Clock aria-hidden="true" /> Duração: 30 dias</small>
          </div>
        </div>
        <div className="wm2-season__rewards">
          <strong>Recompensas da Temporada</strong>
          <div>{REWARDS.map((reward) => <span key={reward.label} title={reward.label}><img src={reward.image} alt={reward.label} draggable={false} /></span>)}</div>
        </div>
      </footer>
    </div>
  </div>;
}
