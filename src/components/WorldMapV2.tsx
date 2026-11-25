import { useMemo, useState } from "react";
import mundiBg from "@/ambiente/mundi/mundi-bg.jpg";
import {
  canSeeTestMaps,
  isMapBlocked,
  isTestMap,
  isWorldMapDestinationUnlocked,
} from "@/game/mapAccess";
import { publicMapName } from "@/game/mapLabels";
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

const elementIcon = (element?: string) => {
  const key = element?.toLowerCase() ?? "";
  if (key.includes("água") || key.includes("agua")) return "💧";
  if (key.includes("gelo")) return "❄️";
  if (key.includes("terra") || key.includes("pedra")) return "🪨";
  if (key.includes("inseto")) return "🍃";
  if (key.includes("planta") || key.includes("grama")) return "🌿";
  if (key.includes("fogo")) return "🔥";
  if (key.includes("elétrico") || key.includes("eletrico")) return "⚡";
  if (key.includes("fantasma")) return "👻";
  return "✨";
};

const mpNumber = (id: string) => Number(publicMapName(id).replace(/\D/g, "")) || 999;

export function WorldMapV2({ destinations, currentMap, trainerEnergy, identityId, onClose, onTravelTo, energyCostFor }: {
  destinations: WorldMapDestination[];
  currentMap: string;
  trainerEnergy: number;
  identityId?: string;
  onClose: () => void;
  onTravelTo?: (mapId: string) => void;
  energyCostFor?: (mapId: string) => number;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toUpperCase();
    return destinations
      .filter((destination) => canSeeTestMaps(identityId) || !isTestMap(destination.id))
      .filter((destination) => !needle || publicMapName(destination.id).includes(needle))
      .sort((a, b) => mpNumber(a.id) - mpNumber(b.id));
  }, [destinations, identityId, query]);

  const unlockedCount = visible.filter((destination) =>
    isWorldMapDestinationUnlocked(destination.id, identityId)
    && !isMapBlocked(destination.id)).length;

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

        <section className="wm2-atlas" aria-label="Destinos do mapa">
          <div className="wm2-atlas__head">
            <div>
              <strong>Áreas liberadas</strong>
              <span>{unlockedCount} de {visible.length} disponíveis</span>
            </div>
            <label className="wm2-search">
              <span aria-hidden="true">🔎</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar MP"
                inputMode="search"
                aria-label="Buscar área MP"
              />
            </label>
          </div>

          <div className="wm2-list">
            {visible.map((destination) => {
              const unlocked = isWorldMapDestinationUnlocked(destination.id, identityId)
                && !isMapBlocked(destination.id);
              const current = currentMap === destination.id;
              const cost = energyCostFor?.(destination.id) ?? 0;
              const label = publicMapName(destination.id);
              return <article
                key={destination.id}
                className={`wm2-row ${current ? "is-current" : ""} ${unlocked ? "" : "is-locked"}`}
              >
                <span className="wm2-row__code">{label}</span>
                <div className="wm2-row__info">
                  <strong>{elementIcon(destination.element)} Área {label}</strong>
                  <small>
                    {unlocked
                      ? `Lv.${destination.minLevel}${destination.maxLevel ? `–${destination.maxLevel}` : "+"} · ${destination.element || "Normal"}`
                      : "🔒 Bloqueado"}
                  </small>
                </div>
                <button
                  type="button"
                  className="wm2-row__go"
                  disabled={!unlocked || current || !onTravelTo}
                  onClick={() => onTravelTo?.(destination.id)}
                >
                  {current ? "Atual" : !unlocked ? "🔒" : cost > 0 ? `${cost}⚡` : "Ir"}
                </button>
              </article>;
            })}
            {visible.length === 0 && <p className="wm2-empty">Nenhuma área encontrada.</p>}
          </div>
        </section>
      </div>

      <footer className="wm2-foot">
        <div className="wm2-season">
          <span className="wm2-season__icon">⚡</span>
          <div>
            <strong>Energia</strong>
            <em>{trainerEnergy}</em>
            <small>Viagens gastam energia conforme a distância.</small>
          </div>
        </div>
        <div className="wm2-season__rewards">
          <strong>Dica</strong>
          <small>As áreas são identificadas por MP1, MP2, MP3… para manter a surpresa.</small>
        </div>
      </footer>
    </div>
  </div>;
}
