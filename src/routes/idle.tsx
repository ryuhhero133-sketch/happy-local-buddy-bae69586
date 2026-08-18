import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FlaskConical, Sparkles } from "lucide-react";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";
import { PokemonStatsCard } from "@/components/PokemonStatsCard";
import { PokemonMarketPanel } from "@/components/PokemonMarketPanel";
import { assetUrlFromJson } from "@/lib/assetUrl";
import trainerBodyAsset from "@/assets/trainer_body_anatomy.png.asset.json";
import iconFragmentCrystal from "@/assets/icon-fragment-crystal.png.asset.json";

export type Species = string;
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "mythic_shiny";
export type CollectionEntry = {
  uid: string;
  species: Species;
  level: number;
  rarity: Rarity;
  capturedAt: number;
};

export const Route = createFileRoute("/idle")({
  component: IdleGame,
});

function IdleGame() {
  const [tab, setTab] = useState("inicio");
  const [idle, setIdle] = useState<any>({});
  const [items, setItems] = useState<any>({});
  const [team, setTeam] = useState<any[]>([]);
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [bank, setBank] = useState({ gold: 0, crystals: 0 });
  const [statsCardPet, setStatsCardPet] = useState(null);
  const [gifMap, setGifMap] = useState({});

  return (
    <div style={{ padding: 20, color: 'white', background: '#0b0510', minHeight: '100vh' }}>
      <nav style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {["inicio", "pokemon", "mochila", "melhorias", "loja"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', background: tab === t ? '#f5cf6b' : '#2a1638', color: tab === t ? '#000' : '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </nav>

      {tab === "melhorias" && (
        <div style={{ background: '#1a0f26', padding: 20, borderRadius: 12, border: '1px solid #f5cf6b33' }}>
          <h2 style={{ color: '#f5cf6b' }}>Árvore de Habilidades</h2>
          <p>Sistema em manutenção para calibração da Anatomia Estelar.</p>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
             <img src={assetUrlFromJson(trainerBodyAsset)} style={{ opacity: 0.5, maxWidth: 200 }} />
          </div>
        </div>
      )}

      {tab !== "melhorias" && (
        <div>
          <h2 style={{ color: '#f5cf6b' }}>{tab.toUpperCase()}</h2>
          <p>Conteúdo em restauração...</p>
        </div>
      )}
    </div>
  );
}
