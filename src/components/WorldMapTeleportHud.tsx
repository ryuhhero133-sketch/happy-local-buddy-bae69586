import { Map, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import forestImage from "@/assets/worldmap-forest.jpg";
import iceImage from "@/assets/worldmap-ice.jpg";
import caveImage from "@/assets/worldmap-cave.jpg";
import ruinsImage from "@/assets/worldmap-ruins.jpg";
import townImage from "@/assets/worldmap-town.jpg";
import marketImage from "@/assets/worldmap-market.jpg";
import meadowImage from "@/assets/worldmap-meadow.jpg";
import hiveImage from "@/assets/worldmap-hive.jpg";
import crystalImage from "@/assets/worldmap-crystal.jpg";
import blossomImage from "@/assets/worldmap-blossom.jpg";

export type WorldMapDestination = {
  id: string;
  name: string;
  diff: string;
  minLevel: number;
  element?: string;
  bg?: string;
  previewImage?: string;
};

type Props = {
  destinations: WorldMapDestination[];
  currentMap: string;
  trainerEnergy: number;
  onClose: () => void;
  onTeleport: (destination: WorldMapDestination) => void;
  energyCostFor?: (destinationId: string) => number;
};

const imageForDestination = (destination: WorldMapDestination) => {
  const key = `${destination.id} ${destination.name} ${destination.element ?? ""}`.toLowerCase();
  if (key.includes("pokemarkt")) return marketImage;
  if (destination.id === "mapinha13" || destination.id === "mapinha7") return meadowImage;
  if (destination.id === "terra" || destination.id === "mapinha12") return hiveImage;
  if (destination.id === "cristal_cave") return crystalImage;
  if (destination.id === "florest_shiny" || destination.id === "ruinas_de_venus") return blossomImage;
  if (key.includes("cidade") || key.includes("revo") || key.includes("revoland")) return destination.bg ?? townImage;
  if (key.includes("ice") || key.includes("gelo")) return iceImage;
  if (key.includes("cave") || key.includes("cristal") || key.includes("ninho")) return destination.bg ?? caveImage;
  if (key.includes("ruina") || key.includes("bone") || key.includes("venus")) return destination.bg ?? ruinsImage;
  return destination.bg ?? forestImage;
};

const elementIcon = (element?: string) => {
  const key = element?.toLowerCase() ?? "";
  if (key.includes("água") || key.includes("agua")) return "💧";
  if (key.includes("gelo")) return "❄️";
  if (key.includes("terra")) return "🪨";
  if (key.includes("inseto")) return "🍃";
  if (key.includes("planta") || key.includes("grama")) return "🌿";
  return "✨";
};

export function WorldMapTeleportHud({ destinations, currentMap, trainerEnergy, onClose, onTeleport, energyCostFor }: Props) {
  const costFor = (id: string) => (energyCostFor ? energyCostFor(id) : 5);
  return (
    <div className="world-atlas-backdrop" onClick={onClose}>
      <section className="world-atlas" onClick={(event) => event.stopPropagation()} aria-label="Mapa Mundi">
        <header className="world-atlas__header">
          <div className="world-atlas__title-wrap">
            <span className="world-atlas__emblem"><Map aria-hidden="true" /></span>
            <div>
              <p className="world-atlas__eyebrow">Atlas dos aventureiros</p>
              <h2>Mapa Mundi <span>Teleporte Grátis</span></h2>
            </div>
          </div>
          <div className="world-atlas__header-actions">
            <span className="world-atlas__energy"><Zap aria-hidden="true" /> {trainerEnergy}</span>
            <Button type="button" size="icon" variant="ghost" className="world-atlas__close" onClick={onClose} aria-label="Fechar mapa">
              <X aria-hidden="true" />
            </Button>
          </div>
        </header>

        <div className="world-atlas__grid">
          {destinations.map((destination) => {
            const isCurrent = currentMap === destination.id;
            const isLocked = false;
            const previewImage = imageForDestination(destination);
            return (
              <article className={`world-destination ${isCurrent ? "is-current" : ""}`} key={destination.id}>
                <img
                  src={previewImage}
                  alt=""
                  loading="lazy"
                  width={992}
                  height={672}
                  className="world-destination__image pixelated"
                />
                <div className="world-destination__shade" />
                <span className="world-destination__element" aria-hidden="true">{elementIcon(destination.element)}</span>
                {isCurrent && <span className="world-destination__current"><Sparkles aria-hidden="true" /> Você está aqui</span>}
                <div className="world-destination__content">
                  <div>
                    <h3>{destination.name}</h3>
                    <p>{destination.diff} · Lv.{destination.minLevel} · {destination.element || "Normal"}</p>
                  </div>
                  <Button
                    type="button"
                    className="world-destination__button"
                    disabled={isLocked}
                    onClick={() => onTeleport({ ...destination, previewImage })}
                  >
                    {isCurrent ? "Atual" : `Teleportar · ${costFor(destination.id)}⚡`}
                    {!isCurrent && <span aria-hidden="true">→</span>}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="world-atlas__footer">
          <Sparkles aria-hidden="true" />
          <span>Escolha um destino ilustrado</span>
          <span className="world-atlas__footer-cost"><Zap aria-hidden="true" /> Revoland: 1 ⚡ · Pokémarkt: 2 ⚡ · outros: 5 ⚡</span>
        </footer>
      </section>
    </div>
  );
}