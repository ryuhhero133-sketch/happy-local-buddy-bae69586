// LOJINHA CASH — Premium redesign (Black Mythic Plus edition)
// Design: glassmorphism, particles, framer-motion, cinematic banner.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import blackEggImg from "@/assets/black-mythic-plus-egg.jpg";
import rubyVipImg from "@/assets/ruby-vip.jpg";
import rubyPackImg from "@/assets/ruby-pack.jpg";
import chestEmeraldImg from "@/assets/chest-emerald.png";
import packUltraballImg from "@/assets/pack-ultraball.png";
import orb24hImg from "@/assets/orb-24h.png";
import incense24hImg from "@/assets/incense-24h.png";

// Mantém tipos exportados p/ compat externa (não usados internamente agora)
export type CashProduct = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  image_url: string | null;
  currency: string;
  price: number;
  discount_pct: number | null;
  grants: Record<string, number> | null;
  active: boolean;
  sort: number | null;
  badge: string | null;
  payment_link_url?: string | null;
  price_brl?: number | null;
  payment_method?: string | null;
};
export type PendingPurchase = {
  id: string; user_id: string; username: string; product_id: string; product_name: string;
  price_brl: number | null; payment_method: string | null; payment_link_url: string | null;
  transaction_ref: string | null; grants: Record<string, number>;
  status: "analise" | "approved" | "rejected" | "expired";
  admin_note: string | null; approved_by: string | null;
  created_at: string; expires_at: string; resolved_at: string | null;
};
export type Wallet = {
  coins: number; crystals: number; sapphires?: number; tokens?: number;
  tickets?: number; cash?: number; level?: number; xp?: number; xpNext?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  identity: { id: string; name: string } | null;
  wallet: { coins: number; crystals: number; level: number; xp: number; xpNext: number; safiras?: number };
  onGrantCoins: (n: number) => void;
  onGrantCrystals: (n: number) => void;
  onGrantItem: (id: string, qty: number) => void;
  onSpendSafiras?: (n: number) => boolean;
  codeInput: string;
  setCodeInput: (v: string) => void;
  codeMsg: string | { kind: "err" | "ok"; text: string } | null;
  onRedeemCode: () => void;
};


// ---------- Produtos ----------
// PicPay — link do BLACK MYTHIC PLUS (R$347)
const PAYMENT_LINK_BLACK = "https://link.picpay.com/p/17846742186a5ff7aa48373";
// PicPay — link dos demais pacotes (Ruby / Ruby+VIP)
const PAYMENT_LINK_STANDARD = "https://link.picpay.com/p/17846738126a5ff61491b33";
// PicPay — link exclusivo do pacote Ruby (2000 Rubys, R$75)
const PAYMENT_LINK_RUBY = "https://link.picpay.com/p/17846511816a5f9dad66e61";

type Product = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  image: string;
  badge?: string;
  limited?: number;
  description: string;
  link: string;
  accent: string; // gradient
};

const PRODUCTS: Product[] = [
  {
    id: "ruby_vip",
    name: "Ruby + VIP",
    subtitle: "Melhor custo-benefício",
    price: 50,
    image: rubyVipImg,
    badge: "MAIS VENDIDO",
    description: "Pacote com Rubys premium + VIP incluso. Bônus de XP, Gold e recompensas exclusivas.",
    link: PAYMENT_LINK_STANDARD,
    accent: "from-amber-500 via-rose-500 to-red-600",
  },
  {
    id: "ruby",
    name: "Ruby",
    subtitle: "2.000 Rubys",
    price: 75,
    image: rubyPackImg,
    description: "Pacote generoso com 2.000 Rubys para gastar como quiser dentro da loja premium.",
    link: PAYMENT_LINK_RUBY,
    accent: "from-rose-500 via-red-500 to-red-700",
  },
  {
    id: "black_mythic_plus",
    name: "BLACK MYTHIC PLUS",
    subtitle: "Edição Limitada — 30 unidades",
    price: 347,
    image: blackEggImg,
    badge: "⭐ EDIÇÃO LIMITADA",
    limited: 30,
    description:
      "O ovo mais raro já lançado no IdleMon. Possui Pokémon exclusivos, nunca voltará à loja. Quem comprar fará parte da primeira geração de treinadores lendários.",
    link: PAYMENT_LINK_BLACK,
    accent: "from-yellow-400 via-amber-500 to-yellow-600",
  },
];


