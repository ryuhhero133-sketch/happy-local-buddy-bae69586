import type { CSSProperties } from "react";
import { CircleHelp } from "lucide-react";

export type HudTarget = {
  id: number;
  name: string;
  level: number;
  rarity: string;
  hp: number;
  maxHp: number;
  image?: string;
  sheet?: string;
  frame: number;
  direction: number;
  flip: boolean;
  elite: boolean;
};

const TIERS: Record<string, { color: string; label: string }> = {
  common: { color: "#72d79c", label: "Comum" },
  uncommon: { color: "#4dd5b2", label: "Incomum" },
  rare: { color: "#62b7ff", label: "Raro" },
  epic: { color: "#bc91ff", label: "Épico" },
  legendary: { color: "#ffad64", label: "Lendário" },
  mythic: { color: "#ff82b4", label: "Mítico" },
  mythic_shiny: { color: "#f6a2eb", label: "Mítico Shiny" },
};

export function TargetHud({ target }: { target: HudTarget }) {
  const tier = TIERS[target.rarity] ?? TIERS.common;
  const hp = Math.max(0, Math.min(target.maxHp, target.hp));
  const percent = Math.max(0, Math.min(100, hp / Math.max(1, target.maxHp) * 100));
  const description = `${target.name} · Lv. ${target.level} · ${tier.label}${target.elite ? " · Elite" : ""} · HP ${Math.round(hp)}/${target.maxHp}`;

  return <section
    className="revo-target revo-panel"
    data-tier={target.rarity}
    style={{ "--target-tier": tier.color } as CSSProperties}
    aria-label={`Alvo: ${description}`}
    title={description}
  >
    <span className="revo-target__portrait">
      {target.sheet ? <span className="revo-target__sheet" style={{
        backgroundImage: `url(${target.sheet})`,
        backgroundPosition: `${target.frame * 33.333}% ${target.direction * 33.333}%`,
      }} /> : target.image ? <img src={target.image} alt="" style={{ transform: target.flip ? "scaleX(-1)" : undefined }} /> : <CircleHelp />}
    </span>
    <span className="revo-target__info">
      <strong>Lv. {target.level}</strong>
      <span className="revo-target__hp" role="progressbar" aria-label={`HP de ${target.name}`} aria-valuemin={0} aria-valuemax={target.maxHp} aria-valuenow={hp}>
        <span style={{ width: `${percent}%` }} />
      </span>
    </span>
  </section>;
}
