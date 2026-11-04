/** Regras exclusivas dos encontros especiais do mapa sa (Safari). */
export const SAFARI_SPECIES = ["snorlax", "snorlax_mythic", "kabutops", "kabutops_shiny", "aerodactyl"] as const;
export const SAFARI_PLANT_SPECIES = ["venusaur", "ivysaur", "bulbasaur", "oddish", "gloom", "vileplume", "bellsprout", "weepinbell", "victreebel", "exeggcute", "exeggutor"] as const;
export function safariSpecialsEarned(defeats: number): number {
  return Math.floor(Math.max(0, defeats) / 20);
}
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
  return 30 + Math.min(570, Math.max(0, Math.floor(roll * 571)));
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

/** Escolhe o ponto mais afastado dos selvagens existentes, sem formar grupos. */
export const SAFARI_ANCESTRAL_SPECIES = ["moltres", "articuno", "zapdos", "lugia"] as const;
export const SAFARI_ANCESTRAL_AGGRESSIVE = new Set(["moltres", "lugia"]) as Set<string>;
export const SAFARI_ANCESTRAL_WINDOW_MS = 30 * 60 * 1000;
export const SAFARI_ANCESTRAL_DURATION_MS = 3 * 60 * 1000;
export const SAFARI_ANCESTRAL_LEVEL = 1000;

/** Entries: captura ancestral só com Safari Ball; Ultra não conta. */
export function safariAncestralCatchChance(ballId: string): number {
  return ballId === "safariball" ? 0.02 : 0;
}

export function safariAncestralDrop(entryKind: "black_mitic" | "ancestral"): { pepita?: number; greatball?: number; ultraball?: number; chance: number } {
  if (entryKind === "black_mitic") return { pepita: 1, ultraball: 1, chance: 0.20 };
  return { pepita: 100, greatball: 1, ultraball: 1, chance: 1.0 };
}

export async function safariAttackRemote(
  supabase: any,
  attackerUserId: string,
  targetUserId: string,
  targetSp: string,
  targetLevel: number,
  mapId: string,
  damage: number,
): Promise<{ ok: boolean; newHp?: number; reason?: string }> {
  try {
    const { data: targetRow } = await supabase
      .from("game_saves")
      .select("data")
      .eq("user_id", targetUserId)
      .single();
    if (!targetRow?.data) return { ok: false, reason: "no_save" };
    const d = targetRow.data;
    const currentHp = d.trainer_hp ?? 100;
    const newHp = Math.max(0, currentHp - damage);
    await supabase.from("game_saves").update({
      data: { ...d, trainer_hp: newHp, last_attacked_by: attackerUserId, last_attack_map: mapId },
      updated_at: new Date().toISOString(),
    }).eq("user_id", targetUserId);
    return { ok: true, newHp };
  } catch { return { ok: false, reason: "db_error" }; }
}

/** Quando o mapa alterna para neve após 30min. */
export function safariSnowActive(windowStartMs: number): boolean {
  return Date.now() - windowStartMs < SAFARI_ANCESTRAL_DURATION_MS;
}

export function safariSpreadPoint(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  placed: readonly { x: number; y: number }[],
  random: () => number = Math.random,
): { x: number; y: number } {
  let best = { x: bounds.minX, y: bounds.minY };
  let bestDistance = -1;
  for (let sample = 0; sample < 24; sample++) {
    const point = {
      x: bounds.minX + random() * (bounds.maxX - bounds.minX),
      y: bounds.minY + random() * (bounds.maxY - bounds.minY),
    };
    const distance = placed.reduce((nearest, other) => Math.min(nearest, Math.hypot(point.x - other.x, point.y - other.y)), Infinity);
    if (distance > bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return best;
}
