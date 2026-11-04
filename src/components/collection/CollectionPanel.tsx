import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, CircleDot, Diamond, Filter, Grid2X2, Info, Lock, Search, Shield, Sparkles, Star, Trophy, X } from "lucide-react";
import { COLLECTION_PAGE_SIZE, COLLECTION_TIERS, eligibleForFragment, filterPokemon, matchesCollectionFilter, type CollectionFilter, type CollectionSort, type PokemonRecord } from "./collectionModel";
import "../inventory/inventory.css";
import "./collection.css";

export type CollectionPanelProps = {
  mode: "collection" | "pokedex"; records: PokemonRecord[];
  progress: { count: number; total: number; percent: number };
  capacity: number; craftPoints: number; onClose: () => void;
  onDetails: (record: PokemonRecord) => boolean; onLock: (key: string) => void;
  onFragment: (keys: string[]) => void;
};
const FILTERS: { id: CollectionFilter; label: string; color: string }[] = [
  { id: "all", label: "Todos", color: "#d2ebff" },
  ...Object.entries(COLLECTION_TIERS).map(([id, tier]) => ({ id: id as CollectionFilter, ...tier })),
  { id: "black", label: "Black Mítico", color: "#fbd05b" }, { id: "ancestral", label: "Ancestral", color: "#efa9ff" },
];
const FAVORITES_KEY = "rubym.collection.favorites.v1";
function PokemonArtwork({ record, portrait = false }: { record: PokemonRecord; portrait?: boolean }) {
  if (record.sheet) return <span className="collection-sheet" role={portrait ? "img" : undefined} aria-label={portrait ? record.seen ? record.name : "Silhueta não registrada" : undefined} aria-hidden={portrait ? undefined : true} style={{ backgroundImage: `url("${record.sheet}")` }} />;
  return record.image ? <img src={record.image} alt={portrait ? record.seen ? record.name : "Silhueta não registrada" : ""} loading={portrait ? undefined : "lazy"} /> : <CircleDot />;
}

