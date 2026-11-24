import { SPECIES_BASE } from "@/game/systems";
import { getDex, TYPE_COLOR, TYPE_ICON } from "@/game/movesets";
import "./pet-card.css";

const RARITY_MULT: Record<string, number> = {
  common: 1, uncommon: 1.05, rare: 1.12, epic: 1.2,
  legendary: 1.35, mythic: 1.5, mythic_shiny: 1.65,
};
const RARITY_LABEL: Record<string, string> = {
  common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico",
  legendary: "Lendário", mythic: "Mítico", mythic_shiny: "Mítico Shiny",
};

export function starsForLevel(level: number) {
  if (level >= 200) return 3;
  if (level >= 150) return 2;
  if (level >= 100) return 1;
  return 0;
}

export type PetCardProps = {
  name: string;
  species: string;
  level: number;
  rarity: string;
  image?: string;
  hp: number;
  maxHp: number;
  isLeader?: boolean;
  onClose: () => void;
  onMakeLeader?: () => void;
};

export function PetCard({ name, species, level, rarity, image, hp, maxHp, isLeader, onClose, onMakeLeader }: PetCardProps) {
  const base = (SPECIES_BASE as Record<string, { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }>)[species]
    ?? { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 };
  const mult = RARITY_MULT[rarity] ?? 1;
  const scale = (1 + Math.max(0, level - 1) * 0.05) * mult;
  const stats = [
    { key: "HP", value: Math.round(base.hp * scale), color: "#f26d6d" },
    { key: "ATK", value: Math.round(base.atk * scale), color: "#f59f45" },
    { key: "DEF", value: Math.round(base.def * scale), color: "#54a8f0" },
    { key: "S.ATK", value: Math.round(base.spa * scale), color: "#b07cf0" },
    { key: "S.DEF", value: Math.round(base.spd * scale), color: "#67c46b" },
    { key: "VEL", value: Math.round(base.spe * scale), color: "#f2c94c" },
  ];
  const total = stats.reduce((sum, s) => sum + s.value, 0);
  const maxStat = Math.max(...stats.map((s) => s.value), 1);
  const dex = getDex(species as never) as { types?: string[]; moves?: { name?: string }[] };
  const types = (dex.types ?? []) as string[];
  const moves = (dex.moves ?? []).map((m) => m.name).filter(Boolean).slice(0, 2) as string[];
  const stars = starsForLevel(level);
  const hpPct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));

  return <div className="pc-backdrop" onClick={onClose}>
    <div className="pc-card" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="pc-close" onClick={onClose} aria-label="Fechar card">✕</button>

      <div className="pc-top">
        <div className="pc-portrait">
          {image ? <img src={image} alt={name} draggable={false} /> : <span>?</span>}
        </div>
        <div className="pc-head">
          <div className="pc-name">
            <span className="pc-ball" />
            <strong>{name}</strong>
          </div>
          <div className="pc-types">
            {types.map((type) => (
              <span key={type} className="pc-type" style={{ background: TYPE_COLOR[type] ?? "#9ca3af" }}>
                <span>{TYPE_ICON[type] ?? "◆"}</span>{type}
              </span>
            ))}
            {types.length === 0 && <span className="pc-type" style={{ background: "#9ca3af" }}>{RARITY_LABEL[rarity] ?? rarity}</span>}
          </div>
          <div className="pc-power">
            <span>Poder Total</span>
            <b>✦ {total}</b>
          </div>
          <div className="pc-hpbar" title={`HP ${Math.round(hp)}/${maxHp}`}>
            <i style={{ width: `${hpPct}%` }} />
          </div>
        </div>
      </div>

      <div className="pc-level">
        <span className="pc-lv">Lv. {level}</span>
        <span className="pc-stars">{stars > 0 ? "★".repeat(stars) : "—"}</span>
        <span className="pc-rarity">{RARITY_LABEL[rarity] ?? rarity}</span>
      </div>

      <div className="pc-section">
        <span className="pc-section__title">▮ Atributos</span>
        <div className="pc-stats">
          {stats.map((stat) => (
            <div className="pc-stat" key={stat.key}>
              <span className="pc-stat__label">{stat.key}</span>
              <span className="pc-stat__bar"><i style={{ width: `${(stat.value / maxStat) * 100}%`, background: stat.color }} /></span>
              <b>{stat.value}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="pc-section">
        <span className="pc-section__title">✦ Habilidades</span>
        <div className="pc-abilities">
          {moves.length > 0
            ? moves.map((move) => <span key={move} className="pc-ability">✦ {move}</span>)
            : <span className="pc-ability pc-ability--empty">Sem habilidades</span>}
        </div>
      </div>

      {onMakeLeader && !isLeader && (
        <button type="button" className="pc-leader" onClick={onMakeLeader}>👑 Tornar líder</button>
      )}
      {isLeader && <p className="pc-leader-note">👑 Este é o seu líder</p>}
    </div>
  </div>;
}
