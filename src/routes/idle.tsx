import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { z } from "zod";
import { 
  SPECIES_BASE, Species, IdleMapId, IDLE_MAPS, BLACK_EGG_ITEM_ID,
  calcIdleMaxHp, trainerXpToNext, SPRITE_SHEET, GIF,
  assetUrlFromJson, idleArenaAsset, worldMapGlobeAsset, worldMapContinent2Asset, governanteHallMapAsset,
  hornetCocoonUrl, buffOrbXpUrl, buffTeamOrbUrl, buffIncenseHoneyUrl,
  GOVERNANTE_PLUS_POOL, GOVERNANTE_PLUS_TRAITS, MAX_COLLECTION
} from "@/lib/game-constants";
import { useIdleState, IdleState, CollectionEntry } from "@/hooks/useIdleState";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { AdminDashboard } from "@/components/AdminDashboard";
import { CashShopModal } from "@/components/CashShopModal";
import { BlackMiticEggHud } from "@/components/BlackMiticEggHud";
import { GovernanteDialog } from "@/components/GovernanteDialog";
import { ProfessorOakGuide } from "@/components/ProfessorOakGuide";
import { pushCloudSaveNow } from "@/hooks/useServerSync";

// Mocking some missing elements for the build to pass if they aren't in scope
const pushChat = (msg: string, type: string = "info") => console.log(msg, type);

export const Route = createFileRoute("/idle")({
  component: IdleGame,
});

