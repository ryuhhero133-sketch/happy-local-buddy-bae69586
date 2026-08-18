import { PetInstance } from "./systems";

export interface PetInstanceLocal extends PetInstance {}

export const SHOP_BOOKS = [
  { id: "exp_mult", name: "Livro de Experiência", price: 100, desc: "Aumenta o XP ganho em 50% por 1 hora.", currency: "crystals" as const },
  { id: "orb_team", name: "Orb de Time", price: 250, desc: "Bônus de atributos para todo o time por 30 min.", price_type: "crystals", currency: "crystals" as const, img: "/items/orb_team.png" },
];

export const ITEM_COLORS: Record<string, string> = {
  exp_mult: "#c084fc",
  orb_team: "#ff97e1",
};

export const EGG_SHOP_ITEMS = [
  { id: "egg_common", name: "Ovo Comum", price: 5000, color: "#8dfa8d", currency: "gold" as const, desc: "Um ovo misterioso." },
];
