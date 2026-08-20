import React from 'react';
import { Target, Zap, Shield, Sparkles, Sword, BookOpen, Star } from 'lucide-react';

interface ImprovementsWindowContentProps {
  stats: {
    attack: number;
    speed: number;
    synergy: number;
    resistance: number;
    mastery: number;
  };
  items: Record<string, number>;
  onUpgrade: (key: any) => void;
  stonesMap: Record<string, { stone: string, color: string, label: string, desc: string, fail: number }>;
  stoneImgs: Record<string, string>;
}

export const ImprovementsWindowContent: React.FC<ImprovementsWindowContentProps> = ({
  stats,
  items,
  onUpgrade,
  stonesMap,
  stoneImgs
}) => {
  const radarPoints = [
    { label: stonesMap.attack.label, val: 20 + (stats.attack ?? 0) * 8, color: stonesMap.attack.color, key: "attack" },
    { label: stonesMap.speed.label, val: 20 + (stats.speed ?? 0) * 8, color: stonesMap.speed.color, key: "speed" },
    { label: stonesMap.synergy.label, val: 20 + (stats.synergy ?? 0) * 8, color: stonesMap.synergy.color, key: "synergy" },
    { label: stonesMap.resistance.label, val: 20 + (stats.resistance ?? 0) * 8, color: stonesMap.resistance.color, key: "resistance" },
    { label: stonesMap.mastery.label, val: 20 + (stats.mastery ?? 0) * 8, color: stonesMap.mastery.color, key: "mastery" },
  ];

  const getPolyPoints = () => {
    return radarPoints.map((p, i) => {
      const angle = (i * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
      const r = (Math.min(100, p.val) / 100) * 80;
      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
    }).join(" ");
  };

  return (
    <div className="flex flex-col gap-4 font-pixel text-[#4a3010]">
      <div className="flex gap-4 bg-[#f5e6c8] border-2 border-[#b8862a] rounded-lg p-4 shadow-sm">
        {/* Radar Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg width="192" height="192" viewBox="0 0 200 200" className="drop-shadow-md">
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(184,134,42,0.1)" strokeWidth="1" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(184,134,42,0.1)" strokeWidth="1" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(184,134,42,0.1)" strokeWidth="1" />
            {radarPoints.map((_, i) => {
              const angle = (i * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
              return <line key={i} x1="100" y1="100" x2={100 + 80 * Math.cos(angle)} y2={100 + 80 * Math.sin(angle)} stroke="rgba(184,134,42,0.2)" strokeWidth="1" />;
            })}
            <polygon points={getPolyPoints()} fill="rgba(184,134,42,0.3)" stroke="#b8862a" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <div className="absolute inset-0 pointer-events-none">
            {radarPoints.map((p, i) => {
              const angle = (i * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
              return (
                <div key={i} style={{
                  position: "absolute",
                  left: 100 + 92 * Math.cos(angle),
                  top: 100 + 92 * Math.sin(angle),
                  transform: "translate(-50%, -50%)",
                  fontSize: '8px', fontWeight: 900, color: p.color, textAlign: 'center'
                }}>{p.label}</div>
              );
            })}
          </div>
        </div>

        {/* Stats Info */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 border-b border-[#b8862a]/30 pb-1 mb-1">
            <BookOpen size={16} className="text-[#b8862a]" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Anatomia da Conta</h3>
          </div>
          <p className="text-[10px] text-[#8b6a30] leading-tight italic">
            Melhore atributos permanentes usando Stones Elementais e Livros Sagrados.
          </p>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
            {(Object.entries(stonesMap) as [keyof typeof stats, any][]).map(([key, cfg]) => {
              const level = (stats as any)[key] || 0;
              const stoneCost = 50 + level * 25;
              const bookCost = 1 + Math.floor(level / 2);
              const hasStones = (items[cfg.stone] || 0) >= stoneCost;
              const hasBooks = (items.book_atk || 0) >= bookCost && (items.book_def || 0) >= bookCost;
              const canUpgrade = hasStones && hasBooks;

              return (
                <div key={key} className="bg-[#fff8e5] border border-[#b8862a]/40 rounded-lg p-2 flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 bg-[#f5e6c8] border border-[#b8862a]/30 rounded flex items-center justify-center flex-shrink-0">
                    <img src={stoneImgs[cfg.stone]} alt="" className="w-8 h-8 image-pixelated" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold truncate pr-1" style={{ color: cfg.color }}>{cfg.label} <span className="text-[#8b6a30] font-normal">Lv.{level}</span></span>
                      <span className="text-[8px] text-[#ff5252] font-bold flex-shrink-0">Falha: {cfg.fail}%</span>
                    </div>
                    <p className="text-[9px] text-[#4a3010]/80 leading-tight mb-2 truncate">{cfg.desc}</p>
                    <button
                      onClick={() => onUpgrade(key)}
                      className={`w-full py-1 rounded text-[9px] font-bold transition-all ${
                        canUpgrade 
                          ? 'bg-[#b8862a] text-white hover:bg-[#8b6a30]' 
                          : 'bg-[#d6c4a8] text-[#8b6a30] cursor-not-allowed'
                      }`}
                    >
                      MELHORAR ({stoneCost} St. + {bookCost} Liv.)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bonus Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#fff8e5] border-2 border-[#ff5252]/40 rounded-lg p-2 flex items-center gap-2 shadow-sm">
          <Sword size={14} className="text-[#ff5252]" />
          <div className="flex flex-col">
            <span className="text-[8px] text-[#8b6a30]">ATAQUE</span>
            <span className="text-[10px] font-bold text-[#ff5252]">+{Math.round((stats.attack || 0) * 5)}%</span>
          </div>
        </div>
        <div className="bg-[#fff8e5] border-2 border-[#4a7bff]/40 rounded-lg p-2 flex items-center gap-2 shadow-sm">
          <Shield size={14} className="text-[#4a7bff]" />
          <div className="flex flex-col">
            <span className="text-[8px] text-[#8b6a30]">DEFESA</span>
            <span className="text-[10px] font-bold text-[#4a7bff]">+{Math.round((stats.resistance || 0) * 3)}%</span>
          </div>
        </div>
        <div className="bg-[#fff8e5] border-2 border-[#5ec26a]/40 rounded-lg p-2 flex items-center gap-2 shadow-sm">
          <Star size={14} className="text-[#5ec26a]" />
          <div className="flex flex-col">
            <span className="text-[8px] text-[#8b6a30]">MAESTRIA</span>
            <span className="text-[10px] font-bold text-[#5ec26a]">+{Math.round((stats.mastery || 0) * 1.5)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
