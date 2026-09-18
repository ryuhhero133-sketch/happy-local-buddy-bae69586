import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import shopAsset from "@/assets/pokemarkt-shop.png.asset.json";
import ballPokeImg from "@/assets/items/icon-pokeball.png";
import ballGreatImg from "@/assets/items/icon-greatball.png";
import potionImg from "@/assets/items/icon-potion.png";
import bookAtkImg from "@/assets/icons/book-atk.png";
import bookDefImg from "@/assets/icons/book-def.png";
import bookExpImg from "@/assets/icons/book-exp.png";

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
  onBuyBook,
}: Props) {
  const [selectedId, setSelectedId] = useState("pokeball");
  const [quantity, setQuantity] = useState(1);

  const products = useMemo<StoreItem[]>(() => [
    { id: "pokeball", name: "Pokébola", price: 500, currency: "gold", image: ballPokeImg, description: "A bola clássica para capturas.", buy: (q) => onBuyBall("pokeball", q) },
    { id: "greatball", name: "Great Ball", price: 5000, currency: "gold", image: ballGreatImg, description: "Chance de captura duas vezes maior.", buy: (q) => onBuyBall("greatball", q) },
    { id: "potion", name: "Poção", price: 250, currency: "gold", image: potionImg, description: "Recupera 35% do HP do Pokémon.", buy: onBuyPotion },
    { id: "book_atk", name: "Livro de Ataque", price: 100, currency: "crystals", image: bookAtkImg, description: "+3% de dano em Melhorias.", buy: (q) => onBuyBook("book_atk", q) },
    { id: "book_def", name: "Livro de Defesa", price: 100, currency: "crystals", image: bookDefImg, description: "-3% de dano recebido em Melhorias.", buy: (q) => onBuyBook("book_def", q) },
    { id: "book_exp", name: "Livro de EXP", price: 30, currency: "crystals", image: bookExpImg, description: "+30% de EXP durante uma hora.", buy: (q) => onBuyBook("book_exp", q) },
    { id: "book_atk_purple", name: "Ataque Arcano", price: 350, currency: "crystals", image: bookAtkImg, description: "+8% de dano em Melhorias.", buy: (q) => onBuyBook("book_atk_purple", q) },
    { id: "book_def_purple", name: "Defesa Arcana", price: 350, currency: "crystals", image: bookDefImg, description: "-8% de dano recebido em Melhorias.", buy: (q) => onBuyBook("book_def_purple", q) },
    { id: "book_atk_gold", name: "Tratado Real", price: 1200, currency: "crystals", image: bookAtkImg, description: "+15% de dano em Melhorias.", buy: (q) => onBuyBook("book_atk_gold", q) },
  ], [onBuyBall, onBuyBook, onBuyPotion]);

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
        <img src={shopAsset.url} alt="Vitrine do Pokémarkt" className="block h-auto w-full select-none" draggable={false} />

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