import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import lojinhaImg from "@/assets/lojinha.png";
import ballPokeImg from "@/assets/items/icon-pokeball.png";
import ballGreatImg from "@/assets/items/icon-greatball.png";
import potionImg from "@/assets/items/icon-potion.png";
import frutaImg from "@/assets/comida/fruit_apple.png";
import sucoImg from "@/assets/comida/fruit_orange.png";
import energeticoImg from "@/assets/comida/soda_coke.png";
import refrigeranteImg from "@/assets/comida/soda_sprite.png";
import cafeImg from "@/assets/comida/coffee_espresso.png";
import boloMorangoImg from "@/assets/comida/cake_strawberry.png";

type StoreItem = {
  id: string;
  name: string;
  price: number;
  currency: "gold" | "crystals";
  image: string;
  description: string;
  buy: (quantity: number) => void;
};

type Props = {
  gold: number;
  crystals: number;
  inventory: Record<string, number>;
  onClose: () => void;
  onBuyBall: (id: "pokeball" | "greatball", quantity: number) => void;
  onBuyPotion: (quantity: number) => void;
  onBuyFood: (id: string, quantity: number) => void;
  onBuyBook: (
    id: "book_atk" | "book_def" | "book_atk_purple" | "book_def_purple" | "book_atk_gold" | "book_def_gold" | "book_exp",
    quantity: number,
  ) => void;
};

export function PokemarktNpcShop({
  gold,
  crystals,
  inventory,
  onClose,
  onBuyBall,
  onBuyPotion,
  onBuyFood,
}: Props) {
  const [selectedId, setSelectedId] = useState("pokeball");
  const [quantity, setQuantity] = useState(1);

  // 9 slots da prateleira — tudo por ouro: essenciais + comidas.
  const products = useMemo<StoreItem[]>(() => [
    { id: "pokeball", name: "Pokébola", price: 500, currency: "gold", image: ballPokeImg, description: "A bola clássica para capturas.", buy: (q) => onBuyBall("pokeball", q) },
    { id: "greatball", name: "Great Ball", price: 5000, currency: "gold", image: ballGreatImg, description: "Chance de captura duas vezes maior.", buy: (q) => onBuyBall("greatball", q) },
    { id: "potion", name: "Poção", price: 250, currency: "gold", image: potionImg, description: "Recupera 35% do HP do Pokémon.", buy: onBuyPotion },
    { id: "fruta", name: "Fruta", price: 150, currency: "gold", image: frutaImg, description: "Alimenta: +20 fome, +10 energia.", buy: (q) => onBuyFood("fruta", q) },
    { id: "suco", name: "Suco", price: 400, currency: "gold", image: sucoImg, description: "Alimenta: +40 fome, +25 energia.", buy: (q) => onBuyFood("suco", q) },
    { id: "energetico", name: "Energético", price: 900, currency: "gold", image: energeticoImg, description: "Alimenta: +10 fome, +50 energia.", buy: (q) => onBuyFood("energetico", q) },
    { id: "refrigerante", name: "Refrigerante", price: 600, currency: "gold", image: refrigeranteImg, description: "Alimenta: +20 fome, +35 energia.", buy: (q) => onBuyFood("refrigerante", q) },
    { id: "cafe", name: "Café Expresso", price: 500, currency: "gold", image: cafeImg, description: "Alimenta: +15 fome, +45 energia.", buy: (q) => onBuyFood("cafe", q) },
    { id: "bolo_morango", name: "Bolo de Morango", price: 1200, currency: "gold", image: boloMorangoImg, description: "Alimenta: +60 fome, +40 energia.", buy: (q) => onBuyFood("bolo_morango", q) },
  ], [onBuyBall, onBuyFood, onBuyPotion]);

  const selected = products.find((item) => item.id === selectedId) ?? products[0];
  if (!selected) return null;
  const total = selected.price * quantity;
  const balance = selected.currency === "gold" ? gold : crystals;
  const canBuy = balance >= total;

  return (
    <div className="fixed inset-0 z-[10020] grid place-items-center bg-black/80 p-2 sm:p-4" onClick={onClose}>
      <section
        aria-label="Loja do Pokémarkt"
        className="relative w-full max-w-[980px] overflow-hidden rounded-md border-2 border-sky-200 bg-slate-950 shadow-2xl animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={lojinhaImg} alt="Vitrine do Pokémarkt" className="block h-auto w-full select-none" draggable={false} />

        <div className="absolute left-[21%] right-[20%] top-[18%] flex h-[9%] items-center justify-center overflow-hidden px-2 text-center font-mono text-[clamp(10px,1.7vw,18px)] font-black text-white [text-shadow:2px_2px_0_#064e3b]">
          {selected.name} · {selected.currency === "gold" ? "OURO" : "CRISTAIS"}
        </div>

        <Button variant="destructive" size="icon" className="absolute right-[5%] top-[16%] z-20 h-8 w-8 border-2 border-white" onClick={onClose} title="Fechar loja">
          <X />
        </Button>

        <div className="absolute left-[10.5%] right-[9.5%] top-[35%] bottom-[10%] grid grid-cols-3 grid-rows-3 gap-x-[7%] gap-y-[10%]">
          {products.map((item) => {
            const active = item.id === selected.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Selecionar ${item.name}`}
                onClick={() => setSelectedId(item.id)}
                className={`group relative grid min-h-0 place-items-center rounded-md border-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${active ? "border-yellow-300 bg-yellow-300/20" : "border-transparent bg-slate-950/10"}`}
              >
                <img src={item.image} alt="" className="h-[70%] max-h-16 w-[70%] max-w-16 object-contain [image-rendering:pixelated] drop-shadow-lg" />
                <span className="absolute -bottom-2 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-1.5 py-0.5 text-[9px] font-bold text-white shadow group-hover:block sm:text-[10px]">{item.name}</span>
                {(inventory[item.id] ?? 0) > 0 && <span className="absolute right-0 top-0 rounded bg-emerald-500 px-1 text-[8px] font-black text-slate-950">{inventory[item.id]}</span>}
              </button>
            );
          })}
        </div>

        <div className="relative -mt-1 grid gap-2 border-t-2 border-sky-300 bg-slate-950/95 p-3 text-white sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-5">
          <div className="min-w-0">
            <div className="font-mono text-sm font-black text-emerald-300">{selected.name}</div>
            <div className="text-xs text-slate-300">{selected.description}</div>
            <div className="mt-1 flex gap-3 text-xs font-bold">
              <span className="text-yellow-300">Ouro: {Math.floor(gold).toLocaleString("pt-BR")}</span>
              <span className="text-cyan-300">Cristais: {Math.floor(crystals).toLocaleString("pt-BR")}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1" aria-label="Quantidade">
            {[1, 10, 100].map((value) => (
              <Button key={value} size="sm" variant={quantity === value ? "default" : "outline"} onClick={() => setQuantity(value)} className="h-8 px-2">×{value}</Button>
            ))}
          </div>
          <Button
            disabled={!canBuy}
            onClick={() => selected.buy(quantity)}
            className="h-10 bg-emerald-500 px-5 font-mono font-black text-slate-950 hover:bg-emerald-400"
          >
            {canBuy ? `COMPRAR · ${total.toLocaleString("pt-BR")}` : "SALDO INSUFICIENTE"}
          </Button>
        </div>
      </section>
    </div>
  );
}