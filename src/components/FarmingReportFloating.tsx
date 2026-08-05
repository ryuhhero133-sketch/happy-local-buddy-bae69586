import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, TrendingUp, Clock, Swords, Coins, Diamond, X } from 'lucide-react';

interface FarmingReportProps {
  gold: number;
  crystals: number;
  redShards: number;
  kills: number;
  activeTime: number; // ms
  trainerLevel: number;
}

export const FarmingReportFloating: React.FC<FarmingReportProps> = ({
  gold,
  crystals,
  redShards,
  kills,
  activeTime,
  trainerLevel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Format time in HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const perHour = (val: number) => {
    if (activeTime <= 0) return 0;
    const hours = activeTime / 3600000;
    return Math.floor(val / hours);
  };

  return (
    <>
      {/* Botão Flutuante (Cartinha) */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          zIndex: 10000,
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #6b46c1, #44337a)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.2)',
          cursor: 'pointer',
          border: '2px solid #a78bfa',
        }}
      >
        <FileText color="#fff" size={24} />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: '12px',
            height: '12px',
            background: '#ef4444',
            borderRadius: '50%',
            border: '2px solid #fff'
          }}
        />
      </motion.div>

      {/* Relatório */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            style={{
              position: 'fixed',
              bottom: '160px',
              right: '20px',
              width: '280px',
              background: 'rgba(15, 10, 25, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #f5cf6b',
              borderRadius: '16px',
              padding: '16px',
              zIndex: 10001,
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              color: '#fff',
              fontFamily: 'sans-serif',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #44337a', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#f5cf6b" />
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#f5cf6b', letterSpacing: '1px' }}>RELATÓRIO DE SESSÃO</span>
              </div>
              <X size={18} onClick={() => setIsOpen(false)} style={{ cursor: 'pointer', opacity: 0.7 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <StatRow icon={<Clock size={14} color="#a78bfa" />} label="Tempo Ativo" value={formatTime(activeTime)} />
              <StatRow icon={<Swords size={14} color="#ef4444" />} label="Derrotados" value={kills.toLocaleString()} subValue={`${perHour(kills)}/h`} />
              <StatRow icon={<Coins size={14} color="#f4c430" />} label="Ouro Ganho" value={`+${gold.toLocaleString()}`} subValue={`${perHour(gold)}/h`} />
              <StatRow icon={<Diamond size={14} color="#6bd4ff" />} label="Cristais" value={`+${crystals.toLocaleString()}`} />
              <StatRow icon={<span style={{fontSize: '14px'}}>🔻</span>} label="Fragmentos" value={`+${redShards.toLocaleString()}`} color="#ff4d4d" />
            </div>

            <div style={{ marginTop: '16px', background: 'rgba(245, 207, 107, 0.1)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#f5cf6b', opacity: 0.8 }}>Eficiência da Sessão</span>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#f5cf6b' }}>
                {perHour(gold + (crystals * 100)).toLocaleString()} pts/h
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const StatRow = ({ icon, label, value, subValue, color = '#fff' }: { icon: React.ReactNode, label: string, value: string, subValue?: string, color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon}
      <span style={{ fontSize: '12px', opacity: 0.8 }}>{label}</span>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '13px', fontWeight: 800, color }}>{value}</div>
      {subValue && <div style={{ fontSize: '9px', opacity: 0.5 }}>{subValue}</div>}
    </div>
  </div>
);
