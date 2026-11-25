// Fixture local, sem Supabase e sem transações reais. Não é uma rota do jogo.
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MarketplacePanel } from "../../src/components/marketplace/MarketplacePanel";
import type { MarketCurrency, MarketPet, MarketplaceData, MarketplaceListing } from "../../src/components/marketplace/marketplaceModel";
import pikachu from "../../src/assets/pikachu.gif";
import charizard from "../../src/assets/charizard.gif";
import bulbasaur from "../../src/assets/bulbasaur.gif";
import squirtle from "../../src/assets/squirtle.gif";
import potion from "../../src/assets/items/icon-potion.webp";
import ball from "../../src/assets/items/icon-pokeball.webp";
import berry from "../../src/assets/materials/morango.webp";
import book from "../../src/assets/icons/book-exp.webp";
const makePet = (uid: string, species: MarketPet["species"], level = 15): MarketPet => ({ uid, species, level, rarity: "rare", capturedAt: 100 });
const initial = { ...makePet("initial", "charizard", 25), isStarter: true, event: "starter" };
const pet = makePet("mine-pikachu", "pikachu", 32);
const other = makePet("mine-squirtle", "squirtle", 18);
const row = (id: string, extra: Partial<MarketplaceListing>): MarketplaceListing => ({
  id, seller_id: "outro", seller_name: "Luna", kind: "item", item_id: "potion", qty: 50,
  pet_data: null, price: 2400, currency: "gold", created_at: "2026-11-25T10:00:00Z", ...extra,
});
const initialData: MarketplaceData = {
  listings: [
    row("poke1", { kind: "pokemon", item_id: null, qty: 1, pet_data: { ...makePet("wild1", "bulbasaur_shiny", 42), rarity: "mythic_shiny", traits: ["atk_gold", "def_gold"] }, price: 850, currency: "crystal" }),
    row("poke2", { kind: "pokemon", item_id: null, qty: 1, pet_data: makePet("wild2", "charizard", 78), seller_name: "Caio", price: 29000 }),
    row("item1", {}), row("item2", { item_id: "morango", qty: 30, price: 1200, seller_name: "João" }),
    row("item3", { item_id: "pokeball", qty: 100, price: 8000, seller_name: "Maya" }),
    row("item4", { item_id: "book_exp", qty: 3, price: 60, currency: "safira" }),
    row("poke3", { kind: "pokemon", item_id: null, qty: 1, pet_data: makePet("wild3", "squirtle", 12), seller_name: "Ravi", price: 1300 }),
    row("poke4", { kind: "pokemon", item_id: null, qty: 1, pet_data: makePet("wild4", "pikachu", 26), price: 75, currency: "safira" }),
  ],
  mine: [row("my-item", { seller_id: "me", seller_name: "Você", item_id: "pokeball", qty: 10, price: 600 })],
  payouts: [row("my-sold", { seller_id: "me", item_id: "morango", qty: 5, price: 400, sold_at: "2026-11-25T10:00:00Z" })],
  total: 9, starter_uid: "initial",
};
function Preview() {
  const data = useRef(structuredClone(initialData));
  const [items, setItems] = useState<Record<string, number>>({ potion: 20, morango: 40, pokeball: 100, book_exp: 2, safira_verde: 200 });
  const [bank, setBank] = useState({ gold: 120000, crystals: 2500 });
  const [pets, setPets] = useState<MarketPet[]>([initial, pet, other]);
  const [open, setOpen] = useState(true);
  const list = async (id: string, qty: number, price: number, currency: MarketCurrency, pokemon = false) => {
    const listing = row(`created-${Date.now()}`, { seller_id: "me", seller_name: "Você", kind: pokemon ? "pokemon" : "item", item_id: pokemon ? null : id, qty, pet_data: pokemon ? pets.find(pet => pet.uid === id)! : null, price, currency });
    data.current.mine.unshift(listing); data.current.total++;
    if (pokemon) setPets(current => current.filter(pet => pet.uid !== id));
    else setItems(current => ({ ...current, [id]: current[id] - qty }));
    return true;
  };
  const credit = (cur: MarketCurrency, value: number) => cur === "safira"
    ? setItems(current => ({ ...current, safira_verde: current.safira_verde + value }))
    : setBank(current => ({ ...current, [cur === "gold" ? "gold" : "crystals"]: current[cur === "gold" ? "gold" : "crystals"] + value }));
  return open ? <MarketplacePanel userId="me" items={items} bank={bank} pets={pets} activeUids={["initial"]} restingUids={[]} starterUid="initial"
    pokemonImages={{ pikachu, charizard, bulbasaur, bulbasaur_shiny: bulbasaur, squirtle }} sheetImages={{}}
    itemImages={{ potion, morango: berry, pokeball: ball, book_exp: book }} npcPrices={{ potion: 20, morango: 8, pokeball: 10 }}
    load={async () => structuredClone(data.current)} initialData={initialData} onClose={() => setOpen(false)}
    onListItem={(id, qty, price, currency) => list(id, qty, price, currency)}
    onListPokemon={(uid, price, currency) => list(uid, 1, price, currency, true)}
    onBuy={async listing => { credit(listing.currency, -listing.price); data.current.listings = data.current.listings.filter(row => row.id !== listing.id); data.current.total--; if (listing.pet_data) setPets(current => [...current, listing.pet_data!]); else if (listing.item_id) setItems(current => ({ ...current, [listing.item_id!]: (current[listing.item_id!] ?? 0) + listing.qty })); return true; }}
    onCancel={async listing => { data.current.mine = data.current.mine.filter(row => row.id !== listing.id); data.current.total--; if (listing.pet_data) setPets(current => [...current, listing.pet_data!]); else if (listing.item_id) setItems(current => ({ ...current, [listing.item_id!]: (current[listing.item_id!] ?? 0) + listing.qty })); return true; }}
    onClaim={async listing => { credit(listing.currency, listing.price); data.current.payouts = data.current.payouts.filter(row => row.id !== listing.id); return true; }}
    onNpcSell={(id, qty) => { setItems(current => ({ ...current, [id]: current[id] - qty })); credit("gold", qty * ({ potion: 20, morango: 8, pokeball: 10 }[id] ?? 0)); }}
  /> : <button onClick={() => setOpen(true)}>Reabrir verificação do Marketplace</button>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
