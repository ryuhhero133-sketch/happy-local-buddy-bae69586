import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, Check, ChevronLeft, ChevronRight, CircleDot, Coins, Diamond, Info, Lock, Package, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Sparkles, Store, Tag, X } from "lucide-react";
import { TRAITS } from "@/game/traits";
import { STARTER_DISCS } from "@/game/skillDiscs";
import type { Species } from "@/game/systems";
import {
  MARKET_CURRENCIES, MARKET_ITEM_NAMES, filterMarketListings, initialPokemonUid, marketItemName,
  marketListingName, marketNormalize, marketPokemonName, pokemonSaleError,
  type MarketCurrency, type MarketPet, type MarketplaceData, type MarketplaceListing,
} from "./marketplaceModel";
import "./marketplace.css";

export type MarketplacePanelProps = {
  userId: string; items: Record<string, number>; bank: { gold: number; crystals: number };
  pets: MarketPet[]; activeUids: string[]; restingUids: string[]; starterUid?: string;
  pokemonImages: Partial<Record<Species, string>>; sheetImages: Partial<Record<Species, string>>;
  itemImages: Record<string, string>; npcPrices: Record<string, number>;
  load: () => Promise<MarketplaceData>; onClose: () => void;
  onListItem: (id: string, qty: number, price: number, currency: MarketCurrency) => Promise<boolean>;
  onListPokemon: (uid: string, price: number, currency: MarketCurrency) => Promise<boolean>;
  onBuy: (listing: MarketplaceListing) => Promise<boolean>;
  onCancel: (listing: MarketplaceListing) => Promise<boolean>;
  onClaim: (listing: MarketplaceListing) => Promise<boolean>;
  onNpcSell: (id: string, qty: number) => void;
  initialData?: MarketplaceData;
};
const EMPTY: MarketplaceData = { listings: [], mine: [], payouts: [], total: 0 };
const PAGE_SIZE = 24;
const RARITY: Record<string, string> = { common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico", legendary: "Lendário", mythic: "Mítico", mythic_shiny: "Mítico Shiny" };
const number = (value: number) => value.toLocaleString("pt-BR");
type Confirmation = { action: "buy" | "cancel" | "claim"; listing: MarketplaceListing } | { action: "list" };

export function MarketplacePanel(props: MarketplacePanelProps) {
  const [view, setView] = useState<"browse" | "mine" | "create" | "npc">("browse");
  const [data, setData] = useState(props.initialData ?? EMPTY);
  const [loading, setLoading] = useState(!props.initialData);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "item" | "pokemon">("all");
  const [currency, setCurrency] = useState<"all" | MarketCurrency>("all");
  const [sort, setSort] = useState<"recent" | "price_asc" | "price_desc" | "level">("recent");
  const [shiny, setShiny] = useState(false);
  const [page, setPage] = useState(0);
  const [sellKind, setSellKind] = useState<"item" | "pokemon">("item");
  const [sellKey, setSellKey] = useState("");
  const [sellQuery, setSellQuery] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("500");
  const [sellCurrency, setSellCurrency] = useState<MarketCurrency>("gold");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef(props.load);
  loadRef.current = props.load;
  const mounted = useRef(true);
  const requestId = useRef(0);
  const refresh = async () => {
    const request = ++requestId.current;
    setLoading(true);
    try {
      const result = await loadRef.current();
      if (mounted.current && request === requestId.current) {
        setData(result);
        setNotice(current => current?.error ? null : current);
      }
    } catch {
      if (mounted.current && request === requestId.current) setNotice({ error: true, text: "Não foi possível carregar o mercado. Tente atualizar; nenhum item foi movimentado." });
    } finally {
      if (mounted.current && request === requestId.current) setLoading(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    if (!props.initialData) void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible" && !busyRef.current) void refresh(); }, 30_000);
    return () => { mounted.current = false; requestId.current++; window.clearInterval(timer); document.body.style.overflow = overflow; previous?.focus(); };
    // loadRef mantém os saldos e o callback atuais sem recriar o polling a cada tick do jogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.userId]);
  useEffect(() => {
    if (confirmation) confirmRef.current?.focus();
    else root.current?.focus();
  }, [confirmation]);

  const active = useMemo(() => new Set(props.activeUids), [props.activeUids]);
  const resting = useMemo(() => new Set(props.restingUids), [props.restingUids]);
  const starter = data.starter_uid ?? initialPokemonUid(props.pets, props.starterUid);
  const filtered = filterMarketListings(data.listings, { query, kind, currency, sort, shiny });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const selectedPet = sellKind === "pokemon" ? props.pets.find(pet => pet.uid === sellKey) : undefined;
  const selectedItem = sellKind === "item" && MARKET_ITEM_NAMES[sellKey] ? sellKey : "";
  const selectedName = selectedPet ? marketPokemonName(selectedPet.species) : selectedItem ? marketItemName(selectedItem) : "";
  const stock = selectedItem ? props.items[selectedItem] ?? 0 : 1;
  const sellError = selectedPet ? pokemonSaleError(selectedPet, starter, active, resting) : null;
  const validPrice = Number.isSafeInteger(Number(price)) && Number(price) >= 1 && Number(price) <= MARKET_CURRENCIES[sellCurrency].cap;
  const validQty = sellKind === "pokemon" || (Number.isSafeInteger(Number(qty)) && Number(qty) >= 1 && Number(qty) <= stock && Number(qty) <= 999999);
  const canPublish = !!selectedName && !sellError && validPrice && validQty && !busy;
  const balance = (cur: MarketCurrency) => cur === "gold" ? props.bank.gold : cur === "crystal" ? props.bank.crystals : props.items.safira_verde ?? 0;
  const money = (value: number, cur: MarketCurrency) => <span className={`market-money market-money--${cur}`}>{cur === "gold" ? <Coins aria-hidden="true" /> : <Diamond aria-hidden="true" />} {number(value)} <small>{MARKET_CURRENCIES[cur].label}</small></span>;
  const artwork = (pet?: MarketPet | null, item?: string | null) => {
    const image = pet ? props.pokemonImages[pet.species] : props.itemImages[item ?? ""] ?? STARTER_DISCS.find(disc => disc.itemId === item)?.img;
    if (pet && image && props.sheetImages[pet.species] === image) return <span className="market-sprite" style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" />;
    return image ? <img src={image} alt="" loading="lazy" /> : pet ? <CircleDot aria-hidden="true" /> : <Package aria-hidden="true" />;
  };
  const execute = async () => {
    if (busyRef.current || !confirmation) return;
    if (confirmation.action === "list" && !canPublish) return;
    busyRef.current = true; setBusy(true); setNotice(null);
    try {
      const ok = confirmation.action === "list"
        ? sellKind === "pokemon"
          ? await props.onListPokemon(sellKey, Number(price), sellCurrency)
          : await props.onListItem(sellKey, Number(qty), Number(price), sellCurrency)
        : confirmation.action === "buy" ? await props.onBuy(confirmation.listing)
          : confirmation.action === "cancel" ? await props.onCancel(confirmation.listing) : await props.onClaim(confirmation.listing);
      if (!mounted.current) return;
      setConfirmation(null);
      setNotice({ error: !ok, text: ok
        ? confirmation.action === "list" ? "Anúncio publicado! A mercadoria está sob custódia do mercado."
          : confirmation.action === "buy" ? "Compra confirmada! A mercadoria já está na sua coleção ou mochila."
            : confirmation.action === "cancel" ? "Anúncio cancelado. Sua mercadoria foi devolvida." : "Pagamento recebido!"
        : "Transação não confirmada. Confira seu saldo e estoque. Se o save estiver em conflito, recarregue o jogo antes de repetir." });
      if (ok && confirmation.action === "list") { setView("mine"); setSellKey(""); }
      if (ok) await refresh();
    } catch {
      if (mounted.current) { setConfirmation(null); setNotice({ error: true, text: "Conexão interrompida. Recarregue para consultar o resultado oficial antes de repetir." }); }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const card = (listing: MarketplaceListing, own = false, payout = false) => <article className={`market-card ${listing.kind === "pokemon" ? "market-card--pokemon" : ""}`} key={listing.id}>
    <header><span className="market-chip">{payout ? "Vendido" : listing.kind === "pokemon" ? RARITY[listing.pet_data?.rarity ?? "common"] : "Item"}</span>{listing.pet_data?.event === "ancestral" && <span className="market-chip market-chip--gold">Ancestral</span>}{listing.pet_data?.species?.includes("shiny") && <Sparkles className="market-shiny" aria-label="Shiny" />}</header>
    <div className="market-card__art">{artwork(listing.pet_data, listing.item_id)}</div>
    <h3>{marketListingName(listing)}</h3>
    <p className="market-card__meta">{listing.kind === "pokemon" ? `Nv. ${number(listing.pet_data?.level ?? 1)} · ${listing.pet_data?.traits?.length ?? 0} traits` : `${number(listing.qty)} unidade${listing.qty === 1 ? "" : "s"}`}</p>
    <p className="market-card__seller">{own ? "Seu anúncio" : `por ${listing.seller_name}`}</p>
    {listing.pet_data?.traits?.length ? <details className="market-traits"><summary>Ver traits e atributos</summary><p>{listing.pet_data.traits.map(id => TRAITS[id]?.name ?? id).join(" · ")}</p><p>{listing.pet_data.legacyStars ? `${listing.pet_data.legacyStars} estrelas · ` : ""}{listing.pet_data.rebirths ? `${listing.pet_data.rebirths} renascimentos` : ""}</p></details> : null}
    <footer>{money(listing.price, listing.currency)}{listing.kind === "item" && listing.qty > 1 && <small>{(listing.price / listing.qty).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} / unidade</small>}
      <button type="button" className={own && !payout ? "market-button market-button--quiet" : "market-button"} disabled={busy || (!own && balance(listing.currency) < listing.price)} onClick={() => setConfirmation({ action: payout ? "claim" : own ? "cancel" : "buy", listing })}>{payout ? <Coins /> : own ? <X /> : <ShoppingBag />}{payout ? "Receber pagamento" : own ? "Cancelar e devolver" : balance(listing.currency) < listing.price ? "Saldo insuficiente" : "Comprar"}</button>
    </footer>
  </article>;
  const confirmListing = confirmation && confirmation.action !== "list" ? confirmation.listing : null;
  const content = <div className="market-window" ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="market-title"
    onClick={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()} onKeyDown={event => {
      event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); if (busy) return; if (confirmation) setConfirmation(null); else props.onClose(); }
      if (event.key === "Tab") {
        const container = confirmation ? confirmRef.current : root.current;
        const nodes = [...(container?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, summary') ?? [])].filter(node => node.offsetWidth && node.offsetHeight);
        const first = nodes[0], last = nodes.at(-1);
        if (!nodes.includes(document.activeElement as HTMLElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      }
    }}>
    <header className="market-heading"><div className="market-emblem"><Store /></div><div><small>REVO • MERCADO GLOBAL</small><h2 id="market-title">Marketplace</h2><p>Pokémon e itens. De treinador para treinador.</p></div><span className="market-public"><ShieldCheck /> Aberto para todos</span><button type="button" className="market-close" aria-label="Fechar Marketplace" disabled={busy} onClick={props.onClose}><X /></button></header>
    <div className="market-balances" aria-label="Seus saldos">{(Object.keys(MARKET_CURRENCIES) as MarketCurrency[]).map(cur => <div key={cur}>{money(balance(cur), cur)}</div>)}<span><ArrowLeftRight /> Sem exigência de VIP</span></div>
    <nav className="market-tabs" aria-label="Seções do Marketplace">{([
      ["browse", "Explorar", ShoppingBag], ["mine", "Meus anúncios", Tag], ["create", "Anunciar", Plus], ["npc", "Venda rápida", Store],
    ] as const).map(([id, label, Icon]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => { setView(id); setNotice(null); }}><Icon />{label}{id === "mine" && data.payouts.length > 0 && <b>{data.payouts.length}</b>}</button>)}<button type="button" className="market-refresh" aria-label="Atualizar Marketplace" disabled={loading || busy} onClick={() => void refresh()}><RefreshCw className={loading ? "market-spin" : ""} /><span>Atualizar</span></button></nav>
    {notice && <div className={`market-notice ${notice.error ? "market-notice--error" : ""}`} role={notice.error ? "alert" : "status"}><Info />{notice.text}</div>}
    <main className="market-main" aria-busy={loading || busy}>
      {view === "browse" && <>
        <section className="market-intro"><div><span className="market-eyebrow">ENCONTRE SEU PRÓXIMO PARCEIRO</span><h3>Uma nova troca.<br /><em>Uma nova aventura.</em></h3><p>Compare anúncios, escolha sua moeda e compre com segurança.</p></div><div className="market-intro__stats"><strong>{number(data.total)}</strong><span>anúncios ativos no servidor</span><small><ShieldCheck /> Compra e entrega confirmadas no servidor</small></div></section>
        <div className="market-toolbar"><label className="market-search"><Search /><input aria-label="Buscar no Marketplace" placeholder="Buscar Pokémon, item ou treinador..." value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label><select aria-label="Filtrar por moeda" value={currency} onChange={event => { setCurrency(event.target.value as typeof currency); setPage(0); }}><option value="all">Todas as moedas</option>{Object.entries(MARKET_CURRENCIES).map(([id, meta]) => <option key={id} value={id}>{meta.symbol} {meta.label}</option>)}</select><select aria-label="Ordenar anúncios" value={sort} onChange={event => { setSort(event.target.value as typeof sort); setPage(0); }}><option value="recent">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option><option value="level">Maior nível</option></select></div>
        <div className="market-filters">{([["all", "Tudo"], ["pokemon", "Pokémon"], ["item", "Itens"]] as const).map(([id, label]) => <button type="button" aria-pressed={kind === id} key={id} onClick={() => { setKind(id); setPage(0); }}>{label}</button>)}<label><input type="checkbox" checked={shiny} onChange={event => { setShiny(event.target.checked); setPage(0); }} /><Sparkles /> Só shiny</label><span>{number(filtered.length)} resultados{data.total > data.listings.length ? " recentes" : ""}</span></div>
        <div className="market-grid">{visible.map(listing => card(listing))}</div>
        {!visible.length && <div className="market-empty"><ShoppingBag /><h3>{loading ? "Carregando o mercado…" : "Nenhum anúncio por aqui"}</h3><p>{query || kind !== "all" || shiny || currency !== "all" ? "Experimente outros filtros." : "Seja o primeiro a anunciar um Pokémon ou item."}</p><button type="button" className="market-button" onClick={() => setView("create")}><Plus /> Criar anúncio</button></div>}
        <footer className="market-pagination"><button type="button" disabled={safePage === 0} aria-label="Página anterior" onClick={() => setPage(safePage - 1)}><ChevronLeft /></button><span aria-live="polite">Página {safePage + 1} de {pages}</span><button type="button" disabled={safePage + 1 >= pages} aria-label="Próxima página" onClick={() => setPage(safePage + 1)}><ChevronRight /></button></footer>
      </>}
      {view === "mine" && <><div className="market-section-title"><div><span className="market-eyebrow">SUA BANCA</span><h3>Meus anúncios e pagamentos</h3></div><button type="button" className="market-button" onClick={() => setView("create")}><Plus /> Anunciar</button></div>
        {data.payouts.length > 0 && <><h4 className="market-subtitle"><Coins /> Pagamentos disponíveis ({data.payouts.length})</h4><div className="market-grid">{data.payouts.map(listing => card(listing, true, true))}</div></>}
        <h4 className="market-subtitle"><Tag /> À venda ({data.mine.length})</h4><div className="market-grid">{data.mine.map(listing => card(listing, true))}</div>{!data.mine.length && <div className="market-empty"><Tag /><h3>Você não tem anúncios ativos</h3><p>Itens e Pokémon anunciados ficam no mercado até a compra ou o cancelamento.</p></div>}
      </>}
      {view === "create" && <>
        <div className="market-section-title"><div><span className="market-eyebrow">ABRA SUA BANCA</span><h3>O que você quer vender?</h3><p>O anúncio fica disponível imediatamente. Você define o preço total.</p></div></div>
        <div className="market-create-layout"><section className="market-inventory"><div className="market-filters"><button type="button" aria-pressed={sellKind === "item"} onClick={() => { setSellKind("item"); setSellKey(""); setSellQuery(""); }}><Package /> Itens da mochila</button><button type="button" aria-pressed={sellKind === "pokemon"} onClick={() => { setSellKind("pokemon"); setSellKey(""); setSellQuery(""); }}><CircleDot /> Meus Pokémon</button></div><label className="market-search"><Search /><input aria-label="Buscar mercadoria para anunciar" placeholder={sellKind === "pokemon" ? "Buscar nos seus Pokémon..." : "Buscar na mochila..."} value={sellQuery} onChange={event => setSellQuery(event.target.value)} /></label>
          <div className="market-stock">{sellKind === "item"
            ? Object.entries(props.items).filter(([id, amount]) => amount > 0 && MARKET_ITEM_NAMES[id] && marketNormalize(marketItemName(id)).includes(marketNormalize(sellQuery))).map(([id, amount]) => <button type="button" key={id} className={sellKey === id ? "is-selected" : ""} aria-pressed={sellKey === id} onClick={() => { setSellKey(id); setQty("1"); }}><span className="market-stock__art">{artwork(null, id)}</span><strong>{marketItemName(id)}<small>{number(amount)} na mochila</small></strong>{sellKey === id ? <Check /> : <Plus />}</button>)
            : props.pets.filter(pet => marketNormalize(marketPokemonName(pet.species)).includes(marketNormalize(sellQuery))).map(pet => { const error = pokemonSaleError(pet, starter, active, resting); return <button type="button" key={pet.uid} disabled={!!error} title={error ?? "Selecionar para venda"} className={sellKey === pet.uid ? "is-selected" : ""} aria-pressed={sellKey === pet.uid} onClick={() => setSellKey(pet.uid)}><span className="market-stock__art">{artwork(pet)}</span><strong>{marketPokemonName(pet.species)}<small>Nv. {pet.level} · {error ? pet.uid === starter || pet.isStarter ? "Inicial protegido" : active.has(pet.uid) ? "No time" : "Protegido / descansando" : RARITY[pet.rarity]}</small></strong>{error ? <Lock /> : sellKey === pet.uid ? <Check /> : <Plus />}</button>; })}
          </div>
          <p className="market-rule"><Lock /> O Pokémon inicial nunca pode ser vendido, mesmo após evoluir. Retire os demais do time para anunciar. Moedas, contadores e itens vinculados não são mercadorias.</p>
        </section><form className="market-sale-form" onSubmit={event => { event.preventDefault(); if (canPublish) setConfirmation({ action: "list" }); }}>
          <div className="market-sale-form__preview">{artwork(selectedPet, selectedItem)}<h4>{selectedName || "Selecione uma mercadoria"}</h4><p>{selectedPet ? `Nv. ${selectedPet.level} · ${RARITY[selectedPet.rarity]}` : selectedItem ? `${number(stock)} disponíveis` : "Escolha um item ou Pokémon ao lado."}</p></div>
          {sellKind === "item" && <label>Quantidade<input type="number" inputMode="numeric" min="1" max={Math.min(stock, 999999)} required value={qty} onChange={event => setQty(event.target.value)} /></label>}
          <label>Moeda de pagamento<select value={sellCurrency} onChange={event => setSellCurrency(event.target.value as MarketCurrency)}>{Object.entries(MARKET_CURRENCIES).map(([id, meta]) => <option key={id} value={id}>{meta.symbol} {meta.label}</option>)}</select></label>
          <label>Preço total do anúncio<input type="number" inputMode="numeric" min="1" max={MARKET_CURRENCIES[sellCurrency].cap} required value={price} onChange={event => setPrice(event.target.value)} /></label>
          <p className="market-sale-total">Você receberá {money(Number(price) || 0, sellCurrency)}</p>
          {sellError && <p role="alert" className="market-form-error">{sellError}</p>}
          <button type="submit" className="market-button" disabled={!canPublish}><Tag /> Publicar anúncio</button><small><ShieldCheck /> A mercadoria sai da sua posse somente após a confirmação do servidor.</small>
        </form></div>
      </>}
      {view === "npc" && <><div className="market-section-title"><div><span className="market-eyebrow">PRECISA DE OURO AGORA?</span><h3>Venda rápida ao NPC</h3><p>Preço fixo por unidade, sem esperar outro jogador.</p></div></div><div className="market-grid">{Object.entries(props.npcPrices).filter(([id]) => (props.items[id] ?? 0) > 0).map(([id, value]) => <article className="market-card" key={id}><div className="market-card__art">{artwork(null, id)}</div><h3>{marketItemName(id)}</h3><p className="market-card__meta">{number(props.items[id])} disponíveis</p><footer>{money(value, "gold")}<small>por unidade</small><button type="button" className="market-button" disabled={busy} onClick={() => props.onNpcSell(id, 1)}>Vender 1</button><button type="button" className="market-button market-button--quiet" disabled={busy || props.items[id] < 10} onClick={() => props.onNpcSell(id, 10)}>Vender 10</button></footer></article>)}</div><p className="market-rule">Somente os itens aceitos pelo NPC e presentes na sua mochila aparecem aqui.</p></>}
    </main>
    <footer className="market-bottom"><ShieldCheck /><span>Negociações globais · Sem taxa de anúncio · Inicial protegido</span><span>REVO MARKET</span></footer>
    {confirmation && <div className="market-confirm-backdrop"><div className="market-confirm" ref={confirmRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="market-confirm-title" aria-describedby="market-confirm-description"><ShieldCheck /><h3 id="market-confirm-title">{confirmation.action === "buy" ? "Confirmar compra" : confirmation.action === "cancel" ? "Cancelar anúncio?" : confirmation.action === "claim" ? "Receber pagamento" : "Publicar anúncio?"}</h3><p id="market-confirm-description">{confirmation.action === "list" ? `${sellKind === "item" ? `${qty}× ` : ""}${selectedName}. A mercadoria ficará sob custódia do mercado.` : `${confirmListing?.kind === "item" ? `${confirmListing.qty}× ` : ""}${marketListingName(confirmListing!)}.${confirmation.action === "cancel" ? " A mercadoria voltará para a sua coleção ou mochila." : ""}`}</p>{confirmation.action !== "cancel" && money(confirmation.action === "list" ? Number(price) : confirmListing!.price, confirmation.action === "list" ? sellCurrency : confirmListing!.currency)}<div><button type="button" className="market-button market-button--quiet" disabled={busy} onClick={() => setConfirmation(null)}>Voltar</button><button type="button" className="market-button" disabled={busy || (confirmation.action === "list" && !canPublish)} onClick={() => void execute()}>{busy ? "Confirmando…" : "Confirmar"}</button></div><small>Não feche o jogo durante a confirmação.</small></div></div>}
  </div>;
  return typeof document === "undefined" ? content : createPortal(content, document.fullscreenElement ?? document.body);
}
