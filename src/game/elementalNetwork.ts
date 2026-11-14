// Progressão permanente de cristais — independente das sinergias dos Pokémon.
export type CrystalElement = "fire" | "water" | "nature" | "earth" | "electric";
export type CrystalNetwork = Partial<Record<CrystalElement, number>>;
export type CrystalTier = "epic" | "legendary" | "ancestral";
export type CrystalTiers = Partial<Record<CrystalTier, number>>;

export const CRYSTAL_TIER_ORDER: CrystalTier[] = ["legendary", "epic", "ancestral"];
export const CRYSTAL_TIER_NODES: Record<CrystalTier, { label: string; color: string; stones: string[]; bonus: string }> = {
  legendary: { label: "LENDÁRIO", color: "#ffb337", stones: ["stone_dragon"], bonus: "ATK" },
  epic: { label: "ÉPICO", color: "#b45bf5", stones: ["stone_dark"], bonus: "DEF" },
  ancestral: { label: "ANCESTRAL", color: "#f6d865", stones: ["stone_fire", "stone_water", "stone_grass"], bonus: "HP" },
};

export const CRYSTAL_NODES: Record<CrystalElement, { label: string; stone: string; color: string; icon: string; bonus: string }> = {
  fire: { label: "FOGO", stone: "stone_fire", color: "#ef4029", icon: "🔥", bonus: "ATK" },
  water: { label: "ÁGUA", stone: "stone_water", color: "#179cf5", icon: "💧", bonus: "DEF" },
  nature: { label: "NATUREZA", stone: "stone_grass", color: "#52c525", icon: "🌿", bonus: "HP" },
  earth: { label: "TERRA", stone: "stone_dark", color: "#ba7444", icon: "🪨", bonus: "HP" },
  electric: { label: "ELÉTRICO", stone: "stone_electric", color: "#ffcc24", icon: "⚡", bonus: "VEL" },
};

export const CRYSTAL_ORDER: CrystalElement[] = ["fire", "water", "nature", "earth", "electric"];
export const CRYSTAL_MAX_LEVEL = 5;

/** Custo de pedras para sair do nível atual. */
export function crystalCost(level: number) {
  return 8 + level * 4;
}

export function crystalTierCost(tier: CrystalTier, level: number) {
  return (tier === "ancestral" ? 4 : 10) + level * (tier === "ancestral" ? 2 : 5);
}

export function crystalTierBonuses(tiers: CrystalTiers = {}) {
  return {
    hpMult: (tiers.ancestral ?? 0) * 0.03,
    dmgMult: (tiers.legendary ?? 0) * 0.02,
    defMult: (tiers.epic ?? 0) * 0.02,
  };
}

/** Bônus permanentes somados sobre o pacote de sinergia do time. */
export function crystalBonuses(network: CrystalNetwork = {}) {
  return {
    hpMult: ((network.nature ?? 0) + (network.earth ?? 0)) * 0.03,
    dmgMult: (network.fire ?? 0) * 0.04,
    defMult: (network.water ?? 0) * 0.04,
    atkSpeedMult: (network.electric ?? 0) * 0.03,
  };
}
