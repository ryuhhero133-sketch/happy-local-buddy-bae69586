// LOJA POKÉMON — redesenho fiel ao mock (banner de madeira, tabs, cards em pergaminho,
// colunas laterais de Carteira/Converter/Código e Pacotes Especiais, nav inferior).
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin as readIsAdmin } from "@/components/admin/adminStore";
import { assetUrlFromJson } from "@/lib/assetUrl";
import shopBannerAsset from "@/assets/shop-banner.png.asset.json";
import shopBgAsset from "@/assets/shop-bg.jpg.asset.json";

// ---------- Types ----------
export type CashProduct = {
  id: string;
  category: "featured" | "sapphire" | "package" | "egg" | "premium" | "promo" | "other";
  name: string;
  description: string | null;
  image_url: string | null;
  currency: "cash" | "sapphires" | "tokens" | "tickets" | "coins" | "crystals";
  price: number;
  discount_pct: number | null;
  grants: Record<string, number> | null;
  active: boolean;
  sort: number | null;
  badge: string | null;
};

export type Wallet = {
  coins: number; crystals: number; sapphires: number;
  tokens: number; tickets: number; cash: number;
  vip_until: number | null; premium_until: number | null;
};

export type CashShopModalProps = {
  open: boolean;
  onClose: () => void;
  identity: { id: string; name: string } | null;
  wallet: Partial<Wallet> & { level?: number; xp?: number; xpNext?: number };
  onGrantCoins?: (n: number) => void;
  onGrantCrystals?: (n: number) => void;
  onGrantItem?: (itemId: string, qty: number) => void;
  onGrantPokemon?: (species: string, rarity?: string) => void;
  onOpenCodeTab?: () => void;
  onRedeemCode?: (code: string) => void;
  codeInput?: string;
  setCodeInput?: (v: string) => void;
  codeMsg?: { kind: "ok" | "err"; text: string } | null;
};

type TabId = "featured" | "items" | "coins" | "sapphires" | "pokemon" | "all";
const TABS: { id: TabId; label: string }[] = [
  { id: "featured", label: "EM DESTAQUE" },
  { id: "items",    label: "ITENS" },
  { id: "coins",    label: "MOEDAS" },
  { id: "sapphires",label: "SAFIRAS" },
  { id: "pokemon",  label: "POKÉMON" },
  { id: "all",      label: "TUDO" },
];

const BANNER = assetUrlFromJson(shopBannerAsset);
const BG = assetUrlFromJson(shopBgAsset);

const currencyIcon = (c: CashProduct["currency"]) =>
  ({ cash: "💵", sapphires: "🟢", tokens: "🟣", tickets: "🎟", coins: "🪙", crystals: "💎" }[c] ?? "•");

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return n.toLocaleString("pt-BR");
  return String(n);
}

// ============ Panels ============

function CardHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: `linear-gradient(180deg, ${color}22, transparent)`,
      borderBottom: `1.5px solid ${color}55`,
      color, fontWeight: 900, fontSize: 12, letterSpacing: 1.5,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function LeftCarteira({ w }: { w: Partial<Wallet> }) {
  return (
    <div style={cardBox("#1e2a4a", "#3d5aa8")}>
      <CardHeader icon="💼" title="CARTEIRA" color="#7aa5ff" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px" }}>
        <ResourceRow icon="🪙" color="#f5cf6b" value={w.coins ?? 0} />
        <ResourceRow icon="💎" color="#7dd3fc" value={w.crystals ?? 0} action="+" />
      </div>
    </div>
  );
}

function ResourceRow({ icon, color, value, action }: { icon: string; color: string; value: number; action?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(8,14,32,0.6)", border: `1.5px solid ${color}44`,
      borderRadius: 10, padding: "8px 12px",
    }}>
      <span style={{ fontSize: 20, filter: `drop-shadow(0 0 6px ${color})` }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>{fmt(value)}</span>
      {action && (
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: "linear-gradient(180deg,#f7c14a,#d99a2a)",
          color: "#3a1e05", fontWeight: 900, fontSize: 16,
          display: "grid", placeItems: "center", cursor: "pointer",
          boxShadow: "0 2px 0 #7a4c0f",
        }}>{action}</div>
      )}
    </div>
  );
}

