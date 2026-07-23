// LOJINHA CASH — Premium redesign (Black Mythic Plus edition)
// Design: glassmorphism, particles, framer-motion, cinematic banner.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchThread, sendUserMessage, sendAdminMessage, subscribeThread,
  fetchThreadsForAdmin, subscribeAll,
  fetchPendingSales, subscribePendingSales, updatePendingStatus,
  checkCashShopAdmin, getCashShopChatError, getCashShopSalesError,
  type TicketMsg, type AdminThreadSummary, type PendingSale,
} from "@/lib/cashshopChat";
import { motion, AnimatePresence } from "framer-motion";
import blackEggImg from "@/assets/black-mythic-plus-egg.jpg";
import rubyVipImg from "@/assets/ruby-vip.jpg";
import rubyEmeraldPackImg from "@/assets/ruby-emerald-pack.jpg";
import chestEmeraldImg from "@/assets/chest-emerald.png";
import packUltraballImg from "@/assets/pack-ultraball.png";
import orb24hImg from "@/assets/orb-24h.png";
import incense24hImg from "@/assets/incense-24h.png";
import emeraldCoinImg from "@/assets/emerald-coin.png";
import safiraVerdeAsset from "@/assets/icon-safira-verde.png.asset.json";
import { assetUrlFromJson } from "@/lib/assetUrl";
const SAFIRA_URL = assetUrlFromJson(safiraVerdeAsset);
import safariBallImg from "@/assets/items/icon-safariball.png";
import ultraBallIconImg from "@/assets/icon-ultraball.png";
import crystalDiamondAsset from "@/assets/icon-crystal-blue-diamond.png.asset.json";
const CRYSTAL_URL = assetUrlFromJson(crystalDiamondAsset);
import dragoniteEggImg from "@/assets/egg-dragonite-shiny.jpg";
import { emeraldKeyFor, readEmeraldFor, writeEmeraldFor } from "@/lib/emerald";

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
    name: "Ruby → Esmeralda",
    subtitle: "2.000 Rubys convertidos em 500 Esmeraldas",
    price: 75,
    image: rubyEmeraldPackImg,
    badge: "💚 CONVERSÃO 500 ESMERALDAS",
    description: "Pacote de conversão premium: 2.000 Rubys são convertidos diretamente em 500 Esmeraldas. Não entrega Ruby separado.",
    link: PAYMENT_LINK_RUBY,
    accent: "from-rose-500 via-red-500 to-emerald-600",
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
const STOCK_SOLD_INITIAL = 30;
const STOCK_KEY = "rubym.cashshop.blackmythic.stock.v3";
function readStock(): number {
  try {
    const v = localStorage.getItem(STOCK_KEY);
    if (v == null) return STOCK_TOTAL - STOCK_SOLD_INITIAL; // 10
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(STOCK_TOTAL, n)) : (STOCK_TOTAL - STOCK_SOLD_INITIAL);
  } catch { return STOCK_TOTAL - STOCK_SOLD_INITIAL; }
}

// Helpers de Esmeralda compartilhados em src/lib/emerald.ts (import no topo).

// Taxas de conversão
const SAFIRA_PER_EMERALD = 200;  // 200 Safiras Verdes → 1 Esmeralda
const EMERALD_PER_ULTRAPACK = 3; // 3 Esmeraldas → 100 Ultra Balls
const ULTRAPACK_SIZE = 100;
// Câmbio único (não reverso): 500 Esmeraldas → 30.000 Cristais
const EMERALD_PER_CRYSTAL_PACK = 500;
const CRYSTAL_PACK_SIZE = 30000;

