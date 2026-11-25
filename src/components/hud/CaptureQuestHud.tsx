import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CAPTURE_QUEST_MILESTONES } from "@/game/captureQuests";
import "./capture-quests.css";

export type CaptureQuestView = {
  id: string;
  title: string;
  species: string;
  map: string;
  level: string;
  chance: string;
  done: boolean;
};

const speciesLabel = (id: string) => id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function CaptureQuestHud({ quests, milestones }: {
  quests: CaptureQuestView[];
  milestones: number[];
}) {
  const [open, setOpen] = useState(false);
  const completed = quests.filter((quest) => quest.done).length;
  const next = quests.filter((quest) => !quest.done).slice(0, 3);
  const nextMilestone = CAPTURE_QUEST_MILESTONES.find((milestone) => completed < milestone.at);
  const progress = nextMilestone
    ? Math.max(0, Math.min(100, (completed / nextMilestone.at) * 100))
    : 100;

  return <>
    <section className="revo-panel capture-quests" aria-label={`Missões de captura: ${completed} de 20`}>
      <header className="revo-panel__header">
        <span aria-hidden="true">🏅</span>
        <strong>Missões 20</strong>
        <button type="button" className="capture-quests__open" onClick={() => setOpen(true)} title="Ver as 20 missões">
          {completed}/20
        </button>
      </header>
      <div className="capture-quests__body">
        <div className="capture-quests__bar" title={nextMilestone ? `Próximo prêmio em ${nextMilestone.at}` : "Todas concluídas"}>
          <i style={{ width: `${progress}%` }} />
        </div>
        {next.length === 0 ? (
          <p className="capture-quests__done">Todas as 20 missões concluídas!</p>
        ) : next.map((quest) => (
          <button type="button" key={quest.id} className="capture-quests__row" onClick={() => setOpen(true)} title="Abrir lista completa">
            <span className="capture-quests__mark">○</span>
            <span className="capture-quests__text">
              <strong>{quest.title}</strong>
              <small>{speciesLabel(quest.species)} · Mapa {quest.map} · Lv {quest.level} · {quest.chance}</small>
            </span>
          </button>
        ))}
        <button type="button" className="capture-quests__all" onClick={() => setOpen(true)}>
          Ver as 20 · prêmios a cada 5
        </button>
      </div>
    </section>

    {open && typeof document !== "undefined" && createPortal(
      <div className="capture-quests-modal" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section className="capture-quests-modal__box" role="dialog" aria-modal="true" aria-label="As 20 missões de captura">
          <header>
            <div>
              <span className="capture-quests-modal__kicker">DESAFIO INDIVIDUAL</span>
              <h2>Missões 20</h2>
              <p>{completed} de 20 concluídas · prêmio automático a cada 5</p>
            </div>
            <button type="button" className="capture-quests-modal__close" onClick={() => setOpen(false)} aria-label="Fechar missões">
              <X size={18} />
            </button>
          </header>
          <div className="capture-quests-modal__progress"><i style={{ width: `${(completed / 20) * 100}%` }} /></div>
          <div className="capture-quests-modal__milestones">
            {CAPTURE_QUEST_MILESTONES.map((milestone) => {
              const claimed = milestones.includes(milestone.at);
              return <span key={milestone.at} className={claimed ? "is-claimed" : completed >= milestone.at ? "is-ready" : ""}>
                <b>{milestone.at}</b> {milestone.label}
              </span>;
            })}
          </div>
          <div className="capture-quests-modal__list">
            {quests.map((quest, index) => (
              <article key={quest.id} className={`capture-quests-modal__row ${quest.done ? "is-done" : ""}`}>
                <span className="capture-quests-modal__num">{String(index + 1).padStart(2, "0")}</span>
                <span className="capture-quests-modal__icon">{quest.done ? "✓" : "○"}</span>
                <span className="capture-quests-modal__info">
                  <strong>{quest.title}</strong>
                  <small>{speciesLabel(quest.species)} · Mapa {quest.map} · Lv {quest.level} · Spawn {quest.chance}</small>
                </span>
              </article>
            ))}
          </div>
          <footer>Cada missão: +50 Cristais Vermelhos e +250 XP · a cada 3: 1 ticket da Nevezinha. O progresso fica salvo na sua conta.</footer>
        </section>
      </div>,
      document.body,
    )}
  </>;
}