function LeftConverter({ w, onConvert }: { w: Partial<Wallet>; onConvert: (from: string, to: string, af: number, at: number) => void }) {
  const [coinsToCry, setCoinsToCry] = useState(1000);
  const [cryToCoins, setCryToCoins] = useState(100);
  const gotCrystals = Math.floor(coinsToCry / 10);
  const gotCoins = cryToCoins * 10;
  return (
    <div style={cardBox("#1e2a4a", "#3d5aa8")}>
      <CardHeader icon="🔄" title="CONVERTER" color="#7aa5ff" />
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10.5, color: "#b8c8f0", textAlign: "center", lineHeight: 1.4 }}>
          Converta moedas em cristais e cristais em moedas.
        </div>
        <ConvertRow icon1="🪙" icon2="💎" val={coinsToCry} setVal={setCoinsToCry} result={gotCrystals} />
        <ConvertRow icon1="💎" icon2="🪙" val={cryToCoins} setVal={setCryToCoins} result={gotCoins} />
        <button onClick={() => onConvert("coins","crystals",coinsToCry,gotCrystals)} style={btnGreen}>CONVERTER</button>
      </div>
    </div>
  );
}

function ConvertRow({ icon1, icon2, val, setVal, result }: { icon1: string; icon2: string; val: number; setVal: (n: number) => void; result: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
      <div style={convBox}>
        <span style={{ fontSize: 14 }}>{icon1}</span>
        <input type="number" value={val} onChange={e => setVal(Math.max(0, Number(e.target.value)))}
          style={convInput} />
      </div>
      <span style={{ color: "#7aa5ff", fontSize: 14, fontWeight: 900 }}>»</span>
      <div style={convBox}>
        <span style={{ fontSize: 14 }}>{icon2}</span>
        <span style={{ ...convInput, textAlign: "right" as const, padding: "4px 6px" }}>{fmt(result)}</span>
      </div>
    </div>
  );
}

function LeftPromoCode({ codeInput, setCodeInput, onRedeem, msg }: {
  codeInput?: string; setCodeInput?: (v: string) => void;
  onRedeem?: (c: string) => void; msg?: { kind: "ok" | "err"; text: string } | null;
}) {
  return (
    <div style={cardBox("#2a1a4a", "#6b47c9")}>
      <CardHeader icon="🎁" title="CÓDIGO PROMOCIONAL" color="#c4a3ff" />
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10.5, color: "#d6c5ff", textAlign: "center", lineHeight: 1.4 }}>
          Resgate códigos e ganhe recompensas exclusivas!
        </div>
        <input value={codeInput ?? ""} onChange={e => setCodeInput?.(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onRedeem?.(codeInput ?? ""); }}
          placeholder="Digite o código..."
          style={{
            padding: "10px 12px", background: "rgba(8,14,32,0.7)",
            color: "#fff", border: "1.5px solid #6b47c988", borderRadius: 8,
            fontSize: 12, fontWeight: 700, letterSpacing: 1,
          }} />
        <button onClick={() => onRedeem?.(codeInput ?? "")} style={btnPurple}>RESGATAR</button>
        {msg && (
          <div style={{
            padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, textAlign: "center",
            background: msg.kind === "ok" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)",
            color: msg.kind === "ok" ? "#86efac" : "#fca5a5",
          }}>{msg.text}</div>
        )}
      </div>
    </div>
  );
}

