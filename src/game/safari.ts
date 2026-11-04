/** Regras exclusivas dos encontros especiais do mapa sa (Safari). */
export const SAFARI_SPECIES = ["snorlax", "snorlax_mythic", "kabutops", "kabutops_shiny", "aerodactyl"] as const;
// IDs do catálogo existente: usa as sprites e a resolução real de dano/área.
const SAFARI_SKILLS: Record<string, readonly string[]> = {
  snorlax: ["quake_aoe", "fire_burst", "volt_field", "fight_single", "safari_dark_orb"],
  snorlax_mythic: ["psy_field", "dark_field", "quake_aoe", "psy_single", "safari_pink_orb"],
  kabutops: ["quake_aoe", "water_single", "rock_throw", "root_aoe", "safari_dark_orb"],
  kabutops_shiny: ["volt_field", "poison_cloud", "quake_aoe", "water_single", "safari_pink_orb"],
  aerodactyl: ["fire_burst", "quake_aoe", "dark_field", "fly_single", "safari_dark_orb"],
};
export function safariSkillIds(map: string, species: string): readonly string[] {
  return map === "sa" ? SAFARI_SKILLS[species] ?? [] : [];
}
export function isSafariEncounter(map: string, species: string): boolean {
  return map === "sa" && (SAFARI_SPECIES as readonly string[]).includes(species);
}
export function safariRarity(species: string): "mythic" | "mythic_shiny" {
  return species === "snorlax_mythic" || species === "kabutops_shiny" ? "mythic" : "mythic_shiny";
}
export function safariLevel(roll: number): number {
  if (roll < 0.01) return 10;
  if (roll < 0.03) return 50;
  return [100, 300, 500, 640][Math.min(3, Math.floor((roll - 0.03) / 0.97 * 4))];
}
export function safariCatchChance(ball: string, ultraThrows: number): number {
  if (ball === "safariball") return 0.02;
  if (ball !== "ultraball" || ultraThrows <= 70) return 0;
  // Sem garantia na 80ª: chance crescente de 2% até 20% por Ultra Ball.
  return Math.min(0.20, (ultraThrows - 70) * 0.02);
}
export function safariEvent(species: string): string {
  return safariRarity(species) === "mythic" ? "safari:mythic" : "safari:black_mitic";
}
export const SAFARI_TRAINER_MAX_HP = 100;
export const SAFARI_TRAINER_HIT = 15;