// ---------- Ofertas em Esmeraldas ----------
type EmeraldOffer = {
  id: string;
  name: string;
  desc: string;
  price: number;         // custo em Esmeraldas
  image: string;
  grants: { itemId: string; qty: number }[];
  accent: string;        // gradient tailwind classes
};
const EMERALD_OFFERS: EmeraldOffer[] = [
  {
    id: "orb_supremo_24h",
    name: "Orb Supremo 24h",
    desc: "1× Orb Supremo 24h ✦✦✦ · +30% EXP contínuo por 24 horas",
    price: 15,
    image: orb24hImg,
    grants: [{ itemId: "orb_xp_supreme_24h", qty: 1 }],
    accent: "from-fuchsia-500 via-purple-500 to-indigo-600",
  },
  {
    id: "incenso_24h",
    name: "Incenso Raro 24h",
    desc: "1× Incenso de Mel Raro 24h ✨🍯 · atrai raros por 24 horas",
    price: 12,
    image: incense24hImg,
    grants: [{ itemId: "incenso_mel_raro_24h", qty: 1 }],
    accent: "from-amber-400 via-orange-500 to-yellow-600",
  },
  {
    id: "pack_ultra_100",
    name: "Pacote 100 Ultra",
    desc: "100× Ultra Ball · entrega instantânea",
    price: 3,
    image: packUltraballImg,
    grants: [{ itemId: "ultraball", qty: 100 }],
    accent: "from-emerald-400 via-teal-500 to-cyan-600",
  },
  {
    id: "pack_ultra_500",
    name: "Pacote 500 Ultra",
    desc: "500× Ultra Ball · melhor custo-benefício",
    price: 12,
    image: packUltraballImg,
    grants: [{ itemId: "ultraball", qty: 500 }],
    accent: "from-emerald-500 via-green-500 to-lime-500",
  },
  {
    id: "bau_esmeralda",
    name: "Baú de Esmeralda",
    desc: "Loot aleatório ✦ 4k Great, 3k Ultra, Orbs, Stones Elementais (10/50), Cristais e mais",
    price: 20,
    image: chestEmeraldImg,
    grants: [{ itemId: "premium_box", qty: 1 }], // fallback (rota randômica no handler)
    accent: "from-emerald-400 via-green-500 to-emerald-700",
  },
  {
    id: "ovo_mitico_aleatorio",
    name: "Ovo Mítico Aleatório",
    desc: "1× Ovo Místico ✦ · espécie aleatória com chance mítica",
    price: 400,
    image: blackEggImg,
    grants: [{ itemId: "egg_mystic", qty: 1 }],
    accent: "from-fuchsia-500 via-purple-500 to-pink-600",
  },
  {
    id: "ovo_dragonite_shiny",
    name: "Ovo Mítico Shiny Dragonite",
    desc: "1× Ovo Mítico Shiny Dragonite ✦ · choca um Dragonite Shiny mítico nível 100",
    price: 500,
    image: dragoniteEggImg,
    grants: [{ itemId: "egg_dragonite", qty: 1 }],
    accent: "from-amber-400 via-orange-500 to-rose-600",
  },
  {
    id: "safari_ball_pack",
    name: "Safari Ball",
    desc: "Nova pokébola exclusiva de eventos safári · em breve",
    price: 999,
    image: safariBallImg,
    grants: [{ itemId: "safariball", qty: 20 }],
    accent: "from-lime-500 via-green-500 to-emerald-600",
  },
];



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
  const { open, onClose, identity, wallet, codeInput, setCodeInput, codeMsg, onRedeemCode, onSpendSafiras, onGrantItem, onGrantCoins, onGrantCrystals } = props;
  const [selected, setSelected] = useState<Product | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [blackStock, setBlackStock] = useState<number>(readStock());
  const emeraldUid = identity?.id ?? null;
  const [emerald, setEmerald] = useState<number>(() => readEmeraldFor(emeraldUid));

  // Ao trocar de conta / hidratar identidade: recarrega saldo por-uid e reconcilia com o
  // espelho salvo no user_metadata (mantém o maior — evita perder saldo entre devices).
  useEffect(() => {
    if (!emeraldUid) return;
    const local = readEmeraldFor(emeraldUid);
    setEmerald(local);
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        const remote = Number((data?.user?.user_metadata as { emeralds?: number } | null)?.emeralds ?? 0);
        const merged = Math.max(local, Number.isFinite(remote) ? remote : 0);
        if (merged !== local) {
          setEmerald(merged);
          try { localStorage.setItem(emeraldKeyFor(emeraldUid), String(merged)); } catch { /* ignore */ }
        }
      }).catch(() => { /* offline: ok */ });
    }).catch(() => { /* ignore */ });
  }, [emeraldUid]);
  const writeEmerald = (n: number) => writeEmeraldFor(emeraldUid, n);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _readEmeraldNoop = () => readEmeraldFor(emeraldUid);
  const [convMsg, setConvMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [purchaseToast, setPurchaseToast] = useState<{ title: string; subtitle?: string; kind: "ok" | "wait" } | null>(null);
  const lastBuyAtRef = useRef(0);
  const BUY_COOLDOWN_MS = 2000;
  useEffect(() => {
    if (!purchaseToast) return;
    const t = setTimeout(() => setPurchaseToast(null), purchaseToast.kind === "wait" ? 1400 : 2200);
    return () => clearTimeout(t);
  }, [purchaseToast]);
  const guardCooldown = (): boolean => {
    const now = Date.now();
    const diff = now - lastBuyAtRef.current;
    if (diff < BUY_COOLDOWN_MS) {
      const s = Math.max(1, Math.ceil((BUY_COOLDOWN_MS - diff) / 1000));
      setPurchaseToast({ kind: "wait", title: "Aguarde um instante...", subtitle: `Nova compra em ${s}s` });
      return false;
    }
    lastBuyAtRef.current = now;
    return true;
  };
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

  const doEmeraldToCrystal = () => {
    if (emerald < EMERALD_PER_CRYSTAL_PACK) {
      setConvMsg({ kind: "err", text: `Precisa de ${EMERALD_PER_CRYSTAL_PACK} Esmeraldas.` });
      return;
    }
    if (!guardCooldown()) return;
    const next = emerald - EMERALD_PER_CRYSTAL_PACK;
    setEmerald(next); writeEmerald(next);
    onGrantCrystals(CRYSTAL_PACK_SIZE);
    setConvMsg({ kind: "ok", text: `+${CRYSTAL_PACK_SIZE.toLocaleString()} Cristais entregues! (câmbio único — cristais não voltam a Esmeraldas)` });
    setPurchaseToast({ kind: "ok", title: "Câmbio concluído!", subtitle: `+${CRYSTAL_PACK_SIZE.toLocaleString()} 💎 por ${EMERALD_PER_CRYSTAL_PACK} 💠` });
  };

  const buyEmeraldOffer = (offer: EmeraldOffer) => {
    if (emerald < offer.price) {
      setConvMsg({ kind: "err", text: `Precisa de ${offer.price} Esmeraldas para ${offer.name}.` });
      return;
    }
    if (!guardCooldown()) return;
    const next = emerald - offer.price;
    setEmerald(next); writeEmerald(next);

    // Baú de Esmeralda → entrega o item na mochila (o jogador abre na Bag)
    if (offer.id === "bau_esmeralda") {
      onGrantItem("bau_esmeralda", 1);
      setConvMsg({ kind: "ok", text: `💠 Baú de Esmeralda entregue na Mochila! Abra pela Bag para ver seu loot.` });
      setPurchaseToast({ kind: "ok", title: "Compra realizada!", subtitle: `💠 Baú de Esmeralda entregue na Mochila` });
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1600);
      return;
    }

    for (const g of offer.grants) onGrantItem(g.itemId, g.qty);
    const parts = offer.grants.map((g) => `+${g.qty}× ${g.itemId}`).join(", ");
    setConvMsg({ kind: "ok", text: `${offer.name} entregue! ${parts}` });
    setPurchaseToast({ kind: "ok", title: "Compra realizada!", subtitle: `${offer.name} · ${parts}` });
    setConfetti(true);
    setTimeout(() => setConfetti(false), 1600);
  };


  const uid = identity?.id ?? "guest";
  const isLocalCashAdmin = typeof window !== "undefined"
    && localStorage.getItem("rubym.cashShop.isAdmin") === "1"
    && (!localStorage.getItem("rubym.cashShop.adminOwner") || localStorage.getItem("rubym.cashShop.adminOwner") === uid);
  const [isDbCashAdmin, setIsDbCashAdmin] = useState(false);
  const [adminRoleError, setAdminRoleError] = useState<string | null>(null);
  const [adminTicketsError, setAdminTicketsError] = useState<string | null>(null);
  const [adminSalesError, setAdminSalesError] = useState<string | null>(null);
  const isCashAdmin = isLocalCashAdmin || isDbCashAdmin;

  // Alvo do painel admin (uid do jogador cujo ticket está sendo lido)
  const [adminTargetUid, setAdminTargetUid] = useState<string | null>(null);
  const [adminTargetName, setAdminTargetName] = useState<string>("");
  const [adminThreads, setAdminThreads] = useState<AdminThreadSummary[]>([]);
  const [adminTab, setAdminTab] = useState<"tickets" | "sales">("tickets");
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  // Uid efetivamente exibido no painel de chat
  const chatUid = isCashAdmin ? adminTargetUid : uid;

  const ticketToChat = (t: TicketMsg): ChatMsg => ({
    id: t.id,
    from: t.from_role,
    text: t.text,
    ts: new Date(t.created_at).getTime(),
    image: t.image ?? undefined,
  });

  // Carrega lista de tickets (admin) ao abrir
  const reloadAdminList = useCallback(async () => {
    if (!isCashAdmin) return;
    const list = await fetchThreadsForAdmin();
    setAdminThreads(list);
    setAdminTicketsError(getCashShopChatError());
  }, [isCashAdmin]);

  const reloadPendingSales = useCallback(async () => {
    if (!isCashAdmin) return;
    const list = await fetchPendingSales();
    setPendingSales(list);
    setAdminSalesError(getCashShopSalesError());
  }, [isCashAdmin]);

  useEffect(() => {
    if (!open) return;
    if (!uid || uid === "guest" || uid.startsWith("guest-")) {
      setIsDbCashAdmin(false);
      return;
    }
    let alive = true;
    (async () => {
      const res = await checkCashShopAdmin(uid);
      if (!alive) return;
      setIsDbCashAdmin(res.ok);
      setAdminRoleError(res.error);
      if (res.ok && typeof window !== "undefined") {
        try {
          localStorage.setItem("rubym.cashShop.isAdmin", "1");
          localStorage.setItem("rubym.cashShop.adminOwner", uid);
        } catch { /* ignore */ }
      }
    })();
    return () => { alive = false; };
  }, [open, uid]);

  useEffect(() => {
    if (!open) return;
    if (isCashAdmin) {
      reloadAdminList();
      reloadPendingSales();
      const unsub1 = subscribeAll(() => { reloadAdminList(); });
      const unsub2 = subscribePendingSales(() => { reloadPendingSales(); });
      // fallback: refresh periódico caso realtime não esteja habilitado na tabela
      const iv = window.setInterval(() => { reloadAdminList(); reloadPendingSales(); }, 15000);
      return () => { unsub1(); unsub2(); window.clearInterval(iv); };
    }
  }, [open, isCashAdmin, reloadAdminList, reloadPendingSales]);

  // Carrega thread ativa + subscribe
  useEffect(() => {
    if (!open) return;
    if (!chatUid || chatUid === "guest") { setChatMsgs([]); return; }
    let alive = true;
    (async () => {
      const rows = await fetchThread(chatUid);
      if (!alive) return;
      setChatMsgs(rows.map(ticketToChat));
    })();
    const unsub = subscribeThread(chatUid, (row) => {
      setChatMsgs((prev) =>
        prev.some((m) => m.id === row.id) ? prev : [...prev, ticketToChat(row)],
      );
    });
    return () => { alive = false; unsub(); };
  }, [open, chatUid]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, supportOpen]);

  if (!open) return null;

  const sendChat = async (text: string, image?: string) => {
    if (!text.trim() && !image) return;
    if (isCashAdmin) {
      if (!adminTargetUid) return;
      const optimistic: ChatMsg = { id: crypto.randomUUID(), from: "support", text, ts: Date.now(), image };
      setChatMsgs((prev) => [...prev, optimistic]);
      await sendAdminMessage(adminTargetUid, identity?.name ?? "Suporte", text, image);
      reloadAdminList();
      return;
    }
    if (!uid || uid === "guest" || uid.startsWith("guest-")) {
      setConvMsg({ kind: "err", text: "Faça login com uma conta (não convidado) para falar com o suporte." });
      return;
    }
    const optimisticId = crypto.randomUUID();
    const optimistic: ChatMsg = { id: optimisticId, from: "user", text, ts: Date.now(), image };
    setChatMsgs((prev) => [...prev, optimistic]);
    const ok = await sendUserMessage(uid, identity?.name ?? "Treinador", text, image);
    if (!ok) {
      // Reverte otimista e mostra erro real do Supabase
      setChatMsgs((prev) => prev.filter((m) => m.id !== optimisticId));
      const err = getCashShopChatError() ?? "Erro desconhecido ao enviar mensagem.";
      setConvMsg({ kind: "err", text: `Falha ao enviar: ${err}` });
    }
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
              <div className="text-amber-300 font-black tracking-widest text-sm sm:text-base flex items-center gap-2">
                LOJINHA CASH
                {isCashAdmin && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-[0_0_10px_rgba(217,70,239,0.6)] border border-fuchsia-300/60">
                    ★ ADMIN
                  </span>
                )}
              </div>
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
                  disabled
                  className="mt-4 self-start px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white/60 font-black text-sm sm:text-base tracking-wider cursor-not-allowed"
                >
                  ESGOTADO
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
                        disabled={p.id === "black_mythic_plus"}
                        className={`px-4 py-2 rounded-lg font-black text-sm text-black bg-gradient-to-r ${p.accent} shadow-lg hover:shadow-xl transition disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {p.id === "black_mythic_plus" ? "ESGOTADO" : "COMPRAR"}
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
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <img src={emeraldCoinImg} alt="Esmeralda" width={48} height={48} loading="lazy" className="w-12 h-12 drop-shadow-[0_0_14px_rgba(52,211,153,0.95)] animate-pulse" style={{ imageRendering: "pixelated" }} />
                  <div>
                    <div className="text-white font-black text-base sm:text-lg tracking-wide">Painel de Conversão</div>
                    <div className="text-emerald-200/70 text-xs">Troque Safiras Verdes por Esmeraldas e itens exclusivos</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/40 text-emerald-100 font-bold flex items-center gap-2">
                    <img src={SAFIRA_URL} alt="Safira" width={22} height={22} loading="lazy" style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 6px #6ee7a8cc)" }} />
                    {safiras.toLocaleString()}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-300/50 text-emerald-100 font-black shadow-[0_0_12px_rgba(52,211,153,.35)] flex items-center gap-2">
                    <img src={emeraldCoinImg} alt="Esmeralda" width={22} height={22} loading="lazy" style={{ imageRendering: "pixelated" }} />
                    {emerald.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Safira -> Esmeralda */}
                <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-950/70 to-black/60 p-4 hover:border-emerald-300/70 hover:shadow-[0_0_24px_rgba(52,211,153,.35)] transition group">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="flex flex-col items-center">
                      <img src={SAFIRA_URL} alt="Safira" width={56} height={56} loading="lazy" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(110,231,168,0.9)] group-hover:scale-110 transition" style={{ imageRendering: "pixelated" }} />
                      <span className="text-emerald-200 font-black text-xs mt-1">×{SAFIRA_PER_EMERALD}</span>
                    </div>
                    <span className="text-emerald-300 text-2xl font-black">→</span>
                    <div className="flex flex-col items-center">
                      <img src={emeraldCoinImg} alt="Esmeralda" width={56} height={56} loading="lazy" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(52,211,153,1)] animate-pulse" style={{ imageRendering: "pixelated" }} />
                      <span className="text-emerald-100 font-black text-xs mt-1">×1</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-white/60 text-center mb-3">
                    Converta <b className="text-emerald-200">{SAFIRA_PER_EMERALD} Safiras Verdes</b> em <b className="text-emerald-100">1 Esmeralda</b>
                  </div>
                  <button
                    onClick={doSafiraToEmerald}
                    disabled={safiras < SAFIRA_PER_EMERALD}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-black font-black text-sm hover:shadow-[0_0_20px_rgba(52,211,153,.6)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    CONVERTER
                  </button>
                </div>

                {/* Esmeralda -> Ultra Balls */}
                <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-950/50 to-black/60 p-4 hover:border-amber-300/70 hover:shadow-[0_0_24px_rgba(250,204,21,.3)] transition group">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="flex flex-col items-center">
                      <img src={emeraldCoinImg} alt="Esmeralda" width={56} height={56} loading="lazy" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(52,211,153,1)]" style={{ imageRendering: "pixelated" }} />
                      <span className="text-emerald-100 font-black text-xs mt-1">×{EMERALD_PER_ULTRAPACK}</span>
                    </div>
                    <span className="text-amber-300 text-2xl font-black">→</span>
                    <div className="flex flex-col items-center">
                      <img src={ultraBallIconImg} alt="Ultra Ball" width={56} height={56} loading="lazy" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(250,204,21,.8)] group-hover:scale-110 transition" style={{ imageRendering: "pixelated" }} />
                      <span className="text-amber-100 font-black text-xs mt-1">×{ULTRAPACK_SIZE}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-white/60 text-center mb-3">
                    Troque <b className="text-emerald-100">{EMERALD_PER_ULTRAPACK} Esmeraldas</b> por <b className="text-amber-200">{ULTRAPACK_SIZE} Ultra Balls</b>
                  </div>
                  <button
                    onClick={doEmeraldToUltra}
                    disabled={emerald < EMERALD_PER_ULTRAPACK}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-black text-sm hover:shadow-[0_0_20px_rgba(250,204,21,.6)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    TROCAR
                  </button>
                </div>

                {/* Esmeralda -> Cristais (câmbio único, não reverso) */}
                <div className="rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/50 to-black/60 p-4 hover:border-cyan-300/70 hover:shadow-[0_0_24px_rgba(56,189,248,.35)] transition group">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="flex flex-col items-center">
                      <img src={emeraldCoinImg} alt="Esmeralda" width={56} height={56} loading="lazy" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(52,211,153,1)]" style={{ imageRendering: "pixelated" }} />
                      <span className="text-emerald-100 font-black text-xs mt-1">×{EMERALD_PER_CRYSTAL_PACK}</span>
                    </div>
                    <span className="text-cyan-300 text-2xl font-black">→</span>
                    <div className="flex flex-col items-center">
                      <img src={CRYSTAL_URL} alt="Cristal" width={56} height={56} loading="lazy" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(56,189,248,.9)] group-hover:scale-110 transition" style={{ imageRendering: "pixelated" }} />
                      <span className="text-cyan-100 font-black text-xs mt-1">×{CRYSTAL_PACK_SIZE.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-white/60 text-center mb-3">
                    Câmbio <b className="text-cyan-200">único</b>: {EMERALD_PER_CRYSTAL_PACK} Esmeraldas → <b className="text-cyan-100">{CRYSTAL_PACK_SIZE.toLocaleString()} Cristais</b>. Cristais <b className="text-white/80">não</b> voltam a Esmeraldas.
                  </div>
                  <button
                    onClick={doEmeraldToCrystal}
                    disabled={emerald < EMERALD_PER_CRYSTAL_PACK}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-600 text-black font-black text-sm hover:shadow-[0_0_20px_rgba(56,189,248,.6)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    CAMBIAR
                  </button>
                </div>
              </div>

              {convMsg && (
                <div className={`mt-3 text-xs text-center font-bold ${convMsg.kind === "err" ? "text-red-400" : "text-emerald-300"}`}>
                  {convMsg.text}
                </div>
              )}
            </div>
          </div>




          {/* ============ OFERTAS EM ESMERALDAS ============ */}
          <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-950/60 via-black/60 to-emerald-900/40 backdrop-blur-xl p-4 sm:p-5 relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, rgba(52,211,153,.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(16,185,129,.25), transparent 50%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <img src={emeraldCoinImg} alt="Esmeralda" width={40} height={40} loading="lazy" className="w-10 h-10 drop-shadow-[0_0_12px_rgba(52,211,153,1)] animate-pulse" style={{ imageRendering: "pixelated" }} />
                  <div>
                    <div className="text-white font-black text-sm tracking-wide">Ofertas em Esmeraldas</div>
                    <div className="text-emerald-200/70 text-xs">Itens exclusivos entregues na hora · sem espera</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-300/50 text-emerald-100 font-black text-xs shadow-[0_0_12px_rgba(52,211,153,.35)] flex items-center gap-1.5">
                  <img src={emeraldCoinImg} alt="" width={16} height={16} loading="lazy" style={{ imageRendering: "pixelated" }} />
                  {emerald.toLocaleString()} Esmeraldas
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {EMERALD_OFFERS.map((o) => {
                  const blocked = o.id === "ovo_mitico_aleatorio" || o.id === "safari_ball_pack";
                  const canBuy = !blocked && emerald >= o.price;
                  return (
                    <div
                      key={o.id}
                      className={"group relative rounded-xl border border-emerald-400/30 bg-gradient-to-b from-black/70 to-emerald-950/40 p-3 flex flex-col transition " + (blocked ? "opacity-60" : "hover:border-emerald-300/70 hover:shadow-[0_0_24px_rgba(52,211,153,.35)]")}
                    >
                      <div className={`pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${o.accent} blur-md -z-0`} />
                      <div className="relative aspect-square rounded-lg bg-gradient-to-br from-black/80 to-emerald-950/60 border border-emerald-400/20 overflow-hidden mb-2 grid place-items-center">
                        <img
                          src={o.image}
                          alt={o.name}
                          loading="lazy"
                          width={128}
                          height={128}
                          className={"w-[85%] h-[85%] object-contain drop-shadow-[0_0_10px_rgba(52,211,153,.55)] transition-transform " + (blocked ? "grayscale" : "group-hover:scale-105")}
                        />
                        {blocked && (
                          <div className="absolute inset-0 grid place-items-center bg-black/60">
                            <span className="px-2 py-0.5 rounded-md bg-red-500/80 text-white text-[10px] font-black tracking-widest">ESGOTADO</span>
                          </div>
                        )}
                      </div>
                      <div className="relative text-white font-black text-[13px] leading-tight mb-0.5">{o.name}</div>
                      <div className="relative text-white/60 text-[10.5px] leading-snug mb-2 line-clamp-2">{o.desc}</div>
                      <div className="relative flex items-center justify-between gap-2 mt-auto">
                        <span className="text-emerald-200 font-black text-sm">💠 {o.price}</span>
                        <button
                          onClick={() => !blocked && buyEmeraldOffer(o)}
                          disabled={!canBuy}
                          className={
                            "relative px-3 py-1.5 rounded-lg font-black text-[11px] tracking-widest transition " +
                            (canBuy
                              ? "text-black bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 shadow-[0_0_18px_rgba(52,211,153,.85)] hover:shadow-[0_0_28px_rgba(52,211,153,1)] animate-[emeraldPulse_1.6s_ease-in-out_infinite]"
                              : "text-white/50 bg-white/5 border border-white/10 cursor-not-allowed")
                          }
                        >
                          {blocked ? "ESGOTADO" : "COMPRAR"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-lg border border-emerald-400/20 bg-black/40 px-3 py-2 text-[11px] text-emerald-100/70 text-center">
                ✨ Todas as ofertas usam <b className="text-emerald-200">Esmeraldas</b>. Converta suas Safiras Verdes acima para adquirir.
              </div>
            </div>

            <style>{`
              @keyframes emeraldPulse {
                0%, 100% { box-shadow: 0 0 14px rgba(52,211,153,.7), 0 0 28px rgba(16,185,129,.35); transform: scale(1); }
                50%      { box-shadow: 0 0 22px rgba(52,211,153,1),  0 0 44px rgba(16,185,129,.55); transform: scale(1.03); }
              }
            `}</style>
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
              if (!guardCooldown()) return;
              if (selected.id === "black_mythic_plus" && blackStock > 0) {
                const next = blackStock - 1;
                setBlackStock(next);
                try { localStorage.setItem(STOCK_KEY, String(next)); } catch { /* ignore */ }
              }
              setConfetti(true);
              setTimeout(() => setConfetti(false), 2400);
              setPurchaseToast({ kind: "ok", title: "Pedido enviado!", subtitle: `${selected.name} · R$${selected.price} — aguarde aprovação no suporte` });
              const productName = selected.name;
              const productPrice = selected.price;
              setSelected(null);
              setSupportOpen(true);
              // Registra o pedido no chat (persistido → admin vê o ticket)
              const orderText = `📩 Pedido: "${productName}" — R$${productPrice}. Envio o comprovante aqui e aguardo o código.`;
              if (uid && uid !== "guest") {
                sendUserMessage(uid, identity?.name ?? "Treinador", orderText).catch(() => { /* ignore */ });
              } else {
                const sysMsg: ChatMsg = {
                  id: crypto.randomUUID(), from: "user", ts: Date.now(), text: orderText,
                };
                setChatMsgs((prev) => [...prev, sysMsg]);
              }
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
            isAdmin={isCashAdmin}
            adminThreads={adminThreads}
            adminTargetUid={adminTargetUid}
            adminTargetName={adminTargetName}
            onAdminPick={(t) => { setAdminTargetUid(t.user_id); setAdminTargetName(t.username); setAdminTab("tickets"); }}
            onAdminBack={() => { setAdminTargetUid(null); setAdminTargetName(""); }}
            adminTab={adminTab}
            onAdminTab={setAdminTab}
            pendingSales={pendingSales}
            adminRoleError={adminRoleError}
            adminTicketsError={adminTicketsError}
            adminSalesError={adminSalesError}
            onApproveSale={async (s) => {
              await updatePendingStatus(s.id, "approved", identity?.name ?? "Admin");
              await sendAdminMessage(
                s.user_id,
                identity?.name ?? "Suporte",
                `✅ Pagamento APROVADO — "${s.product_name}". Os itens foram liberados. Bom jogo!`,
              );
              reloadPendingSales();
              reloadAdminList();
            }}
            onRejectSale={async (s) => {
              const note = window.prompt("Motivo da rejeição (opcional):") ?? "";
              await updatePendingStatus(s.id, "rejected", identity?.name ?? "Admin", note);
              await sendAdminMessage(
                s.user_id,
                identity?.name ?? "Suporte",
                `❌ Pagamento REJEITADO — "${s.product_name}".${note ? ` Motivo: ${note}` : ""}`,
              );
              reloadPendingSales();
              reloadAdminList();
            }}
            onOpenSaleThread={(s) => { setAdminTargetUid(s.user_id); setAdminTargetName(s.username); setAdminTab("tickets"); }}
          />
        )}
      </AnimatePresence>


      {/* ============ CONFETES ============ */}
      <AnimatePresence>
        {confetti && <Confetti />}
      </AnimatePresence>

      {/* ============ TOAST DE COMPRA ============ */}
      <AnimatePresence>
        {purchaseToast && (
          <motion.div
            key="purchase-toast"
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="fixed inset-0 z-[10050] pointer-events-none flex items-center justify-center px-4"
          >
            <div
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-2xl px-6 py-5 min-w-[280px] max-w-[92vw] text-center backdrop-blur-xl ${
                purchaseToast.kind === "ok"
                  ? "border-emerald-300/60 bg-gradient-to-br from-emerald-500/25 via-emerald-950/70 to-black/80 shadow-[0_0_60px_rgba(52,211,153,0.55)]"
                  : "border-amber-300/60 bg-gradient-to-br from-amber-500/20 via-amber-950/70 to-black/80 shadow-[0_0_50px_rgba(251,191,36,0.45)]"
              }`}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    purchaseToast.kind === "ok"
                      ? "radial-gradient(circle at 30% 20%, rgba(52,211,153,0.55), transparent 55%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.45), transparent 55%)"
                      : "radial-gradient(circle at 30% 20%, rgba(251,191,36,0.5), transparent 55%)",
                }}
              />
              <div className="relative">
                <div className="text-3xl mb-1">
                  {purchaseToast.kind === "ok" ? "✨" : "⏳"}
                </div>
                <div
                  className={`font-black text-lg leading-tight ${
                    purchaseToast.kind === "ok" ? "text-emerald-100" : "text-amber-100"
                  }`}
                  style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
                >
                  {purchaseToast.title}
                </div>
                {purchaseToast.subtitle && (
                  <div className="mt-1 text-xs font-semibold text-white/85">
                    {purchaseToast.subtitle}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
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
  isAdmin = false, adminThreads = [], adminTargetUid = null, adminTargetName = "",
  onAdminPick, onAdminBack,
  adminTab = "tickets", onAdminTab, pendingSales = [],
  adminRoleError = null, adminTicketsError = null, adminSalesError = null,
  onApproveSale, onRejectSale, onOpenSaleThread,
}: {
  trainerName: string;
  messages: ChatMsg[];
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string, image?: string) => void;
  onClose: () => void;
  endRef: React.RefObject<HTMLDivElement | null>;
  isAdmin?: boolean;
  adminThreads?: AdminThreadSummary[];
  adminTargetUid?: string | null;
  adminTargetName?: string;
  onAdminPick?: (t: AdminThreadSummary) => void;
  onAdminBack?: () => void;
  adminTab?: "tickets" | "sales";
  onAdminTab?: (t: "tickets" | "sales") => void;
  pendingSales?: PendingSale[];
  adminRoleError?: string | null;
  adminTicketsError?: string | null;
  adminSalesError?: string | null;
  onApproveSale?: (s: PendingSale) => void;
  onRejectSale?: (s: PendingSale) => void;
  onOpenSaleThread?: (s: PendingSale) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => onSend("📎 Comprovante enviado", String(reader.result));
    reader.readAsDataURL(f);
  };

  const showList = isAdmin && !adminTargetUid;
  const salesAnalise = pendingSales.filter((s) => s.status === "analise");
  const panelError = adminTab === "sales" ? adminSalesError : adminTicketsError;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className={`fixed bottom-4 right-4 z-[10001] w-[94vw] ${isAdmin ? "sm:max-w-2xl lg:max-w-3xl" : "max-w-sm"} h-[78vh] max-h-[680px] rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-[#08130e] to-[#04090a] shadow-[0_0_50px_rgba(52,211,153,.35)] flex flex-col overflow-hidden`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-400/20 bg-black/50">
        <div className="flex items-center gap-2">
          {isAdmin && adminTargetUid && (
            <button
              onClick={() => onAdminBack?.()}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 text-emerald-300"
              title="Voltar"
            >←</button>
          )}
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-lg text-black font-black">
            {isAdmin ? "A" : "S"}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
          </div>
          <div>
            <div className="text-white font-black text-sm">
              {isAdmin
                ? (adminTargetUid ? `Ticket · ${adminTargetName || "Treinador"}` : "Painel Admin")
                : "Suporte IdleMon"}
            </div>
            <div className="text-emerald-300 text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isAdmin ? "Tickets + Vendas em análise" : "Atendente online"}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/30 border border-white/10 text-white/80">✕</button>
      </div>

      {showList && (
        <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-emerald-400/10 bg-black/35">
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
            <div className="text-[9px] uppercase tracking-widest text-emerald-200/60 font-black">Tickets abertos</div>
            <div className="text-xl font-black text-emerald-200">{adminThreads.length}</div>
          </div>
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2">
            <div className="text-[9px] uppercase tracking-widest text-amber-200/60 font-black">Vendas análise</div>
            <div className="text-xl font-black text-amber-200">{salesAnalise.length}</div>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2">
            <div className="text-[9px] uppercase tracking-widest text-cyan-200/60 font-black">Status</div>
            <div className="text-xs font-black text-cyan-100 mt-1 truncate">Admin ativo</div>
          </div>
        </div>
      )}




      {showList && (
        <div className="flex gap-1 px-2 pt-2 border-b border-emerald-400/10 bg-black/40">
          <button
            onClick={() => onAdminTab?.("tickets")}
            className={`flex-1 px-3 py-2 text-xs font-black rounded-t-lg transition ${
              adminTab === "tickets"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 border-b-transparent"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            💬 Tickets {adminThreads.length > 0 && <span className="ml-1 text-[10px] opacity-70">({adminThreads.length})</span>}
          </button>
          <button
            onClick={() => onAdminTab?.("sales")}
            className={`flex-1 px-3 py-2 text-xs font-black rounded-t-lg transition ${
              adminTab === "sales"
                ? "bg-amber-500/20 text-amber-200 border border-amber-400/40 border-b-transparent"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            💰 Vendas {salesAnalise.length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 rounded-full bg-amber-400 text-black">{salesAnalise.length}</span>
            )}
          </button>
        </div>
      )}

      {showList && adminTab === "sales" ? (
        <div className="flex-1 overflow-y-auto p-3 grid gap-2 content-start sm:grid-cols-2">
          {salesAnalise.length === 0 && (
            <div className="sm:col-span-2 text-center text-white/50 text-xs py-8 px-4">
              Nenhuma venda em análise no momento.
            </div>
          )}
          {salesAnalise.map((s) => (
            <div key={s.id} className="rounded-lg bg-white/5 border border-amber-400/20 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-white text-sm font-bold truncate">{s.username || "Treinador"}</div>
                <div className="text-amber-300 text-xs font-black">R${s.price_brl ?? "?"}</div>
              </div>
              <div className="text-white/70 text-xs mt-0.5 truncate">{s.product_name}</div>
              <div className="text-white/40 text-[10px] mt-0.5">
                {new Date(s.created_at).toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                {s.payment_method ? ` · ${s.payment_method}` : ""}
                {s.transaction_ref ? ` · ref: ${s.transaction_ref}` : ""}
              </div>
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => onApproveSale?.(s)}
                  className="flex-1 px-2 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black"
                >Aprovar</button>
                <button
                  onClick={() => onRejectSale?.(s)}
                  className="flex-1 px-2 py-1.5 rounded-md bg-red-500/80 hover:bg-red-500 text-white text-xs font-black"
                >Rejeitar</button>
                <button
                  onClick={() => onOpenSaleThread?.(s)}
                  className="px-2 py-1.5 rounded-md bg-white/10 hover:bg-emerald-500/20 text-white/80 text-xs"
                  title="Abrir chat do jogador"
                >💬</button>
              </div>
            </div>
          ))}
        </div>
      ) : showList ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {adminThreads.length === 0 && (
            <div className="text-center text-white/50 text-xs py-8 px-4">
              Nenhum ticket aberto apareceu. Se jogadores já enviaram mensagens, veja o aviso de permissão acima.
            </div>
          )}
          {adminThreads.map((t) => (
            <button
              key={t.user_id}
              onClick={() => onAdminPick?.(t)}
              className="w-full text-left px-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/15 hover:border-emerald-400/40 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-400/15 border border-emerald-300/25 text-emerald-200 font-black">💬</span>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-bold truncate">{t.username || "Treinador"}</div>
                    <div className="text-emerald-300/70 text-[10px] mt-0.5">{t.count} mensagens registradas</div>
                  </div>
                </div>
                <div className="text-white/40 text-[10px]">{new Date(t.last_ts).toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div className="text-white/60 text-xs truncate mt-2 rounded-lg bg-black/25 px-2 py-1 border border-white/5">{t.last_text}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-white/50 text-xs py-8 px-4">
              {isAdmin
                ? "Sem mensagens neste ticket ainda."
                : <>Olá, <span className="text-emerald-300 font-bold">{trainerName}</span>! Envie o comprovante do seu pagamento aqui. Assim que aprovado, você receberá o código do produto neste chat.</>}
            </div>
          )}
          {messages.map((m) => {
            // Admin: mensagens do jogador (from=user) aparecem à esquerda; as do próprio admin (from=support) à direita
            const mine = isAdmin ? m.from === "support" : m.from === "user";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  mine
                    ? "bg-gradient-to-br from-emerald-500 to-cyan-600 text-black rounded-br-sm"
                    : "bg-white/5 border border-white/10 text-white/90 rounded-bl-sm"
                }`}>
                  {m.image && <img src={m.image} alt="" className="rounded-lg mb-1 max-h-40 w-auto" />}
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  <div className={`text-[9px] mt-1 ${mine ? "text-black/60" : "text-white/40"}`}>
                    {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}


      {!showList && (
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
      )}
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
