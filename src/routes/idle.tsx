import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "../components/AuthGate";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { 
  PetInstance, 
  loadIdentity, 
  loadTeam, 
  calcIdleMaxHp, 
  loadItems, 
  loadBank,
  loadBuffs,
  fmtK,
  POTION_HEAL_PCT,
  POTION_PRICE,
  SHOP_BALLS,
  ITEM_COLORS,
  ballUltraImg,
  scrollTeleportUrl,
  chestAmuletImg,
  oddishUrl,
  PET_TYPE_BADGES
} from "../lib/game-logic";
import { SHOP_BOOKS, EGG_SHOP_ITEMS } from "../game/shop-data.server";

// Mock implementation of child components to keep this snippet simple
function QtyBuy(props: any) { return <button onClick={() => props.onBuy(1)}>Comprar 1</button>; }
function WalletScreen(props: any) { return <div>Carteira</div>; }

function IdlePage() {
  const identity = loadIdentity();
  const [tab, setTab] = useState("batalha");
  const [bank] = useState(() => loadBank());
  const [items] = useState(() => loadItems());
  const [buffs] = useState(() => loadBuffs());
  const [idle] = useState<any>({});
  
  // Dummy handlers
  const onBuyBook = (bk: any) => {};
  const onBuyPotion = (n: number) => {};
  const onBuyBall = (b: any, n: number) => {};
  const onBuyUltraBundle = (n: number) => {};
  const onBuyTeleportScroll = (n: number) => {};
  const onBuyEgg = (e: any) => {};
  const onBuyChestAmulet = () => {};
  const onExchange = (dir: any, amt: number) => {};

  const shopEggs = EGG_SHOP_ITEMS;
  const chestAmuletOwned = items.amulet_chest ?? 0;

  return (
    <div style={{ padding: 20, color: "#fff", background: "#0b0510", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setTab("batalha")}>Batalha</button>
        <button onClick={() => setTab("loja")}>Loja (BLOQUEADA)</button>
        <button onClick={() => setTab("market")}>Mercado (BLOQUEADO)</button>
        <button onClick={() => setTab("wallet")}>Carteira</button>
      </div>

      {tab === "batalha" && <div>Tela de Batalha</div>}

      {tab === "loja" && (
        <div style={{ padding: 20, textAlign: "center", color: "#fca5a5", background: "rgba(255,0,0,0.1)", borderRadius: 12, border: "1px dashed #f87171" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
          <h3 style={{ margin: 0 }}>LOJA BLOQUEADA</h3>
          <p style={{ fontSize: 12, opacity: 0.8 }}>O sistema de loja está temporariamente indisponível por ordem da administração.</p>
        </div>
      )}

      {tab === "market" && (
        <div style={{ padding: 20, textAlign: "center", color: "#fca5a5", background: "rgba(255,0,0,0.1)", borderRadius: 12, border: "1px dashed #f87171" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
          <h3 style={{ margin: 0 }}>MERCADO BLOQUEADO</h3>
          <p style={{ fontSize: 12, opacity: 0.8 }}>O mercado global está em manutenção e foi desativado.</p>
        </div>
      )}

      {tab === "wallet" && (
        <WalletScreen bank={bank} onExchange={onExchange} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/idle")({
  component: () => (
    <AuthGate>
      <IdlePage />
    </AuthGate>
  ),
});
