export type CollectionTier = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "mythic_shiny";
export type CollectionFilter = "all" | CollectionTier | "black" | "ancestral";
export type CollectionSort = "dex" | "name" | "recent" | "level" | "level_asc" | "rarity";
export type PokemonRecord = {
  key: string; species: string; name: string; number?: number; image?: string; sheet?: string;
  rarity: CollectionTier; level?: number; capturedAt?: number; event?: string;
  types: { name: string; color: string; icon: string }[];
  caught: boolean; seen: boolean; inTeam: boolean; locked: boolean;
  craftGain: number; traits: string[]; moves: string[];
};
export const COLLECTION_PAGE_SIZE = 10;
export const COLLECTION_TIERS: Record<CollectionTier, { label: string; color: string }> = {
  common: { label: "Comum", color: "#92cce7" }, uncommon: { label: "Incomum", color: "#76d877" },
  rare: { label: "Raro", color: "#55b9f2" }, epic: { label: "Épico", color: "#c37af0" },
  legendary: { label: "Lendário", color: "#f6ba56" }, mythic: { label: "Mítico", color: "#e19dff" },
  mythic_shiny: { label: "Mítico Brilhante", color: "#f7d568" },
};

// National numbers only where known; special forms inherit their base number.
const KANTO = "bulbasaur ivysaur venusaur charmander charmeleon charizard squirtle wartortle blastoise caterpie metapod butterfree weedle kakuna beedrill pidgey pidgeotto pidgeot rattata raticate spearow fearow ekans arbok pikachu raichu sandshrew sandslash nidoran_f nidorina nidoqueen nidoran_m nidorino nidoking clefairy clefable vulpix ninetales jigglypuff wigglytuff zubat golbat oddish gloom vileplume paras parasect venonat venomoth diglett dugtrio meowth persian psyduck golduck mankey primeape growlithe arcanine poliwag poliwhirl poliwrath abra kadabra alakazam machop machoke machamp bellsprout weepinbell victreebel tentacool tentacruel geodude graveler golem ponyta rapidash slowpoke slowbro magnemite magneton farfetchd doduo dodrio seel dewgong grimer muk shellder cloyster gastly haunter gengar onix drowzee hypno krabby kingler voltorb electrode exeggcute exeggutor cubone marowak hitmonlee hitmonchan lickitung koffing weezing rhyhorn rhydon chansey tangela kangaskhan horsea seadra goldeen seaking staryu starmie mr_mime scyther jynx electabuzz magmar pinsir tauros magikarp gyarados lapras ditto eevee vaporeon jolteon flareon porygon omanyte omastar kabuto kabutops aerodactyl snorlax articuno zapdos moltres dratini dragonair dragonite mewtwo mew".split(" ");
const NUMBERS: Record<string, number> = Object.fromEntries(KANTO.map((species, index) => [species, index + 1]));
Object.assign(NUMBERS, { chikorita: 152, cyndaquil: 155, totodile: 158, ampharos: 181, umbreon: 197, espeon: 196, scizor: 212, heracross: 214, sneasel: 215, houndoom: 229, tyranitar: 248, lugia: 249, ho_oh: 250, celebi: 251, treecko: 252, torchic: 255, mudkip: 258, gardevoir: 282, sableye: 302, mawile: 303, aggron: 306, flygon: 330, altaria: 334, absol: 359, salamence: 373, metagross: 376, latias: 380, latios: 381, kyogre: 382, groudon: 383, rayquaza: 384, turtwig: 387, chimchar: 390, piplup: 393, garchomp: 445, lucario: 448, dialga: 483, palkia: 484, giratina: 487, darkrai: 491, arceus: 493, victini: 494, snivy: 495, tepig: 498, oshawott: 501, zorua: 570, zoroark: 571, chespin: 650, fennekin: 653, froakie: 656, sylveon: 700, rowlet: 722, litten: 725, popplio: 728, mimikyu: 778, grookey: 810, scorbunny: 813, sobble: 816, sprigatito: 906, fuecoco: 909, quaxly: 912 });
export function pokemonNumber(species: string): number | undefined {
  return NUMBERS[species] ?? NUMBERS[species.replace(/^mega_/, "").replace(/_(shiny|ancestral|m_shiny|alola|galar).*$/, "")];
}
export function pokemonName(species: string): string {
  return species.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}
export function matchesCollectionFilter(record: PokemonRecord, filter: CollectionFilter): boolean {
  if (filter === "all") return true;
  if (filter === "black") return !!record.event?.startsWith("black_mitic") || record.event === "safari:black_mitic";
  if (filter === "ancestral") return /ancestral/.test(`${record.species} ${record.event ?? ""}`);
  return record.rarity === filter;
}
export function filterPokemon(records: PokemonRecord[], options: { filter: CollectionFilter; query: string; sort: CollectionSort; favorites?: Set<string>; onlyLocked?: boolean; status?: "all" | "caught" | "seen" | "unseen" }): PokemonRecord[] {
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const q = normalize(options.query.trim());
  return records.filter(record => matchesCollectionFilter(record, options.filter) &&
    (!q || normalize(`${record.name} ${record.species} ${record.number ?? ""}`).includes(q)) &&
    (!options.favorites || options.favorites.has(record.key)) && (!options.onlyLocked || record.locked) &&
    (!options.status || options.status === "all" || (options.status === "caught" ? record.caught : options.status === "seen" ? record.seen : !record.seen)))
    .sort((a, b) => {
      if (options.sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      if (options.sort === "level") return (b.level ?? 0) - (a.level ?? 0);
      if (options.sort === "level_asc") return (a.level ?? 0) - (b.level ?? 0);
      if (options.sort === "recent") return (b.capturedAt ?? 0) - (a.capturedAt ?? 0);
      if (options.sort === "rarity") return Object.keys(COLLECTION_TIERS).indexOf(b.rarity) - Object.keys(COLLECTION_TIERS).indexOf(a.rarity);
      return (a.number ?? Infinity) - (b.number ?? Infinity) || a.name.localeCompare(b.name, "pt-BR");
    });
}
export function eligibleForFragment(record: PokemonRecord): boolean { return !record.inTeam && !record.locked; }
export function collectionProgress(species: string[], catalog: string[]): { count: number; total: number; percent: number } {
  const available = new Set(catalog);
  const count = new Set(species.filter(species => available.has(species))).size;
  return { count, total: available.size, percent: available.size ? count / available.size * 100 : 0 };
}
