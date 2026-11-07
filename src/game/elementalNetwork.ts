// Progressão permanente de cristais — independente das sinergias dos Pokémon.
export type CrystalElement = "fire" | "water" | "nature" | "earth" | "electric";
export type CrystalNetwork = Partial<Record<CrystalElement, number>>;

export const CRYSTAL_NODES: Record<CrystalElement, { label: string; stone: string; color: string; icon: string; bonus: string }> = {
  fire: { label: "FOGO", stone: "stone_fire", color: "#ef4029", icon: "🔥", bonus: "ATK" },
  water: { label: "ÁGUA", stone: "stone_water", color: "#179cf5", icon: "💧", bonus: "DEF" },
  nature: { label: "NATUREZA", stone: "stone_grass", color: "#52c525", icon: "🌿", bonus: "HP" },
  earth: { label: "TERRA", stone: "stone_dark", color: "#ba7444", icon: "🪨", bonus: "HP" },
  electric: { label: "ELÉTRICO", stone: "stone_electric", color: "#ffcc24", icon: "⚡", bonus: "VEL" },
};
export const CRYSTAL_ORDER: CrystalElement[] = ["fire", "water", "nature", "earth", "electric"];
export const CRYSTAL_MAX_LEVEL = 5;
export function crystalCost(level: number) { return 8 + level * 4; }
export function crystalBonuses(network: CrystalNetwork = {}) {
  return {
    hpMult: ((network.nature ?? 0) + (network.earth ?? 0)) * .03,
    dmgMult: (network.fire ?? 0) * .04,
    defMult: (network.water ?? 0) * .04,
    atkSpeedMult: (network.electric ?? 0) * .03,
  };
}
