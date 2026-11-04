// Altere esta lista para liberar os mapas novamente; vale para todas as viagens.
export const BLOCKED_LAB_MAPS = ["map_0000", "map_0055", "map_0066", "map_0077", "map_xz"] as const;
export const isMapBlocked = (id: string) => (BLOCKED_LAB_MAPS as readonly string[]).includes(id);
export const SAFARI_ENTRY_GOLD = 1000;
export const SAFARI_ENTRY_NUGGETS = 10;
type TravelState = { currentMap: string; bank: { gold: number }; items: Record<string, number> };
export function mapEntryError(state: TravelState, target: string): string | null {
  if (isMapBlocked(target)) return "🔒 Este mapa está temporariamente bloqueado.";
  if (target === state.currentMap) return "Você já está neste mapa.";
  if (target === "sa" && (state.bank.gold < SAFARI_ENTRY_GOLD || (state.items.pepita ?? 0) < SAFARI_ENTRY_NUGGETS)) return "Safari: precisa de 1.000 ouro e 10 Pepitas de Ouro por entrada.";
  return null;
}
/** Débito e mudança de mapa na MESMA atualização, sem saldo negativo. */
export function applyMapEntry<T extends TravelState>(state: T, target: T["currentMap"]): T {
  if (mapEntryError(state, target)) return state;
  if (target !== "sa") return { ...state, currentMap: target };
  return { ...state, currentMap: target, safariTrainerHp: 100, bank: { ...state.bank, gold: state.bank.gold - SAFARI_ENTRY_GOLD }, items: { ...state.items, pepita: (state.items.pepita ?? 0) - SAFARI_ENTRY_NUGGETS } };
}
