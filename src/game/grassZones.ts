// Zonas de mato GBA: quais Pokémon nascem em cada mapa (tabela do dono).
export type ZoneSpawn = { species: string; min: number; max: number; pct: number };

/** 8 mapas de mato, do mais fraco ao mais forte. */
export const GRASS_ZONE_BY_MAP: Record<string, number> = {
  rota1: 1,
  bobo_rota1: 2,
  bobo_rota2: 3,
  bobo_uuid: 4,
  bobo_transicao: 5,
  bobo_g11ds: 6,
  bobo_rota_gelo: 7,
  bobo_transicao_gelo: 8,
};

export const GRASS_ZONES: Record<number, ZoneSpawn[]> = {
  1: [
    { species: "pidgey", min: 1, max: 4, pct: 25 },
    { species: "rattata", min: 1, max: 4, pct: 23 },
    { species: "caterpie", min: 1, max: 5, pct: 18 },
    { species: "weedle", min: 2, max: 5, pct: 15 },
    { species: "spearow", min: 3, max: 6, pct: 10 },
    { species: "nidoran_f", min: 4, max: 7, pct: 3 },
    { species: "nidoran_m", min: 4, max: 7, pct: 3 },
    { species: "pikachu", min: 5, max: 8, pct: 2 },
    { species: "bulbasaur", min: 8, max: 8, pct: 1 },
  ],
  2: [
    { species: "oddish", min: 8, max: 12, pct: 18 },
    { species: "paras", min: 8, max: 12, pct: 16 },
    { species: "metapod", min: 8, max: 12, pct: 15 },
    { species: "kakuna", min: 8, max: 12, pct: 15 },
    { species: "bellsprout", min: 10, max: 14, pct: 12 },
    { species: "venonat", min: 10, max: 15, pct: 9 },
    { species: "butterfree", min: 12, max: 16, pct: 5 },
    { species: "beedrill", min: 12, max: 16, pct: 5 },
    { species: "exeggcute", min: 14, max: 17, pct: 3 },
    { species: "eevee", min: 16, max: 18, pct: 1.5 },
    { species: "charmander", min: 18, max: 18, pct: 0.5 },
  ],
  3: [
    { species: "ekans", min: 18, max: 21, pct: 18 },
    { species: "sandshrew", min: 18, max: 22, pct: 16 },
    { species: "mankey", min: 18, max: 22, pct: 15 },
    { species: "meowth", min: 19, max: 23, pct: 12 },
    { species: "pidgeotto", min: 20, max: 24, pct: 12 },
    { species: "raticate", min: 20, max: 24, pct: 10 },
    { species: "growlithe", min: 22, max: 26, pct: 8 },
    { species: "vulpix", min: 22, max: 26, pct: 5 },
    { species: "abra", min: 24, max: 27, pct: 3 },
    { species: "squirtle", min: 28, max: 28, pct: 1 },
  ],
  4: [
    { species: "nidorina", min: 28, max: 31, pct: 16 },
    { species: "nidorino", min: 28, max: 31, pct: 16 },
    { species: "gloom", min: 28, max: 32, pct: 14 },
    { species: "weepinbell", min: 29, max: 33, pct: 14 },
    { species: "parasect", min: 30, max: 34, pct: 12 },
    { species: "venomoth", min: 30, max: 34, pct: 10 },
    { species: "doduo", min: 31, max: 35, pct: 8 },
    { species: "tauros", min: 34, max: 37, pct: 4 },
    { species: "pinsir", min: 35, max: 38, pct: 2.5 },
    { species: "scyther", min: 35, max: 38, pct: 2.5 },
    { species: "kangaskhan", min: 38, max: 38, pct: 1 },
  ],
  5: [
    { species: "gastly", min: 38, max: 41, pct: 18 },
    { species: "drowzee", min: 38, max: 42, pct: 15 },
    { species: "grimer", min: 38, max: 42, pct: 15 },
    { species: "koffing", min: 39, max: 43, pct: 12 },
    { species: "haunter", min: 40, max: 44, pct: 12 },
    { species: "kadabra", min: 41, max: 45, pct: 10 },
    { species: "hypno", min: 42, max: 46, pct: 8 },
    { species: "ditto", min: 44, max: 47, pct: 5 },
    { species: "gengar", min: 46, max: 48, pct: 3 },
    { species: "alakazam", min: 48, max: 48, pct: 2 },
  ],
  6: [
    { species: "machoke", min: 48, max: 51, pct: 16 },
    { species: "graveler", min: 48, max: 52, pct: 15 },
    { species: "onix", min: 48, max: 53, pct: 14 },
    { species: "marowak", min: 49, max: 54, pct: 12 },
    { species: "rhyhorn", min: 50, max: 55, pct: 12 },
    { species: "rhydon", min: 52, max: 56, pct: 10 },
    { species: "machamp", min: 53, max: 57, pct: 8 },
    { species: "arcanine", min: 54, max: 58, pct: 6 },
    { species: "dratini", min: 55, max: 59, pct: 4 },
    { species: "dragonair", min: 58, max: 60, pct: 2 },
    { species: "snorlax", min: 60, max: 60, pct: 1 },
  ],
  7: [
    { species: "seel", min: 60, max: 63, pct: 18 },
    { species: "shellder", min: 60, max: 64, pct: 16 },
    { species: "horsea", min: 61, max: 65, pct: 14 },
    { species: "staryu", min: 62, max: 66, pct: 12 },
    { species: "dewgong", min: 64, max: 69, pct: 12 },
    { species: "jynx", min: 65, max: 70, pct: 10 },
    { species: "cloyster", min: 66, max: 71, pct: 8 },
    { species: "starmie", min: 68, max: 73, pct: 5 },
    { species: "vaporeon", min: 70, max: 74, pct: 3 },
    { species: "lapras", min: 75, max: 75, pct: 2 },
  ],
  8: [
    { species: "dewgong", min: 75, max: 79, pct: 20 },
    { species: "cloyster", min: 76, max: 80, pct: 18 },
    { species: "jynx", min: 76, max: 81, pct: 16 },
    { species: "starmie", min: 78, max: 82, pct: 14 },
    { species: "vaporeon", min: 79, max: 84, pct: 10 },
    { species: "dragonair", min: 80, max: 85, pct: 9 },
    { species: "lapras", min: 82, max: 86, pct: 7 },
    { species: "gyarados", min: 84, max: 88, pct: 5 },
    { species: "dragonite", min: 88, max: 90, pct: 1 },
  ],
};

// Sheets 4x4 (mesmo formato dos sprites atuais), copiados de card/151+.
const FILES = import.meta.glob("../ambiente/map/zonas/*.png", { eager: true, import: "default" }) as Record<string, string>;
const SHEET_BY_SPECIES: Record<string, string> = {};
for (const [file, url] of Object.entries(FILES)) {
  const name = file.split("/").pop()!.replace(/\.png$/, "");
  SHEET_BY_SPECIES[name] = url;
}

export function zoneSheet(species: string): string | undefined {
  return SHEET_BY_SPECIES[species];
}

export function zoneForMap(mapId: string): ZoneSpawn[] | null {
  const zone = GRASS_ZONE_BY_MAP[mapId];
  return zone ? GRASS_ZONES[zone] ?? null : null;
}
