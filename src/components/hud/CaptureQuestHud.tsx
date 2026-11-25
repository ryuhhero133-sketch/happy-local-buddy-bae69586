import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CAPTURE_QUEST_MILESTONES, type CaptureChestReward, type CaptureChestView } from "@/game/captureQuests";
import ballIcon from "@/assets/items/icon-pokeball.webp";
import chestGreenImg from "@/ambiente/map/bb/bau_verde.webp";
import chestEpicImg from "@/ambiente/map/bb/bau_epic.webp";
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

export function CaptureQuestHud({ quests, milestones, pokemonImages, pokemonSheets, chests, onOpenChest }: {
  quests: CaptureQuestView[];
  milestones: number[];
  pokemonImages?: Record<string, string>;
  /** Spritesheet 4x4 usada quando a espécie não tem GIF na coleção. */
  pokemonSheets?: Record<string, string>;
  chests?: CaptureChestView[];
  onOpenChest?: (chestId: string) => CaptureChestReward | null;
}) {
  const [open, setOpen] = useState(false);
  const [reward, setReward] = useState<CaptureChestReward | null>(null);
  const completed = quests.filter((quest) => quest.done).length;
  const readyChests = (chests ?? []).filter((chest) => chest.ready).length;

  const openChest = (chest: CaptureChestView) => {
    if (!chest.ready || !onOpenChest) return;
    const result = onOpenChest(chest.id);
    if (result) setReward(result);
  };

  return <>
    <button
      type="button"
      className="capture-quest-orb"
      onClick={() => setOpen(true)}
      title={`Missões 20 · ${completed}/20 concluídas${readyChests ? ` · ${readyChests} baú(s) para abrir` : ""}`}
      aria-label={`Abrir as 20 missões: ${completed} de 20 concluídas${readyChests ? `, ${readyChests} baú(s) pronto(s)` : ""}`}
    >
      <img src={ballIcon} alt="" draggable={false} />
      <span className="capture-quest-orb__badge">{completed}/20</span>
      {readyChests > 0 && <span className="capture-quest-orb__gift" aria-hidden="true">🎁</span>}
    </button>

    {open && typeof document !== "undefined" && createPortal(
      <div className="capture-quests-modal" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section className="capture-quests-modal__box" role="dialog" aria-modal="true" aria-label="As 20 missões de captura">
          <header>
            <div>
              <span className="capture-quests-modal__kicker">DESAFIO INDIVIDUAL</span>
              <h2>Missões 20</h2>
              <p>{completed} de 20 concluídas · caixa de brinde a cada 5{readyChests > 0 ? ` · ${readyChests} pronta(s) para abrir` : ""}</p>
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
          {(chests?.length ?? 0) > 0 && (
            <div className="capture-chests">
              <div className="capture-chests__head">
                <strong>Caixas de brinde</strong>
                <small>uma a cada 5 missões · itens aleatórios</small>
              </div>
              <div className="capture-chests__grid">
                {chests!.map((chest) => {
                  const isEpic = chest.kind === "epic";
                  return <button
                    type="button"
                    key={chest.id}
                    className={`capture-chest is-${chest.kind} ${chest.opened ? "is-opened" : chest.ready ? "is-ready" : "is-locked"}`}
                    disabled={!chest.ready}
                    onClick={() => openChest(chest)}
                    title={chest.opened
                      ? "Caixa já aberta"
                      : chest.ready
                        ? `Abrir ${isEpic ? "Baú Épico" : "Baú Verde"}`
                        : `Faltam ${chest.at - completed} missão(ões)`}
                  >
                    <img src={isEpic ? chestEpicImg : chestGreenImg} alt="" draggable={false} />
                    <strong>{isEpic ? "Baú Épico" : "Baú Verde"}</strong>
                    <small>{chest.opened ? "Aberto" : chest.ready ? "Abrir brinde" : `Faltam ${chest.at - completed}`}</small>
                  </button>;
                })}
              </div>
            </div>
          )}
          <div className="capture-quests-modal__list">
            {quests.map((quest, index) => {
              const image = pokemonImages?.[quest.species];
              const sheet = pokemonSheets?.[quest.species];
              return <article key={quest.id} className={`capture-quests-modal__row ${quest.done ? "is-done" : ""}`}>
                <span className="capture-quests-modal__num">{String(index + 1).padStart(2, "0")}</span>
                <span className="capture-quests-modal__icon">
                  {image
                    ? <img src={image} alt="" loading="lazy" draggable={false} />
                    : sheet
                      ? <span className="capture-quests-modal__sheet" style={{ backgroundImage: `url(${sheet})` }} />
                      : quest.done ? "✓" : "○"}
                </span>
                <span className="capture-quests-modal__info">
                  <strong>{quest.title}</strong>
                  <small>{speciesLabel(quest.species)} · Mapa {quest.map} · Lv {quest.level} · Spawn {quest.chance}</small>
                </span>
              </article>;
            })}
          </div>
          <footer>Cada missão: +50 Cristais Vermelhos e +250 XP · a cada 3: 1 ticket da Nevezinha · caixa de brinde a cada 5. O progresso fica salvo na sua conta.</footer>
          {reward && <div className="capture-chest-reward" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setReward(null); }}>
            <div className={`capture-chest-reward__card is-${reward.chestKind}`} role="dialog" aria-modal="true" aria-label="Prêmio da caixa de brinde">
              <span className="capture-chest-reward__kicker">CAIXA ABERTA!</span>
              <img src={reward.chestKind === "epic" ? chestEpicImg : chestGreenImg} alt="" draggable={false} />
              <span className="capture-chest-reward__label">VOCÊ GANHOU</span>
              <strong>{reward.label}</strong>
              <p>{reward.ticket ? "Somado aos seus tiros da Nevezinha." : "Entregue na sua mochila."}</p>
              <button type="button" onClick={() => setReward(null)}>Continuar</button>
            </div>
          </div>}
        </section>
      </div>,
      document.body,
    )}
  </>;
}