function TrainerCard({ name, level, xp, xpNext, coins, crystals }: {
  name: string; level: number; xp: number; xpNext: number; coins: number; crystals: number;
}) {
  const pct = Math.min(100, Math.round((xp / Math.max(1, xpNext)) * 100));
  return (
    <div style={{
      background: "linear-gradient(160deg, #14213e, #0f1a30)",
      border: "2px solid #f5cf6b",
      borderRadius: 14, padding: "12px 16px", minWidth: 260,
      boxShadow: "0 6px 20px rgba(0,0,0,0.5), 0 0 18px rgba(245,207,107,0.25)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: "#ffe08a" }}>TREINADOR</span>
        <span style={{ fontSize: 10, color: "#c8b8e8", maxWidth: 120, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{name}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#e8dcff", fontWeight: 700 }}>Nível {level}</span>
        <div style={{ flex: 1, height: 8, background: "rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden", border: "1px solid #3a4c7a" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#5aa4ff,#7dd3fc)", boxShadow: "0 0 8px #7dd3fc" }} />
        </div>
        <span style={{ fontSize: 10, color: "#a89cc9", fontWeight: 800 }}>{pct}%</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <span style={miniChip("#f5cf6b")}>🪙 {fmt(coins)}</span>
        <span style={miniChip("#7dd3fc")}>💎 {fmt(crystals)}</span>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: "linear-gradient(180deg,#f7c14a,#d99a2a)",
          color: "#3a1e05", fontWeight: 900, fontSize: 16,
          display: "grid", placeItems: "center", cursor: "pointer", marginLeft: "auto",
          boxShadow: "0 2px 0 #7a4c0f",
        }}>+</div>
      </div>
    </div>
  );
}

// Product tile — parchment / wooden card
function ProductTile({ p, onBuy, canAfford }: { p: CashProduct; onBuy: () => void; canAfford: boolean }) {
  const price = p.discount_pct ? Math.floor(p.price * (1 - p.discount_pct / 100)) : p.price;
  return (
    <div style={{
      background: "linear-gradient(180deg, #f5e6b8 0%, #ecd18e 100%)",
      border: "3px solid #8a5a2c",
      borderRadius: 12,
      padding: 10,
      boxShadow: "0 4px 0 #5c3a18, 0 6px 12px rgba(0,0,0,0.4), inset 0 2px 0 #fff5cc",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 900, letterSpacing: 1, color: "#3a1e05",
        textAlign: "center", textTransform: "uppercase",
        textShadow: "0 1px 0 #fff8d4",
      }}>{p.name}</div>
      <div style={{
        aspectRatio: "1/1", background: "rgba(255,255,255,0.35)",
        border: "1.5px solid #8a5a2c66", borderRadius: 8,
        display: "grid", placeItems: "center", overflow: "hidden",
      }}>
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy"
            style={{ width: "80%", height: "80%", objectFit: "contain", imageRendering: "pixelated" }} />
        ) : (
          <div style={{ fontSize: 40 }}>{currencyIcon(p.currency)}</div>
        )}
      </div>
      {p.description && (
        <div style={{
          fontSize: 10, color: "#5c3a18", textAlign: "center",
          lineHeight: 1.3, minHeight: 26,
        }}>{p.description}</div>
      )}
      <button onClick={onBuy} disabled={!canAfford} style={{
        background: canAfford
          ? "linear-gradient(180deg, #2f4b7a, #1e3358)"
          : "linear-gradient(180deg, #6b6b6b, #4a4a4a)",
        border: `2px solid ${canAfford ? "#5a7db8" : "#666"}`,
        color: "#fff",
        fontWeight: 900, fontSize: 13, letterSpacing: 0.5,
        borderRadius: 8, padding: "6px 8px",
        cursor: canAfford ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        boxShadow: canAfford ? "0 2px 0 #0a1224, inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
      }}>
        <span style={{ fontSize: 15, filter: `drop-shadow(0 0 4px ${p.currency === "crystals" || p.currency === "sapphires" ? "#7dd3fc" : "#f5cf6b"})` }}>{currencyIcon(p.currency)}</span>
        <span>{fmt(price)}</span>
      </button>
    </div>
  );
}

function RightPacotes({ products, onBuy }: { products: CashProduct[]; onBuy: (p: CashProduct) => void }) {
  const pkgs = products.filter(p => p.category === "package" || p.category === "premium").slice(0, 3);
  return (
    <div style={cardBox("#2a1a4a", "#6b47c9")}>
      <CardHeader icon="🎁" title="PACOTES ESPECIAIS" color="#c4a3ff" />
      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>
        {pkgs.length === 0 && (
          <div style={{ padding: 12, color: "#c4a3ff", fontSize: 11, textAlign: "center" }}>
            Nenhum pacote cadastrado. Adicione na tabela <code>cash_products</code>.
          </div>
        )}
        {pkgs.map(p => (
          <div key={p.id} style={{
            background: "linear-gradient(160deg, rgba(30,20,60,0.85), rgba(50,30,90,0.85))",
            border: "1.5px solid #6b47c9",
            borderRadius: 10, padding: 10,
            display: "grid", gridTemplateColumns: "70px 1fr", gap: 10,
          }}>
            <div style={{
              width: 70, height: 70, borderRadius: 8,
              background: "radial-gradient(circle at 50% 40%, rgba(196,163,255,0.3), transparent 70%)",
              border: "1.5px solid #6b47c9aa",
              display: "grid", placeItems: "center", overflow: "hidden",
            }}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} loading="lazy" style={{ width: "88%", height: "88%", objectFit: "contain", imageRendering: "pixelated" }} />
              ) : <div style={{ fontSize: 32 }}>📦</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#f5cf6b", letterSpacing: 0.5 }}>{p.name.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: "#d6c5ff", lineHeight: 1.4, minHeight: 26 }}>{p.description}</div>
              <button onClick={() => onBuy(p)} style={{
                marginTop: 4,
                background: "linear-gradient(180deg,#5abf5a,#3a8f3a)",
                border: "1.5px solid #86ef86", color: "#fff",
                fontWeight: 900, fontSize: 11, letterSpacing: 0.8,
                borderRadius: 6, padding: "6px 10px", cursor: "pointer",
                alignSelf: "flex-start",
                boxShadow: "0 2px 0 #1e5a1e",
              }}>{currencyIcon(p.currency)} {fmt(p.discount_pct ? Math.floor(p.price*(1-p.discount_pct/100)) : p.price)}</button>
            </div>
          </div>
        ))}
        <button style={{
          marginTop: 4,
          background: "linear-gradient(180deg,#f7c14a,#d99a2a)",
          border: "1.5px solid #ffe08a", color: "#3a1e05",
          fontWeight: 900, fontSize: 11, letterSpacing: 1,
          borderRadius: 8, padding: "10px", cursor: "pointer",
          boxShadow: "0 3px 0 #7a4c0f",
        }}>VER TODOS OS PACOTES</button>
      </div>
    </div>
  );
}

