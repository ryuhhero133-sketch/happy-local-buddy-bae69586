// Sincroniza o estado do jogo com o Supabase.
// - No primeiro login com progresso local: envia snapshot pra nuvem (preserva).
// - Nos logins seguintes: puxa server state e chama onHydrate() com o snapshot.
// - Push contínuo debounced (a cada ~6s) espelha o estado no banco com
//   clamp de ganhos server-side (anti-cheat leve).

import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
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
    ran.current = true;
    let cancelled = false;

    (async () => {
      setStatus("syncing");
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        // getSession com timeout para evitar travamento em rede instável
        const { data: sess } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>(r => setTimeout(() => r({ data: { session: null } }), 8000))
        ]);

        if (!sess.session) {
          console.warn("[useServerSync] no session, proceeding in local mode");
          setStatus("ready"); // Mudar para ready permite que o jogo inicie localmente
          readyRef.current = true;
          return;
        }

        // Server functions com timeout silencioso
        await Promise.race([
          bootstrap({} as any),
          new Promise(r => setTimeout(r, 8000))
        ]).catch(e => console.warn("Bootstrap silent fail", e));

        let full = (await Promise.race([
          fetchFull({} as any),
          new Promise(r => setTimeout(r, 10000))
        ]).catch(e => {
          console.warn("fetchFull fail/timeout", e);
          return null;
        })) as FullStateDTO | null;

        if (!full) {
          full = { trainer: { gold: 0, crystal: 0, trainer_level: 1, trainer_xp: 0, kill_count: 0 }, collection: [] } as any;
        }

        const serverEmpty =
          full!.trainer.gold === 0 &&
          full!.trainer.crystal === 0 &&
          full!.trainer.trainer_level <= 1 &&
          full!.trainer.trainer_xp === 0 &&
          full!.trainer.kill_count === 0 &&
          full!.collection.length === 0;

        if (serverEmpty) {
          const snap = buildRef.current();
          const hasLocal =
            snap.gold > 0 || snap.crystal > 0 || snap.trainer_level > 1 ||
            snap.trainer_xp > 0 || snap.collection.length > 0;
          if (hasLocal) {
            await pushInit({ data: snap } as any).catch(e => console.warn("pushInit fail", e));
            const fresh = await fetchFull({} as any).catch(() => null);
            if (fresh) full = fresh as FullStateDTO;
          }
        }

        if (cancelled) return;
        opts.onHydrate(full!);
        readyRef.current = true;
        setStatus("ready");
      } catch (e: any) {
        if (cancelled) return;
        console.error("[useServerSync] critical fail, entering fail-safe mode:", e);
        // Fail-safe: permite o jogo rodar localmente se a sincronização falhar criticamente
        readyRef.current = true;
        setStatus("ready");
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
