export type InventoryTab = "items" | "balls" | "materials" | "evolution" | "consumables" | "special";
export type InventoryCategory = "all" | "usable" | "materials" | "evolution" | "eggs" | "fragments" | "ores" | "events" | "other" | "equipment";
export type InventoryRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type InventoryItem = {
  key: string;
  id: string;
  name: string;
  description: string;
  quantity: number;
  image?: string;
  color?: string;
  rarity: InventoryRarity;
  category: Exclude<InventoryCategory, "all"> | "balls";
  source: "bag" | "vault" | "equipment";
  usable: boolean;
  bulk: boolean;
  actionLabel: string;
  actionHint?: string;
  sellPrice?: number;
  stoneSale?: boolean;
  upgrade?: { label: string; enabled: boolean; hint: string };
};

export const INVENTORY_PAGE_SIZE = 24;
export const INVENTORY_TIERS: Record<InventoryRarity, { color: string; label: string }> = {
  common: { color: "#7f9eae", label: "Comum" },
  uncommon: { color: "#7ccea5", label: "Incomum" },
  rare: { color: "#77bbef", label: "Raro" },
  epic: { color: "#c28bef", label: "Épico" },
  legendary: { color: "#efcb75", label: "Lendário" },
  mythic: { color: "#eda0ee", label: "Mítico" },
};

const FOOD = new Set(["potion", "revive", "berry", "fruta", "suco", "energetico", "refeicao", "morango", "banana", "limao", "maca", "laranja", "picole", "refrigerante", "cafe", "cha_verde", "bolo_morango", "leite_manga", "antidoto", "rare_candy"]);
const ORES = new Set(["ferro", "bronze", "pedra", "pepita", "sucata"]);
const MATERIALS = new Set(["fibra", "agua", "buque", "chicote", "escamas", "perola", "flor", "lenha", "oleo"]);

export function inventoryCategory(id: string, equipment = false): InventoryItem["category"] {
  if (equipment) return "equipment";
  if (id.endsWith("ball")) return "balls";
  if ((id.startsWith("egg_") && id !== "egg_boost_69") || id === "black_mitic_egg" || id === "emerald_egg") return "eggs";
  if ((id.startsWith("stone_") && id !== "stone_pack_all") || id === "egg_boost_69") return "evolution";
  if (/fragment|^frag_|^cr_/.test(id)) return "fragments";
  if (ORES.has(id)) return "ores";
  if (MATERIALS.has(id) || id.startsWith("cog_")) return "materials";
  if (FOOD.has(id) || /^(book_|orb_|incenso_)/.test(id)) return "usable";
  if (/^(ticket_|carta_)/.test(id) || ["premium_box", "bau_esmeralda", "skin_ticket", "certificado", "stone_pack_all"].includes(id)) return "events";
  return "other";
}

export function inventoryRarity(id: string): InventoryRarity {
  if (/egg_(aura|charizard|lugia|dragonite|sprigatito)|black_mitic|emerald_egg|egg_anc/.test(id)) return "mythic";
  if (/book_vip_60|_gold|_max|_supreme|masterball|stone_dragon|stone_dark|esfera_safira/.test(id)) return "legendary";
  if (/egg_epic|egg_mystic|_purple|book_vip|orb_team|premium_box|carta_|bau_esmeralda/.test(id)) return "epic";
  if (/egg_rare|ultraball|greatball|_big|_major|stone_|cr_/.test(id)) return "rare";
  if (/orb_|incenso_|revive/.test(id)) return "uncommon";
  return "common";
}

export function matchesInventoryTab(item: InventoryItem, tab: InventoryTab): boolean {
  if (tab === "items") return true;
  if (tab === "balls") return item.category === "balls";
  if (tab === "materials") return ["materials", "ores", "fragments"].includes(item.category) || item.source === "vault";
  if (tab === "evolution") return item.category === "evolution";
  if (tab === "consumables") return item.category === "usable";
  return ["events", "equipment", "other", "eggs"].includes(item.category);
}

export function filterInventory(items: InventoryItem[], tab: InventoryTab, category: InventoryCategory, query = ""): InventoryItem[] {
  const normalized = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  return items.filter(item => item.quantity > 0 && matchesInventoryTab(item, tab) &&
    (category === "all" || category === item.category) &&
    (!normalized || `${item.name} ${item.id}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(normalized)));
}

export function inventoryUseQuantity(item: InventoryItem, requested: number): number {
  const max = item.bulk ? Math.max(1, Math.floor(item.quantity)) : 1;
  return Math.max(1, Math.min(max, Number.isFinite(requested) ? Math.floor(requested) : 1));
}
