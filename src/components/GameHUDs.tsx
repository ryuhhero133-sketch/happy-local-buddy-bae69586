
import React from 'react';

export function ActiveBuffsHUD({ buffs }: { buffs: any }) {
  if (!buffs) return null;
  const active = [];
  if (buffs.xp > 0) active.push({ id: 'xp', label: 'XP', icon: '✨', color: '#f5cf6b' });
  if (buffs.drop > 0) active.push({ id: 'drop', label: 'DROP', icon: '💎', color: '#6bd4ff' });
  if (buffs.atk > 0) active.push({ id: 'atk', label: 'ATK', icon: '⚔️', color: '#ff5c5c' });
  if (buffs.def > 0) active.push({ id: 'def', label: 'DEF', icon: '🛡️', color: '#5ec26a' });

  if (active.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {active.map(b => (
        <div key={b.id} style={{
          background: 'rgba(11,5,16,0.85)',
          border: `1px solid ${b.color}`,
          borderRadius: 8,
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          fontWeight: 800,
          color: b.color,
          boxShadow: `0 0 10px ${b.color}33`
        }}>
          <span>{b.icon}</span>
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

export function TrainerProfileHUD({ identity, trainerLevel, trainerXp, xpNext, onOpenAdmin }: any) {
  const pct = Math.min(100, (trainerXp / (xpNext || 1)) * 100);
  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a0f26 0%, #0b0510 100%)',
      border: '1px solid rgba(245, 207, 107, 0.3)',
      borderRadius: 12,
      padding: '12px',
      width: '100%',
      pointerEvents: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 6, 
            background: 'linear-gradient(135deg, #ffd94d 0%, #b8862a 100%)',
            display: 'grid', placeItems: 'center', fontSize: 16,
            border: '1px solid #fff4d0'
          }}>👤</div>
          <span style={{ fontWeight: 900, color: '#fff', fontSize: 12, letterSpacing: 0.5 }}>{identity?.name?.toUpperCase() || 'TREINADOR'}</span>
        </div>
        <div style={{ background: '#f5cf6b', color: '#0b0510', padding: '2px 8px', borderRadius: 4, fontWeight: 900, fontSize: 10 }}>
          LV.{trainerLevel}
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ffd94d, #f5cf6b)', transition: 'width 0.3s' }} />
      </div>
      {identity?.isAdmin && (
        <button onClick={onOpenAdmin} style={{
          background: 'rgba(245,207,107,0.1)', border: '1px solid rgba(245,207,107,0.3)',
          borderRadius: 6, color: '#f5cf6b', fontSize: 9, padding: '6px', cursor: 'pointer',
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1
        }}>Painel Admin</button>
      )}
    </div>
  );
}

export function TeamPanelHUD({ team, leaderHp, calcIdleMaxHp, onOpenPokemon }: any) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a0f26 0%, #0b0510 100%)',
      border: '1px solid rgba(245, 207, 107, 0.3)',
      borderRadius: 12,
      padding: '12px',
      width: '100%',
      pointerEvents: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 900, color: '#f5cf6b', fontSize: 10, letterSpacing: 1.5 }}>SUA EQUIPE</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {team.slice(0, 6).map((p: any, i: number) => {
          const max = calcIdleMaxHp(p);
          const cur = i === 0 ? leaderHp : p.hp ?? max;
          const pct = Math.max(0, Math.min(100, (cur / max) * 100));
          return (
            <div 
              key={p.uid || p.id} 
              onClick={() => onOpenPokemon(p)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 10, 
                padding: '6px', background: 'rgba(255,255,255,0.03)', 
                borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div style={{ 
                width: 32, height: 32, background: 'rgba(0,0,0,0.3)', 
                borderRadius: 6, display: 'grid', placeItems: 'center',
                border: '1px solid rgba(245,207,107,0.2)'
              }}>
                <span style={{ fontSize: 18 }}>🐾</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 900 }}>
                  <span style={{ color: '#fff', letterSpacing: 0.5 }}>{p.species.toUpperCase()}</span>
                  <span style={{ color: '#f5cf6b' }}>LV.{p.level}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct > 50 ? '#5ec26a' : pct > 20 ? '#f5cf6b' : '#ff5c5c', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
