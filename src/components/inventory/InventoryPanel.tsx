import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Backpack, Box, Boxes, ChevronLeft, ChevronRight, CircleDot, Coins, Diamond, Egg, FlaskConical, Gem, Grid2X2, Minimize2, Minus, MoreHorizontal, Pickaxe, Plus, Search, Shield, Shirt, Sparkles, Star, Trash2, WandSparkles, X } from "lucide-react";
import { filterInventory, INVENTORY_PAGE_SIZE, INVENTORY_TIERS, inventoryUseQuantity, type InventoryCategory, type InventoryItem, type InventoryTab } from "./inventoryModel";
import "./inventory.css";

export type InventoryPanelProps = {
  items: InventoryItem[];
  bagImage: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onClose: () => void;
  onUse: (item: InventoryItem, quantity: number) => void;
  onDiscard: (item: InventoryItem) => void;
  onSell: (item: InventoryItem) => void;
  onUpgrade: (item: InventoryItem) => void;
  renderIcon: (item: InventoryItem, size: number) => ReactNode;
  appearance: ReactNode;
};

const TABS: { id: InventoryTab; label: string; icon: typeof Backpack }[] = [
  { id: "items", label: "Itens", icon: Backpack },
  { id: "balls", label: "Pokébolas", icon: CircleDot },
  { id: "materials", label: "Materiais", icon: Boxes },
  { id: "evolution", label: "Evolução", icon: WandSparkles },
  { id: "consumables", label: "Consumíveis", icon: FlaskConical },
  { id: "special", label: "Especiais", icon: Sparkles },
];
const CATEGORIES: { id: InventoryCategory; label: string; icon: typeof Backpack }[] = [
  { id: "all", label: "Todos", icon: Grid2X2 },
  { id: "usable", label: "Usáveis", icon: FlaskConical },
  { id: "materials", label: "Materiais", icon: Boxes },
  { id: "evolution", label: "Evolução", icon: Diamond },
  { id: "eggs", label: "Ovos", icon: Egg },
  { id: "fragments", label: "Fragmentos", icon: Gem },
  { id: "ores", label: "Minérios", icon: Pickaxe },
  { id: "events", label: "Eventos", icon: Star },
  { id: "other", label: "Outros", icon: Box },
  { id: "equipment", label: "Equipamentos", icon: Shield },
];

