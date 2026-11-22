// Mapa Mundi público: somente a progressão inicial fica disponível no atlas.
// Os demais mapas continuam existentes, mas não podem ser escolhidos por este
// teleporte até uma liberação futura explícita.
export const WORLD_MAP_FREE_DESTINATION_IDS = ["mapinha6", "mapinha10", "mapinha13", "valley_plume", "laboratorio", "florest_ice", "florest_bone", "ruinas", "ruinas_de_venus", "arv", "emerald", "emerald_01"] as const;

// TESTE LOCAL: no dev o atlas libera todos os destinos (mk1/guildas/mwt/emy).
// Em produção vale só a lista acima — import.meta.env.DEV vira false no build.
export const isWorldMapDestinationUnlocked = (id: string) =>
  import.meta.env.DEV || (WORLD_MAP_FREE_DESTINATION_IDS as readonly string[]).includes(id);

// Altere esta lista para liberar os mapas novamente; vale para todas as viagens.
export const BLOCKED_LAB_MAPS = ["map_0000", "map_0055", "map_0066", "map_0077"] as const;
export const isMapBlocked = (id: string) => !import.meta.env.DEV && (BLOCKED_LAB_MAPS as readonly string[]).includes(id);
type TravelState = { currentMap: string; bank: { gold: number }; items: Record<string, number> };
export function mapEntryError(state: TravelState, target: string): string | null {
  if (isMapBlocked(target)) return "🔒 Este mapa está temporariamente bloqueado.";
  if (target === state.currentMap) return "Você já está neste mapa.";
  return null;
}
/** Débito e mudança de mapa na MESMA atualização, sem saldo negativo. */
export function applyMapEntry<T extends TravelState>(state: T, target: T["currentMap"]): T {
  if (mapEntryError(state, target)) return state;
  return { ...state, currentMap: target };
}
