import type { PetInstance, Rarity, Species } from "@/game/systems";

export type MarketCurrency = "gold" | "crystal" | "safira";
export type MarketPet = Partial<PetInstance> & {
  uid: string; species: Species; level: number; rarity: Rarity;
  capturedAt?: number; isStarter?: boolean; purchasedAt?: number;
};
export type MarketplaceListing = {
  id: string; seller_id: string; seller_name: string;
  kind: "item" | "pokemon"; item_id: string | null; qty: number;
  pet_data: MarketPet | null; price: number; currency: MarketCurrency;
  created_at: string; sold_at?: string | null; payout_claimed?: boolean;
};
export type MarketplaceData = {
  listings: MarketplaceListing[]; mine: MarketplaceListing[];
  payouts: MarketplaceListing[]; total: number; starter_uid?: string | null;
};
export const MARKET_CURRENCIES: Record<MarketCurrency, { label: string; symbol: string; cap: number }> = {
  gold: { label: "Ouro", symbol: "●", cap: 50_000_000 },
  crystal: { label: "Cristais", symbol: "◆", cap: 1_000_000 },
  safira: { label: "Safiras", symbol: "◆", cap: 1_000_000 },
};
// Mesma lista explícita do RPC. Moedas e contadores internos não são mercadorias.
export const MARKET_ITEM_NAMES: Record<string, string> = {
  pokeball: "Pokébola", greatball: "Great Ball", ultraball: "Ultra Ball", masterball: "Master Ball",
  safariball: "Safari Ball", slimeball: "Pokébola Slime", slime_pet: "Slime",
  potion: "Poção", revive: "Revive", berry: "Baga", key: "Chave", chest_amulet: "Amuleto do Baú",
  morango: "Morango", limao: "Limão", banana: "Banana", maca: "Maçã", laranja: "Laranja",
  picole: "Picolé", refrigerante: "Refrigerante", cafe: "Café", cha_verde: "Chá Verde",
  bolo_morango: "Bolo de Morango", leite_manga: "Leite de Manga",
  stone_grass: "Stone Verdejante", stone_fire: "Stone Ígnea", stone_water: "Stone Aquática",
  stone_electric: "Stone Elétrica", stone_dark: "Stone Sombria", stone_dragon: "Stone Dragão",
  book_atk: "Livro de Ataque", book_def: "Livro de Defesa", book_exp: "Livro de EXP",
  book_atk_purple: "Livro de Ataque Arcano", book_def_purple: "Livro de Defesa Arcano",
  book_atk_gold: "Livro de Ataque Dourado", book_def_gold: "Livro de Defesa Dourado",
  book_exp_big: "Livro de EXP Raro", book_exp_max: "Livro de EXP Lendário",
  book_vip: "Livro VIP Epic", book_vip_30: "Livro VIP Cristal", book_vip_60: "Livro VIP Gold Anual",
  incenso_mel: "Incenso de Mel", incenso_mel_raro: "Incenso Raro", incenso_mel_raro_24h: "Incenso Raro 24h",
  orb_xp_minor: "Orb Menor", orb_xp_major: "Orb Maior", orb_xp_supreme: "Orb Supremo",
  orb_xp_supreme_24h: "Orb Supremo 24h", orb_team: "Orb de Time",
  egg_common: "Ovo Comum", egg_rare: "Ovo Raro", egg_epic: "Ovo Épico", egg_mystic: "Ovo Místico",
  egg_aura: "Ovo da Aura", egg_charizard: "Ovo do Charizard", egg_charizard_epic: "Ovo do Charizard Épico",
  egg_lugia: "Ovo de Lugia", egg_sprigatito: "Ovo Sprigatito", egg_mew_7: "Ovo de Mew",
  egg_lucario_7: "Ovo de Lucario", egg_ditto_shiny_1: "Ovo de Ditto Shiny",
  egg_anc_selado: "Ovo Ancestral Selado", egg_anc_plus: "Ovo Ancestral Plus", egg_anc_luck: "Ovo Ancestral Luck",
  black_mitic_egg: "Black Mitic Egg", emerald_egg: "Ovo Emerald", egg_boost_69: "Cristal do Despertar",
  esfera_safira: "Esfera de Safira", ticket_ancestral: "Ticket Ancestral", skin_ticket: "Ticket de Skin",
  carta_montaria: "Carta de Montaria", carta_montaria_30: "Carta de Montaria 30d", carta_incubadora: "Carta da Incubadora", carta_plus: "Carta Suprema Plus",
  carta_riolu: "Carta Riolu", nevezinha_doll: "Nevezinha", premium_box: "Caixa Premium", bau_esmeralda: "Baú de Esmeralda",
  fibra: "Fibra", ferro: "Ferro", agua: "Água", bronze: "Bronze", buque: "Buquê", chicote: "Chicote",
  escamas: "Escamas", perola: "Pérola", pepita: "Pepita de Ouro", flor: "Flor", lenha: "Lenha",
  pedra: "Pedra", sucata: "Sucata", oleo: "Óleo", certificado: "Certificado",
  cog_red: "Cogumelo Vermelho", cog_blue: "Cogumelo Azul", cog_orange: "Cogumelo Laranja", cog_brown: "Cogumelo Marrom",
  disc_raiz: "Disco Raiz", disc_mare: "Disco Maré Cortante", disc_combustao: "Disco Combustão",
};
export const marketItemName = (id: string) => MARKET_ITEM_NAMES[id] ?? id.replaceAll("_", " ");
export const marketPokemonName = (species: string) => species.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
export const marketListingName = (listing: MarketplaceListing) => listing.kind === "pokemon"
  ? marketPokemonName(listing.pet_data?.species ?? "Pokémon") : marketItemName(listing.item_id ?? "");
