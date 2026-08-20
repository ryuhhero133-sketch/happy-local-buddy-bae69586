import React, { useState } from 'react';
import { Package, Search, Filter, Trash2, Coins, Sparkles } from 'lucide-react';
import { ItemPixelIcon } from './ItemPixelIcon';

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
  const [filter, setFilter] = useState<"all" | "balls" | "potions" | "books" | "eggs" | "stones" | "other">("all");
  const [search, setSearch] = useState("");

  const CATS = [
    { id: "all", label: "TUDO", icon: <Package size={14} /> },
    { id: "balls", label: "BALLS", icon: "🔴" },
    { id: "potions", label: "POÇÕES", icon: "🧪" },
    { id: "books", label: "LIVROS", icon: "📕" },
    { id: "eggs", label: "OVOS", icon: "🥚" },
    { id: "stones", label: "STONES", icon: "💎" },
    { id: "other", label: "OUTROS", icon: "✨" },
  ];

  const getCat = (id: string): "all" | "balls" | "potions" | "books" | "eggs" | "stones" | "other" => {
    if (id.includes("ball")) return "balls";
    if (id === "potion") return "potions";
    if (id.startsWith("book_") || id.startsWith("orb_")) return "books";
    if (id.startsWith("egg_") || id === "black_mitic_egg") return "eggs";
    if (id.startsWith("stone_")) return "stones";
    return "other";
  };

  const entries = Object.entries(items)
    .filter(([_, n]) => n > 0)
    .filter(([id]) => filter === "all" || getCat(id) === filter)
    .filter(([id]) => {
      const name = id.replace(/_/g, " ").toLowerCase();
      return name.includes(search.toLowerCase());
    });

  return (
    <div className="flex flex-col h-full gap-4 font-pixel text-[#4a3010]">
      {/* Top Stats */}
      <div className="flex gap-3 justify-end items-center px-2">
        <div className="flex items-center gap-2 bg-[#fff8e5] border-2 border-[#b8862a] rounded-lg px-3 py-1 shadow-sm">
          <Coins size={14} className="text-[#b8862a]" />
          <span className="text-[11px] font-bold">{bank.gold.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 bg-[#fff8e5] border-2 border-[#c084fc] rounded-lg px-3 py-1 shadow-sm">
          <Sparkles size={14} className="text-[#c084fc]" />
          <span className="text-[11px] font-bold">{Math.floor(bank.crystals).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar Filters */}
        <div className="w-32 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id as any)}
              className={`flex items-center gap-2 p-2 rounded border-2 text-left transition-all flex-shrink-0 ${
                filter === c.id 
                  ? 'border-[#b8862a] bg-[#fff8e5] shadow-[0_2px_0_0_#b8862a55]' 
                  : 'border-transparent bg-[#f5e6c8]/50 hover:bg-[#f5e6c8]'
              }`}
            >
              <span className="text-[10px]">{c.icon}</span>
              <span className="text-[9px] font-bold truncate">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-3 p-3 rounded-lg bg-[#fff8e5] border-2 border-[#b8862a] shadow-inner overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#b8862a]" size={12} />
            <input 
              type="text" 
              placeholder="Buscar item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 bg-[#f5e6c8] border border-[#b8862a]/40 rounded text-[10px] focus:outline-none focus:border-[#b8862a]"
            />
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-4 content-start gap-2">
            {entries.map(([id, n]) => {
              const sellPrice = marketSellPrices[id] || 0;
              const isEgg = id.startsWith("egg_");
              
              return (
                <div key={id} className="group relative bg-[#f5e6c8]/50 border-2 border-[#b8862a]/30 rounded-lg p-2 flex flex-col items-center gap-1 hover:border-[#b8862a] hover:bg-[#fff8e5] transition-all">
                  <ItemPixelIcon id={id} size={32} />
                  <span className="text-[8px] font-bold text-center truncate w-full">{id.replace(/_/g, " ").toUpperCase()}</span>
                  <div className="absolute -top-1 -right-1 bg-[#4a3010] text-[#fff] text-[8px] px-1 rounded border border-[#b8862a] z-10">
                    x{n}
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-[#4a3010]/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 rounded-lg">
                    <button 
                      onClick={() => onUseItem(id)}
                      className="w-[80%] bg-[#b8862a] text-white text-[8px] font-bold py-1 rounded hover:bg-[#8b6a30]"
                    >
                      {isEgg ? "CHOCAR" : "USAR"}
                    </button>
                    {sellPrice > 0 && (
                      <button 
                        onClick={() => onSellItem(id)}
                        className="w-[80%] bg-[#5ec26a] text-black text-[8px] font-bold py-1 rounded hover:bg-[#45a049]"
                      >
                        VENDER 💰
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {entries.length === 0 && (
              <div className="col-span-4 py-8 text-center text-[10px] text-[#8b6a30] italic">
                Nenhum item encontrado nesta categoria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