// ---------- Estoque (localStorage) ----------
// Total 30, 20 já vendidas — restam 10.
const STOCK_TOTAL = 30;
const STOCK_SOLD_INITIAL = 20;
const STOCK_KEY = "rubym.cashshop.blackmythic.stock.v2";
function readStock(): number {
  try {
    const v = localStorage.getItem(STOCK_KEY);
    if (v == null) return STOCK_TOTAL - STOCK_SOLD_INITIAL; // 10
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(STOCK_TOTAL, n)) : (STOCK_TOTAL - STOCK_SOLD_INITIAL);
  } catch { return STOCK_TOTAL - STOCK_SOLD_INITIAL; }
}

// ---------- Moeda Esmeralda (visível apenas neste painel) ----------
const EMERALD_KEY = "rubym.cashshop.emerald.v1";
function readEmerald(): number {
  try {
    const v = localStorage.getItem(EMERALD_KEY);
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch { return 0; }
}
function writeEmerald(n: number) {
  try { localStorage.setItem(EMERALD_KEY, String(Math.max(0, Math.floor(n)))); } catch { /* ignore */ }
}

// Taxas de conversão
const SAFIRA_PER_EMERALD = 20;   // 20 Safiras Verdes → 1 Esmeralda
const EMERALD_PER_ULTRAPACK = 3; // 3 Esmeraldas → 100 Ultra Balls
const ULTRAPACK_SIZE = 100;



// ---------- Chat suporte ----------
type ChatMsg = { id: string; from: "user" | "support"; text: string; ts: number; image?: string };
const CHAT_KEY = (uid: string) => `rubym.cashshop.chat.v1.${uid}`;

function loadChat(uid: string): ChatMsg[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY(uid));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveChat(uid: string, msgs: ChatMsg[]) {
  try { localStorage.setItem(CHAT_KEY(uid), JSON.stringify(msgs.slice(-100))); } catch { /* ignore */ }
}

// ---------- Partículas ----------
function Particles({ density = 40 }: { density?: number }) {
  const arr = useMemo(() => Array.from({ length: density }, (_, i) => i), [density]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {arr.map((i) => {
        const size = Math.random() * 3 + 1;
        const dur = Math.random() * 8 + 6;
        const delay = Math.random() * 6;
        const left = Math.random() * 100;
        const hue = Math.random() > 0.5 ? "rgba(250,204,21,0.9)" : "rgba(244,63,94,0.7)";
        return (
          <span
            key={i}
            className="absolute rounded-full blur-[1px]"
            style={{
              left: `${left}%`,
              bottom: `-10px`,
              width: `${size}px`,
              height: `${size}px`,
              background: hue,
              boxShadow: `0 0 ${size * 4}px ${hue}`,
              animation: `cashFloat ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes cashFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) translateX(20px); opacity: 0; }
        }
        @keyframes shineSweep {
          0% { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(220%) skewX(-20deg); }
        }
        @keyframes goldPulse {
          0%,100% { box-shadow: 0 0 24px rgba(250,204,21,.35), inset 0 0 20px rgba(250,204,21,.15); }
          50% { box-shadow: 0 0 44px rgba(250,204,21,.7), inset 0 0 30px rgba(250,204,21,.28); }
        }
        @keyframes bannerFloat {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.01); }
        }
      `}</style>
    </div>
  );
}

// ---------- Componente principal ----------
export function CashShopModal(props: Props) {
  const { open, onClose, identity, wallet, codeInput, setCodeInput, codeMsg, onRedeemCode, onSpendSafiras, onGrantItem } = props;
  const [selected, setSelected] = useState<Product | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [blackStock, setBlackStock] = useState<number>(readStock());
  const [emerald, setEmerald] = useState<number>(readEmerald());
  const [convMsg, setConvMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const safiras = wallet.safiras ?? 0;

  const doSafiraToEmerald = () => {
    if (safiras < SAFIRA_PER_EMERALD) {
      setConvMsg({ kind: "err", text: `Precisa de ${SAFIRA_PER_EMERALD} Safiras Verdes.` });
      return;
    }
    const ok = onSpendSafiras ? onSpendSafiras(SAFIRA_PER_EMERALD) : false;
    if (!ok) { setConvMsg({ kind: "err", text: "Não foi possível gastar suas Safiras." }); return; }
    const next = emerald + 1;
    setEmerald(next); writeEmerald(next);
    setConvMsg({ kind: "ok", text: `+1 Esmeralda! (Total: ${next})` });
  };

  const doEmeraldToUltra = () => {
    if (emerald < EMERALD_PER_ULTRAPACK) {
      setConvMsg({ kind: "err", text: `Precisa de ${EMERALD_PER_ULTRAPACK} Esmeraldas.` });
      return;
    }
    const next = emerald - EMERALD_PER_ULTRAPACK;
    setEmerald(next); writeEmerald(next);
    onGrantItem("ultraball", ULTRAPACK_SIZE);
    setConvMsg({ kind: "ok", text: `+${ULTRAPACK_SIZE} Ultra Balls entregues!` });
  };


  const uid = identity?.id ?? "guest";

  useEffect(() => {
    if (!open) return;
    setChatMsgs(loadChat(uid));
  }, [open, uid]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, supportOpen]);

  if (!open) return null;

  const sendChat = (text: string, image?: string) => {
    const msg: ChatMsg = { id: crypto.randomUUID(), from: "user", text, ts: Date.now(), image };
    const next = [...chatMsgs, msg];
    // resposta automática
    setTimeout(() => {
      const bot: ChatMsg = {
        id: crypto.randomUUID(), from: "support", ts: Date.now(),
        text: "✅ Recebemos! Nosso time analisará seu pagamento em breve. Após aprovado, enviaremos aqui o código do produto.",
      };
      const withBot = [...next, bot];
      setChatMsgs(withBot);
      saveChat(uid, withBot);
    }, 800);
    setChatMsgs(next);
    saveChat(uid, next);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Painel */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: "spring", damping: 22, stiffness: 200 }}
        className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-3xl border border-amber-500/40 shadow-[0_0_80px_rgba(250,204,21,0.35)]"
        style={{
          background:
            "linear-gradient(135deg, rgba(20,10,30,.92) 0%, rgba(10,5,15,.95) 50%, rgba(20,10,30,.92) 100%)",
        }}
      >
        {/* fundo animado */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(250,204,21,.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(139,92,246,.3), transparent 40%), radial-gradient(circle at 50% 50%, rgba(244,63,94,.2), transparent 60%)",
            }}
          />
          <Particles density={50} />
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-amber-500/25 bg-black/40 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-red-600 grid place-items-center text-lg font-black text-black shadow-lg">
              ✦
            </div>
            <div>
              <div className="text-amber-300 font-black tracking-widest text-sm sm:text-base">LOJINHA CASH</div>
              <div className="text-white/50 text-[10px] sm:text-xs tracking-wider">IDLEMON · PREMIUM STORE</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/70">
              <span className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-200">
                Nv {wallet.level}
              </span>
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                💎 {wallet.crystals.toLocaleString()}
              </span>
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                🪙 {wallet.coins.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setSupportOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold hover:bg-emerald-500/30 transition"
            >
              💬 Suporte
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-red-500/30 border border-white/10 hover:border-red-400/50 text-white/80 hover:text-white transition"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="relative z-10 overflow-y-auto max-h-[calc(95vh-64px)] px-4 sm:px-6 py-5 space-y-6">
          {/* ============ BANNER PRINCIPAL ============ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden border-2 border-amber-500/60"
            style={{ animation: "goldPulse 3.4s ease-in-out infinite" }}
          >
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9]">
              <img
                src={blackEggImg}
                alt="Black Mythic Plus"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ animation: "bannerFloat 6s ease-in-out infinite" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/40" />
              {/* Shine sweep */}
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
              >
                <div
                  className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{ animation: "shineSweep 6s ease-in-out infinite" }}
                />
              </div>

              {/* Texto */}
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-200 text-[10px] sm:text-xs font-bold tracking-widest mb-2"
                >
                  ⭐ EDIÇÃO LIMITADA · {blackStock}/{STOCK_TOTAL} · {STOCK_TOTAL - blackStock} vendidas
                </motion.div>
                <motion.h1
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="font-black text-white leading-none tracking-tight text-3xl sm:text-5xl md:text-6xl"
                  style={{ textShadow: "0 0 24px rgba(250,204,21,.6)" }}
                >
                  BLACK <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">MYTHIC PLUS</span>
                </motion.h1>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="mt-2 max-w-xl text-white/80 text-xs sm:text-sm"
                >
                  Apenas <span className="text-amber-300 font-bold">{blackStock} de {STOCK_TOTAL}</span> restantes — <span className="text-amber-300 font-bold">{STOCK_TOTAL - blackStock}</span> já vendidos.
                </motion.p>
                <motion.button
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(PRODUCTS[2])}
                  className="mt-4 self-start px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-black text-sm sm:text-base tracking-wider shadow-[0_0_30px_rgba(250,204,21,.6)] hover:shadow-[0_0_50px_rgba(250,204,21,.9)] transition"
                >
                  COMPRAR AGORA — R$347
                </motion.button>
              </div>

              {/* Contador gigante lateral */}
              <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col items-center">
                <div className="text-[10px] tracking-widest text-amber-300/80">RESTAM</div>
                <div className="text-6xl font-black text-white leading-none" style={{ textShadow: "0 0 20px rgba(250,204,21,.7)" }}>
                  {String(blackStock).padStart(2, "0")}
                </div>
                <div className="text-[10px] tracking-widest text-white/60">de {STOCK_TOTAL} unidades</div>
              </div>
            </div>
          </motion.div>

          {/* ============ PRODUTOS ============ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRODUCTS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-black/40 backdrop-blur-xl hover:border-amber-400/60 transition-all"
              >
                {/* Glow border animado */}
                <div className={`pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${p.accent} blur-md`} style={{ zIndex: 0 }} />
                <div className="relative z-10 bg-black/40 rounded-2xl overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    {p.badge && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-black text-[10px] font-black tracking-widest shadow-lg">
                        {p.badge}
                      </div>
                    )}
                    {p.limited != null && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 border border-amber-400/60 text-amber-300 text-[10px] font-bold">
                        {blackStock}/{p.limited}
                      </div>
                    )}
                    {/* Shine hover */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ animation: "shineSweep 1.6s ease-out" }} />
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div>
                      <div className="text-white font-black text-lg leading-tight">{p.name}</div>
                      <div className="text-white/50 text-xs">{p.subtitle}</div>
                    </div>
                    <div className="text-white/70 text-xs line-clamp-2 min-h-[32px]">{p.description}</div>
                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <div className="text-[10px] text-white/40">Preço</div>
                        <div className={`text-2xl font-black bg-gradient-to-r ${p.accent} bg-clip-text text-transparent`}>
                          R${p.price}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelected(p)}
                        disabled={p.id === "black_mythic_plus" && blackStock <= 0}
                        className={`px-4 py-2 rounded-lg font-black text-sm text-black bg-gradient-to-r ${p.accent} shadow-lg hover:shadow-xl transition disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {p.id === "black_mythic_plus" && blackStock <= 0 ? "ESGOTADO" : "COMPRAR"}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ============ CONVERSÃO (Safira → Esmeralda → Ultra Balls) ============ */}
          <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-900/30 via-black/50 to-emerald-950/40 backdrop-blur-xl p-4 sm:p-5 relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 15% 30%, rgba(52,211,153,.35), transparent 45%), radial-gradient(circle at 85% 70%, rgba(16,185,129,.25), transparent 50%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 grid place-items-center text-lg shadow-[0_0_16px_rgba(52,211,153,.6)]">💠</div>
                  <div>
                    <div className="text-white font-black text-sm">Painel de Conversão</div>
                    <div className="text-emerald-200/70 text-xs">Troque Safiras Verdes por Esmeraldas e itens exclusivos</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 font-bold">
                    💚 Safiras: {safiras.toLocaleString()}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-300/50 text-emerald-100 font-black shadow-[0_0_12px_rgba(52,211,153,.35)]">
                    💠 Esmeraldas: {emerald.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Safira -> Esmeralda */}
                <div className="rounded-xl border border-emerald-400/30 bg-black/50 p-3 hover:border-emerald-300/60 transition">
                  <div className="flex items-center justify-center gap-2 text-white font-bold text-sm mb-2">
                    <span className="text-lg">💚</span>
                    <span className="text-emerald-200/80">×{SAFIRA_PER_EMERALD}</span>
                    <span className="text-emerald-300">→</span>
                    <span className="text-lg">💠</span>
                    <span className="text-emerald-100">×1</span>
                  </div>
                  <div className="text-[11px] text-white/60 text-center mb-3">
                    Converta <b className="text-emerald-200">{SAFIRA_PER_EMERALD} Safiras Verdes</b> em <b className="text-emerald-100">1 Esmeralda</b>
                  </div>
                  <button
                    onClick={doSafiraToEmerald}
                    disabled={safiras < SAFIRA_PER_EMERALD}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-black font-black text-sm hover:shadow-[0_0_20px_rgba(52,211,153,.6)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    CONVERTER
                  </button>
                </div>

                {/* Esmeralda -> Ultra Balls */}
                <div className="rounded-xl border border-amber-400/30 bg-black/50 p-3 hover:border-amber-300/60 transition">
                  <div className="flex items-center justify-center gap-2 text-white font-bold text-sm mb-2">
                    <span className="text-lg">💠</span>
                    <span className="text-emerald-100">×{EMERALD_PER_ULTRAPACK}</span>
                    <span className="text-amber-300">→</span>
                    <span className="text-lg">🟣</span>
                    <span className="text-amber-100">{ULTRAPACK_SIZE} Ultra Balls</span>
                  </div>
                  <div className="text-[11px] text-white/60 text-center mb-3">
                    Troque <b className="text-emerald-100">{EMERALD_PER_ULTRAPACK} Esmeraldas</b> por <b className="text-amber-200">{ULTRAPACK_SIZE} Ultra Balls</b>
                  </div>
                  <button
                    onClick={doEmeraldToUltra}
                    disabled={emerald < EMERALD_PER_ULTRAPACK}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-black text-sm hover:shadow-[0_0_20px_rgba(250,204,21,.6)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    TROCAR
                  </button>
                </div>
              </div>

              {convMsg && (
                <div className={`mt-3 text-xs text-center font-bold ${convMsg.kind === "err" ? "text-red-400" : "text-emerald-300"}`}>
                  {convMsg.text}
                </div>
              )}

              <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white/60 text-center">
                💎 <b className="text-white/80">Compra direta com Safiras</b> · <span className="text-amber-300 font-bold">Em breve</span> — por enquanto, apenas conversões estão disponíveis.
              </div>
            </div>
          </div>


          {/* ============ CÓDIGO PROMOCIONAL ============ */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-lg">🎁</div>
              <div>
                <div className="text-white font-black text-sm">Código Promocional</div>
                <div className="text-white/50 text-xs">Resgate recompensas exclusivas</div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="DIGITE SEU CÓDIGO..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-black/60 border border-white/10 focus:border-amber-400/60 outline-none text-white font-mono text-sm tracking-widest"
              />
              <button
                onClick={onRedeemCode}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-sm hover:shadow-[0_0_20px_rgba(52,211,153,.5)] transition"
              >
                RESGATAR
              </button>
            </div>
            {codeMsg && (
              <div className={`mt-2 text-xs ${typeof codeMsg === "object" && codeMsg?.kind === "err" ? "text-red-400" : "text-amber-300"}`}>
                {typeof codeMsg === "string" ? codeMsg : codeMsg?.text}
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-white/40 pt-2 pb-4">
            Pagamentos processados via provedor externo · Após aprovação, o código do produto é enviado no chat de suporte.
          </div>
        </div>
      </motion.div>

      {/* ============ MODAL COMPRA ============ */}
      <AnimatePresence>
        {selected && (
          <PurchaseModal
            product={selected}
            defaultCharName={identity?.name ?? ""}
            onClose={() => setSelected(null)}
            onConfirm={() => {
              if (selected.id === "black_mythic_plus" && blackStock > 0) {
                const next = blackStock - 1;
                setBlackStock(next);
                try { localStorage.setItem(STOCK_KEY, String(next)); } catch { /* ignore */ }
              }
              setConfetti(true);
              setTimeout(() => setConfetti(false), 2400);
              setSelected(null);
              setSupportOpen(true);
              const sysMsg: ChatMsg = {
                id: crypto.randomUUID(), from: "support", ts: Date.now(),
                text: `📩 Pedido de "${selected.name}" (R$${selected.price}) recebido e está em ANÁLISE. Envie o comprovante do PicPay aqui neste chat para agilizar. Após aprovado, você receberá o código do produto por aqui.`,
              };
              const next = [...chatMsgs, sysMsg];
              setChatMsgs(next); saveChat(uid, next);
            }}
          />
        )}
      </AnimatePresence>

      {/* ============ PAINEL SUPORTE ============ */}
      <AnimatePresence>
        {supportOpen && (
          <SupportChat
            trainerName={identity?.name ?? "Treinador"}
            messages={chatMsgs}
            input={chatInput}
            setInput={setChatInput}
            onSend={(t, img) => { if (t.trim() || img) sendChat(t.trim(), img); setChatInput(""); }}
            onClose={() => setSupportOpen(false)}
            endRef={chatEndRef}
          />
        )}
      </AnimatePresence>

      {/* ============ CONFETES ============ */}
      <AnimatePresence>
        {confetti && <Confetti />}
      </AnimatePresence>
    </div>
  );
}

// ---------- Modal Compra ----------
function PurchaseModal({
  product, defaultCharName, onClose, onConfirm,
}: {
  product: Product;
  defaultCharName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [charName, setCharName] = useState(defaultCharName);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "await">("form");
  const [orderId, setOrderId] = useState<string>("");

  const goToPayment = () => {
    if (!charName.trim() || !email.trim() || !fullName.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido.");
      return;
    }
    setError("");
    const id = crypto.randomUUID();
    setOrderId(id);
    try { window.open(product.link, "_blank", "noopener,noreferrer"); } catch { /* ignore */ }
    // registra pedido local com status "aguardando_pagamento"
    try {
      const key = "rubym.cashshop.orders.v1";
      const arr = JSON.parse(localStorage.getItem(key) ?? "[]");
      arr.push({
        id,
        product_id: product.id,
        product_name: product.name,
        price_brl: product.price,
        payment_link: product.link,
        char_name: charName, email, full_name: fullName,
        created_at: new Date().toISOString(),
        status: "aguardando_pagamento",
      });
      localStorage.setItem(key, JSON.stringify(arr));
    } catch { /* ignore */ }
    setStep("await");
  };

  const markPaid = () => {
    // move pedido para "em_analise"
    try {
      const key = "rubym.cashshop.orders.v1";
      const arr = JSON.parse(localStorage.getItem(key) ?? "[]");
      const idx = arr.findIndex((o: { id?: string }) => o?.id === orderId);
      if (idx >= 0) {
        arr[idx].status = "em_analise";
        arr[idx].paid_at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(arr));
      }
    } catch { /* ignore */ }
    onConfirm();
  };

  const reopenLink = () => {
    try { window.open(product.link, "_blank", "noopener,noreferrer"); } catch { /* ignore */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-md rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#1a0f22] to-[#0a0510] p-6 shadow-[0_0_60px_rgba(250,204,21,.35)]"
      >
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/30 border border-white/10 text-white/80">✕</button>

        <div className="flex items-center gap-3 mb-4">
          <img src={product.image} alt="" className="w-14 h-14 rounded-xl object-cover border border-amber-400/40" />
          <div>
            <div className="text-white font-black text-lg leading-tight">{product.name}</div>
            <div className="text-amber-300 font-bold">R${product.price}</div>
          </div>
        </div>

        {step === "form" && (
          <>
            <div className="space-y-3">
              <Field label="Nome do Personagem" value={charName} onChange={setCharName} placeholder="Ex: AshKetchum" />
              <Field label="Email (Gmail)" value={email} onChange={setEmail} placeholder="voce@gmail.com" type="email" />
              <Field label="Nome Completo do Comprador" value={fullName} onChange={setFullName} placeholder="Ex: João da Silva" />
              {error && <div className="text-xs text-red-400">{error}</div>}
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={goToPayment}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-black tracking-wider hover:shadow-[0_0_30px_rgba(250,204,21,.7)] transition"
              >
                IR PARA PAGAMENTO (PicPay) →
              </button>
              <div className="text-[10px] text-white/50 text-center">
                O link do PicPay abre em uma nova aba. Depois de pagar, volte aqui e clique em <span className="text-amber-300 font-bold">"Já paguei"</span>.
              </div>
            </div>
          </>
        )}

        {step === "await" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-400/40 bg-black/50 p-4 text-center">
              <div className="text-4xl mb-1">💳</div>
              <div className="text-white font-black text-sm">Aguardando confirmação de pagamento</div>
              <div className="text-white/60 text-[11px] mt-1">
                O link do PicPay foi aberto em nova aba. Após concluir o pagamento, clique em "Já paguei" para colocar seu pedido em <span className="text-amber-300 font-bold">análise</span> e enviar o comprovante no chat.
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[.03] p-3 text-[11px] text-white/70 space-y-1">
              <div><span className="text-white/40">Pedido:</span> <span className="text-amber-300 font-mono">{orderId.slice(0, 8).toUpperCase()}</span></div>
              <div><span className="text-white/40">Personagem:</span> <span className="text-white">{charName}</span></div>
              <div><span className="text-white/40">Valor:</span> <span className="text-emerald-300 font-bold">R${product.price}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={reopenLink}
                className="py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-bold"
              >
                Reabrir link
              </button>
              <button
                onClick={markPaid}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-500 text-black font-black text-sm tracking-wider hover:shadow-[0_0_30px_rgba(52,211,153,.6)] transition"
              >
                JÁ PAGUEI ✓
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg text-white/50 hover:text-white/80 text-xs"
            >
              Cancelar
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11px] text-white/60 mb-1 tracking-wider uppercase font-bold">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 focus:border-amber-400/60 outline-none text-white text-sm"
      />
    </label>
  );
}

// ---------- Chat de suporte ----------
function SupportChat({
  trainerName, messages, input, setInput, onSend, onClose, endRef,
}: {
  trainerName: string;
  messages: ChatMsg[];
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string, image?: string) => void;
  onClose: () => void;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => onSend("📎 Comprovante enviado", String(reader.result));
    reader.readAsDataURL(f);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed bottom-4 right-4 z-[10001] w-[92vw] max-w-sm h-[70vh] max-h-[560px] rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-[#08130e] to-[#04090a] shadow-[0_0_50px_rgba(52,211,153,.35)] flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-400/20 bg-black/50">
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-lg text-black font-black">
            S
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
          </div>
          <div>
            <div className="text-white font-black text-sm">Suporte IdleMon</div>
            <div className="text-emerald-300 text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Atendente online
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/30 border border-white/10 text-white/80">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-white/50 text-xs py-8 px-4">
            Olá, <span className="text-emerald-300 font-bold">{trainerName}</span>! Envie o comprovante do seu pagamento aqui.
            Assim que aprovado, você receberá o código do produto neste chat.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              m.from === "user"
                ? "bg-gradient-to-br from-emerald-500 to-cyan-600 text-black rounded-br-sm"
                : "bg-white/5 border border-white/10 text-white/90 rounded-bl-sm"
            }`}>
              {m.image && <img src={m.image} alt="" className="rounded-lg mb-1 max-h-40 w-auto" />}
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              <div className={`text-[9px] mt-1 ${m.from === "user" ? "text-black/60" : "text-white/40"}`}>
                {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-2 border-t border-emerald-400/20 bg-black/50 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickImage(f); e.currentTarget.value = ""; }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 text-emerald-300"
          title="Anexar comprovante"
        >📎</button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSend(input); }}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-emerald-400/60 outline-none text-white text-sm"
        />
        <button
          onClick={() => onSend(input)}
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-sm"
        >Enviar</button>
      </div>
    </motion.div>
  );
}

// ---------- Confetes ----------
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 80 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 1.6 + Math.random() * 1.4,
    color: ["#facc15", "#f43f5e", "#22d3ee", "#a78bfa", "#34d399"][Math.floor(Math.random() * 5)],
    rot: Math.random() * 360,
  })), []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[10002] overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-10px] w-2 h-3 rounded-sm"
          style={{
            left: `${p.left}%`,
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            animation: `confDrop ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confDrop {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
