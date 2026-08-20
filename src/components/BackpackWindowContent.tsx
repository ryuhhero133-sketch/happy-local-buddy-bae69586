import React from 'react';
import { ShoppingBag, TrendingDown, DollarSign } from 'lucide-react';

interface BackpackWindowContentProps {
  items: Record<string, number>;
  bank: { gold: number; crystals: number };
  onUseItem: (id: string, qty?: number) => void;
  onSellItem: (id: string, qty?: number, currency?: "gold" | "crystal" | "safira") => void;
  marketSellPrices: Record<string, number>;
}

export const BackpackWindowContent: React.FC<BackpackWindowContentProps> = ({
  items,
  bank,
  onUseItem,
  onSellItem,
  marketSellPrices
}) => {
  const [category, setCategory] = React.useState<"all" | "balls" | "potions" | "books" | "eggs" | "other">("all");

  const getItemCategory = (id: string): string => {
    if (id.includes("ball")) return "balls";
    if (id.includes("potion")) return "potions";
    if (id.includes("book")) return "books";
    if (id.includes("egg")) return "eggs";
    return "other";
  };

  const entries = Object.entries(items)
    .filter(([id, n]) => n > 0 && !id.startsWith("_"))
    .filter(([id]) => category === "all" || getItemCategory(id) === category);

  const ITEM_NAMES: Record<string, string> = {
    potion: "Poção", 
    pokeball: "Pokébola", 
    greatball: "Great Ball", 
    ultraball: "Ultra Ball",
    book_atk: "Livro de Ataque",
    book_def: "Livro de Defesa",
    book_exp: "Livro de Experiência",
    premium_box: "Caixa Premium ✦",
    stone_grass: "Stone Verdejante",
    stone_fire: "Stone Ígnea",
    stone_water: "Stone Aquática",
    stone_electric: "Stone Elétrica",
    stone_dark: "Stone Sombria",
    stone_dragon: "Stone Dragão",
    egg_common: "Ovo Comum",
    egg_rare: "Ovo Raro",
    egg_epic: "Ovo Épico",
    egg_mystic: "Ovo Místico"
  };

  return (
    <div className="flex flex-col gap-4 h-full font-pixel text-[#eadfe8]">
      {/* Economy Bar */}
      <div className="flex justify-between items-center bg-[#0b0510]/50 border border-[#f5cf6b44] p-2 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-[#f5cf6b] text-xs font-bold">💰 {bank.gold.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#c084fc] text-xs font-bold">💎 {Math.floor(bank.crystals).toLocaleString()}</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {["all", "balls", "potions", "books", "eggs", "other"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat as any)}
            className={`px-3 py-1 rounded-md text-[9px] font-bold border transition-all ${
              category === cat 
                ? 'bg-[#f5cf6b] border-[#f5cf6b] text-[#0b0510]' 
                : 'bg-[#1A0F26] border-[#3a2a4a] text-[#8a7a9c] hover:border-[#eadfe844]'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[250px]">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#8a7a9c] text-xs italic opacity-50 gap-2">
            <ShoppingBag size={24} />
            Mochila vazia
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {entries.map(([id, n]) => {
              const sellPrice = marketSellPrices[id] ?? 0;
              return (
                <div key={id} className="bg-[#1A0F26] border border-[#3a2a4a] p-2 rounded-lg flex flex-col gap-2 relative group hover:border-[#f5cf6b44]">
                  <div className="absolute -top-1 -right-1 bg-[#a855f7] text-white text-[8px] px-1 rounded shadow-sm z-10">
                    x{n}
                  </div>
                  <div className="aspect-square bg-[#0b0510] rounded border border-[#3a2a4a] flex items-center justify-center text-xl">
                    {id.startsWith("egg_") ? "🥚" : id.includes("ball") ? "⚾" : id.includes("potion") ? "🧪" : id.includes("book") ? "📖" : "✨"}

                  </div>
                  <div className="text-[9px] font-bold truncate text-center">{ITEM_NAMES[id] || id}</div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => onUseItem(id, 1)}
                      className="flex-1 bg-[#f5cf6b] text-[#0b0510] text-[8px] font-bold py-1 rounded hover:brightness-110"
                    >
                      {id.startsWith("egg_") ? "CHOCAR" : "USAR"}
                    </button>
                    {sellPrice > 0 && !id.startsWith("stone_") && (
                      <button 
                        onClick={() => onSellItem(id, 1, "gold")}
                        className="p-1 bg-[#ff5252] text-white rounded hover:brightness-110"
                        title={`Vender por ${sellPrice} ouro`}
                      >
                        <DollarSign size={10} />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
