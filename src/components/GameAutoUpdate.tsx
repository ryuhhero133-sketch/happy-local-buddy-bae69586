import { useEffect, useRef, useState } from "react";
import { APP_RELEASE_ID, APP_VERSION_PATH, parseAppRelease } from "@/lib/appRelease";
import { recordAppReload, startAppUpdate, type AppUpdateState } from "@/lib/appUpdate";
import "./game-auto-update.css";

type Props = {
  enabled?: boolean;
  canReload: () => boolean;
  prepareReload: () => Promise<boolean>;
  persistLatest: () => boolean;
  cancelReload: () => void;
};

function playerIsInteracting(): boolean {
  return Boolean(
    document.activeElement?.matches("input, textarea, select, [contenteditable='true']")
    || document.querySelector("[role='dialog']:not([data-app-update]), [aria-modal='true']:not([data-app-update]), .revo-hud.is-rearranging"),
  );
}

export function GameAutoUpdate({ enabled = import.meta.env.PROD, ...callbacks }: Props) {
  const latest = useRef(callbacks);
  latest.current = callbacks;
  const monitor = useRef<ReturnType<typeof startAppUpdate> | null>(null);
  const [state, setState] = useState<AppUpdateState>({ phase: "idle", version: null });
  useEffect(() => {
    if (!enabled || APP_RELEASE_ID === "development") return;
    let lastInteraction = -Infinity;
    const interact = () => { lastInteraction = performance.now(); };
    const controller = startAppUpdate({
      currentVersion: APP_RELEASE_ID,
      online: () => navigator.onLine,
      visible: () => document.visibilityState === "visible",
      canReload: () => performance.now() - lastInteraction >= 1_500 && !playerIsInteracting() && latest.current.canReload(),
      prepareReload: () => latest.current.prepareReload(),
      persistLatest: () => latest.current.persistLatest(),
      cancelReload: () => latest.current.cancelReload(),
      recordReload: (version) => recordAppReload(sessionStorage, APP_RELEASE_ID, version),
      reload: () => window.location.reload(),
      onState: setState,
      readVersion: async (signal) => {
        const response = await fetch(APP_VERSION_PATH, {
          cache: "no-store", credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: AbortSignal.any([signal, AbortSignal.timeout(8_000)]),
        });
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return null;
        return parseAppRelease(await response.json());
      },
    });
    monitor.current = controller;
    const wake = () => controller.wake();
    window.addEventListener("online", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("pointerdown", interact, true);
    window.addEventListener("keydown", interact, true);
    document.addEventListener("visibilitychange", wake);
    return () => {
      controller.dispose();
      monitor.current = null;
      window.removeEventListener("online", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("pointerdown", interact, true);
      window.removeEventListener("keydown", interact, true);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [enabled]);
  const saving = enabled && (state.phase === "saving" || state.phase === "reloading");
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
  if (!enabled || ["idle", "deferred"].includes(state.phase)) return null;
  const description = state.phase === "countdown"
    ? "Vamos salvar seu progresso e atualizar em alguns segundos."
    : state.phase === "waiting"
      ? "Vamos atualizar assim que você terminar a ação atual."
      : state.phase === "save-error"
        ? "Ainda não foi possível confirmar o salvamento. Tentaremos de novo sem interromper seu jogo."
        : "A atualização está aguardando uma conexão estável. Seu jogo continua normalmente.";
  return <div className={`game-update ${saving ? "is-saving" : ""}`} data-app-update
    role={saving ? "dialog" : "status"} aria-modal={saving ? true : undefined} aria-label={saving ? "Atualizando o jogo" : undefined} aria-live="polite">
    <div className="game-update__card">
      <span className="game-update__icon" aria-hidden="true">☁️</span>
      <div>
        <strong>{saving ? "Salvando e atualizando…" : "Uma nova versão chegou!"}</strong>
        <p>{saving ? "Aguarde a confirmação do seu progresso. O jogo será recarregado em seguida." : description}</p>
      </div>
      {!saving && <button type="button" onClick={() => monitor.current?.defer()}>Adiar 5 min</button>}
    </div>
  </div>;
}
