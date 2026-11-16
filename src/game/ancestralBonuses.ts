import { TRAITS } from "./traits";
import { ENTRY_TO_SPECIES } from "./ancestralEggs";
import { SPECIES_BASE, type Species } from "./systems";

export const ANCESTRAL_TRAIT_COUNT = 13;
export const ANCESTRAL_PET_XP_MULT = 1.5;
export const ANCESTRAL_TRAINER_XP_MULT = 2;
export const ANCESTRAL_GOLD_MULT = 5;
export const ANCESTRAL_CRYSTAL_DROP_CHANCE = 0.10;

type AncestralEntry = {
  uid: string;
  species?: string;
  rarity?: string;
  level?: number;
  event?: string;
  traits?: string[];
};
type AncestralState = { activeAncestralUid?: string; collection?: AncestralEntry[] };

const EGG_SPECIES = new Set<string>(Object.values(ENTRY_TO_SPECIES));

/** Reconhece ovos antigos que perderam `event`, sem transformar capturas comuns. */
export function isAncestralRecord(entry: AncestralEntry): boolean {
  if (entry.event === "ancestral") return true;
  if (entry.event || entry.rarity !== "mythic_shiny" || !entry.species || !EGG_SPECIES.has(entry.species)) return false;
  // Traits roxos/dourados só vinham do ovo; os 17 Pokémon do ovo têm
  // nível mínimo de captura 500, mas os ovos antigos podiam chocar abaixo disso.
  if (entry.traits?.some((id) => TRAITS[id]?.tier === "purple" || TRAITS[id]?.tier === "gold")) return true;
  const minLevel = SPECIES_BASE[entry.species as Species]?.minLv;
  return typeof entry.level === "number" && typeof minLevel === "number" && entry.level < minLevel;
}

/** A ficha do time pode ter uma cópia antiga sem event/traits; o UID da coleção é a origem. */
export function ancestralPetForDisplay<T extends AncestralEntry>(
  pet: T,
  collection: AncestralEntry[],
): T {
  const entry = collection.find((item) => item.uid === pet.uid);
  if (!isAncestralRecord(pet) && !(entry && isAncestralRecord(entry))) return pet;
  const traits = entry?.traits?.length ? entry.traits : pet.traits;
  return { ...pet, event: "ancestral", traits: normalizeAncestralTraits(traits, pet.uid) };
}

/** Somente o ancestral escolhido no painel global concede os bônus universais. */
export function hasActiveAncestral(state: AncestralState): boolean {
  return !!state.activeAncestralUid && !!state.collection?.some(
    (entry) => entry.uid === state.activeAncestralUid && isAncestralRecord(entry),
  );
}

const GOLD_TRAITS = Object.keys(TRAITS).filter((id) => TRAITS[id].tier === "gold");

/** Corrige ovos antigos sem recriar o Pokémon: mantém os traits dourados existentes. */
export function normalizeAncestralTraits(traits: string[] | undefined, uid: string): string[] {
  const current = Array.isArray(traits) ? traits : [];
  if (current.length === ANCESTRAL_TRAIT_COUNT && current.every((id) => TRAITS[id]?.tier === "gold")) {
    return current;
  }
  const gold = current.filter((id) => TRAITS[id]?.tier === "gold").slice(0, ANCESTRAL_TRAIT_COUNT);
  const offset = [...uid].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  while (gold.length < ANCESTRAL_TRAIT_COUNT) {
    gold.push(GOLD_TRAITS[(offset + gold.length) % GOLD_TRAITS.length]);
  }
  return gold;
}

export function ancestralLabel(event?: string, rarityLabel?: string): string {
  return event === "ancestral" ? "ANCESTRAL" : (rarityLabel ?? "");
}
