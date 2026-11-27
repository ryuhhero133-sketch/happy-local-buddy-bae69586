import initialChest from "@/assets/cash-shop/bau-inicial.webp";
import advancedChest from "@/assets/cash-shop/bau-avancado.webp";
import supremeChest from "@/assets/cash-shop/bau-supremo.webp";
import goldAdventure from "@/assets/cash-shop/banner-gold-aventura.webp";
import goldPower from "@/assets/cash-shop/banner-gold-poder.webp";
import goldTeam from "@/assets/cash-shop/banner-gold-time.webp";
import goldProgress from "@/assets/cash-shop/banner-gold-progresso.webp";
import goldLuffy from "@/assets/cash-shop/banner-gold-luffy.webp";

// Artwork only. Prices, availability and delivery quantities come from the server.
export const DIAMOND_PACKAGE_ART: Record<string, { image: string; accent: string }> = {
  bau_inicial: { image: initialChest, accent: "#c78bff" },
  bau_avancado: { image: advancedChest, accent: "#ffcf70" },
  bau_supremo: { image: supremeChest, accent: "#ff6a83" },
};

export const CASH_SHOP_BANNERS = [
  { id: "aventura", image: goldAdventure, alt: "GOLD VIP — aventura e skin exclusiva" },
  { id: "poder", image: goldPower, alt: "GOLD VIP — aumente seu poder" },
  { id: "time", image: goldTeam, alt: "GOLD VIP — fortaleça seu time" },
  { id: "progresso", image: goldProgress, alt: "GOLD VIP — progrida sem parar" },
  { id: "luffy", image: goldLuffy, alt: "GOLD VIP — skin exclusiva do Luffy" },
] as const;
