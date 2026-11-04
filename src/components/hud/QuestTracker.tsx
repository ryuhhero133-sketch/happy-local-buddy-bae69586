import { useState } from "react";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleAlert, Star } from "lucide-react";

export type HudQuest = {
  id: string; title: string; icon: string; progress: number; target: number;
  claimed: boolean; reward: number; vipOnly?: boolean;
};

export function QuestTracker({ quests, region, resetIn, vip, onClaim, onOpen }: {
  quests: HudQuest[]; region: string; resetIn: string; vip: boolean;
  onClaim: (id: string) => void; onOpen: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [index, setIndex] = useState(0);
  const available = quests.filter((quest) => !quest.claimed);
  const quest = available[index % Math.max(1, available.length)];
  const ready = quest && quest.progress >= quest.target;
  return <section className="revo-quests revo-panel" aria-label="Acompanhamento de missões">
    <header className="revo-panel__header">
      <CircleAlert className="revo-gold" /><strong>Quests</strong>
      <span className="revo-muted">{quest ? `${index % available.length + 1}/${available.length}` : "Concluídas"}</span>
      <button type="button" className="revo-icon revo-push" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} aria-label={collapsed ? "Expandir missões" : "Recolher missões"}>{collapsed ? <ChevronUp /> : <ChevronDown />}</button>
    </header>
    {!collapsed && <>
      {quest ? <div className="revo-quests__body">
        <span className="revo-quests__emblem" aria-hidden="true">{quest.icon}</span>
        <div className="revo-quests__details">
          <div className="revo-quests__region">{region} <Star size={12} className="revo-gold" /></div>
          <strong>{quest.title}{quest.vipOnly ? " · VIP" : ""}</strong>
          <div className="revo-quests__progress">
            <div className="revo-meter" role="progressbar" aria-label={quest.title} aria-valuemin={0} aria-valuemax={quest.target} aria-valuenow={Math.min(quest.progress, quest.target)}><span style={{ width: `${Math.min(100, quest.progress / Math.max(1, quest.target) * 100)}%` }} /></div>
            <b>{quest.progress}/{quest.target}</b>
          </div>
          {ready && <button type="button" className="revo-claim" disabled={quest.vipOnly && !vip} onClick={() => onClaim(quest.id)}>{quest.vipOnly && !vip ? "Requer VIP" : `Resgatar +${quest.reward} ouro`}</button>}
        </div>
      </div> : <p className="revo-quests__complete">Todas as missões foram resgatadas. Boa aventura!</p>}
      <footer>
        <button type="button" title="Abrir livro de missões" onClick={onOpen}><BookOpen size={12} /> Missões</button>
        <span title="Tempo até a renovação">{resetIn}</span>
        <div className="revo-quests__pagination">
          <button type="button" aria-label="Missão anterior" disabled={available.length < 2} onClick={() => setIndex((index + available.length - 1) % available.length)}><ChevronLeft /></button>
          <button type="button" aria-label="Próxima missão" disabled={available.length < 2} onClick={() => setIndex((index + 1) % available.length)}><ChevronRight /></button>
        </div>
      </footer>
    </>}
  </section>;
}
