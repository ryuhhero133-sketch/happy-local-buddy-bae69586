// Sincroniza o estado do jogo com o Supabase.
// - No primeiro login com progresso local: envia snapshot pra nuvem (preserva).
// - Nos logins seguintes: puxa server state e chama onHydrate() com o snapshot.
// - Push contínuo debounced (a cada ~6s) espelha o estado no banco com
//   clamp de ganhos server-side (anti-cheat leve).

import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  bootstrapGameState,
  getFullGameState,
  pushInitialState,
  syncClientState,
  type FullStateDTO,
} from "@/lib/game.functions";

export type LocalSnapshotForPush = {
  gold: number;
  crystal: number;
  ruby: number;
  trainer_level: number;
  trainer_xp: number;
  kill_count: number;
  active_map?: string;
  pokeballs: Record<string, number>;
  collection: Array<{
    id?: string;
    species: string;
    level: number;
    xp?: number;
    rarity: string;
    team_slot?: number | null;
  }>;
};

export function useServerSync(opts: {
  buildLocalSnapshot: () => LocalSnapshotForPush;
  onHydrate: (state: FullStateDTO) => void;
}) {
  const bootstrap = useServerFn(bootstrapGameState);
  const fetchFull = useServerFn(getFullGameState);
  const pushInit = useServerFn(pushInitialState);
  const syncFn = useServerFn(syncClientState);

  const [status, setStatus] = useState<"idle" | "syncing" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);
  const readyRef = useRef(false);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const buildRef = useRef(opts.buildLocalSnapshot);
  buildRef.current = opts.buildLocalSnapshot;

  useEffect(() => {
    if (ran.current) return;
    let cancelled = false;

    (async () => {
      setStatus("syncing");
      try {
        // Wait for session to be established via supabase.auth.onAuthStateChange in AuthGate
        let session = null;
        let attempts = 0;
        while (!session && attempts < 20) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
          if (session) break;
          await new Promise(r => setTimeout(r, 200));
          attempts++;
        }

        if (!session) {
          throw new Error("Sessão não encontrada. Por favor, faça login novamente.");
        }

        if (cancelled) return;
        ran.current = true; // Only mark as ran if we found a session

        await bootstrap({} as any);
        let full = (await fetchFull({} as any)) as FullStateDTO;

        const serverEmpty =
          full.trainer.gold === 0 &&
          full.trainer.crystal === 0 &&
          full.trainer.trainer_level <= 1 &&
          full.trainer.trainer_xp === 0 &&
          full.trainer.kill_count === 0 &&
          full.collection.length === 0;

        if (serverEmpty) {
          const snap = buildRef.current();
          const hasLocal =
            snap.gold > 0 || snap.crystal > 0 || snap.trainer_level > 1 ||
            snap.trainer_xp > 0 || snap.collection.length > 0;
          if (hasLocal) {
            await pushInit({ data: snap } as any);
            full = (await fetchFull({} as any)) as FullStateDTO;
          }
        }

        if (cancelled) return;
        opts.onHydrate(full);
        readyRef.current = true;
        setStatus("ready");
      } catch (e: any) {
        if (cancelled) return;
        console.error("[useServerSync] falhou:", e);
        setError(e?.message ?? String(e));
        setStatus("error");
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doPush = useCallback(async () => {
    if (!readyRef.current) return;
    if (inFlightRef.current) { pendingRef.current = true; return; }
    inFlightRef.current = true;
    try {
      const snap = buildRef.current();
      await syncFn({ data: snap } as any);
    } catch (e) {
      console.warn("[useServerSync] push falhou:", e);
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current) { pendingRef.current = false; doPush(); }
    }
  }, [syncFn]);

  // Loop de push a cada 6s enquanto a aba estiver ativa.
  useEffect(() => {
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") doPush();
    }, 20000);

    const onHide = () => { if (document.visibilityState === "hidden") doPush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", () => { doPush(); });
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onHide); };
  }, [doPush]);

  return { status, error, pushNow: doPush };
}
