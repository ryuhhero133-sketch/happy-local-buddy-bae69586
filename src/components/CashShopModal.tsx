// CASH SHOP MODAL — Lojinha Cash
// Modal overlay for the game. Reads products from Supabase tables:
//   cash_products, cash_packages, cash_eggs
// and wallet from cash_wallets (tokens/tickets/cash) + props (gold/crystals).
// Grants happen via callbacks that mutate the existing game state.
//
// Also embeds an Admin panel visible only when isAdmin=true.
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin as readIsAdmin } from "@/components/admin/adminStore";

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
  coins: number;      // gold
  crystals: number;   // 💎 (existing)
  sapphires: number;  // 🟢 verde
  tokens: number;
  tickets: number;
  cash: number;
  vip_until: number | null;
  premium_until: number | null;
};

export type CashShopModalProps = {
  open: boolean;
  onClose: () => void;
  identity: { id: string; name: string } | null;
  wallet: Partial<Wallet>;
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

const TABS: { id: CashProduct["category"] | "convert" | "promo"; label: string; icon: string }[] = [
  { id: "featured", label: "Destaques", icon: "⭐" },
  { id: "sapphire", label: "Safiras", icon: "🟢" },
  { id: "convert",  label: "Conversão", icon: "🔁" },
  { id: "package",  label: "Pacotes", icon: "🎁" },
  { id: "egg",      label: "Ovos", icon: "🥚" },
  { id: "premium",  label: "Premium", icon: "👑" },
  { id: "promo",    label: "Promoções", icon: "🎉" },
];

// ---------- Small primitives ----------
const glow = (color: string, intensity = 0.5) =>
  `0 0 20px rgba(${color}, ${intensity}), inset 0 0 20px rgba(${color}, ${intensity * 0.4})`;

function currencyIcon(c: CashProduct["currency"]): string {
  return {
    cash: "💵", sapphires: "🟢", tokens: "🟣", tickets: "🎟",
    coins: "🪙", crystals: "💎",
  }[c] ?? "•";
}

function formatN(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ---------- Wallet Header ----------
function WalletPanel({ w }: { w: Partial<Wallet> }) {
  const items = [
    { icon: "🪙", label: "Coins", value: w.coins ?? 0, color: "#f5cf6b" },
    { icon: "💎", label: "Cristais", value: w.crystals ?? 0, color: "#7dd3fc" },
    { icon: "🟢", label: "Safiras", value: w.sapphires ?? 0, color: "#4ade80" },
    { icon: "🟣", label: "Tokens", value: w.tokens ?? 0, color: "#c084fc" },
    { icon: "🎟", label: "Tickets", value: w.tickets ?? 0, color: "#fb7185" },
    { icon: "💵", label: "Cash", value: w.cash ?? 0, color: "#fbbf24" },
  ];
  return (
    <div style={{
      display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end",
    }}>
      {items.map((it) => (
        <div key={it.label} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px",
          background: "linear-gradient(135deg, rgba(20,10,40,0.85), rgba(40,20,80,0.7))",
          border: `1.5px solid ${it.color}66`,
          borderRadius: 10,
          boxShadow: `0 0 12px ${it.color}33, inset 0 0 8px rgba(0,0,0,0.4)`,
          minWidth: 88,
        }}>
          <span style={{ fontSize: 16, filter: `drop-shadow(0 0 4px ${it.color})` }}>{it.icon}</span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.8, color: it.color, opacity: 0.85 }}>{it.label}</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#fff", textShadow: "0 1px 0 rgba(0,0,0,0.7)" }}>{formatN(it.value)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Product Card ----------
function ProductCard({ p, onBuy, canAfford }: { p: CashProduct; onBuy: () => void; canAfford: boolean }) {
  const finalPrice = p.discount_pct ? Math.floor(p.price * (1 - p.discount_pct / 100)) : p.price;
  const rarityColor = p.category === "egg" ? "#fb7185"
    : p.category === "premium" ? "#fbbf24"
    : p.category === "package" ? "#a78bfa"
    : p.category === "sapphire" ? "#4ade80"
    : "#7dd3fc";
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(160deg, #0f0820 0%, #1a0f38 55%, #2a1a52 100%)",
      border: `2px solid ${rarityColor}`,
      borderRadius: 14,
      padding: 12,
      boxShadow: glow("245,207,107", 0.15) + `, 0 0 18px ${rarityColor}55`,
      overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {p.badge && (
        <span style={{
          position: "absolute", top: 8, right: 8,
          fontSize: 9, fontWeight: 900, letterSpacing: 1,
          background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}dd)`,
          color: "#0a0512", padding: "3px 8px", borderRadius: 10,
          boxShadow: `0 0 10px ${rarityColor}88`,
          zIndex: 2,
        }}>{p.badge}</span>
      )}
      {p.discount_pct ? (
        <span style={{
          position: "absolute", top: 8, left: 8,
          fontSize: 10, fontWeight: 900,
          background: "linear-gradient(135deg,#ef4444,#b91c1c)",
          color: "#fff", padding: "3px 8px", borderRadius: 10,
          boxShadow: "0 0 10px rgba(239,68,68,0.6)",
          zIndex: 2,
        }}>-{p.discount_pct}%</span>
      ) : null}

      <div style={{
        aspectRatio: "1/1", width: "100%",
        borderRadius: 10, overflow: "hidden",
        background: `radial-gradient(circle at 50% 40%, ${rarityColor}44 0%, transparent 65%)`,
        display: "grid", placeItems: "center",
        border: `1px solid ${rarityColor}77`,
      }}>
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} style={{
            width: "78%", height: "78%", objectFit: "contain",
            imageRendering: "pixelated",
            filter: `drop-shadow(0 0 12px ${rarityColor})`,
          }} />
        ) : (
          <div style={{ fontSize: 44 }}>{currencyIcon(p.currency)}</div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: 0.3, lineHeight: 1.2 }}>
          {p.name}
        </div>
        {p.description && (
          <div style={{ fontSize: 10, color: "#cbb8ea", marginTop: 4, lineHeight: 1.3, minHeight: 26 }}>
            {p.description}
          </div>
        )}
      </div>

      <button
        onClick={onBuy}
        disabled={!canAfford}
        style={{
          width: "100%",
          background: canAfford
            ? `linear-gradient(135deg, ${rarityColor}, ${rarityColor}aa)`
            : "linear-gradient(135deg, rgba(70,50,110,0.6), rgba(45,30,80,0.6))",
          border: `1.5px solid ${canAfford ? rarityColor : "#a78bfa"}`,
          color: canAfford ? "#0a0512" : "#a89cc9",
          fontWeight: 900, fontSize: 11, letterSpacing: 1,
          borderRadius: 10, padding: "9px",
          cursor: canAfford ? "pointer" : "not-allowed",
          boxShadow: canAfford ? `0 3px 12px ${rarityColor}55` : "none",
          textShadow: canAfford ? "0 1px 0 rgba(255,255,255,0.35)" : "none",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>{currencyIcon(p.currency)}</span>
        <span>{formatN(finalPrice)}</span>
        {p.discount_pct ? (
          <span style={{ fontSize: 9, opacity: 0.75, textDecoration: "line-through", marginLeft: 4 }}>
            {formatN(p.price)}
          </span>
        ) : null}
      </button>
    </div>
  );
}

// ---------- Convert Panel ----------
function ConvertPanel({ wallet, onConvert }: {
  wallet: Partial<Wallet>;
  onConvert: (from: string, to: string, amountFrom: number, amountTo: number) => void;
}) {
  const [from, setFrom] = useState<"tokens" | "sapphires" | "coins">("tokens");
  const [to, setTo] = useState<"sapphires" | "tokens" | "coins">("sapphires");
  const [amount, setAmount] = useState<number>(100);
  const balance = (wallet[from] as number) ?? 0;

  // Simple conversion rates (client-side hint; server should re-validate)
  const RATES: Record<string, number> = {
    "tokens>sapphires": 0.5,
    "sapphires>tokens": 1.8,
    "coins>tokens": 0.001,
    "tokens>coins": 900,
  };
  const rate = RATES[`${from}>${to}`] ?? 1;
  const received = Math.floor(amount * rate);

  const swap = () => {
    setFrom((prev) => (to as typeof from));
    setTo((prev) => (from as typeof to));
  };

  return (
    <div style={{
      background: "linear-gradient(160deg, #0f0820, #1a0f38 60%, #2a1a52)",
      border: "2px solid #f5cf6b",
      borderRadius: 14, padding: 20,
      boxShadow: "0 0 24px rgba(245,207,107,0.2)",
    }}>
      <div style={{ color: "#f5cf6b", fontWeight: 900, fontSize: 14, letterSpacing: 1, marginBottom: 14, textAlign: "center" }}>
        🔁 CENTRAL DE CONVERSÃO
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end" }}>
        {/* FROM */}
        <div style={{ background: "rgba(10,5,25,0.6)", border: "1.5px solid #7dd3fc55", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#a89cc9", fontWeight: 800 }}>ENVIAR</span>
            <span style={{ fontSize: 10, color: "#7dd3fc" }}>Saldo: {formatN(balance)}</span>
          </div>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value as typeof from)}
            style={{
              width: "100%", background: "rgba(10,5,25,0.9)", color: "#fff",
              border: "1px solid #7dd3fc55", borderRadius: 8, padding: "8px 10px",
              fontSize: 13, fontWeight: 900, marginBottom: 8,
            }}
          >
            <option value="tokens">🟣 Tokens</option>
            <option value="sapphires">🟢 Safiras</option>
            <option value="coins">🪙 Coins</option>
          </select>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            style={{
              width: "100%", background: "rgba(10,5,25,0.9)", color: "#fff",
              border: "1px solid #7dd3fc55", borderRadius: 8, padding: "10px 12px",
              fontSize: 16, fontWeight: 900, textAlign: "right",
            }}
          />
        </div>

        <button onClick={swap} style={{
          background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
          border: "1.5px solid #c4b5fd", color: "#fff",
          width: 44, height: 44, borderRadius: "50%",
          fontSize: 18, cursor: "pointer", fontWeight: 900,
          boxShadow: "0 0 14px rgba(167,139,250,0.55)",
        }}>⇄</button>

        {/* TO */}
        <div style={{ background: "rgba(10,5,25,0.6)", border: "1.5px solid #4ade8055", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#a89cc9", fontWeight: 800 }}>RECEBER</span>
            <span style={{ fontSize: 10, color: "#4ade80" }}>Taxa: {rate}x</span>
          </div>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value as typeof to)}
            style={{
              width: "100%", background: "rgba(10,5,25,0.9)", color: "#fff",
              border: "1px solid #4ade8055", borderRadius: 8, padding: "8px 10px",
              fontSize: 13, fontWeight: 900, marginBottom: 8,
            }}
          >
            <option value="sapphires">🟢 Safiras</option>
            <option value="tokens">🟣 Tokens</option>
            <option value="coins">🪙 Coins</option>
          </select>
          <div style={{
            width: "100%", background: "rgba(10,5,25,0.9)", color: "#4ade80",
            border: "1px solid #4ade8055", borderRadius: 8, padding: "10px 12px",
            fontSize: 16, fontWeight: 900, textAlign: "right",
          }}>{formatN(received)}</div>
        </div>
      </div>

      <button
        onClick={() => onConvert(from, to, amount, received)}
        disabled={amount <= 0 || amount > balance}
        style={{
          marginTop: 16, width: "100%",
          background: amount > 0 && amount <= balance
            ? "linear-gradient(135deg, #4ade80, #22c55e)"
            : "rgba(70,50,110,0.5)",
          border: "1.5px solid #4ade80",
          color: amount > 0 && amount <= balance ? "#0a0512" : "#a89cc9",
          fontWeight: 900, fontSize: 13, letterSpacing: 1.5,
          borderRadius: 10, padding: "12px",
          cursor: amount > 0 && amount <= balance ? "pointer" : "not-allowed",
          boxShadow: amount > 0 && amount <= balance ? "0 4px 14px rgba(74,222,128,0.4)" : "none",
        }}
      >CONVERTER</button>

      <div style={{ marginTop: 12, fontSize: 10, color: "#a89cc9", textAlign: "center", lineHeight: 1.4 }}>
        As taxas podem ser ajustadas pelo administrador no banco de dados.
      </div>
    </div>
  );
}

// ---------- Admin Panel ----------
function AdminPanel({ identity }: { identity: { id: string; name: string } | null }) {
  const [nickname, setNickname] = useState("");
  const [itemId, setItemId] = useState("pokeball");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const knownItems = [
    "pokeball", "greatball", "ultraball", "masterball",
    "potion", "super-potion", "hyper-potion", "revive",
    "incense", "honey", "coins", "crystal", "sapphire", "token", "ticket", "cash",
    "egg_common", "egg_rare", "egg_epic", "egg_myth", "egg_aura",
    "book_atk", "book_def", "book_exp", "book_exp_big", "book_exp_max",
    "book_vip", "book_vip_30", "book_vip_60",
    "orb_xp_minor", "orb_xp_major", "orb_xp_supreme", "orb_team",
    "scroll_teleport",
  ];

  useEffect(() => {
    const q = itemId.toLowerCase();
    setSuggestions(knownItems.filter((x) => x.includes(q)).slice(0, 6));
  }, [itemId]);

  const send = useCallback(async () => {
    if (!identity?.id) { setMsg({ kind: "err", text: "Não autenticado." }); return; }
    if (!nickname.trim()) { setMsg({ kind: "err", text: "Informe o nickname do jogador." }); return; }
    if (!itemId.trim() || qty <= 0) { setMsg({ kind: "err", text: "Item ou quantidade inválida." }); return; }
    setBusy(true);
    try {
      // find recipient user by username
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", nickname.trim())
        .maybeSingle();

      const recipientUserId = prof?.id ?? null;
      const recipientUsername = prof?.username ?? nickname.trim();

      const { error } = await supabase.from("admin_gifts").insert({
        recipient_user_id: recipientUserId,
        recipient_username: recipientUsername,
        kind: "item",
        item_id: itemId.trim(),
        qty,
        sender: identity.name || "ADMIN",
        note: "cash-shop admin panel",
      });
      if (error) throw error;
      setMsg({ kind: "ok", text: `✅ ${qty}× ${itemId} → ${recipientUsername}` });
      setNickname(""); setQty(1); setItemId("pokeball");
    } catch (e) {
      setMsg({ kind: "err", text: `Erro: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }, [identity, nickname, itemId, qty]);

  return (
    <div style={{
      marginTop: 16,
      background: "linear-gradient(160deg, #260a0a 0%, #3d0f0f 50%, #521414 100%)",
      border: "2px solid #f5cf6b",
      borderRadius: 14, padding: 16,
      boxShadow: "0 0 24px rgba(245,207,107,0.3)",
    }}>
      <div style={{
        color: "#f5cf6b", fontWeight: 900, fontSize: 13, letterSpacing: 1.5, marginBottom: 12,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        👑 PAINEL ADMINISTRATIVO
        <span style={{
          fontSize: 9, background: "linear-gradient(135deg, #ef4444, #b91c1c)",
          color: "#fff", padding: "2px 8px", borderRadius: 10, letterSpacing: 1,
        }}>APENAS ADMIN</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 10, alignItems: "end" }}>
        <div>
          <label style={{ fontSize: 10, color: "#f5cf6b", fontWeight: 800, letterSpacing: 0.5 }}>Nickname do jogador</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ex: kakahimita"
            style={{
              width: "100%", marginTop: 4, padding: "8px 10px",
              background: "rgba(10,5,25,0.9)", color: "#fff",
              border: "1px solid #f5cf6b55", borderRadius: 8, fontSize: 13, fontWeight: 700,
            }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <label style={{ fontSize: 10, color: "#f5cf6b", fontWeight: 800, letterSpacing: 0.5 }}>Item (ID)</label>
          <input
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            placeholder="ex: ultraball"
            style={{
              width: "100%", marginTop: 4, padding: "8px 10px",
              background: "rgba(10,5,25,0.9)", color: "#fff",
              border: "1px solid #f5cf6b55", borderRadius: 8, fontSize: 13, fontWeight: 700,
            }}
          />
          {suggestions.length > 0 && itemId && !suggestions.includes(itemId) && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 5,
              background: "rgba(10,5,25,0.98)", border: "1px solid #f5cf6b55",
              borderTop: "none", borderRadius: "0 0 8px 8px", maxHeight: 160, overflowY: "auto",
            }}>
              {suggestions.map((s) => (
                <button key={s} onClick={() => setItemId(s)} style={{
                  width: "100%", textAlign: "left", padding: "6px 10px",
                  background: "transparent", border: "none", color: "#fff",
                  fontSize: 11, cursor: "pointer", fontWeight: 700,
                }}>{s}</button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label style={{ fontSize: 10, color: "#f5cf6b", fontWeight: 800, letterSpacing: 0.5 }}>Qtd</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            style={{
              width: "100%", marginTop: 4, padding: "8px 10px",
              background: "rgba(10,5,25,0.9)", color: "#fff",
              border: "1px solid #f5cf6b55", borderRadius: 8, fontSize: 13, fontWeight: 800, textAlign: "right",
            }}
          />
        </div>
        <button
          onClick={send}
          disabled={busy}
          style={{
            padding: "10px 18px",
            background: busy ? "rgba(70,50,110,0.5)" : "linear-gradient(135deg, #f5cf6b, #d9a441)",
            border: "1.5px solid #ffe08a", color: busy ? "#a89cc9" : "#0a0512",
            fontWeight: 900, fontSize: 12, letterSpacing: 1,
            borderRadius: 8, cursor: busy ? "wait" : "pointer",
            boxShadow: "0 3px 12px rgba(245,207,107,0.5)",
          }}
        >{busy ? "..." : "ENVIAR"}</button>
      </div>

      {msg && (
        <div style={{
          marginTop: 10, padding: "8px 12px",
          background: msg.kind === "ok" ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${msg.kind === "ok" ? "#4ade80" : "#ef4444"}`,
          color: msg.kind === "ok" ? "#86efac" : "#fca5a5",
          borderRadius: 8, fontSize: 11, fontWeight: 800,
        }}>{msg.text}</div>
      )}

      <div style={{ marginTop: 10, fontSize: 10, color: "#f5cf6b99", lineHeight: 1.4 }}>
        Envia via <code style={{ color: "#ffe08a" }}>admin_gifts</code>. O jogador recebe ao abrir a mochila.
      </div>
    </div>
  );
}

// ---------- Main Modal ----------
export function CashShopModal(props: CashShopModalProps) {
  const { open, onClose, identity, wallet } = props;
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("featured");
  const [products, setProducts] = useState<CashProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbWallet, setDbWallet] = useState<Partial<Wallet>>({});

  useEffect(() => { setIsAdmin(readIsAdmin()); }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  // Load products from Supabase
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setDbError(null);
      try {
        // Products table (tolerant to schema absence)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("cash_products")
          .select("*")
          .eq("active", true)
          .order("sort", { ascending: true });
        if (error) throw error;
        if (!cancelled) setProducts((data as CashProduct[]) ?? []);
      } catch (e) {
        if (!cancelled) {
          setProducts([]);
          setDbError((e as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Load wallet extras (tokens/tickets/cash/sapphires) from cash_wallets
  useEffect(() => {
    if (!open || !identity?.id) return;
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("cash_wallets")
          .select("*")
          .eq("user_id", identity.id)
          .maybeSingle();
        if (!cancelled && data) setDbWallet(data as Partial<Wallet>);
      } catch {
        // silent; table may not exist yet
      }
    })();
    return () => { cancelled = true; };
  }, [open, identity?.id]);

  const mergedWallet: Partial<Wallet> = useMemo(() => ({
    coins: wallet.coins ?? 0,
    crystals: wallet.crystals ?? 0,
    sapphires: dbWallet.sapphires ?? wallet.sapphires ?? 0,
    tokens: dbWallet.tokens ?? wallet.tokens ?? 0,
    tickets: dbWallet.tickets ?? wallet.tickets ?? 0,
    cash: dbWallet.cash ?? wallet.cash ?? 0,
    vip_until: dbWallet.vip_until ?? null,
    premium_until: dbWallet.premium_until ?? null,
  }), [wallet, dbWallet]);

  const canAfford = (p: CashProduct): boolean => {
    const price = p.discount_pct ? Math.floor(p.price * (1 - p.discount_pct / 100)) : p.price;
    const bal = (mergedWallet[p.currency as keyof Wallet] as number) ?? 0;
    return bal >= price;
  };

  const handleBuy = useCallback(async (p: CashProduct) => {
    if (!identity?.id) return;
    const price = p.discount_pct ? Math.floor(p.price * (1 - p.discount_pct / 100)) : p.price;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("cash_purchases").insert({
        user_id: identity.id,
        username: identity.name,
        product_id: p.id,
        currency: p.currency,
        price_paid: price,
        grants: p.grants ?? {},
      });
      // Apply grants locally
      if (p.grants) {
        for (const [k, v] of Object.entries(p.grants)) {
          const qty = Number(v);
          if (k === "coins") props.onGrantCoins?.(qty);
          else if (k === "crystals") props.onGrantCrystals?.(qty);
          else props.onGrantItem?.(k, qty);
        }
      }
      alert(`✅ Comprado: ${p.name}`);
    } catch (e) {
      alert(`Erro na compra: ${(e as Error).message}`);
    }
  }, [identity, props]);

  const visibleProducts = useMemo(() => {
    if (tab === "featured") return products.filter((p) => p.category === "featured" || p.badge);
    if (tab === "convert" || tab === "promo") return [];
    return products.filter((p) => p.category === tab);
  }, [products, tab]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(5,2,15,0.75)",
        backdropFilter: "blur(8px)",
        display: "grid", placeItems: "center",
        padding: 20,
        animation: "cashModalFadeIn 200ms ease",
      }}
    >
      <style>{`
        @keyframes cashModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cashModalSlideIn { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .cash-shop-scroll::-webkit-scrollbar { width: 8px; }
        .cash-shop-scroll::-webkit-scrollbar-thumb { background: #a78bfa66; border-radius: 4px; }
      `}</style>

      <div style={{
        width: "min(1180px, 98vw)", maxHeight: "94vh",
        background: "linear-gradient(160deg, #0a0518 0%, #14082e 50%, #1c0f3e 100%)",
        border: "2px solid #f5cf6b",
        borderRadius: 18,
        boxShadow: "0 20px 80px rgba(0,0,0,0.8), 0 0 60px rgba(245,207,107,0.25), inset 0 0 60px rgba(167,139,250,0.1)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "cashModalSlideIn 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        {/* HEADER */}
        <div style={{
          padding: "16px 24px",
          background: "linear-gradient(90deg, rgba(30,15,60,0.9), rgba(60,30,110,0.9))",
          borderBottom: "2px solid #f5cf6b55",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #f5cf6b, #d9a441)",
              display: "grid", placeItems: "center", fontSize: 24,
              boxShadow: "0 0 18px rgba(245,207,107,0.6)",
            }}>💎</div>
            <div>
              <div style={{
                fontSize: 20, fontWeight: 900, letterSpacing: 2,
                background: "linear-gradient(90deg, #f5cf6b, #ffe08a, #f5cf6b)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                textShadow: "0 2px 8px rgba(245,207,107,0.3)",
              }}>LOJINHA CASH</div>
              <div style={{ fontSize: 10, color: "#c8b8e8", letterSpacing: 1 }}>
                {identity?.name ?? "Convidado"} • Premium Store
              </div>
            </div>
          </div>
          <WalletPanel w={mergedWallet} />
          <button
            onClick={onClose}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg, #ef4444, #b91c1c)",
              border: "1.5px solid #fca5a5", color: "#fff",
              fontSize: 18, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 0 12px rgba(239,68,68,0.5)",
              display: "grid", placeItems: "center",
            }}
            aria-label="Fechar"
          >✕</button>
        </div>

        {/* TABS */}
        <div style={{
          display: "flex", gap: 4, padding: "10px 16px 0",
          background: "linear-gradient(180deg, rgba(20,10,40,0.6), transparent)",
          overflowX: "auto",
        }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 16px",
                  background: active
                    ? "linear-gradient(180deg, rgba(245,207,107,0.25), rgba(245,207,107,0.05))"
                    : "transparent",
                  border: "none",
                  borderBottom: active ? "3px solid #f5cf6b" : "3px solid transparent",
                  color: active ? "#ffe08a" : "#a89cc9",
                  fontWeight: 900, fontSize: 12, letterSpacing: 1,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "all 150ms ease",
                }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* BODY */}
        <div className="cash-shop-scroll" style={{
          flex: 1, overflowY: "auto",
          padding: 20,
        }}>
          {tab === "convert" ? (
            <ConvertPanel
              wallet={mergedWallet}
              onConvert={async (from, to, amountFrom, amountTo) => {
                if (!identity?.id) return;
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabase as any).from("cash_conversions").insert({
                    user_id: identity.id, from_currency: from, to_currency: to,
                    amount_from: amountFrom, amount_to: amountTo,
                  });
                  alert(`✅ Convertido ${amountFrom} ${from} → ${amountTo} ${to}`);
                } catch (e) {
                  alert(`Erro: ${(e as Error).message}`);
                }
              }}
            />
          ) : tab === "promo" ? (
            <div style={{
              maxWidth: 520, margin: "20px auto",
              background: "linear-gradient(160deg, #0f0820, #1a0f38 60%, #2a1a52)",
              border: "2px solid #4ade80", borderRadius: 14, padding: 24,
              boxShadow: "0 0 24px rgba(74,222,128,0.25)",
            }}>
              <div style={{ color: "#4ade80", fontWeight: 900, fontSize: 15, letterSpacing: 1.5, textAlign: "center", marginBottom: 16 }}>
                🎉 CÓDIGO PROMOCIONAL
              </div>
              <input
                value={props.codeInput ?? ""}
                onChange={(e) => props.setCodeInput?.(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") props.onRedeemCode?.(props.codeInput ?? ""); }}
                placeholder="Digite seu código"
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "rgba(10,5,25,0.9)", color: "#fff",
                  border: "1.5px solid #4ade8055", borderRadius: 10,
                  fontSize: 15, fontWeight: 800, letterSpacing: 1.5, textAlign: "center",
                }}
              />
              <button
                onClick={() => props.onRedeemCode?.(props.codeInput ?? "")}
                style={{
                  marginTop: 12, width: "100%",
                  background: "linear-gradient(135deg, #4ade80, #22c55e)",
                  border: "1.5px solid #86efac", color: "#0a0512",
                  fontWeight: 900, fontSize: 13, letterSpacing: 1.5,
                  borderRadius: 10, padding: "12px", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(74,222,128,0.4)",
                }}
              >RESGATAR</button>
              {props.codeMsg && (
                <div style={{
                  marginTop: 12, padding: "10px 12px",
                  background: props.codeMsg.kind === "ok" ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${props.codeMsg.kind === "ok" ? "#4ade80" : "#ef4444"}`,
                  color: props.codeMsg.kind === "ok" ? "#86efac" : "#fca5a5",
                  borderRadius: 8, fontSize: 12, fontWeight: 800, textAlign: "center",
                }}>{props.codeMsg.text}</div>
              )}
            </div>
          ) : loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#a89cc9", fontSize: 13 }}>
              ⏳ Carregando produtos...
            </div>
          ) : visibleProducts.length === 0 ? (
            <div style={{
              textAlign: "center", padding: 60, color: "#a89cc9",
              background: "rgba(20,10,40,0.4)", border: "1px dashed #a78bfa55",
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📦</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#c8b8e8", marginBottom: 6 }}>
                Nenhum produto disponível nesta categoria.
              </div>
              <div style={{ fontSize: 11, color: "#8b7ba8", lineHeight: 1.5 }}>
                {dbError
                  ? `⚠️ Tabela cash_products não configurada. Rode SUPABASE_CASH_SHOP.sql no Supabase.`
                  : "Adicione produtos na tabela cash_products no Supabase para exibi-los aqui."}
              </div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 14,
            }}>
              {visibleProducts.map((p) => (
                <ProductCard key={p.id} p={p} onBuy={() => handleBuy(p)} canAfford={canAfford(p)} />
              ))}
            </div>
          )}

          {/* ADMIN PANEL — only for admins */}
          {isAdmin && <AdminPanel identity={identity} />}
        </div>
      </div>
    </div>
  );
}

export default CashShopModal;
