import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, CircleHelp, Crown, Users } from "lucide-react";

export type HudTeamMember = {
  uid: string;
  name: string;
  image?: string;
  rarity: string;
  level: number;
  hp: number;
  maxHp: number;
  xp: number;
  maxXp: number;
  hunger: number;
  fainted: boolean;
};

const TIERS: Record<string, { color: string; label: string }> = {
  common: { color: "#b1c3d4", label: "Comum" },
  uncommon: { color: "#72dba4", label: "Incomum" },
  rare: { color: "#63bcff", label: "Raro" },
  epic: { color: "#c099ff", label: "Épico" },
  legendary: { color: "#f2cc75", label: "Lendário" },
  mythic: { color: "#ff8cb3", label: "Mítico" },
  mythic_shiny: { color: "#f9d4ff", label: "Mítico Shiny" },
};

const percent = (value: number, max: number) => Math.max(0, Math.min(100, value / Math.max(1, max) * 100));

function TeamMeter({ label, value, max, kind }: {
  label: string; value: number; max: number; kind: "hp" | "xp" | "hunger";
}) {
  return <span className={`revo-team__stat revo-team__stat--${kind}`}>
    <span>{label}</span>
    <span className="revo-team__meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.max(0, Math.min(max, value))}>
      <span style={{ width: `${percent(value, max)}%` }} />
    </span>
    <b>{kind === "hp" ? `${Math.round(value)}/${max}` : `${Math.round(percent(value, max))}%`}</b>
  </span>;
}

export function TeamHud({ members, selectedUid, onSelect, onManage }: {
  members: HudTeamMember[];
  selectedUid: string | null;
  onSelect: (uid: string) => void;
  onManage: () => void;
}) {
  const [compact, setCompact] = useState(false);
  return <section className={`revo-team ${compact ? "is-compact" : ""}`} aria-label="Equipe Pokémon">
    <header className="revo-team__header revo-panel">
      <button type="button" onClick={onManage} title="Gerenciar equipe" aria-label={`Gerenciar equipe, ${members.length} de 6 Pokémon`}>
        <Users /><strong>EQUIPE</strong><span>{members.length}/6</span>
      </button>
      <button type="button" onClick={() => setCompact(!compact)} aria-label={compact ? "Expandir equipe" : "Recolher detalhes da equipe"} aria-expanded={!compact}>
        {compact ? <ChevronRight /> : <ChevronLeft />}
      </button>
    </header>
    <div className="revo-team__list">
      {members.map((member, index) => {
        const tier = TIERS[member.rarity] ?? TIERS.common;
        const hp = Math.max(0, Math.min(member.maxHp, member.hp));
        return <button
          type="button"
          key={member.uid}
          className={`revo-team__card revo-panel ${selectedUid === member.uid ? "is-selected" : ""} ${member.fainted ? "is-fainted" : ""}`}
          style={{ "--pet-tier": tier.color } as CSSProperties}
          data-tier={member.rarity}
          aria-label={`Ver ${member.name}, nível ${member.level}, ${tier.label}. HP ${Math.round(hp)}/${member.maxHp}, XP ${member.xp}/${member.maxXp}, fome ${Math.round(member.hunger)}%.`}
          aria-pressed={selectedUid === member.uid}
          title={`${member.name} · ${tier.label} · Lv. ${member.level}\nHP ${Math.round(hp)}/${member.maxHp} · XP ${member.xp}/${member.maxXp} · Fome ${Math.round(member.hunger)}%\nClique para ver detalhes e cuidados`}
          onClick={() => onSelect(member.uid)}
        >
          <span className="revo-team__portrait">
            <span className="revo-team__ball-center" />
            {member.image ? <img src={member.image} alt="" /> : <CircleHelp />}
            <span className="revo-team__level">{member.level}</span>
            {index === 0 && <Crown className="revo-team__leader" aria-label="Líder" />}
          </span>
          <span className="revo-team__details">
            <span className="revo-team__name"><strong>{member.name}</strong><span>Lv. {member.level}</span></span>
            <span className="revo-team__tier">{tier.label}{member.fainted ? " · Desmaiado" : ""}</span>
            <TeamMeter label="HP" value={hp} max={member.maxHp} kind="hp" />
            <TeamMeter label="XP" value={member.xp} max={member.maxXp} kind="xp" />
            <TeamMeter label="Fome" value={member.hunger} max={100} kind="hunger" />
          </span>
          <span className="revo-team__compact-hp" aria-hidden="true"><span style={{ width: `${percent(hp, member.maxHp)}%` }} /></span>
        </button>;
      })}
      {!members.length && !compact && <button type="button" className="revo-team__empty revo-panel" onClick={onManage}>Adicione Pokémon à sua equipe.</button>}
    </div>
  </section>;
}
