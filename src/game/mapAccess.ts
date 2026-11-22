// Mapa Mundi público: somente a progressão inicial fica disponível no atlas.
// Os demais mapas continuam existentes, mas não podem ser escolhidos por este
// teleporte até uma liberação futura explícita.
export const WORLD_MAP_FREE_DESTINATION_IDS = ["mapinha6", "mapinha10", "mapinha13", "valley_plume", "laboratorio", "florest_ice", "florest_bone", "ruinas", "ruinas_de_venus", "arv"] as const;

// ─── MAPAS DE TESTE ──────────────────────────────────────────────────────────
// Visíveis e acessíveis SOMENTE para a conta dona. A falha é fechada: sem
// identity (ou com outra conta) eles não aparecem no atlas nem podem ser
// entrados por nenhum caminho.
export const TEST_MAP_IDS = ["emerald", "emerald_01", "rota1"] as const;
export const isTestMap = (id: string) => (TEST_MAP_IDS as readonly string[]).includes(id);
export const TEST_MAP_OWNER_ID = "16d47359-8fbb-4a81-9596-918b2d53b75b";
export const canSeeTestMaps = (identityId?: string | null) => identityId === TEST_MAP_OWNER_ID;

// TESTE LOCAL: no dev o atlas libera todos os destinos (mk1/guildas/mwt/emy).
// Em produção vale só a lista acima — import.meta.env.DEV vira false no build.
// Mapas de teste NUNCA entram nessa liberação: exigem a conta dona.
export const isWorldMapDestinationUnlocked = (id: string, identityId?: string | null) => {
  if (isTestMap(id)) return canSeeTestMaps(identityId);
  return import.meta.env.DEV || (WORLD_MAP_FREE_DESTINATION_IDS as readonly string[]).includes(id);
};

// Altere esta lista para liberar os mapas novamente; vale para todas as viagens.
export const BLOCKED_LAB_MAPS = ["map_0000", "map_0055", "map_0066", "map_0077"] as const;
export const isMapBlocked = (id: string) => !import.meta.env.DEV && (BLOCKED_LAB_MAPS as readonly string[]).includes(id);
type TravelState = { currentMap: string; bank: { gold: number }; items: Record<string, number> };
export function mapEntryError(state: TravelState, target: string, identityId?: string | null): string | null {
  if (isMapBlocked(target)) return "🔒 Este mapa está temporariamente bloqueado.";
  if (isTestMap(target) && !canSeeTestMaps(identityId)) return "🔒 Mapa privado — acesso restrito.";
  if (target === state.currentMap) return "Você já está neste mapa.";
  return null;
}
/** Débito e mudança de mapa na MESMA atualização, sem saldo negativo. */
export function applyMapEntry<T extends TravelState>(state: T, target: T["currentMap"], identityId?: string | null): T {
  if (mapEntryError(state, target, identityId)) return state;
  return { ...state, currentMap: target };
}
