import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import lojinhaImg from "@/assets/lojinha.png";
import { assetUrlFromJson } from "@/lib/assetUrl";
import clerkAsset from "@/assets/pokemarkt-clerk.png.asset.json";
import ballPokeImg from "@/assets/items/icon-pokeball.png";
import ballGreatImg from "@/assets/items/icon-greatball.png";
import ballUltraImg from "@/assets/items/icon-ultraball.png";
import potionImg from "@/assets/items/icon-potion.png";
import reviveImg from "@/assets/items/icon-revive.png";
import bookAtkImg from "@/assets/icons/book-atk.png";
import bookDefImg from "@/assets/icons/book-def.png";
import bookExpImg from "@/assets/icons/book-exp.png";
import orbMinorAsset from "@/assets/orb-xp-minor.png.asset.json";
import orbTeamAsset from "@/assets/orb-xp-team.png.asset.json";
// Comidas (sprites em src/assets/comida).
import appleImg from "@/assets/comida/fruit_apple.png";
import orangeImg from "@/assets/comida/fruit_orange.png";
import cokeImg from "@/assets/comida/soda_coke.png";
import spriteImg from "@/assets/comida/soda_sprite.png";
import espressoImg from "@/assets/comida/coffee_espresso.png";
import cakeImg from "@/assets/comida/cake_strawberry.png";
import mangoImg from "@/assets/comida/soymilk_mango.png";
import greenteaImg from "@/assets/comida/coffee_greentea.png";
import popsicleImg from "@/assets/comida/popsicle_pink.png";

type StoreItem = {
  id: string;
  name: string;
  price: number;
  currency: "gold" | "crystals";
  image: string;
  imgFilter?: string;
  description: string;
  buy: (quantity: number) => void;
};

type Props = {
  gold: number;
  crystals: number;
  inventory: Record<string, number>;
  onClose: () => void;
  onBuyBall: (id: "pokeball" | "greatball" | "ultraball", quantity: number) => void;
  onBuyPotion: (quantity: number) => void;
  onBuyRevive: (quantity: number) => void;
  onBuyFood: (id: string, quantity: number) => void;
  onBuyBook: (
    id: "book_atk" | "book_def" | "book_atk_purple" | "book_def_purple" | "book_atk_gold" | "book_def_gold" | "book_exp" | "orb_xp_minor" | "orb_team",
    quantity: number,
  ) => void;
};

// ============================================================
// ESTOQUE DA LOJINHA — 500 un por item, reseta a cada 8h
// (janelas alinhadas: 00h/08h/16h). Guardado no navegador.
// ============================================================
const STOCK_MAX = 500;
const STOCK_WINDOW_MS = 8 * 60 * 60 * 1000;
const STOCK_KEY = "pokemarkt-stock-v1";

function loadStock(): { resetAt: number; qty: Record<string, number> } {
  const now = Date.now();
  const aligned = Math.ceil(now / STOCK_WINDOW_MS) * STOCK_WINDOW_MS;
  try {
    const raw = localStorage.getItem(STOCK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { resetAt: number; qty: Record<string, number> };
      if (parsed.resetAt > now) return parsed;
    }
  } catch { /* ignora */ }
  return { resetAt: aligned, qty: {} };
}

function fmtMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

// Posição de cada produto DENTRO do quadradinho da prateleira
// (% da imagem 1536x1024 — medido na arte). Fixo em % = independe do zoom/tela.
// Ordem de leitura: fileira 1 (9 slots), fileira 2, fileira 3.
const SLOT_CX = [13.9, 21.5, 29.0, 41.2, 49.0, 56.6, 69.0, 76.4, 83.9];
const SLOT_CY = [36.4, 55.3, 73.0];
const SLOT_POS = [0, 1, 2].flatMap((r) =>
  SLOT_CX.map((cx) => ({ x: cx - 2.5, y: SLOT_CY[r] - 5.5, w: 5, h: 11 })),
);

