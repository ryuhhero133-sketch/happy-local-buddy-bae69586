import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProfessorOakGuide, type GuideTopic } from "@/components/ProfessorOakGuide";
import { assetUrlFromJson } from "@/lib/assetUrl";
import trainerBodyAsset from "@/assets/trainer_body_anatomy.png.asset.json";
import { AuthGate } from "@/components/AuthGate";
import { Toaster } from "sonner";
import { type Species, type Rarity } from "@/game/systems";

export type CollectionEntry = {
  uid: string;
  species: Species;
  level: number;
  xp?: number;
  rarity: Rarity;
  traits?: string[];
  capturedAt: number;
  statBoost?: number;
};

export const Route = createFileRoute("/idle")({
  component: IdleGame,
});

function IdleGame() {
  const [tab, setTab] = useState("inicio");
  const [activeModals, setActiveModals] = useState<string[]>([]);
  const [guideTopic, setGuideTopic] = useState<GuideTopic | null>("welcome");

  // ESC key listener for closing modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (guideTopic) {
          setGuideTopic(null);
          return;
        }
        setActiveModals(prev => {
          if (prev.length === 0) return prev;
          return prev.slice(0, -1);
        });
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [guideTopic]);

  return (
    <AuthGate>
      <div style={{ padding: 20, color: 'white', background: '#0b0510', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <nav style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {["inicio", "pokemon", "mochila", "melhorias", "loja", "market", "ranked"].map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t)} 
              style={{ 
                padding: '8px 16px', 
                background: tab === t ? '#f5cf6b' : '#2a1638', 
                color: tab === t ? '#000' : '#fff', 
                border: '1px solid #f5cf6b55', 
                borderRadius: 4, 
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}
            >
              {t}
            </button>
          ))}
        </nav>

        <main style={{ position: 'relative', zIndex: 1 }}>
          {tab === "inicio" && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <h1 style={{ color: '#f5cf6b', marginBottom: 20 }}>Ruby M - Idle</h1>
              <p>O jogo está sendo restaurado. Clique nas abas para navegar.</p>
              <div style={{ marginTop: 20 }}>
                <button 
                  onClick={() => setGuideTopic("welcome")}
                  style={{ background: '#f5cf6b', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Falar com Prof. Oak
                </button>
              </div>
            </div>
          )}

          {tab === "melhorias" && (
            <div style={{ background: '#1a0f26', padding: 20, borderRadius: 12, border: '1px solid #f5cf6b33', position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                background: 'radial-gradient(circle at center, #f5cf6b11 0%, transparent 70%)',
                zIndex: 0
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ color: '#f5cf6b', borderBottom: '1px solid #f5cf6b33', paddingBottom: 10 }}>Stellar Anatomy</h2>
                <p style={{ opacity: 0.8 }}>Calibrando a anatomia estelar do seu treinador...</p>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, marginTop: 20 }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={assetUrlFromJson(trainerBodyAsset)} 
                      style={{ height: 350, opacity: 0.6, filter: 'drop-shadow(0 0 20px #f5cf6b33)' }} 
                    />
                    {/* Simplified Stat Points */}
                    <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', color: '#f5cf6b' }}>
                      <strong>ATK</strong>
                    </div>
                    <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', color: '#f5cf6b' }}>
                      <strong>HP</strong>
                    </div>
                    <div style={{ position: 'absolute', top: '50%', left: '-20%', color: '#f5cf6b' }}>
                      <strong>DEF</strong>
                    </div>
                    <div style={{ position: 'absolute', top: '50%', right: '-20%', color: '#f5cf6b' }}>
                      <strong>SPD</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab !== "inicio" && tab !== "melhorias" && (
            <div style={{ background: '#1a0f26', padding: 40, borderRadius: 12, textAlign: 'center', border: '1px solid #2a1638' }}>
              <h2 style={{ color: '#f5cf6b', marginBottom: 10 }}>{tab.toUpperCase()}</h2>
              <p>Conteúdo temporariamente em manutenção.</p>
              { (tab === "market" || tab === "ranked") && (
                <p style={{ color: '#ef4444', fontWeight: 'bold', marginTop: 10 }}>MÓDULO BLOQUEADO ADMINISTRATIVAMENTE</p>
              )}
            </div>
          )}
        </main>

        {guideTopic && (
          <ProfessorOakGuide topic={guideTopic} onClose={() => setGuideTopic(null)} />
        )}

        <Toaster theme="dark" position="top-center" />
      </div>
    </AuthGate>
  );
}
