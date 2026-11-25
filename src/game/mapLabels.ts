/**
 * Nomes públicos dos mapas. Os jogadores veem apenas MP1, MP2, MP3... — os
 * títulos internos e os IDs ficam restritos ao editor do dono e aos logs.
 */
const PUBLIC_MAP_ORDER = [
  "mapinha6",
  "arena",
  "terra",
  "mapinha5",
  "mapinha7",
  "mapinha8",
  "mapinha10",
  "mapinha9",
  "mapinha11",
  "mapinha12",
  "mapinha13",
  "cave01",
  "cristal_cave",
  "florest_bone",
  "florest_ice",
  "florest_shiny",
  "ruinas_de_venus",
  "ruinas",
  "valley_plume",
  "revo_rout",
  "cidade_principal",
  "esfera_ancestral",
  "land_revo",
  "land_gelo",
  "casa1",
  "casa2",
  "rota_pinsir",
  "deserto_alaka",
  "areia_de_anubis",
  "torre_verdejante",
  "torre_ancestral",
  "mapa_orange",
  "elementure",
  "laboratorio",
  "casinha",
  "emerald",
  "emerald_01",
  "rota1",
  "bobo_uuid",
  "bobo_g11ds",
  "bobo_mmmm",
  "bobo_rota1",
  "bobo_rota2",
  "bobo_rota3",
  "bobo_rota_gelo",
  "bobo_t2_viridiana",
  "bobo_t2",
  "bobo_templo",
  "bobo_transicao_gelo",
  "bobo_transicao",
  "bobo_viridian",
  "iceblow",
  "monte_floreto",
  "rayow",
  "sakura_city",
  "venenot",
  "hallow",
  "caverna_brok",
  "azulante",
  "margrande",
  "navegante",
  "map_0000",
  "map_0055",
  "map_0066",
  "map_0077",
  "mk1",
  "guildas",
  "mwt",
  "emy",
  "emy_1",
] as const;

const CODE_BY_MAP = new Map<string, string>(
  PUBLIC_MAP_ORDER.map((id, index) => [id, `MP${index + 1}`]),
);

/** Nome que o jogador vê. Nunca expõe o título interno do mapa. */
export function publicMapName(mapId: string | null | undefined): string {
  if (!mapId) return "MP?";
  return CODE_BY_MAP.get(mapId) ?? "MP?";
}

/** Lista estável usada pelo atlas público. */
export const PUBLIC_MAP_IDS = PUBLIC_MAP_ORDER;