// ---------- Admin ----------
function AdminPanel({ identity }: { identity: { id: string; name: string } | null }) {
  const [nickname, setNickname] = useState("");
  const [itemId, setItemId] = useState("pokeball");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useCallback(async () => {
    if (!identity?.id) { setMsg({ kind: "err", text: "Não autenticado." }); return; }
    if (!nickname.trim() || !itemId.trim() || qty <= 0) { setMsg({ kind: "err", text: "Preencha nickname/item/quantidade." }); return; }
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prof } = await (supabase as any).from("profiles").select("id,username").ilike("username", nickname.trim()).maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("admin_gifts").insert({
        recipient_user_id: prof?.id ?? null,
        recipient_username: prof?.username ?? nickname.trim(),
        kind: "item", item_id: itemId.trim(), qty,
        sender: identity.name || "ADMIN", note: "loja pokemon admin",
      });
      if (error) throw error;
      setMsg({ kind: "ok", text: `✅ ${qty}× ${itemId} → ${nickname}` });
      setNickname(""); setQty(1);
    } catch (e) { setMsg({ kind: "err", text: `Erro: ${(e as Error).message}` }); }
    finally { setBusy(false); }
  }, [identity, nickname, itemId, qty]);

  return (
    <div style={{
      marginTop: 12, background: "linear-gradient(160deg,#3d0f0f,#521414)",
      border: "2px solid #f5cf6b", borderRadius: 12, padding: 12,
    }}>
      <div style={{ color: "#f5cf6b", fontWeight: 900, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>👑 PAINEL ADMIN</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 60px auto", gap: 6 }}>
        <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="nickname"
          style={adminInput} />
        <input value={itemId} onChange={e => setItemId(e.target.value)} placeholder="item id"
          style={adminInput} />
        <input type="number" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
          style={{ ...adminInput, textAlign: "right" as const }} />
        <button onClick={send} disabled={busy} style={{
          background: "linear-gradient(180deg,#f7c14a,#d99a2a)", border: "1.5px solid #ffe08a",
          color: "#3a1e05", fontWeight: 900, fontSize: 11, letterSpacing: 0.5,
          borderRadius: 6, padding: "0 12px", cursor: "pointer",
        }}>{busy ? "..." : "ENVIAR"}</button>
      </div>
      {msg && <div style={{ marginTop: 6, fontSize: 11, color: msg.kind === "ok" ? "#86efac" : "#fca5a5" }}>{msg.text}</div>}
    </div>
  );
}

// ============ Main Modal ============
export function CashShopModal(props: CashShopModalProps) {
  const { open, onClose, identity, wallet } = props;
  const [tab, setTab] = useState<TabId>("featured");
  const [products, setProducts] = useState<CashProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbWallet, setDbWallet] = useState<Partial<Wallet>>({});

  useEffect(() => { setIsAdmin(readIsAdmin()); }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setDbError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("cash_products").select("*").eq("active", true).order("sort", { ascending: true });
        if (error) throw error;
        if (!cancelled) setProducts((data as CashProduct[]) ?? []);
      } catch (e) {
        if (!cancelled) { setProducts([]); setDbError((e as Error).message); }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open || !identity?.id) return;
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any).from("cash_wallets").select("*").eq("user_id", identity.id).maybeSingle();
        if (!cancelled && data) setDbWallet(data as Partial<Wallet>);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [open, identity?.id]);

  const w: Partial<Wallet> = useMemo(() => ({
    coins: wallet.coins ?? 0,
    crystals: wallet.crystals ?? 0,
    sapphires: dbWallet.sapphires ?? wallet.sapphires ?? 0,
    tokens: dbWallet.tokens ?? wallet.tokens ?? 0,
    tickets: dbWallet.tickets ?? wallet.tickets ?? 0,
    cash: dbWallet.cash ?? wallet.cash ?? 0,
  }), [wallet, dbWallet]);

  const visible = useMemo(() => {
    if (tab === "all") return products;
    if (tab === "featured") return products.filter(p => p.category === "featured" || p.badge);
    if (tab === "items") return products.filter(p => p.category === "other" || p.category === "featured");
    if (tab === "coins") return products.filter(p => p.currency === "coins" || p.currency === "cash");
    if (tab === "sapphires") return products.filter(p => p.category === "sapphire" || p.currency === "sapphires");
    if (tab === "pokemon") return products.filter(p => p.category === "egg");
    return products;
  }, [products, tab]);

  const canAfford = (p: CashProduct) => {
    const price = p.discount_pct ? Math.floor(p.price * (1 - p.discount_pct / 100)) : p.price;
    return ((w[p.currency as keyof Wallet] as number) ?? 0) >= price;
  };

  const buy = useCallback(async (p: CashProduct) => {
    if (!identity?.id) return;
    const price = p.discount_pct ? Math.floor(p.price * (1 - p.discount_pct / 100)) : p.price;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("cash_purchases").insert({
        user_id: identity.id, username: identity.name,
        product_id: p.id, currency: p.currency, price_paid: price,
        grants: p.grants ?? {},
      });
      if (p.grants) {
        for (const [k, v] of Object.entries(p.grants)) {
          const qty = Number(v);
          if (k === "coins") props.onGrantCoins?.(qty);
          else if (k === "crystals") props.onGrantCrystals?.(qty);
          else props.onGrantItem?.(k, qty);
        }
      }
      alert(`✅ Comprado: ${p.name}`);
    } catch (e) { alert(`Erro: ${(e as Error).message}`); }
  }, [identity, props]);

  if (!open) return null;

  const level = wallet.level ?? 1;
  const xp = wallet.xp ?? 0;
  const xpNext = wallet.xpNext ?? 100;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(5,10,25,0.7)", backdropFilter: "blur(6px)",
        display: "grid", placeItems: "center", padding: 12,
        animation: "loja-fade 200ms ease",
      }}
    >
      <style>{`
        @keyframes loja-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes loja-pop  { from { transform: scale(.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        .loja-scroll::-webkit-scrollbar { width: 10px }
        .loja-scroll::-webkit-scrollbar-thumb { background: #6b47c988; border-radius: 5px }
        .loja-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.3) }
      `}</style>

      <div style={{
        width: "min(1400px, 98vw)", height: "min(900px, 96vh)",
        background: `linear-gradient(rgba(5,20,40,0.55), rgba(5,20,40,0.55)), url(${BG})`,
        backgroundSize: "cover", backgroundPosition: "center",
        border: "3px solid #8a5a2c", borderRadius: 20,
        boxShadow: "0 25px 80px rgba(0,0,0,0.85), 0 0 40px rgba(245,207,107,0.25)",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        overflow: "hidden",
        animation: "loja-pop 260ms cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* HEADER: banner + trainer + close */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto", gap: 16,
          padding: "12px 18px",
          background: "linear-gradient(180deg, rgba(0,0,0,0.4), transparent)",
          alignItems: "center",
        }}>
          <img src={BANNER} alt="LOJA POKÉMON" style={{
            height: 130, maxWidth: "100%", objectFit: "contain",
            filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.5))",
          }} />
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <TrainerCard
              name={identity?.name ?? "Convidado"}
              level={level} xp={xp} xpNext={xpNext}
              coins={w.coins ?? 0} crystals={w.crystals ?? 0}
            />
            <button onClick={onClose} aria-label="Fechar" style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(180deg,#ef4444,#b91c1c)",
              border: "2px solid #fca5a5", color: "#fff",
              fontSize: 18, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 3px 0 #7a1414",
            }}>✕</button>
          </div>
        </div>

        {/* MIDDLE: 3 columns */}
        <div style={{
          display: "grid", gridTemplateColumns: "260px 1fr 300px",
          gap: 14, padding: "0 18px 12px", minHeight: 0,
        }}>
          {/* LEFT column */}
          <div className="loja-scroll" style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
            <LeftCarteira w={w} />
            <LeftConverter w={w} onConvert={async (from, to, af, at) => {
              if (!identity?.id) return;
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any).from("cash_conversions").insert({
                  user_id: identity.id, from_currency: from, to_currency: to, amount_from: af, amount_to: at,
                });
                alert(`✅ ${af} ${from} → ${at} ${to}`);
              } catch (e) { alert(`Erro: ${(e as Error).message}`); }
            }} />
            <LeftPromoCode
              codeInput={props.codeInput}
              setCodeInput={props.setCodeInput}
              onRedeem={props.onRedeemCode}
              msg={props.codeMsg}
            />
          </div>

          {/* CENTER: tabs + products */}
          <div style={{
            background: "linear-gradient(160deg, rgba(15,30,55,0.9), rgba(10,20,45,0.9))",
            border: "2.5px solid #2a4478",
            borderRadius: 14,
            display: "grid", gridTemplateRows: "auto auto 1fr",
            overflow: "hidden",
          }}>
            {/* Tabs */}
            <div style={{
              display: "flex", gap: 4, padding: "10px 10px 0",
              background: "rgba(0,0,0,0.25)",
            }}>
              {TABS.map(t => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    flex: 1, padding: "10px 8px",
                    background: active
                      ? "linear-gradient(180deg,#f5cf6b,#d99a2a)"
                      : "linear-gradient(180deg,#2a4478,#1a2e58)",
                    border: `2px solid ${active ? "#ffe08a" : "#3a5a98"}`,
                    borderBottom: active ? "2px solid #ffe08a" : "2px solid transparent",
                    color: active ? "#3a1e05" : "#c8d6f0",
                    fontSize: 11, fontWeight: 900, letterSpacing: 0.8,
                    borderRadius: "8px 8px 0 0", cursor: "pointer",
                    textShadow: active ? "0 1px 0 rgba(255,255,255,0.4)" : "none",
                  }}>{t.label}</button>
                );
              })}
            </div>
            <div style={{
              padding: "10px 14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              borderBottom: "1px solid #2a4478",
            }}>
              <span style={{ color: "#f5cf6b", fontSize: 12 }}>✦</span>
              <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: "#ffe08a" }}>
                {TABS.find(t => t.id === tab)?.label}
              </span>
              <span style={{ color: "#f5cf6b", fontSize: 12 }}>✦</span>
            </div>

            <div className="loja-scroll" style={{ overflowY: "auto", padding: 14 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#c8d6f0" }}>⏳ Carregando...</div>
              ) : visible.length === 0 ? (
                <div style={{
                  padding: 40, textAlign: "center", color: "#c8d6f0",
                  background: "rgba(0,0,0,0.25)", border: "1.5px dashed #3a5a98",
                  borderRadius: 10,
                }}>
                  <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.6 }}>📦</div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                    Nenhum item nesta categoria.
                  </div>
                  <div style={{ fontSize: 11, color: "#8ba0c8", lineHeight: 1.5 }}>
                    {dbError
                      ? "⚠️ Rode SUPABASE_CASH_SHOP.sql no Supabase para criar as tabelas."
                      : "Adicione produtos em cash_products no Supabase."}
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 12,
                }}>
                  {visible.map(p => (
                    <ProductTile key={p.id} p={p} onBuy={() => buy(p)} canAfford={canAfford(p)} />
                  ))}
                </div>
              )}
              {isAdmin && <AdminPanel identity={identity} />}
            </div>
          </div>

          {/* RIGHT column */}
          <div className="loja-scroll" style={{ overflowY: "auto" }}>
            <RightPacotes products={products} onBuy={buy} />
          </div>
        </div>

        {/* BOTTOM: footer */}
        <div style={{
          padding: "10px 20px",
          background: "linear-gradient(180deg, rgba(5,15,35,0.85), rgba(5,15,35,0.95))",
          borderTop: "2px solid #2a4478",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          color: "#7dd3fc", fontSize: 11, fontWeight: 800, letterSpacing: 1,
        }}>
          <span>🛡️</span>
          <span style={{ color: "#c8d6f0" }}>COMPRA SEGURA</span>
          <span style={{ color: "#f5cf6b" }}>•</span>
          <span style={{ color: "#c8d6f0" }}>100% PROTEGIDO</span>
        </div>
      </div>
    </div>
  );
}