export function CollectionPanel(props: CollectionPanelProps) {
  const isDex = props.mode === "pokedex";
  const [tab, setTab] = useState("main");
  const [filter, setFilter] = useState<CollectionFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CollectionSort>("dex");
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [onlyLocked, setOnlyLocked] = useState(false);
  const [status, setStatus] = useState<"all" | "caught" | "seen" | "unseen">("all");
  const [bulk, setBulk] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"); return new Set(Array.isArray(saved) ? saved.filter((key): key is string => typeof key === "string") : []); } catch { return new Set(); }
  });
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { root.current?.focus(); }, []);
  const filtered = filterPokemon(props.records, { filter, query, sort, favorites: tab === "favorites" ? favorites : undefined, onlyLocked, status });
  const pages = Math.max(1, Math.ceil(filtered.length / COLLECTION_PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * COLLECTION_PAGE_SIZE, (safePage + 1) * COLLECTION_PAGE_SIZE);
  const selected = visible.find(record => record.key === selectedKey) ?? visible[0];
  useEffect(() => { setShowDetails(false); }, [selected?.key]);
  const tier = selected?.event === "safari:black_mitic" ? { label: "Black Mítico", color: "#bca7dd" } : COLLECTION_TIERS[selected?.rarity ?? "common"];
  const eligibleKeys = props.records.filter(record => picked.has(record.key) && eligibleForFragment(record)).map(record => record.key);
  const toggleFavorite = (key: string) => setFavorites(previous => {
    const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); } catch { /* Local preference only. */ }
    return next;
  });
  const choose = (record: PokemonRecord) => {
    setSelectedKey(record.key); setShowDetails(false);
    if (bulk && eligibleForFragment(record)) setPicked(previous => { const next = new Set(previous); if (next.has(record.key)) next.delete(record.key); else next.add(record.key); return next; });
  };
  return <div ref={root} className="revo-inventory collection-window" role="dialog" aria-modal="true" aria-labelledby="collection-title" tabIndex={-1} onKeyDown={event => {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); if (showDetails) setShowDetails(false); else props.onClose(); }
    if (event.key === "Tab") {
      const nodes = [...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select') ?? [])].filter(node => node.offsetWidth > 0 && node.offsetHeight > 0);
      const first = nodes[0], last = nodes.at(-1);
      if (!nodes.includes(document.activeElement as HTMLElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
    }
  }}>
    <header className="inventory-heading"><span className="inventory-heading__rule" /><div className="inventory-heading__title"><BookOpen className="collection-book" /><h2 id="collection-title">{isDex ? "Pokédex" : "Coleção"}</h2></div><span className="inventory-heading__rule" /><button type="button" className="inventory-close" onClick={props.onClose} aria-label={`Fechar ${isDex ? "Pokédex" : "coleção"}`}><X /></button></header>
    <nav className="inventory-tabs collection-tabs" aria-label="Seções do registro">{[
      { id: "main", label: isDex ? "Pokédex" : "Coleção", icon: CircleDot }, { id: "favorites", label: "Favoritos", icon: Star },
      { id: "records", label: "Registros", icon: Trophy }, { id: "bonuses", label: "Bônus de Coleção", icon: Sparkles },
    ].map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => { setTab(id); setPage(0); }}><Icon /><span>{label}</span></button>)}</nav>
    <div className="collection-body">
      <aside className="inventory-panel collection-sidebar" aria-label="Raridades">{FILTERS.map(({ id, label, color }) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => { setFilter(id); setPage(0); if (tab !== "favorites") setTab("main"); }} style={{ "--filter-color": color } as CSSProperties}>{id === "all" ? <Grid2X2 /> : id === "ancestral" ? <Sparkles /> : <Diamond />}<span>{label}</span><small>({props.records.filter(record => matchesCollectionFilter(record, id)).length})</small></button>)}<footer>{isDex ? "Catálogo do jogo" : `${props.records.length} / ${props.capacity} Pokémon`}<span>{!isDex && `${props.craftPoints.toLocaleString("pt-BR")} pontos de craft`}</span></footer></aside>
      <main className="collection-main">
        <section className="inventory-panel collection-progress" aria-label="Progresso do registro"><CircleDot /><div><strong>{isDex ? "Progresso da Pokédex" : "Progresso da Coleção"}</strong><div className="collection-progress__row"><div role="progressbar" aria-label={isDex ? "Espécies vistas" : "Espécies capturadas"} aria-valuemin={0} aria-valuemax={props.progress.total} aria-valuenow={props.progress.count}><span style={{ width: `${Math.min(100, props.progress.percent)}%` }} /></div><b>{props.progress.count} / {props.progress.total}</b><em>{props.progress.percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</em></div></div></section>
        {tab === "records" || tab === "bonuses" ? <section className="inventory-panel collection-summary">
          {tab === "records" ? <><Trophy /><h3>Seu registro de treinador</h3><p>{props.progress.count} espécies {isDex ? "registradas" : "capturadas"} de {props.progress.total} disponíveis no catálogo do jogo.</p><div>{FILTERS.filter(item => item.id !== "all").map(item => <p key={item.id}><span>{item.label}</span><b>{props.records.filter(record => matchesCollectionFilter(record, item.id) && record.seen).length}</b></p>)}</div><small>Estatísticas reais do registro — sem conquistas ou recompensas fictícias.</small></> : <><Sparkles /><h3>Bônus de Coleção</h3><p>Esta tela não concede bônus de XP, ouro ou cristal por completar a coleção.</p><p>Seus Pokémon mantêm seus atributos, traits e efeitos originais. Abra os detalhes de um capturado para consultá-los.</p><small>Nenhum bônus de gameplay foi adicionado com a nova interface.</small></>}
        </section> : <>
          <div className="collection-toolbar"><label><Search /><input value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Buscar Pokémon..." aria-label="Buscar Pokémon" /></label><select aria-label="Ordenar Pokémon" value={sort} onChange={event => { setSort(event.target.value as CollectionSort); setPage(0); }}><option value="dex">Ordem: Nº Pokédex</option><option value="name">Nome</option><option value="recent">Mais recentes</option><option value="level">Nível ↓</option><option value="level_asc">Nível ↑</option><option value="rarity">Raridade</option></select><button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><Filter />Filtros</button></div>
          {filtersOpen && <div className="collection-filter-options inventory-panel">{isDex ? <select value={status} aria-label="Status do registro" onChange={event => { setStatus(event.target.value as typeof status); setPage(0); }}><option value="all">Todos os registros</option><option value="caught">Capturados</option><option value="seen">Vistos</option><option value="unseen">Não vistos</option></select> : <><label><input type="checkbox" checked={onlyLocked} onChange={event => { setOnlyLocked(event.target.checked); setPage(0); }} />Somente protegidos</label><button type="button" aria-pressed={bulk} onClick={() => { setBulk(!bulk); setPicked(new Set()); }}>{bulk ? "Cancelar seleção" : "Selecionar para fragmentar"}</button>{bulk && <button type="button" disabled={!eligibleKeys.length} onClick={() => props.onFragment(eligibleKeys)}>Fragmentar ({eligibleKeys.length})</button>}</>}</div>}
          <div className="collection-grid" aria-label="Grade de Pokémon">{visible.map(record => <article key={record.key} className={`collection-card ${selected?.key === record.key ? "is-selected" : ""} ${!record.seen ? "is-unseen" : ""}`} style={{ "--pokemon-color": record.types[0]?.color ?? "#7dbce2", "--pokemon-tier": COLLECTION_TIERS[record.rarity].color } as CSSProperties} data-record={record.key}>
            <span className="collection-card__type" title={record.seen ? record.types.map(type => type.name).join(" / ") : "Não registrado"}>{record.seen ? record.types[0]?.icon : "?"}</span>
            <button type="button" className="collection-favorite" aria-label={`${favorites.has(record.key) ? "Remover" : "Adicionar"} ${record.name} ${favorites.has(record.key) ? "dos" : "aos"} favoritos`} aria-pressed={favorites.has(record.key)} onClick={() => toggleFavorite(record.key)}><Star /></button>
            <button type="button" className="collection-card__select" aria-pressed={selected?.key === record.key} aria-label={`Selecionar ${record.seen ? record.name : "Pokémon não registrado"}${record.level ? `, nível ${record.level}` : ""}`} onClick={() => choose(record)}><PokemonArtwork record={record} /><strong>{record.seen ? record.name : "???"}</strong><small>{record.inTeam ? "No time · " : ""}{record.level ? `Nv. ${record.level}` : record.caught ? "Capturado" : record.seen ? "Visto" : "Não registrado"}</small></button>
            {bulk && picked.has(record.key) && <span className="collection-card__picked"><Check /></span>}{record.locked && <Lock className="collection-card__lock" />}
          </article>)}{Array.from({ length: COLLECTION_PAGE_SIZE - visible.length }, (_, i) => <span className="collection-card collection-card--empty" key={`empty-${i}`} aria-hidden="true" />)}{!visible.length && <div className="collection-no-results"><BookOpen /><strong>{tab === "favorites" ? "Nenhum favorito neste filtro" : "Nenhum Pokémon encontrado"}</strong><span>{tab === "favorites" ? "Use a estrela de um Pokémon para favoritar." : "Ajuste a busca ou continue sua jornada."}</span></div>}</div>
          <footer className="inventory-pagination collection-pagination"><button type="button" disabled={safePage === 0} aria-label="Página anterior" onClick={() => { setPage(safePage - 1); setShowDetails(false); }}><ChevronLeft /></button><span aria-live="polite">{safePage + 1} / {pages}</span><button type="button" disabled={safePage + 1 === pages} aria-label="Próxima página" onClick={() => { setPage(safePage + 1); setShowDetails(false); }}><ChevronRight /></button></footer>
        </>}
      </main>
      <section className="inventory-panel collection-detail" aria-label="Detalhes do Pokémon" style={{ "--pokemon-color": selected?.types[0]?.color ?? "#78c850" } as CSSProperties}>
        {selected ? <><header><CircleDot /><h3>{selected.number != null && <span>#{String(selected.number).padStart(3, "0")} </span>}{selected.seen ? selected.name : "Não registrado"}</h3><button type="button" className="collection-favorite" aria-label="Favoritar Pokémon selecionado" aria-pressed={favorites.has(selected.key)} onClick={() => toggleFavorite(selected.key)}><Star /></button></header>
          <div className="collection-types">{selected.seen && selected.types.map(type => <span key={type.name} style={{ "--type-color": type.color } as CSSProperties}>{type.name}</span>)}</div>
          <div className={`collection-portrait ${!selected.seen ? "is-unseen" : ""}`}><PokemonArtwork record={selected} portrait /></div>
          <div className="collection-detail__data"><p><span>Raridade</span><b style={{ color: tier.color }}>{selected.seen ? tier.label : "???"}</b></p><p><span>Registro</span><b>{selected.caught ? "Capturado" : selected.seen ? "Visto" : "Não visto"}</b></p>{selected.level != null && <p><span>Nível</span><b>{selected.level}</b></p>}
            {!isDex && <><p><span>Fragmentação</span><b>+{selected.craftGain} craft</b></p><div className="collection-detail__tools"><button type="button" aria-pressed={selected.locked} onClick={() => props.onLock(selected.key)}><Shield />{selected.locked ? "Protegido" : "Proteger"}</button><button type="button" disabled={!eligibleForFragment(selected)} title={selected.inTeam ? "Retire do time antes de fragmentar" : selected.locked ? "Desproteja antes de fragmentar" : "Exige confirmação"} onClick={() => props.onFragment([selected.key])}><Diamond />Fragmentar</button></div></>}
            {showDetails && selected.seen && <div className="collection-inline-details"><h4>Tipos e movimentos</h4>{selected.moves.map(move => <span key={move}>{move}</span>)}{selected.traits.length > 0 && <p>Traits: {selected.traits.join(" · ")}</p>}</div>}
          </div>
          <button type="button" className="inventory-use collection-details-button" disabled={!selected.seen} onClick={() => { if (!props.onDetails(selected)) setShowDetails(!showDetails); }}><BookOpen />{showDetails ? "Ocultar detalhes" : "Ver Detalhes"}</button>
        </> : <div className="collection-no-selection"><Info /><p>Selecione um Pokémon para consultar o registro.</p></div>}
      </section>
    </div>
  </div>;
}
