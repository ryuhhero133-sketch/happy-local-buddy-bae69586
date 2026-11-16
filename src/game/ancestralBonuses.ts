import { TRAITS } from "./traits";

export const ANCESTRAL_TRAIT_COUNT = 13;
export const ANCESTRAL_PET_XP_MULT = 1.5;
export const ANCESTRAL_TRAINER_XP_MULT = 2;
export const ANCESTRAL_GOLD_MULT = 5;
export const ANCESTRAL_CRYSTAL_DROP_CHANCE = 0.10;

type AncestralEntry = { uid: string; event?: string; traits?: string[] };
type AncestralState = { activeAncestralUid?: string; collection?: AncestralEntry[] };

/** Somente o ancestral escolhido no painel global concede os bônus universais. */
export function hasActiveAncestral(state: AncestralState): boolean {
  return !!state.activeAncestralUid && !!state.collection?.some(
    (entry) => entry.uid === state.activeAncestralUid && entry.event === "ancestral",
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
