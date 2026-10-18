// ═══ EGG SELADO ANCESTRAL — regras puras (sem JSX) ═══
// O jogador escolhe um Pokémon da aba ANCESTRAL e o SELA num ovo.
// O ovo libera DEPOIS DE 3 DIAS — ou JÁ, se alimentado com 300 Esferas.
// E libera EXATAMENTE o escolhido (nunca aleatório).
// Alimentação: Esfera de Safira (drops.ts) melhora o sorteio de traits.
// Regras duras da spec: ≥12 traits (Plus = 16), NUNCA abaixo do tier ROXO.
import type { Species } from "./systems";
import { rollAncestralTraits, type AncestralEggKind } from "./traits";

export const HATCH_MS = 3 * 24 * 60 * 60 * 1000; // 3 dias (72h)
export const FED_CAP = 300; // teto de Esferas de Safira (300/300 = choca antes do tempo)

export interface SealedEgg {
  kind: AncestralEggKind;
  entryId: string; // id em ANCESTRAL_ENTRIES (enciclopédia)
  species: Species; // exatamente o escolhido
  sealedAt: number; // Date.now() do selamento
  fed: number; // Esferas consumidas (0..FED_CAP)
}

/** Mapeamento entrada da enciclopédia → Species (1:1, sempre o escolhido). */
export const ENTRY_TO_SPECIES: Record<string, Species> = {
  darkrai: "darkrai",
  "dragonite-mg": "dragonite_mg",
  giratina: "giratina",
  "groudon-shiny": "groudon_shiny",
  cresselia: "cresselia",
  kyurem: "kyurem",
  "latias-ancestral": "latias_ancestral",
  "latios-ancestral": "latios_ancestral",
  "lugia-m-shiny": "lugia_m_shiny",
  "lugia-shiny-ancestral": "lugia_shiny_ancestral",
  "mega-charizard": "mega_charizard",
  "mega-lugia-ancestral": "mega_lugia_ancestral",
  "mega-charizard-x": "charizard_mega_x",
  "rayquaza-shiny": "rayquaza_shiny",
  rayquaza: "rayquaza",
  reshiram: "reshiram",
  zekrom: "zekrom",
};

export function speciesForEntry(entryId: string): Species | null {
  return ENTRY_TO_SPECIES[entryId] ?? null;
}

export function canSeal(entryId: string): boolean {
  return speciesForEntry(entryId) !== null;
}

export function seal(kind: AncestralEggKind, entryId: string, now = Date.now()): SealedEgg | null {
  const sp = speciesForEntry(entryId);
  if (!sp) return null;
  return { kind, entryId, species: sp, sealedAt: now, fed: 0 };
}

/** Ainda selado? (true = ainda dentro dos 3 dias) */
export function isSealed(egg: SealedEgg, now = Date.now()): boolean {
  return now - egg.sealedAt < HATCH_MS;
}

export function remainingMs(egg: SealedEgg, now = Date.now()): number {
  return Math.max(0, HATCH_MS - (now - egg.sealedAt));
}

/** Pode chocar? Tempo esgotado (3 dias) OU 300/300 esferas alimentadas. */
export function readyToHatch(egg: SealedEgg, now = Date.now()): boolean {
  return !isSealed(egg, now) || egg.fed >= FED_CAP;
}

/** Consome 1 Esfera de Safira. true = alimentou; false = cheio/já liberado. */
export function feed(egg: SealedEgg, amount = 1): SealedEgg | null {
  if (egg.fed >= FED_CAP) return null;
  const fed = Math.min(FED_CAP, egg.fed + amount);
  return { ...egg, fed };
}

/** Traits do ancestral no momento da liberação (≥12, todos ≥ ROXO). */
export function hatchTraits(egg: SealedEgg): string[] {
  return rollAncestralTraits(egg.kind, egg.fed);
}