export default CashShopModal;

// ============ Shared style helpers ============
const cardBox = (bg: string, border: string): React.CSSProperties => ({
  background: `linear-gradient(160deg, ${bg}, rgba(5,10,25,0.9))`,
  border: `2px solid ${border}`,
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: `0 4px 14px rgba(0,0,0,0.5), 0 0 12px ${border}44`,
});
const cardHeader = (icon: string, title: string, color: string): React.CSSProperties => ({
  padding: "10px 12px",
  background: `linear-gradient(180deg, ${color}22, transparent)`,
  borderBottom: `1.5px solid ${color}55`,
  color: color, fontWeight: 900, fontSize: 12, letterSpacing: 1.5,
  display: "flex", alignItems: "center", gap: 8,
  // content injected via children—render fallback with icon+title:
});
// Because cardHeader is used as a style-with-children pattern, we build a small helper component below instead.
// The variant used above expects children — we swap to a component:

// (Note: the earlier cardHeader() usage returns only CSSProperties; the JSX <div style={cardHeader()} />
// won't render icon/title. Replace calls with <CardHeader/> component:
// We keep both styles alive by exporting the CardHeader component.
// The three left panels reference cardHeader() as a style — they render icon/title inline instead.
// To simplify, we render inline in each panel; the cardHeader helper is unused fallback for style only.)