export function PokemarktNpcShop({
  gold,
  crystals,
  inventory,
  onClose,
  onBuyBall,
  onBuyPotion,
  onBuyRevive,
  onBuyFood,
  onBuyBook,
}: Props) {
  const [selectedId, setSelectedId] = useState("pokeball");
  const [quantity, setQuantity] = useState(1);
  const [stock, setStock] = useState(loadStock);
  const [, forceTick] = useState(0);

  // Relógio do reabastecimento (atualiza 1x/min).
  useEffect(() => {
    const t = setInterval(() => forceTick((v) => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const stockOf = (id: string): number => {
    if (Date.now() >= stock.resetAt) return STOCK_MAX;
    return stock.qty[id] ?? STOCK_MAX;
  };

  const takeStock = (id: string, n: number) => {
    setStock((prev) => {
      const now = Date.now();
      const base = now >= prev.resetAt
        ? { resetAt: Math.ceil(now / STOCK_WINDOW_MS) * STOCK_WINDOW_MS, qty: {} as Record<string, number> }
        : prev;
      const cur = base.qty[id] ?? STOCK_MAX;
      const next = { resetAt: base.resetAt, qty: { ...base.qty, [id]: Math.max(0, cur - n) } };
      try { localStorage.setItem(STOCK_KEY, JSON.stringify(next)); } catch { /* ignora */ }
      return next;
    });
  };

  // Estante — fileira 1: bolas/cura/livros básicos;
  // fileira 2: orbs no lugar dos arcanos + comidas; fileira 3: comidas.
  // (fruta/suco/refeição e livros arcanos/reais saíram da vitrine.)
  const products = useMemo<StoreItem[]>(() => [
    { id: "pokeball", name: "Pokébola", price: 500, currency: "gold", image: ballPokeImg, description: "A bola clássica para capturas.", buy: (q) => onBuyBall("pokeball", q) },
    { id: "greatball", name: "Great Ball", price: 5000, currency: "gold", image: ballGreatImg, description: "Chance de captura duas vezes maior.", buy: (q) => onBuyBall("greatball", q) },
    { id: "ultraball", name: "Ultra Ball", price: 100, currency: "crystals", image: ballUltraImg, description: "Captura altíssima — 100 cristais cada.", buy: (q) => onBuyBall("ultraball", q) },
    { id: "book_atk", name: "Livro de Ataque", price: 100, currency: "crystals", image: bookAtkImg, description: "Use em 'Melhorias' (+3% dano).", buy: (q) => onBuyBook("book_atk", q) },
    { id: "book_def", name: "Livro de Defesa", price: 100, currency: "crystals", image: bookDefImg, description: "Use em 'Melhorias' (-3% dano).", buy: (q) => onBuyBook("book_def", q) },
    { id: "book_exp", name: "Livro de EXP", price: 30, currency: "crystals", image: bookExpImg, description: "+30% de EXP durante uma hora.", buy: (q) => onBuyBook("book_exp", q) },
    { id: "maca", name: "Maçã", price: 200, currency: "gold", image: appleImg, description: "Alimenta: +25 fome, +15 energia.", buy: (q) => onBuyFood("maca", q) },
    { id: "laranja", name: "Laranja", price: 200, currency: "gold", image: orangeImg, description: "Alimenta: +25 fome, +15 energia.", buy: (q) => onBuyFood("laranja", q) },
    { id: "energetico", name: "Energético", price: 900, currency: "gold", image: cokeImg, description: "Alimenta: +10 fome, +50 energia.", buy: (q) => onBuyFood("energetico", q) },
    { id: "potion", name: "Poção", price: 250, currency: "gold", image: potionImg, description: "Recupera 35% do HP do Pokémon.", buy: onBuyPotion },
    { id: "revive", name: "Revive", price: 400, currency: "gold", image: reviveImg, description: "Levanta o Pokémon desmaiado com HP cheio.", buy: onBuyRevive },
    { id: "antidoto", name: "Antídoto", price: 150, currency: "gold", image: potionImg, imgFilter: "hue-rotate(95deg) saturate(1.4)", description: "Limpa status negativos.", buy: (q) => onBuyFood("antidoto", q) },
    { id: "orb_xp_minor", name: "Orb de XP ✦", price: 100, currency: "crystals", image: assetUrlFromJson(orbMinorAsset), description: "+10% EXP por 1 hora.", buy: (q) => onBuyBook("orb_xp_minor", q) },
    { id: "orb_team", name: "Orb de Time ✦✦✦", price: 2000, currency: "crystals", image: assetUrlFromJson(orbTeamAsset), description: "Time todo ganha EXP por 3 horas.", buy: (q) => onBuyBook("orb_team", q) },
    { id: "bolo_morango", name: "Bolo de Morango", price: 1200, currency: "gold", image: cakeImg, description: "Alimenta: +60 fome, +40 energia.", buy: (q) => onBuyFood("bolo_morango", q) },
    { id: "refrigerante", name: "Refrigerante", price: 600, currency: "gold", image: spriteImg, description: "Alimenta: +20 fome, +35 energia.", buy: (q) => onBuyFood("refrigerante", q) },
    { id: "cafe", name: "Café Expresso", price: 500, currency: "gold", image: espressoImg, description: "Alimenta: +15 fome, +45 energia.", buy: (q) => onBuyFood("cafe", q) },
    { id: "picole", name: "Picolé", price: 300, currency: "gold", image: popsicleImg, description: "Alimenta: +25 fome, +20 energia.", buy: (q) => onBuyFood("picole", q) },
    { id: "cha_verde", name: "Chá Verde", price: 350, currency: "gold", image: greenteaImg, description: "Alimenta: +15 fome, +30 energia.", buy: (q) => onBuyFood("cha_verde", q) },
    { id: "leite_manga", name: "Leite de Manga", price: 700, currency: "gold", image: mangoImg, description: "Alimenta: +35 fome, +25 energia.", buy: (q) => onBuyFood("leite_manga", q) },
  ], [onBuyBall, onBuyFood, onBuyPotion, onBuyRevive, onBuyBook]);

  const selected = products.find((item) => item.id === selectedId) ?? products[0];
  if (!selected) return null;
  const total = selected.price * quantity;
  const balance = selected.currency === "gold" ? gold : crystals;
  const moneyOk = balance >= total;
  const left = stockOf(selected.id);
  const soldOut = left <= 0;
  const canBuy = moneyOk && !soldOut;
  const resetIn = Math.max(0, (Date.now() >= stock.resetAt ? STOCK_WINDOW_MS : stock.resetAt - Date.now()));
  const coin = selected.currency === "gold" ? "🪙" : "💎";
  const coinName = selected.currency === "gold" ? "ouro" : "cristais";

  const doBuy = () => {
    if (!canBuy) return;
    takeStock(selected.id, quantity);
    selected.buy(quantity);
  };

  return (
    <div className="fixed inset-0 z-[10020] grid place-items-center bg-black/80 p-2 sm:p-4" onClick={onClose}>
      <section
        aria-label="Loja do Pokémarkt"
        className="relative w-full max-w-[980px] overflow-hidden rounded-md border-2 border-sky-200 bg-slate-950 shadow-2xl animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          <img src={lojinhaImg} alt="Vitrine do Pokémarkt" className="block h-auto w-full select-none" draggable={false} />

          <div className="absolute left-[21%] right-[20%] top-[18%] flex h-[9%] items-center justify-center overflow-hidden px-2 text-center font-mono text-[clamp(10px,1.7vw,18px)] font-black text-white [text-shadow:2px_2px_0_#064e3b]">
            {selected.name} · {selected.currency === "gold" ? "OURO" : "CRISTAIS"}
          </div>

          {/* Vendedora dando boas-vindas */}
          <div className="absolute left-[1%] top-[5%] z-20 flex items-center gap-1">
            <img
              src={assetUrlFromJson(clerkAsset)}
              alt="Vendedora"
              className="h-12 w-12 rounded-full border-2 border-yellow-200 object-cover shadow-lg sm:h-14 sm:w-14"
              style={{ imageRendering: "pixelated" }}
              draggable={false}
            />
            <div className="relative rounded-lg border border-yellow-200 bg-white px-2 py-1 text-[10px] font-black text-slate-900 shadow-lg sm:text-[11px]">
              Bem-vindo ao Pokémarkt! 💰
              <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-yellow-200 bg-white" />
            </div>
          </div>

          <Button variant="destructive" size="icon" className="absolute right-[5%] top-[16%] z-20 h-8 w-8 border-2 border-white" onClick={onClose} title="Fechar loja">
            <X />
          </Button>

          <div className="absolute inset-0">
            {SLOT_POS.map((pos, i) => {
              const item = products[i];
              if (!item) {
                return (
                  <div
                    key={`soon-${i}`}
                    className="absolute grid place-items-center"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.w}%`, height: `${pos.h}%` }}
                  >
                    <span className="rounded bg-slate-950/70 px-1 text-[8px] font-black text-slate-400">EM BREVE</span>
                  </div>
                );
              }
              const active = item.id === selected.id;
              const leftQty = stockOf(item.id);
              const empty = leftQty <= 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Selecionar ${item.name}`}
                  onClick={() => setSelectedId(item.id)}
                  className="group absolute grid place-items-center rounded-md border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                  style={{
                    left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.w}%`, height: `${pos.h}%`,
                    borderColor: active ? "#fde047" : "transparent",
                    background: active ? "rgba(253,224,71,0.22)" : "transparent",
                    boxShadow: active ? "0 0 10px rgba(253,224,71,0.7)" : "none",
                    filter: empty ? "grayscale(1) opacity(0.45)" : "none",
                  }}
                >
                  <img
                    src={item.image}
                    alt=""
                    className="h-[85%] w-[85%] object-contain [image-rendering:pixelated] drop-shadow-lg"
                    style={item.imgFilter ? { filter: item.imgFilter } : undefined}
                  />
                  <span className="absolute -bottom-2 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-1.5 py-0.5 text-[9px] font-bold text-white shadow group-hover:block sm:text-[10px]">
                    {item.name} · {item.price.toLocaleString("pt-BR")}{item.currency === "gold" ? "🪙" : "💎"}
                  </span>
                  {(inventory[item.id] ?? 0) > 0 && <span className="absolute right-0 top-0 rounded bg-emerald-500 px-1 text-[8px] font-black text-slate-950">{inventory[item.id]}</span>}
                  {empty && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-600 px-1 text-[8px] font-black text-white">ESGOTADO</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative -mt-1 grid gap-2 border-t-2 border-sky-300 bg-slate-950/95 p-3 text-white sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-5">
          <div className="min-w-0">
            <div className="font-mono text-sm font-black text-emerald-300">{selected.name}</div>
            <div className="text-xs text-slate-300">{selected.description}</div>
            <div className="mt-1 font-mono text-base font-black text-yellow-300 [text-shadow:1px_1px_0_#000]">
              💰 {selected.price.toLocaleString("pt-BR")} {coin} cada
            </div>
            <div className="mt-0.5 text-[11px] font-bold text-slate-300">
              📦 Estoque: <span className={left > 0 ? "text-emerald-300" : "text-red-400"}>{left}/{STOCK_MAX}</span>
              <span className="text-slate-400"> · reabastece em {fmtMs(resetIn)}</span>
            </div>
            <div className="mt-1 flex gap-3 text-xs font-bold">
              <span className="text-yellow-300">Ouro: {Math.floor(gold).toLocaleString("pt-BR")}</span>
              <span className="text-cyan-300">Cristais: {Math.floor(crystals).toLocaleString("pt-BR")}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2" aria-label="Quantidade">
            {[1, 10, 100].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={quantity === value ? "default" : "outline"}
                onClick={() => setQuantity(value)}
                className={`h-10 min-w-12 px-3 text-sm font-black ${quantity === value ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : ""}`}
              >
                ×{value}
              </Button>
            ))}
          </div>
          <Button
            disabled={!canBuy}
            onClick={doBuy}
            className="h-12 bg-emerald-500 px-5 font-mono text-sm font-black text-slate-950 hover:bg-emerald-400"
          >
            {soldOut ? "ESGOTADO" : canBuy ? `COMPRAR ×${quantity} · ${(total).toLocaleString("pt-BR")} ${coin}` : `FALTAM ${coinName.toUpperCase()}`}
          </Button>
        </div>
      </section>
    </div>
  );
}
