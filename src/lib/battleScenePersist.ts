// Persistência da cena de batalha (inimigos + status do treinador) entre reloads.
// Motivação: se o jogador recebe paralisia/veneno/debuff e dá F5, os timers
// zeravam — abrindo brecha de abuso. Agora fica salvo por até 15 min,
// escopado ao mapa atual. Se mudar de mapa, o snapshot é descartado.

const KEY = "rubym.battleScene.v1";
const TTL_MS = 15 * 60 * 1000;

export type BattleScenePersist = {
  mapId: string;
  savedAt: number;
  enemies: unknown[];
  paralyzedUntil: number;
  atkDebuffUntil: number;
  poisonUntil: number;
};

export function loadBattleScene(mapId: string): BattleScenePersist | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as BattleScenePersist;
    if (!s || s.mapId !== mapId) return null;
    if (Date.now() - (s.savedAt ?? 0) > TTL_MS) return null;
    return s;
  } catch { return null; }
}

export function saveBattleScene(s: BattleScenePersist) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify({ ...s, savedAt: Date.now() })); }
  catch { /* quota */ }
}

export function clearBattleScene() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