export function InventoryPanel(props: InventoryPanelProps) {
  const [tab, setTab] = useState<InventoryTab>("items");
  const [category, setCategory] = useState<InventoryCategory>("all");
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const filtered = filterInventory(props.items, tab, category, query);
  const pages = Math.max(1, Math.ceil(filtered.length / INVENTORY_PAGE_SIZE));
  const safePage = Math.max(0, Math.min(page, pages - 1));
  const visible = filtered.slice(safePage * INVENTORY_PAGE_SIZE, (safePage + 1) * INVENTORY_PAGE_SIZE);
  const selected = visible.find(item => item.key === props.selectedKey) ?? visible[0] ?? null;
  const tier = INVENTORY_TIERS[selected?.rarity ?? "common"];
  const useQuantity = selected ? inventoryUseQuantity(selected, quantity) : 1;

  useEffect(() => { panelRef.current?.focus(); }, []);
  useEffect(() => { setQuantity(1); }, [selected?.key]);
  useEffect(() => {
    if (appearanceOpen) panelRef.current?.querySelector<HTMLButtonElement>('.inventory-appearance-dialog button')?.focus();
    else panelRef.current?.focus();
  }, [appearanceOpen]);

  const choose = (item: InventoryItem) => { props.onSelect(item.key); setQuantity(1); };
  const activateSelected = () => { if (selected?.usable && selected.quantity > 0) props.onUse(selected, useQuantity); };
  const changeTab = (next: InventoryTab) => { setTab(next); setCategory("all"); setPage(0); };
  const changeCategory = (next: InventoryCategory) => { setCategory(next); setTab("items"); setPage(0); };

  return <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="revo-inventory-title" className={`revo-inventory ${expanded ? "is-expanded" : ""}`} onKeyDown={(event) => {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); if (appearanceOpen) setAppearanceOpen(false); else props.onClose(); return; }
    if (event.key === "Tab") {
      const focusRoot = appearanceOpen ? panelRef.current?.querySelector('.inventory-appearance-dialog') : panelRef.current;
      const nodes = [...(focusRoot?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), summary, [tabindex="0"]') ?? [])].filter(node => node.offsetWidth > 0 && node.offsetHeight > 0);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!nodes.includes(document.activeElement as HTMLElement) || event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      return;
    }
    if ((event.target as HTMLElement).closest("input, textarea, summary, details[open]") || appearanceOpen) return;
    if (event.key.toLowerCase() === "z") { event.preventDefault(); activateSelected(); }
    if (event.key.toLowerCase() === "x" && selected?.source === "bag") { event.preventDefault(); props.onDiscard(selected); }
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -6, ArrowDown: 6 };
    const delta = deltas[event.key];
    if (delta != null && filtered.length) {
      event.preventDefault();
      const index = Math.max(0, filtered.findIndex(item => item.key === selected?.key));
      const next = Math.max(0, Math.min(filtered.length - 1, index + delta));
      choose(filtered[next]); setPage(Math.floor(next / INVENTORY_PAGE_SIZE));
      requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus());
    }
  }}>
    <header className="inventory-heading">
      <span className="inventory-heading__rule" />
      <div className="inventory-heading__title"><img src={props.bagImage} alt="" /><h2 id="revo-inventory-title">Mochila</h2></div>
      <span className="inventory-heading__rule" />
      <button type="button" className="inventory-close" onClick={props.onClose} aria-label="Fechar mochila" title="Fechar (Esc)"><X /></button>
    </header>

    <nav className="inventory-tabs" aria-label="Bolsos da mochila">
      {TABS.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => changeTab(id)}><Icon /><span>{label}</span></button>)}
    </nav>

    <div className="inventory-body">
      <aside className="inventory-categories inventory-panel" aria-label="Categorias de itens">
        <div className="inventory-categories__list">{CATEGORIES.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={category === id} onClick={() => changeCategory(id)}><Icon /><span>{label}</span></button>)}</div>
        <button type="button" className="inventory-appearance" onClick={() => setAppearanceOpen(true)}><Shirt /><span>Visuais e equipamentos</span></button>
      </aside>

      <section className="inventory-storage inventory-panel" aria-label="Itens do inventário">
        <header className="inventory-storage__header"><h3>Inventário <span>({props.items.filter(item => item.source !== "vault").length} tipos)</span></h3>
          <button type="button" className="inventory-search-toggle" title="Buscar itens" aria-label="Buscar itens" aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); setQuery(""); setPage(0); }}><Search /></button>
          <button type="button" className="inventory-expand" aria-pressed={expanded} title="Ampliar a janela, sem alterar a capacidade do inventário" onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 /> : <Plus />}<span>{expanded ? "Reduzir" : "Expandir"}</span></button>
        </header>
        {searchOpen && <label className="inventory-search"><Search /><input autoFocus value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Buscar um item..." aria-label="Nome do item" /></label>}
        <div ref={gridRef} className="inventory-grid" aria-label="Grade de itens">
          {visible.map(item => <button type="button" key={item.key} className={`inventory-slot ${item.key === selected?.key ? "is-selected" : ""}`} style={{ "--item-tier": INVENTORY_TIERS[item.rarity].color } as CSSProperties} data-item={item.id} data-source={item.source} data-rarity={item.rarity} aria-label={`${item.name}, ${item.quantity} unidades${item.source === "vault" ? ", no cofre" : ""}`} aria-pressed={item.key === selected?.key} tabIndex={item.key === selected?.key ? 0 : -1} onClick={() => choose(item)} title={`${item.name} · ×${item.quantity.toLocaleString("pt-BR")}`}>
            {props.renderIcon(item, 58)}<b>×{item.quantity.toLocaleString("pt-BR")}</b>{item.source === "vault" && <small>Cofre</small>}
          </button>)}
          {Array.from({ length: INVENTORY_PAGE_SIZE - visible.length }, (_, index) => <span key={`empty-${index}`} className="inventory-slot inventory-slot--empty" aria-hidden="true" />)}
          {!visible.length && <div className="inventory-empty"><Backpack /><strong>{query ? "Nenhum item encontrado" : "Nada por aqui ainda"}</strong><span>{query ? "Tente outro nome." : "Explore o mundo para encontrar novos itens."}</span></div>}
        </div>
        <footer className="inventory-pagination"><button type="button" aria-label="Página anterior" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft /></button><span aria-live="polite">{safePage + 1} / {pages}</span><button type="button" aria-label="Próxima página" disabled={safePage + 1 === pages} onClick={() => setPage(safePage + 1)}><ChevronRight /></button></footer>
      </section>

      <section className="inventory-detail inventory-panel" aria-label="Detalhes do item" style={{ "--item-tier": tier.color } as CSSProperties}>
        {selected ? <>
          <details className="inventory-extra-actions" key={selected.key}><summary aria-label="Mais ações do item" title="Mais ações"><MoreHorizontal /></summary><div>
            {selected.source === "bag" && <button type="button" onClick={() => props.onDiscard(selected)}><Trash2 />Descartar 1</button>}
            {selected.source === "bag" && (!!selected.sellPrice || selected.stoneSale) && <button type="button" disabled={selected.stoneSale && selected.quantity < 250} onClick={() => props.onSell(selected)}><Coins />{selected.stoneSale ? "Vender lote por safiras" : `Vender 1 · ${selected.sellPrice} ouro`}</button>}
            {selected.upgrade && <button type="button" disabled={!selected.upgrade.enabled} title={selected.upgrade.hint} onClick={() => props.onUpgrade(selected)}><WandSparkles />{selected.upgrade.label}</button>}
            {selected.source === "vault" && <p>Recurso armazenado no cofre. Apenas consulta.</p>}
          </div></details>
          <div className={`inventory-detail__art ${["legendary", "mythic"].includes(selected.rarity) ? "is-precious" : ""}`}>{props.renderIcon(selected, 110)}</div>
          <h3>{selected.name}</h3>
          <span className="inventory-rarity">{tier.label}</span>
          <div className="inventory-detail__description"><p>{selected.description}</p>{selected.source === "vault" && <small>COFRE DE RECURSOS · SOMENTE LEITURA</small>}</div>
          <div className="inventory-quantity" title={selected.bulk ? "Quantidade para usar" : "Este item é usado uma unidade por vez"}>
            <button type="button" aria-label="Diminuir quantidade" disabled={!selected.bulk || useQuantity <= 1} onClick={() => setQuantity(useQuantity - 1)}><Minus /></button>
            <input aria-label="Quantidade para usar" type="number" min={1} max={selected.bulk ? selected.quantity : 1} value={useQuantity} disabled={!selected.bulk || !selected.usable} onChange={event => setQuantity(inventoryUseQuantity(selected, Number(event.target.value)))} />
            <button type="button" aria-label="Aumentar quantidade" disabled={!selected.bulk || useQuantity >= selected.quantity} onClick={() => setQuantity(useQuantity + 1)}><Plus /></button>
            <button type="button" disabled={!selected.bulk || !selected.usable} onClick={() => setQuantity(selected.quantity)}>Máx.</button>
          </div>
          <button type="button" className="inventory-use" disabled={!selected.usable} title={selected.actionHint ?? "Usar item (Z)"} onClick={activateSelected}>{selected.category === "eggs" ? <Egg /> : selected.source === "equipment" ? <Shield /> : <Sparkles />}<span>{selected.actionLabel}</span></button>
        </> : <div className="inventory-detail__empty"><Backpack /><strong>Selecione um item</strong><p>Os detalhes e as ações aparecerão aqui.</p></div>}
      </section>
    </div>

    {appearanceOpen && <div className="inventory-appearance-backdrop" onClick={() => setAppearanceOpen(false)}><section className="inventory-appearance-dialog inventory-panel" role="dialog" aria-modal="true" aria-label="Visuais e equipamentos" onClick={event => event.stopPropagation()}><header><h3>Visuais e equipamentos</h3><button type="button" onClick={() => setAppearanceOpen(false)} aria-label="Fechar visuais"><X /></button></header>{props.appearance}</section></div>}
  </div>;
}
