export type GameRestartPhase = "idle" | "pending" | "saving" | "save-error";
export type GameRestartState = { phase: GameRestartPhase; version: number | null };

/** Tempo para o jogador ler o aviso antes de salvarmos e recarregarmos. */
export const RESTART_NOTICE_MS = 4_000;
/** Nova tentativa depois de uma falha de salvamento (não é consulta de versão). */
export const RESTART_RETRY_MS = 15_000;
/** Se o save travar, libera a tela em vez de confundir "pendente" com "salvo". */
export const RESTART_SAVE_TIMEOUT_MS = 20_000;
/** Enquanto o jogador estiver em compra/janela/PvP, verifica apenas o estado local. */
export const RESTART_SAFETY_POLL_MS = 2_000;

type RestartOptions = {
  canRestart: () => boolean;
  prepareRestart: () => Promise<boolean>;
  persistLatest: () => boolean;
  cancelRestart: () => void;
  reload: () => void;
  onState: (state: GameRestartState) => void;
  setTimer?: (callback: () => unknown, ms: number) => unknown;
  clearTimer?: (timer: unknown) => void;
};

/**
 * Reinício manual disparado pelo dono. Não existe polling de versão:
 * o gatilho chega por um único evento Realtime ou pelo retorno do RPC.
 */
export function startGameRestart(options: RestartOptions) {
  const setTimer = options.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
  const clearTimer = options.clearTimer ?? ((timer) => clearTimeout(timer as ReturnType<typeof setTimeout>));
  let state: GameRestartState = { phase: "idle", version: null };
  let target: number | null = null;
  let handled = 0;
  let timer: unknown;
  let disposed = false;
  let busy = false;

  const emit = (phase: GameRestartPhase, version = target) => {
    state = { phase, version };
    if (!disposed) options.onState(state);
  };
  const schedule = (callback: () => unknown, ms: number) => {
    if (timer !== undefined) clearTimer(timer);
    if (!disposed) timer = setTimer(callback, ms);
  };
  const fail = () => {
    options.cancelRestart();
    if (disposed) return;
    emit("save-error");
    schedule(attempt, RESTART_RETRY_MS);
  };

  async function attempt() {
    if (disposed || busy || target === null) return;
    if (!options.canRestart()) {
      emit("pending");
      schedule(attempt, RESTART_SAFETY_POLL_MS);
      return;
    }
    busy = true;
    emit("saving");
    let timeout: unknown;
    try {
      const saved = await Promise.race([
        options.prepareRestart(),
        new Promise<boolean>((resolve) => { timeout = setTimer(() => resolve(false), RESTART_SAVE_TIMEOUT_MS); }),
      ]);
      if (timeout !== undefined) { clearTimer(timeout); timeout = undefined; }
      if (!saved) { fail(); return; }
      if (disposed) { options.cancelRestart(); return; }
      if (!options.persistLatest()) { fail(); return; }
      if (!options.canRestart()) {
        options.cancelRestart();
        emit("pending");
        schedule(attempt, RESTART_SAFETY_POLL_MS);
        return;
      }
      handled = target;
      emit("saving", target);
      options.reload();
    } catch {
      fail();
    } finally {
      if (timeout !== undefined) clearTimer(timeout);
      busy = false;
    }
  }

  /** Ignora eventos repetidos/antigos: a versão precisa ser maior que a última. */
  function trigger(rawVersion: number) {
    if (!Number.isSafeInteger(rawVersion) || rawVersion <= 0) return;
    if (rawVersion <= handled) return;
    if (target !== null && rawVersion < target) return;
    if (state.phase === "saving") return;
    target = rawVersion;
    if (state.phase === "idle" || state.phase === "save-error") {
      emit("pending", rawVersion);
      schedule(attempt, RESTART_NOTICE_MS);
      return;
    }
    emit("pending", rawVersion);
  }

  return {
    trigger,
    state() { return state; },
    dispose() {
      disposed = true;
      if (timer !== undefined) clearTimer(timer);
      options.cancelRestart();
    },
  };
}