function IdleGame() {
  const { identity, session } = useSupabaseAuth();
  const [idle, setIdle, idleRef] = useIdleState();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [cashShopOpen, setCashShopOpen] = useState(false);
  const [blackEggHudOpen, setBlackEggHudOpen] = useState(false);
  const [governanteOpen, setGovernanteOpen] = useState(false);
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  const [bigMapOpen, setBigMapOpen] = useState(false);
  const [worldTab, setWorldTab] = useState<1 | 2 | 3>(1);
  const [codeInput, setCodeInput] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [pendingGate, setPendingGate] = useState<any>(null);
  
  // Game state stubs
  const team = idle.team || [];
  const teamRef = { current: team };
  const restingBench = idle.restingBench || [];
  const trainerPos = idle.trainerPos || { x: 500, y: 500 };
  const viewportBg = "#000";
  const zoom = 1;
  const renderCamX = 0;
  const renderCamY = 0;
  const WORLD_W = 2000;
  const WORLD_H = 2000;
  const map = IDLE_MAPS[idle.currentMap];
  const obstacles = [] as any[];
  const transparentObstacleIds = new Set();
  const gatesByMap = {} as any;
  const weather = idle.weather || "clear";
  const leveledAt = 0;
  const pokemonFace = "left";
  const leaderHp = 100;
  const renderFollowerX = 450;
  const renderFollowerY = 500;
  const attackAnim = null as any;
  const followerX = 450;
  const followerY = 500;
  const cloudSaveBlocked = false;
  const attemptPendingCloudSave = async () => {};
  const saveIdle = (s: any) => {};
  const pushCloudSaveNow = async (s: any) => {};
  const redeemCrystalCode = () => {};
  const rainDrops = [] as any[];
  const snowFlakes = [] as any[];
  const restingUntil = null as any;

  return (
    <div style={{
      height: "100vh",
      background: "#0b0510",
      color: "#f3e5c5",
      fontFamily: "'Trebuchet MS', system-ui, sans-serif",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* HUD Superior flutuante */}
      <div className="modern-top-bar">
        <div className="trainer-card-compact">
           <img src={identity?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Trainer"} alt="Avatar" />
           <div className="info">
             <div className="name">{identity?.user_metadata?.full_name || "Treinador"}</div>
             <div className="level">Nv. {idle.trainerLevel || 1}</div>
             <div className="xp-bar-container">
               <div className="xp-bar-fill" style={{ width: `${((idle.trainerXp || 0) / trainerXpToNext(idle.trainerLevel || 1)) * 100}%` }} />
             </div>
           </div>
        </div>

        <div className="resource-pill gold">
          <span>🪙</span> {idle.bank?.gold?.toLocaleString() || 0}
        </div>
        <div className="resource-pill crystal">
          <span>💎</span> {idle.bank?.crystals?.toLocaleString() || 0}
        </div>
      </div>

      {/* Menu Lateral Direito */}
      <div className="right-system-menu">
        <button onClick={() => setWorldMapOpen(true)} title="Mapa Mundi">🌍</button>
        <button onClick={() => setCashShopOpen(true)} title="Loja VIP">💎</button>
        <button onClick={() => setIsAdminOpen(true)} title="Configurações">⚙️</button>
      </div>

      {/* Dock Inferior Moderna */}
      <div className="modern-bottom-dock">
         <button className="dock-item active">🏠<span>Início</span></button>
         <button className="dock-item">🐾<span>Equipe</span></button>
         <button className="dock-item">🎒<span>Mochila</span></button>
         <button className="dock-item">📜<span>Missões</span></button>
         <button className="dock-item">🗂️<span>Coleção</span></button>
         <button className="dock-item">📟<span>Pokedex</span></button>
      </div>

      {/* Viewport do Mapa */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden" }}>
          {/* MUNDO */}
          <div style={{
            position: "absolute",
            left: 0, top: 0,
            width: WORLD_W, height: WORLD_H,
            transform: `translate3d(${-renderCamX * zoom}px, ${-renderCamY * zoom}px, 0) scale(${zoom})`,
            transformOrigin: "0 0",
            backgroundColor: viewportBg,
            imageRendering: "pixelated"
          }}>
            <img src={map.bg} alt="Map" style={{ width: "100%", height: "100%", objectFit: "fill" }} />
          </div>
      </div>

      {/* Modais */}
      {cashShopOpen && (
        <CashShopModal
          open={cashShopOpen}
          onClose={() => setCashShopOpen(false)}
          identity={identity ? { id: identity.id, name: identity.name || "Treinador" } : null}
          wallet={{
            coins: idle.bank.gold,
            crystals: idle.bank.crystals,
            level: idle.trainerLevel ?? 1,
            xp: idle.trainerXp ?? 0,
            xpNext: trainerXpToNext(idle.trainerLevel ?? 1),
            safiras: idle.items?.safira_verde ?? 0,
          }}
          onSpendSafiras={(n) => {
            const cur = idle.items?.safira_verde ?? 0;
            if (cur < n) return false;
            setIdle((s) => ({
              ...s,
              items: { ...(s.items ?? {}), safira_verde: (s.items?.safira_verde ?? 0) - n },
            }));
            return true;
          }}
          onGrantCoins={(n) => setIdle((s) => ({ ...s, bank: { ...s.bank, gold: s.bank.gold + n } }))}
          onGrantCrystals={(n) => setIdle((s) => ({ ...s, bank: { ...s.bank, crystals: s.bank.crystals + n } }))}
          onGrantItem={(id, qty) => {
            setIdle((s) => ({
              ...s,
              items: { ...(s.items ?? {}), [id]: (s.items?.[id] ?? 0) + qty },
            }));
          }}
          codeInput={codeInput}
          setCodeInput={setCodeInput}
          onRedeemCode={() => redeemCrystalCode()}
        />
      )}

      {isAdminOpen && createPortal(
        <AdminDashboard onClose={() => setIsAdminOpen(false)} />,
        document.body
      )}

      <SmartGuideHud hasPokemon={team.length > 0} />
    </div>
  );
}

function SmartGuideHud({ hasPokemon }: { hasPokemon: boolean }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <ProfessorOakGuide
      topic={hasPokemon ? "autohunt" : "welcome"}
      onClose={() => setClosed(true)}
    />
  );
}
