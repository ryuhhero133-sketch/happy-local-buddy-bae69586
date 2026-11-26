import { useEffect, useRef, useState } from "react";
import { startGameRestart, type GameRestartState } from "@/lib/gameRestart";
import "./game-restart.css";

/** Never reload under an open menu, purchase, form or focused text field. */
function hasBlockingUi(): boolean {
  return Boolean(
    document.visibilityState !== "visible"
    || document.activeElement?.matches("input, textarea, select, [contenteditable='true']")
    || document.querySelector("[role='dialog']:not([data-game-restart]), [aria-modal='true']:not([data-game-restart])"),
  );
}

type Props = {
  enabled: boolean;
  /** Versão recebida pelo evento Realtime (null = nenhum reinício pedido). */
  signal: number | null;
  canRestart: () => boolean;
  prepareRestart: () => Promise<boolean>;
  persistLatest: () => boolean;
  cancelRestart: () => void;
};

export function GameRestartPrompt({ enabled, signal, ...callbacks }: Props) {
  const latest = useRef(callbacks);
  latest.current = callbacks;
  const controller = useRef<ReturnType<typeof startGameRestart> | null>(null);
  const [state, setState] = useState<GameRestartState>({ phase: "idle", version: null });

  useEffect(() => {
    if (!enabled) return;
    const next = startGameRestart({
      canRestart: () => !hasBlockingUi() && latest.current.canRestart(),
      prepareRestart: () => latest.current.prepareRestart(),
      persistLatest: () => latest.current.persistLatest(),
      cancelRestart: () => latest.current.cancelRestart(),
      reload: () => window.location.reload(),
      onState: setState,
    });
    controller.current = next;
    return () => {
      next.dispose();
      controller.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled && signal !== null) controller.current?.trigger(signal);
  }, [enabled, signal]);

  const visible = enabled && state.phase !== "idle";
  const saving = state.phase === "saving";

  useEffect(() => {
    if (!saving) return;
    const preventGameKeys = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      event.stopImmediatePropagation();
      event.preventDefault();
    };
    window.addEventListener("keydown", preventGameKeys, true);
    return () => window.removeEventListener("keydown", preventGameKeys, true);
  }, [saving]);

  if (!visible) return null;
  const message = saving
    ? "Aguarde a confirmação do seu progresso. O jogo vai recarregar em seguida."
    : state.phase === "save-error"
      ? "Não foi possível confirmar o salvamento agora. Vamos tentar de novo sem interromper seu jogo."
      : state.phase === "pending"
        ? "Vamos salvar seu progresso e reiniciar assim que a ação atual terminar."
        : "";

  return <div className={`game-restart ${saving ? "is-saving" : ""}`} data-game-restart data-game-restart-prompt
    role={saving ? "dialog" : "status"} aria-modal={saving ? true : undefined}
    aria-label={saving ? "Salvando e reiniciando o jogo" : "Atualização importante do jogo"} aria-live="polite">
    <div className="game-restart__card">
      <span className="game-restart__icon" aria-hidden="true">🔄</span>
      <div>
        <strong>{saving ? "Salvando e reiniciando…" : "Atualização importante do jogo"}</strong>
        <p>{message}</p>
      </div>
    </div>
  </div>;
}