const convBox: React.CSSProperties = {
  background: "rgba(8,14,32,0.7)",
  border: "1.5px solid #3a5a9855",
  borderRadius: 6, padding: "2px 6px",
  display: "flex", alignItems: "center", gap: 4,
};
const convInput: React.CSSProperties = {
  flex: 1, background: "transparent", border: "none", color: "#fff",
  fontSize: 12, fontWeight: 900, textAlign: "right", padding: 4, minWidth: 0, width: "100%",
  outline: "none",
};
const btnGreen: React.CSSProperties = {
  background: "linear-gradient(180deg,#5abf5a,#3a8f3a)",
  border: "1.5px solid #86ef86", color: "#fff",
  fontWeight: 900, fontSize: 12, letterSpacing: 1,
  borderRadius: 8, padding: "9px", cursor: "pointer",
  boxShadow: "0 2px 0 #1e5a1e",
};
const btnPurple: React.CSSProperties = {
  background: "linear-gradient(180deg,#8b5cf6,#6b47c9)",
  border: "1.5px solid #c4a3ff", color: "#fff",
  fontWeight: 900, fontSize: 12, letterSpacing: 1,
  borderRadius: 8, padding: "9px", cursor: "pointer",
  boxShadow: "0 2px 0 #3a1e75",
};
const miniChip = (color: string): React.CSSProperties => ({
  fontSize: 11, fontWeight: 900, color: "#fff",
  background: "rgba(0,0,0,0.35)", border: `1px solid ${color}55`,
  padding: "3px 8px", borderRadius: 6, letterSpacing: 0.5,
});
const adminInput: React.CSSProperties = {
  padding: "8px 10px", background: "rgba(10,5,25,0.9)", color: "#fff",
  border: "1px solid #f5cf6b55", borderRadius: 6, fontSize: 12, fontWeight: 700,
};
