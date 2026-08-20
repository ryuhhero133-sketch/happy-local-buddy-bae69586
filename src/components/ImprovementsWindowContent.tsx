import React from 'react';
import { Shield, Zap, Swords, Heart, Sparkles } from 'lucide-react';

interface ImprovementsWindowContentProps {
  stats: {
    attack: number;
    speed: number;
    synergy: number;
    resistance: number;
    mastery: number;
  };
  items: Record<string, number>;
  onUpgradeStat: (key: string) => void;
}

export const ImprovementsWindowContent: React.FC<ImprovementsWindowContentProps> = ({
  stats,
  items,
  onUpgradeStat
}) => {
  const radarPoints = [
    { label: 'ATAQUE', val: 20 + (stats.attack || 0) * 8, color: '#ff5252', key: 'attack', icon: Swords },
    { label: 'VELO', val: 20 + (stats.speed || 0) * 8, color: '#ffd94d', key: 'speed', icon: Zap },
    { label: 'SINERG', val: 20 + (stats.synergy || 0) * 8, color: '#c084fc', key: 'synergy', icon: Sparkles },
    { label: 'RESIST', val: 20 + (stats.resistance || 0) * 8, color: '#4a7bff', key: 'resistance', icon: Shield },
    { label: 'MASTER', val: 20 + (stats.mastery || 0) * 8, color: '#5ec26a', key: 'mastery', icon: Heart },
  ];

  const getPolyPoints = () => {
    return radarPoints.map((p, i) => {
      const angle = (i * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
      const r = (Math.min(100, p.val) / 100) * 40;
      return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
    }).join(" ");
  };

  return (
    <div className="flex flex-col gap-4 h-full font-pixel text-[#eadfe8]">
      {/* Radar Chart */}
      <div className="relative aspect-square w-40 mx-auto bg-[#0b0510]/50 rounded-full border border-[#f5cf6b22] p-4">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(245,207,107,0.2)]">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(245,207,107,0.1)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(245,207,107,0.1)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(245,207,107,0.1)" strokeWidth="0.5" />
          {radarPoints.map((_, i) => {
            const angle = (i * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
            return (
              <line 
                key={i} 
                x1="50" y1="50" 
                x2={50 + 40 * Math.cos(angle)} 
                y2={50 + 40 * Math.sin(angle)} 
                stroke="rgba(245,207,107,0.1)" 
                strokeWidth="0.5" 
              />
            );
          })}
          <polygon points={getPolyPoints()} fill="rgba(245,207,107,0.2)" stroke="#f5cf6b" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Upgrades List */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
        {radarPoints.map((p) => {
          const Icon = p.icon;
          const level = (stats as any)[p.key] || 0;
          return (
            <div key={p.key} className="bg-[#1A0F26] border border-[#3a2a4a] p-2 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#0b0510] border flex items-center justify-center" style={{ borderColor: p.color + '44' }}>
                <Icon size={16} style={{ color: p.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold" style={{ color: p.color }}>{p.label}</span>
                  <span className="text-[8px] text-[#8a7a9c]">Nível {level}</span>
                </div>
                <button
                  onClick={() => onUpgradeStat(p.key)}
                  className="w-full py-1 rounded text-[8px] font-bold transition-all bg-[#0b0510] border border-[#3a2a4a] hover:border-[#f5cf6b44] text-[#eadfe8]"
                >
                  MELHORAR ATRIBUTO
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