export const marketNormalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const INITIAL_LINE = /^(charmander|charmeleon|charizard|bulbasaur|ivysaur|venusaur|squirtle|wartortle|blastoise)$/;
/** Compatibilidade com saves anteriores à marca de origem. Não bloqueia toda a espécie. */
export function initialPokemonUid(pets: MarketPet[], savedUid?: string): string | undefined {
  if (savedUid) return savedUid;
  const marked = pets.find(pet => pet.isStarter || pet.event === "starter");
  if (marked) return marked.uid;
  return [...pets].filter(pet => INITIAL_LINE.test(pet.species) && !pet.event && !pet.purchasedAt)
    .sort((a, b) => (a.capturedAt ?? Number.MAX_SAFE_INTEGER) - (b.capturedAt ?? Number.MAX_SAFE_INTEGER))[0]?.uid;
}
export function pokemonSaleError(pet: MarketPet, starterUid: string | undefined, activeUids: Set<string>, restingUids: Set<string> = new Set()): string | null {
  if (pet.uid === starterUid || pet.isStarter || pet.event === "starter") return "Seu Pokémon inicial não pode ser vendido, mesmo evoluído.";
  if (pet.locked) return "Este Pokémon está protegido e não pode ser vendido.";
  if (activeUids.has(pet.uid)) return "Retire este Pokémon do time antes de anunciar.";
  if (restingUids.has(pet.uid)) return "Aguarde o descanso deste Pokémon terminar.";
  return null;
}
export function filterMarketListings(listings: MarketplaceListing[], options: {
  query: string; kind: "all" | "item" | "pokemon"; currency: "all" | MarketCurrency;
  sort: "recent" | "price_asc" | "price_desc" | "level"; shiny?: boolean;
}) {
  const query = marketNormalize(options.query);
  return listings.filter(listing =>
    (options.kind === "all" || listing.kind === options.kind) &&
    (options.currency === "all" || listing.currency === options.currency) &&
    (!options.shiny || (listing.kind === "pokemon" && (!!listing.pet_data?.species?.includes("shiny") || listing.pet_data?.rarity === "mythic_shiny"))) &&
    (!query || marketNormalize(`${marketListingName(listing)} ${listing.seller_name} ${listing.item_id ?? ""}`).includes(query)),
  ).sort((a, b) => options.sort === "price_asc" ? a.price - b.price
    : options.sort === "price_desc" ? b.price - a.price
      : options.sort === "level" ? (b.pet_data?.level ?? 0) - (a.pet_data?.level ?? 0)
        : Date.parse(b.created_at) - Date.parse(a.created_at));
}
