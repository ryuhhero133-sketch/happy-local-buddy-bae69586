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
    <div className="flex flex-col gap-4 min-w-[300px]">
      {/* Crafting Area */}
      <div className="bg-[#2D1B0E] p-3 rounded border-2 border-[#1A0F08] shadow-inner">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {slots.map((slot, i) => (
              <div 
                key={i}
                className="w-12 h-12 bg-[#4A3728] border-2 border-[#1A0F08] rounded flex items-center justify-center relative group"
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
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </>
                ) : (
                  <Plus size={16} className="text-[#5C4533]" />
                )}
              </div>
            ))}
          </div>
          
          <ArrowRight className="text-[#F3E5AB]" />
          
          <div className="w-16 h-16 bg-[#5C4533] border-2 border-[#F3E5AB] rounded flex items-center justify-center shadow-lg">
            <Hammer size={32} className="text-[#F3E5AB] opacity-20" />
          </div>
        </div>
      </div>

      <button 
        disabled={slots.every(s => s === null)}
        className="w-full py-2 bg-[#4CAF50] hover:bg-[#45a049] disabled:bg-gray-600 text-white font-bold rounded border-b-4 border-green-900 active:border-b-0 active:mt-1 transition-all uppercase tracking-widest shadow-lg"
      >
        Criar Item
      </button>

      {/* Mini Inventory for selection */}
      <div className="mt-2">
        <h3 className="text-xs text-[#F3E5AB] opacity-70 mb-2 uppercase tracking-tighter">Selecione Materiais:</h3>
        <div className="grid grid-cols-5 gap-1 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
          {inventoryItems.map(([id, count]) => (
            <button
              key={id}
              onClick={() => handleAddItem(id)}
              className="w-10 h-10 bg-[#4A3728] border border-[#1A0F08] rounded flex items-center justify-center relative hover:bg-[#5C4533] transition-colors"
              title={id}
            >
              <img 
                src={`/items/${id}.png`} 
                alt={id} 
                className="w-6 h-6 pixelated"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
                }}
              />
              <span className="absolute bottom-0 right-0 text-[8px] bg-black/60 px-0.5 rounded text-white">{count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
