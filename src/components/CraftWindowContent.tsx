import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Hammer, Box, ArrowRight } from 'lucide-react';
import { ItemPixelIcon } from './ItemPixelIcon';

interface CraftingSystemProps {
  items: Record<string, number>;
  bank: { gold: number; crystals: number };
  onCraft: (recipeId: string) => void;
}

// Recipes for Stones and Fragments
const RECIPES = [
  {
    id: 'enhanced_fire_stone',
    name: 'Stone Ígnea Superior',
    result: { id: 'stone_fire', qty: 1 },
    ingredients: [
      { id: 'stone_fire_fragment', qty: 50 },
      { id: 'crystal', qty: 10, isCurrency: true }
    ],
    desc: 'Usa fragmentos ígneos para criar uma Stone Ígnea completa.'
  },
  {
    id: 'fragment_fire',
    name: 'Fragmentar Stone Ígnea',
    result: { id: 'stone_fire_fragment', qty: 40 },
    ingredients: [
      { id: 'stone_fire', qty: 1 }
    ],
    desc: 'Quebra uma Stone Ígnea em fragmentos úteis.'
  },
  {
    id: 'enhanced_grass_stone',
    name: 'Stone Verdejante Superior',
    result: { id: 'stone_grass', qty: 1 },
    ingredients: [
      { id: 'stone_grass_fragment', qty: 50 },
      { id: 'crystal', qty: 10, isCurrency: true }
    ],
    desc: 'Usa fragmentos verdejantes para criar uma Stone Verdejante completa.'
  },
  {
    id: 'fragment_grass',
    name: 'Fragmentar Stone Verdejante',
    result: { id: 'stone_grass_fragment', qty: 40 },
    ingredients: [
      { id: 'stone_grass', qty: 1 }
    ],
    desc: 'Quebra uma Stone Verdejante em fragmentos úteis.'
  }
];

export const CraftWindowContent: React.FC<CraftingSystemProps> = ({ items, bank, onCraft }) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState(RECIPES[0].id);

  const selectedRecipe = useMemo(() => 
    RECIPES.find(r => r.id === selectedRecipeId) || RECIPES[0]
  , [selectedRecipeId]);

  const canCraft = useMemo(() => {
    return selectedRecipe.ingredients.every(ing => {
      if (ing.isCurrency) {
        if (ing.id === 'crystal') return bank.crystals >= ing.qty;
        if (ing.id === 'gold') return bank.gold >= ing.qty;
        return false;
      }
      return (items[ing.id] || 0) >= ing.qty;
    });
  }, [selectedRecipe, items, bank]);

  return (
    <div className="flex flex-col gap-4 font-pixel">
      {/* Recipe List */}
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
        {RECIPES.map(recipe => (
          <button
            key={recipe.id}
            onClick={() => setSelectedRecipeId(recipe.id)}
            className={`flex items-center gap-2 p-2 rounded border-2 text-left transition-all ${
              selectedRecipeId === recipe.id 
                ? 'border-[#f5cf6b] bg-[#4A3728] shadow-[0_2px_0_0_#1A0F08]' 
                : 'border-[#1A0F08] bg-[#2D1B0E] hover:bg-[#3E2A1C]'
            }`}
          >
            <ItemPixelIcon itemId={recipe.result.id} size={24} />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] truncate leading-tight">{recipe.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Crafting Area */}
      <div className="flex flex-col gap-3 p-3 rounded-lg bg-[#1A0F08]/40 border border-[#4A3728]">
        <div className="text-center">
          <p className="text-[10px] text-[#A8A0B8] uppercase tracking-widest mb-2">Ingredientes Necessários</p>
          <div className="flex items-center justify-center gap-4">
            {selectedRecipe.ingredients.map((ing, i) => {
              const has = ing.isCurrency 
                ? (ing.id === 'crystal' ? bank.crystals : bank.gold)
                : (items[ing.id] || 0);
              const enough = has >= ing.qty;
              
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`relative p-2 rounded-md border-2 ${enough ? 'border-green-800 bg-green-950/30' : 'border-red-900 bg-red-950/30'}`}>
                    {ing.isCurrency ? (
                      <div className="w-8 h-8 flex items-center justify-center text-lg">
                        {ing.id === 'crystal' ? '💎' : '💰'}
                      </div>
                    ) : (
                      <ItemPixelIcon itemId={ing.id} size={32} />
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-[#1A0F08] text-[8px] px-1 rounded border border-[#4A3728]">
                      {ing.qty}
                    </div>
                  </div>
                  <span className={`text-[8px] ${enough ? 'text-green-400' : 'text-red-400'}`}>
                    {has}/{ing.qty}
                  </span>
                </div>
              );
            })}

            <ArrowRight className="text-[#f5cf6b] animate-pulse" size={20} />

            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-md border-2 border-[#f5cf6b] bg-[#f5cf6b]/10 shadow-[0_0_10px_rgba(245,207,107,0.3)]">
                <ItemPixelIcon itemId={selectedRecipe.result.id} size={32} />
                <div className="absolute -bottom-1 -right-1 bg-[#1A0F08] text-[8px] px-1 rounded border border-[#4A3728]">
                  x{selectedRecipe.result.qty}
                </div>
              </div>
              <span className="text-[8px] text-[#f5cf6b]">Resultado</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#4A3728] pt-2">
          <p className="text-[9px] text-[#A8A0B8] mb-3 leading-relaxed">{selectedRecipe.desc}</p>
          <button
            disabled={!canCraft}
            onClick={() => onCraft(selectedRecipe.id)}
            className={`w-full py-2 rounded border-b-4 font-bold flex items-center justify-center gap-2 transition-all ${
              canCraft 
                ? 'bg-[#5ec26a] border-[#2d6634] text-[#0b0510] active:border-b-0 active:translate-y-[2px]' 
                : 'bg-[#4A3728] border-[#1A0F08] text-[#8a7a9c] cursor-not-allowed'
            }`}
          >
            <Hammer size={16} />
            CRIAR ITEM
          </button>
        </div>
      </div>
    </div>
  );
};
