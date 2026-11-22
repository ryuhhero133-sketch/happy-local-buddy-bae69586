// Mapa Mundi público: somente a progressão inicial fica disponível no atlas.
// Os demais mapas continuam existentes, mas não podem ser escolhidos por este
// teleporte até uma liberação futura explícita.
export const WORLD_MAP_FREE_DESTINATION_IDS = ["mapinha6", "mapinha10", "mapinha13", "valley_plume", "laboratorio", "florest_ice", "florest_bone", "ruinas", "ruinas_de_venus", "arv"] as const;

// ─── MAPA PRIVADO (src/full.png) ─────────────────────────────────────────────
// Visibilidade e entrada somente para a conta dona. Todas as comparações usam
// o UUID autenticado (nunca o nome exibido), e a falha é fechada: sem identity
// não há acesso.
export const PRIVATE_MAP_ID = "nissan_full";
export const PRIVATE_MAP_OWNER_ID = "16d47359-8fbb-4a81-9596-918b2d53b75b";
export function canAccessPrivateMap(identityId: string | null | undefined): boolean {
  return identityId === PRIVATE_MAP_OWNER_ID;
}

// TESTE LOCAL: no dev o atlas libera todos os destinos (mk1/guildas/mwt/emy).
// Em produção vale só a lista acima — import.meta.env.DEV vira false no build.
// O mapa privado NUNCA entra nessa liberação: ele é resolvido pela conta dona
// em canAccessPrivateMap, mesmo em DEV.
export const isWorldMapDestinationUnlocked = (id: string, identityId?: string | null) => {
  if (id === PRIVATE_MAP_ID) return canAccessPrivateMap(identityId);
  return import.meta.env.DEV || (WORLD_MAP_FREE_DESTINATION_IDS as readonly string[]).includes(id);
};

// Altere esta lista para liberar os mapas novamente; vale para todas as viagens.
export const BLOCKED_LAB_MAPS = ["map_0000", "map_0055", "map_0066", "map_0077", "map_xz"] as const;
export const isMapBlocked = (id: string) => !import.meta.env.DEV && (BLOCKED_LAB_MAPS as readonly string[]).includes(id);
export const SAFARI_ENTRY_GOLD = 1000;
export const SAFARI_ENTRY_NUGGETS = 10;
type TravelState = { currentMap: string; bank: { gold: number }; items: Record<string, number> };
export function mapEntryError(state: TravelState, target: string, identityId?: string | null): string | null {
  if (isMapBlocked(target)) return "🔒 Este mapa está temporariamente bloqueado.";
  if (target === PRIVATE_MAP_ID && !canAccessPrivateMap(identityId)) return "🔒 Mapa privado — acesso restrito.";
  if (target === state.currentMap) return "Você já está neste mapa.";
  if (target === "sa" && (state.bank.gold < SAFARI_ENTRY_GOLD || (state.items.pepita ?? 0) < SAFARI_ENTRY_NUGGETS)) return "Safari: precisa de 1.000 ouro e 10 Pepitas de Ouro por entrada.";
  return null;
}
/** Débito e mudança de mapa na MESMA atualização, sem saldo negativo. */
export function applyMapEntry<T extends TravelState>(state: T, target: T["currentMap"], identityId?: string | null): T {
  if (mapEntryError(state, target, identityId)) return state;
  if (target !== "sa") return { ...state, currentMap: target };
  return { ...state, currentMap: target, safariTrainerHp: 100, bank: { ...state.bank, gold: state.bank.gold - SAFARI_ENTRY_GOLD }, items: { ...state.items, pepita: (state.items.pepita ?? 0) - SAFARI_ENTRY_NUGGETS } };
}
