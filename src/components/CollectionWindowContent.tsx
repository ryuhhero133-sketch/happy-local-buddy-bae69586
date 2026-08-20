import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Trash2, ArrowUpCircle } from 'lucide-react';
import type { PetInstance, Rarity, CollectionEntry } from '@/game/systems';
import { TIER_COLOR } from '@/game/traits';

interface CollectionWindowContentProps {
  collection: CollectionEntry[];

  maxCollection: number;
  caughtCount: number;
  onSelectPokemon: (uid: string) => void;
  onRetireFromTeam?: (uid: string) => void;
  teamUids: Set<string>;
}

export const CollectionWindowContent: React.FC<CollectionWindowContentProps> = ({
  collection,
  maxCollection,
  caughtCount,
  onSelectPokemon,
  onRetireFromTeam,
  teamUids
}) => {
  const [filterName, setFilterName] = useState('');
  const [filterRarity, setFilterRarity] = useState<'all' | Rarity>('all');
  const [sortMode, setSortMode] = useState<'recent' | 'level_desc' | 'level_asc' | 'rarity' | 'name'>('recent');

  const filtered = useMemo(() => {
    let list = [...collection];

    if (filterName) {
      const search = filterName.toLowerCase();
      list = list.filter(p => p.species.toLowerCase().includes(search));
    }

    if (filterRarity !== 'all') {
      list = list.filter(p => p.rarity === filterRarity);
    }

    list.sort((a, b) => {
      if (sortMode === 'level_desc') return (b.level || 0) - (a.level || 0);
      if (sortMode === 'level_asc') return (a.level || 0) - (b.level || 0);
      if (sortMode === 'rarity') {
        const tiers: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, mythic_shiny: 6 };
        return (tiers[b.rarity] || 0) - (tiers[a.rarity] || 0);
      }
      if (sortMode === 'name') return a.species.localeCompare(b.species);
      return 0; // 'recent' mantido pela ordem original (que costuma ser push no array)
    });

    return list;
  }, [collection, filterName, filterRarity, sortMode]);

  return (
    <div className="flex flex-col gap-4 h-full font-pixel text-[#eadfe8]">
      {/* HUD Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#1A0F26] border border-[#f5cf6b44] p-2 rounded-lg text-center">
          <div className="text-[8px] text-[#A8A0B8] uppercase">Espaço</div>
          <div className={`text-xs font-bold ${collection.length >= maxCollection ? 'text-red-400' : 'text-[#f5cf6b]'}`}>
            {collection.length} / {maxCollection}
          </div>
        </div>
        <div className="bg-[#1A0F26] border border-[#a066ff44] p-2 rounded-lg text-center">
          <div className="text-[8px] text-[#A8A0B8] uppercase">Descobertas</div>
          <div className="text-xs font-bold text-[#a066ff]">{caughtCount} Espécies</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 p-2 bg-[#0b0510]/50 border border-[#3a2a4a] rounded-lg">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8a7a9c]" size={12} />
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Buscar Pokémon..."
            className="w-full bg-[#1A0F26] border border-[#3a2a4a] rounded-md pl-8 pr-2 py-1 text-[10px] focus:outline-none focus:border-[#f5cf6b] transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as any)}
            className="bg-[#1A0F26] border border-[#3a2a4a] rounded-md px-2 py-1 text-[9px] cursor-pointer hover:border-[#f5cf6b]"
          >
            <option value="all">Todas Raridades</option>
            <option value="common">Comum</option>
            <option value="uncommon">Incomum</option>
            <option value="rare">Raro</option>
            <option value="epic">Épico</option>
            <option value="legendary">Lendário</option>
            <option value="mythic">Mítico</option>
            <option value="mythic_shiny">Mítico Brilhante</option>
          </select>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="bg-[#1A0F26] border border-[#3a2a4a] rounded-md px-2 py-1 text-[9px] cursor-pointer hover:border-[#f5cf6b]"
          >
            <option value="recent">Recentes</option>
            <option value="level_desc">Nível ↓</option>
            <option value="level_asc">Nível ↑</option>
            <option value="rarity">Raridade</option>
            <option value="name">Nome</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[250px]">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#8a7a9c] text-xs italic opacity-50">
            Nenhum Pokémon encontrado
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {filtered.map((p) => {
              const inTeam = teamUids.has(p.uid);
              const color = (TIER_COLOR as any)[p.rarity] || '#f5cf6b';
              return (
                <button
                  key={p.uid}
                  onClick={() => onSelectPokemon(p.uid)}
                  className={`relative group flex flex-col items-center p-2 rounded-lg border-2 bg-[#1A0F26] transition-all hover:scale-105 ${
                    inTeam ? 'border-[#5ec26a] shadow-[0_0_8px_#5ec26a44]' : 'border-[#3a2a4a] hover:border-[#eadfe844]'
                  }`}
                >
                  {/* Portrait Placeholder - Assuming GIF mapping or similar is handled by parent/globals */}
                  <div className="w-full aspect-square bg-[#0b0510] rounded border border-[#3a2a4a] mb-1 overflow-hidden flex items-center justify-center">
                    <span className="text-[10px] opacity-20">{p.species.charAt(0).toUpperCase()}</span>
                  </div>
                  
                  <div className="text-[7px] font-bold truncate w-full text-center" style={{ color }}>
                    {p.species.toUpperCase()}
                  </div>
                  <div className="text-[8px] text-[#8a7a9c]">Lv.{p.level}</div>
                  
                  {inTeam && (
                    <div className="absolute -top-1 -right-1 bg-[#5ec26a] text-[#0b0510] text-[6px] font-black px-1 rounded shadow-sm">
                      TIME
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
