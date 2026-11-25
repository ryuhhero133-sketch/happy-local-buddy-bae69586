// Mapa Mundi público: os mapas da saga e as rotas BOBO ficam disponíveis para
// todas as contas. Mapas internos/de evento continuam bloqueados no atlas e só
// entram pelos caminhos próprios (NPC, evento ou conta do dono).
export const WORLD_MAP_LOCKED_IDS = [
  "arena",
  "esfera_ancestral",
  "rota_pinsir",
  "deserto_alaka",
  "areia_de_anubis",
  "torre_verdejante",
  "torre_ancestral",
  "elementure",
  "florest_shiny",
  "cristal_cave",
] as const;

// Mantido para compatibilidade com imports antigos; a liberação real agora é
// feita por WORLD_MAP_LOCKED_IDS.
export const WORLD_MAP_FREE_DESTINATION_IDS = [
  "mapinha6", "mapinha10", "mapinha13", "valley_plume", "laboratorio",
  "florest_ice", "florest_bone", "ruinas", "ruinas_de_venus", "emerald",
  "rota1", "bobo_uuid", "bobo_g11ds", "bobo_mmmm", "bobo_rota1",
  "bobo_rota2", "bobo_rota3", "bobo_rota_gelo", "bobo_t2_viridiana",
  "bobo_t2", "bobo_templo", "bobo_transicao_gelo", "bobo_transicao",
  "bobo_viridian",
] as const;

// ─── MAPAS DE TESTE ──────────────────────────────────────────────────────────
// Restam apenas cenários internos. As rotas BOBO agora são públicas.
export const TEST_MAP_IDS = ["emerald_01"] as const;
export const isTestMap = (id: string) => (TEST_MAP_IDS as readonly string[]).includes(id);
export const TEST_MAP_OWNER_ID = "16d47359-8fbb-4a81-9596-918b2d53b75b";
export const canSeeTestMaps = (identityId?: string | null) => identityId === TEST_MAP_OWNER_ID;

// No dev o atlas libera todos os destinos; em produção valem as listas acima.
export const isWorldMapDestinationUnlocked = (id: string, identityId?: string | null) => {
  if (isTestMap(id)) return canSeeTestMaps(identityId);
  if (isMapBlocked(id)) return false;
  if (import.meta.env.DEV) return true;
  return !(WORLD_MAP_LOCKED_IDS as readonly string[]).includes(id);
};

// Altere esta lista para liberar os mapas novamente; vale para todas as viagens.
export const BLOCKED_LAB_MAPS = [
  "iceblow", "monte_floreto", "rayow", "sakura_city", "venenot",
  "azulante", "margrande", "navegante", "hallow", "caverna_brok",
  "map_0000", "map_0055", "map_0066", "map_0077",
] as const;
export const isMapBlocked = (id: string) => (BLOCKED_LAB_MAPS as readonly string[]).includes(id);
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
