// Sincroniza o estado do jogo com o Supabase.
// - No primeiro login com progresso local: envia snapshot pra nuvem (preserva).
// - Nos logins seguintes: puxa server state e chama onHydrate() com o snapshot.
// - Cliente NUNCA soma recurso: mutações vão passar por reportKill/attemptCapture/etc.

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  bootstrapGameState,
  getFullGameState,
  pushInitialState,
  type FullStateDTO,
} from "@/lib/game.functions";

export type LocalSnapshotForPush = {
  gold: number;
  crystal: number;
  ruby: number;
  trainer_level: number;
  trainer_xp: number;
  kill_count: number;
  pokeballs: Record<string, number>;
  collection: Array<{
    species: string;
    level: number;
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

  const [status, setStatus] = useState<"idle" | "syncing" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let cancelled = false;

    (async () => {
      setStatus("syncing");
      try {
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
          const snap = opts.buildLocalSnapshot();
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

  return { status, error };
}
