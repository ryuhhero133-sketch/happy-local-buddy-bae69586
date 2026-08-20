import React, { useState, useMemo } from 'react';
import { Hammer, ArrowRight, Sparkles, Gem, Scroll } from 'lucide-react';
import { ItemPixelIcon } from './ItemPixelIcon';

interface CraftingSystemProps {
  items: Record<string, number>;
  bank: { gold: number; crystals: number };
  onCraft: (recipeId: string) => void;
}

export const RECIPES = [
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

const STONES_LIST = [
  { id: 'stone_fire', name: 'Ígnea', frag: 'stone_fire_fragment' },
  { id: 'stone_grass', name: 'Verdejante', frag: 'stone_grass_fragment' },
  { id: 'stone_water', name: 'Aquática', frag: 'stone_water_fragment' },
  { id: 'stone_electric', name: 'Elétrica', frag: 'stone_electric_fragment' },
  { id: 'stone_dark', name: 'Sombria', frag: 'stone_dark_fragment' },
  { id: 'stone_dragon', name: 'Dragão', frag: 'stone_dragon_fragment' },
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
    <div className="flex flex-col gap-4 font-pixel text-[#4a3010]">
      {/* Stones Inventory Section - Mini-inventory */}
      <div className="bg-[#f5e6c8] border-2 border-[#b8862a] rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2 border-b border-[#b8862a]/30 pb-1">
          <Gem size={14} className="text-[#b8862a]" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider">Estoque de Materiais</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STONES_LIST.map(s => (
            <div key={s.id} className="flex flex-col gap-1 bg-[#fff8e5] border border-[#b8862a]/40 rounded p-1">
              <div className="flex items-center justify-between gap-1">
                <ItemPixelIcon id={s.id} size={16} />
                <span className="text-[9px] font-bold">x{items[s.id] || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-1 opacity-80">
                <ItemPixelIcon id={s.frag} size={12} />
                <span className="text-[8px]">x{items[s.frag] || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Recipe List */}
        <div className="w-1/3 flex flex-col gap-2">
           <div className="flex items-center gap-2 px-1">
             <Scroll size={12} />
             <span className="text-[9px] font-bold uppercase">Receitas</span>
           </div>
           <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {RECIPES.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipeId(recipe.id)}
                className={`flex items-center gap-2 p-2 rounded border-2 text-left transition-all ${
                  selectedRecipeId === recipe.id 
                    ? 'border-[#b8862a] bg-[#fff8e5] shadow-[0_2px_0_0_#b8862a55]' 
                    : 'border-transparent bg-[#f5e6c8]/50 hover:bg-[#f5e6c8]'
                }`}
              >
                <ItemPixelIcon id={recipe.result.id} size={20} />
                <span className="text-[9px] truncate leading-tight font-bold">{recipe.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Crafting Area */}
        <div className="flex-1 flex flex-col gap-3 p-3 rounded-lg bg-[#fff8e5] border-2 border-[#b8862a] shadow-inner">
          <div className="text-center">
            <p className="text-[9px] text-[#8b6a30] uppercase font-bold mb-3">Requisitos da Forja</p>
            <div className="flex items-center justify-center gap-4">
              {selectedRecipe.ingredients.map((ing, i) => {
                const has = ing.isCurrency 
                  ? (ing.id === 'crystal' ? bank.crystals : bank.gold)
                  : (items[ing.id] || 0);
                const enough = has >= ing.qty;
                
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`relative p-2 rounded-md border-2 ${enough ? 'border-[#2d6634] bg-[#5ec26a]/10' : 'border-[#8a1a1a] bg-[#ff7a7a]/10'}`}>
                      {ing.isCurrency ? (
                        <div className="w-8 h-8 flex items-center justify-center text-lg">
                          {ing.id === 'crystal' ? '💎' : '💰'}
                        </div>
                      ) : (
                        <ItemPixelIcon id={ing.id} size={32} />
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-[#4a3010] text-[#fff] text-[8px] px-1 rounded border border-[#b8862a]">
                        {ing.qty}
                      </div>
                    </div>
                    <span className={`text-[8px] font-bold ${enough ? 'text-[#2d6634]' : 'text-[#8a1a1a]'}`}>
                      {Math.floor(has)}/{ing.qty}
                    </span>
                  </div>
                );
              })}

              <ArrowRight className="text-[#b8862a] animate-pulse" size={16} />

              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-md border-2 border-[#b8862a] bg-[#f5cf6b]/10 shadow-[0_0_10px_rgba(184,134,42,0.2)]">
                  <ItemPixelIcon id={selectedRecipe.result.id} size={32} />
                  <div className="absolute -bottom-1 -right-1 bg-[#b8862a] text-[#fff] text-[8px] px-1 rounded">
                    x{selectedRecipe.result.qty}
                  </div>
                </div>
                <span className="text-[8px] text-[#b8862a] font-bold">Resultado</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#b8862a]/20 pt-2 mt-auto">
            <p className="text-[9px] text-[#8b6a30] mb-3 leading-relaxed italic">{selectedRecipe.desc}</p>
            <button
              disabled={!canCraft}
              onClick={() => onCraft(selectedRecipe.id)}
              className={`w-full py-2 rounded border-b-4 font-bold flex items-center justify-center gap-2 transition-all ${
                canCraft 
                  ? 'bg-[#b8862a] border-[#8b6a30] text-[#fff] active:border-b-0 active:translate-y-[2px] shadow-lg' 
                  : 'bg-[#d6c4a8] border-[#a89678] text-[#8b6a30] cursor-not-allowed'
              }`}
            >
              <Hammer size={14} />
              FORJAR ITEM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
