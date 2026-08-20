import React, { useState } from 'react';
import { Hammer, Plus, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CraftHUDProps {
  items: Record<string, number>;
  onCraft?: (result: string, ingredients: Record<string, number>) => void;
}

export const CraftHUD: React.FC<CraftHUDProps> = ({ items, onCraft }) => {
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null]);
  
  const handleRemoveItem = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const handleAddItem = (itemId: string) => {
    const emptyIndex = slots.findIndex(s => s === null);
    if (emptyIndex !== -1) {
      const newSlots = [...slots];
      newSlots[emptyIndex] = itemId;
      setSlots(newSlots);
    }
  };

  const inventoryItems = Object.entries(items).filter(([_, count]) => count > 0);

  return (
    <div className="flex flex-col gap-4 min-w-[300px] font-pixel">
      {/* Crafting Area */}
      <div className="bg-[#1A0F08] p-3 rounded border-2 border-[#4A3728] shadow-inner relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {slots.map((slot, i) => (
              <div 
                key={i}
                className="w-12 h-12 bg-[#2D1B0E] border-2 border-[#4A3728] rounded flex items-center justify-center relative group"
              >
                {slot ? (
                  <>
                    <img 
                      src={`/items/${slot}.png`} 
                      alt={slot} 
                      className="w-8 h-8 pixelated"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
                      }}
                    />
                    <button 
                      onClick={() => handleRemoveItem(i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={10} />
                    </button>
                  </>
                ) : (
                  <Plus size={16} className="text-[#4A3728]" />
                )}
              </div>
            ))}
          </div>
          
          <ArrowRight className="text-[#F3E5AB] opacity-50" />
          
          <div className="w-16 h-16 bg-[#2D1B0E] border-2 border-[#F3E5AB] rounded flex items-center justify-center shadow-[0_0_15px_rgba(243,229,171,0.2)]">
            <Hammer size={32} className="text-[#F3E5AB] opacity-20" />
          </div>
        </div>
      </div>

      <button 
        disabled={slots.every(s => s === null)}
        className="w-full py-2 bg-[#5ec26a] hover:bg-[#4eb25a] disabled:bg-gray-700 text-[#1A0F08] font-black rounded border-b-4 border-[#2d6a35] active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest shadow-lg text-xs"
      >
        FORJAR ITEM
      </button>

      {/* Mini Inventory for selection */}
      <div className="mt-2 bg-[#2D1B0E]/50 p-2 rounded border border-[#4A3728]">
        <h3 className="text-[10px] text-[#F3E5AB] opacity-70 mb-2 uppercase tracking-widest font-bold">MATERIAIS DISPONÍVEIS</h3>
        <div className="grid grid-cols-5 gap-1 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
          {inventoryItems.map(([id, count]) => (
            <button
              key={id}
              onClick={() => handleAddItem(id)}
              className="w-10 h-10 bg-[#1A0F08] border border-[#4A3728] rounded flex items-center justify-center relative hover:bg-[#4A3728] transition-colors group"
              title={id}
            >
              <img 
                src={`/items/${id}.png`} 
                alt={id} 
                className="w-6 h-6 pixelated group-hover:scale-110 transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
                }}
              />
              <span className="absolute -bottom-1 -right-1 text-[8px] bg-[#f3e5ab] px-1 rounded-sm text-[#1A0F08] font-bold border border-[#1A0F08] z-10">
                {count}
              </span>
            </button>
          ))}
          {inventoryItems.length === 0 && (
            <div className="col-span-5 text-[9px] text-center opacity-30 py-4 uppercase">
              Inventário Vazio
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
