// Marketplace P2P de Pokémon — funcional via Supabase.
// - Anuncia (pending) → após 3 min vira "active" e aparece pra todo mundo.
// - Cancelar devolve o pokémon e trava novos anúncios por 5 min.
// - Comprar transfere pokémon + moeda. Vendedor "claima" o pagamento na aba
//   "Meus anúncios". Se o comprador crashar, ele pode reclamar em "Comprados".

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase as _supabase } from "@/integrations/supabase/client";
import type { CollectionEntry } from "@/routes/idle";
import type { Species, Rarity } from "@/game/systems";
import { SPECIES_BASE, RARITY_NAME } from "@/game/systems";
import { computePower, elementsOf, ELEMENT_META } from "@/game/synergies";
import { TRAITS, TIER_COLOR } from "@/game/traits";
import { readEmeraldFor, writeEmeraldFor, spendEmeraldFor, grantEmeraldFor } from "@/lib/emerald";

// A tabela pokemon_market ainda não está nos types gerados — cast pra any.
const supabase = _supabase as unknown as {
  from: (table: string) => any;
};

type Currency = "gold" | "crystal" | "safira" | "esmerald";

type ListingRow = {
  id: string;
  seller_id: string;
  seller_name: string;
  pokemon: {
    uid: string;
    species: Species;
    level: number;
    rarity: Rarity;
    xp?: number;
    traits?: string[];
    statBoost?: number;
  };
  price: number;
  currency: Currency;
  status: "pending" | "active" | "sold" | "cancelled";
  activate_at: string;
  buyer_id: string | null;
  buyer_name: string | null;
  sold_at: string | null;
  payout_claimed: boolean;
  buyer_claimed: boolean;
  via_offer?: boolean;
  offers_only?: boolean;
  created_at: string;
};

type OfferRow = {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  buyer_name: string;
  amount: number;
  currency: Currency;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
};

const RARITY_COLOR: Record<string, string> = {
  common: "#c8b8d0", uncommon: "#7ef2a2", rare: "#6bd4ff",
  epic: "#c084fc", legendary: "#f5cf6b", mythic: "#ff6b3d", mythic_shiny: "#ff97e1",
};

const cooldownKey = (uid: string) => `rubym.market.cancelUntil.${uid}`;
const claimedBuyerKey = (uid: string) => `rubym.market.claimedBuyer.${uid}`;
const claimedSellerKey = (uid: string) => `rubym.market.claimedSeller.${uid}`;

function readCancelUntil(uid: string): number {
  try { return Number(localStorage.getItem(cooldownKey(uid)) ?? 0); } catch { return 0; }
}
function writeCancelUntil(uid: string, ts: number) {
  try { localStorage.setItem(cooldownKey(uid), String(ts)); } catch { /* noop */ }
}
function readClaimSet(key: string): Set<string> {
  try { const r = localStorage.getItem(key); return new Set(r ? (JSON.parse(r) as string[]) : []); } catch { return new Set(); }
}
function writeClaimSet(key: string, s: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(s).slice(-500))); } catch { /* noop */ }
}

function fmtTime(ms: number) {
  if (ms <= 0) return "0s";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60), r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export interface PokemonMarketPanelProps {
  identity: { id: string; name: string } | null;
  collection: CollectionEntry[];
  gold: number;
  crystals: number;
  isVip: boolean;
  gifOf: (sp: Species) => string | undefined;
  onListed: (uid: string) => void;                              // remove do estoque local
  onReturned: (entry: CollectionEntry) => void;                 // devolve p/ coleção
  onSpend: (currency: Currency, amount: number) => void;
  onEarn:  (currency: Currency, amount: number) => void;
  pushChat: (msg: string, kind?: "info" | "cap") => void;
}

export function PokemonMarketPanel(props: PokemonMarketPanelProps) {
  const { identity, collection, gold, crystals, isVip, gifOf, onListed, onReturned, onSpend, onEarn, pushChat } = props;
  const [mode, setMode] = useState<"browse" | "mine" | "create">("browse");
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [selUid, setSelUid] = useState<string>("");
  const [price, setPrice] = useState<number>(1000);
  const [currency, setCurrency] = useState<Currency>("gold");
  const [offersOnly, setOffersOnly] = useState<boolean>(false);
  // Dedup: IDs de anúncio já processados. Persistido em localStorage por usuário
  // pra sobreviver a F5 — caso o UPDATE de buyer_claimed/payout_claimed seja
  // bloqueado pela RLS, o cliente não reprocessa (não cobra de novo, não duplica).
  const claimedBuyerRef = useRef<Set<string>>(new Set());
  const claimedSellerRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!identity?.id) return;
    claimedBuyerRef.current = readClaimSet(claimedBuyerKey(identity.id));
    claimedSellerRef.current = readClaimSet(claimedSellerKey(identity.id));
  }, [identity?.id]);
  const [offers, setOffers] = useState<OfferRow[]>([]);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const refresh = async () => {
    if (!identity?.id) return;
    setLoading(true);
    // vitrine ativa + tudo do próprio jogador (vendedor ou comprador)
    const { data, error } = await supabase
      .from("pokemon_market")
      .select("*")
      .or(`status.eq.active,seller_id.eq.${identity.id},buyer_id.eq.${identity.id}`)
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) { pushChat(`Falha ao carregar vitrine: ${error.message}`, "info"); return; }
    const list = (data ?? []) as ListingRow[];
    setRows(list);

    // promover pending→active nos meus anúncios que já passaram do activate_at
    const nowIso = new Date();
    const toPromote = list.filter(l =>
      l.seller_id === identity.id && l.status === "pending" && new Date(l.activate_at) <= nowIso
    );
    for (const l of toPromote) {
      await supabase.from("pokemon_market").update({ status: "active" }).eq("id", l.id).eq("status", "pending");
    }
    if (toPromote.length > 0) {
      // re-fetch discreto pra refletir status
      const { data: fresh } = await supabase.from("pokemon_market").select("*")
        .in("id", toPromote.map(l => l.id));
      if (fresh) {
        setRows(cur => cur.map(r => (fresh as ListingRow[]).find(f => f.id === r.id) ?? r));
      }
    }

    // Ofertas relacionadas a mim (como vendedor OU comprador)
    const { data: offData } = await supabase
      .from("pokemon_market_offers")
      .select("*")
      .or(`seller_id.eq.${identity.id},buyer_id.eq.${identity.id}`)
      .order("created_at", { ascending: false })
      .limit(300);
    setOffers((offData ?? []) as OfferRow[]);
  };

  useEffect(() => {
    void refresh();
    const iv = setInterval(() => { void refresh(); }, 20000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity?.id]);

  const cancelUntil = identity?.id ? readCancelUntil(identity.id) : 0;
  const cancelRemaining = Math.max(0, cancelUntil - now);

  const vitrine = rows.filter(r => r.status === "active" && new Date(r.activate_at).getTime() <= now && r.seller_id !== (identity?.id ?? ""));
  const myListings = rows.filter(r => r.seller_id === (identity?.id ?? "") && (r.status === "pending" || r.status === "active"));
  const mySold = rows.filter(r => r.seller_id === (identity?.id ?? "") && r.status === "sold" && !r.payout_claimed);
  const myBought = rows.filter(r => r.buyer_id === (identity?.id ?? "") && r.status === "sold" && !r.buyer_claimed);

  // Locks in-memory sincronos pra evitar reentrância antes do await terminar.
  const inflightBuyerRef = useRef<Set<string>>(new Set());
  const inflightSellerRef = useRef<Set<string>>(new Set());

  // Após render, se houver compras não reclamadas, aplicar automaticamente no próximo tick.
  useEffect(() => {
    if (!identity?.id) return;
    (async () => {
      for (const r of myBought) {
        if (claimedBuyerRef.current.has(r.id)) continue;
        if (inflightBuyerRef.current.has(r.id)) continue;
        // Idempotência forte: se o pokémon já foi entregue nesta conta,
        // considera claim finalizado — nunca cobra de novo, mesmo se a
        // RLS bloquear o UPDATE de buyer_claimed no banco.
        const alreadyDelivered = collection.some(c => c.uid === `bought-${r.id}`);
        if (alreadyDelivered) {
          claimedBuyerRef.current.add(r.id);
          writeClaimSet(claimedBuyerKey(identity.id), claimedBuyerRef.current);
          // Tenta marcar no banco silenciosamente pra parar de reaparecer em myBought.
          void supabase.from("pokemon_market").update({ buyer_claimed: true })
            .eq("id", r.id).eq("buyer_claimed", false);
          continue;
        }
        // Para vendas via oferta o comprador só é debitado agora — precisa de saldo.
        if (r.via_offer) {
          const have = r.currency === "gold" ? gold : crystals;
          if (have < r.price) continue;
        }
        inflightBuyerRef.current.add(r.id);
        // Claim atômico: só o primeiro UPDATE que encontrar buyer_claimed=false vence.
        // Se a RLS bloquear ou já estiver claimed, `data` vem vazio e NÃO cobramos.
        const { data, error } = await supabase
          .from("pokemon_market")
          .update({ buyer_claimed: true })
          .eq("id", r.id)
          .eq("buyer_claimed", false)
          .select("id");
        if (error || !data || data.length === 0) {
          inflightBuyerRef.current.delete(r.id);
          // Sempre marca localmente após tentar — mesmo com erro RLS —
          // pra bloquear qualquer chance de reprocessar/cobrar novamente.
          claimedBuyerRef.current.add(r.id);
          writeClaimSet(claimedBuyerKey(identity.id), claimedBuyerRef.current);
          continue;
        }
        // Só agora cobra e entrega — garantido único.
        if (r.via_offer) onSpend(r.currency, r.price);
        claimedBuyerRef.current.add(r.id);
        writeClaimSet(claimedBuyerKey(identity.id), claimedBuyerRef.current);
        const entry: CollectionEntry = {
          uid: `bought-${r.id}`,
          species: r.pokemon.species,
          level: r.pokemon.level,
          rarity: r.pokemon.rarity,
          xp: r.pokemon.xp ?? 0,
          traits: r.pokemon.traits ?? [],
          capturedAt: Date.now(),
        };
        onReturned(entry);
        pushChat(r.via_offer
          ? `🤝 Oferta aceita! Recebeu ${r.pokemon.species} por ${r.price} ${r.currency === "gold" ? "ouro" : "cristal"}.`
          : `📦 Recebeu ${r.pokemon.species} do Marketplace.`, "cap");
        inflightBuyerRef.current.delete(r.id);
      }
      for (const r of mySold) {
        if (claimedSellerRef.current.has(r.id)) continue;
        if (inflightSellerRef.current.has(r.id)) continue;
        inflightSellerRef.current.add(r.id);
        const { data, error } = await supabase
          .from("pokemon_market")
          .update({ payout_claimed: true })
          .eq("id", r.id)
          .eq("payout_claimed", false)
          .select("id");
        if (error || !data || data.length === 0) {
          inflightSellerRef.current.delete(r.id);
          if (!error) {
            claimedSellerRef.current.add(r.id);
            writeClaimSet(claimedSellerKey(identity.id), claimedSellerRef.current);
          }
          continue;
        }
        onEarn(r.currency, r.price);
        claimedSellerRef.current.add(r.id);
        writeClaimSet(claimedSellerKey(identity.id), claimedSellerRef.current);
        pushChat(`💸 Recebeu ${r.price} ${r.currency === "gold" ? "ouro" : "cristal"} da venda de ${r.pokemon.species}.`, "cap");
        inflightSellerRef.current.delete(r.id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, gold, crystals]);

  const doList = async () => {
    if (!identity?.id) { pushChat("Faça login pra anunciar.", "info"); return; }
    const entry = collection.find(c => c.uid === selUid);
    if (!entry) { pushChat("Selecione um Pokémon da coleção.", "info"); return; }
    if (myListings.length >= 6) { pushChat("Você já tem 6 anúncios ativos. Aguarde ou cancele algum.", "info"); return; }
    if (price < 1 || price > 100_000_000) { pushChat("Preço inválido.", "info"); return; }
    if (currency === "crystal" && !isVip) { pushChat("✦ Vender por Cristal é exclusivo VIP.", "info"); return; }
    if (cancelRemaining > 0) { pushChat(`Cooldown ativo: aguarde ${fmtTime(cancelRemaining)}.`, "info"); return; }

    const activate = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    const payload = {
      seller_id: identity.id,
      seller_name: identity.name || "Treinador",
      pokemon: { uid: entry.uid, species: entry.species, level: entry.level, rarity: entry.rarity, xp: entry.xp ?? 0, traits: entry.traits ?? [] },
      price, currency,
      status: "pending",
      activate_at: activate,
      offers_only: offersOnly,
    };
    const { error } = await supabase.from("pokemon_market").insert(payload);
    if (error) {
      console.error("[market] insert failed", error, payload);
      const msg = String(error.message || error.hint || error.details || "erro desconhecido");
      if (/does not exist|schema cache|relation.*pokemon_market/i.test(msg)) {
        pushChat(`⚠ Marketplace ainda não ativado no banco. Rode o SQL SUPABASE_MARKETPLACE_POKEMON.sql no Supabase.`, "info");
      } else if (/row-level security|permission|policy/i.test(msg)) {
        pushChat(`⚠ Sem permissão pra anunciar (RLS). Confira login e políticas no Supabase.`, "info");
      } else {
        pushChat(`Falha ao anunciar: ${msg}`, "info");
      }
      return;
    }
    onListed(entry.uid);
    setSelUid("");
    pushChat(`📢 ${entry.species} anunciado por ${price} ${currency === "gold" ? "ouro" : "cristal"}. Fica visível em 3 min.`, "cap");
    void refresh();
    setMode("mine");
  };

  const doCancel = async (r: ListingRow) => {
    if (!identity?.id) return;
    const { data, error } = await supabase.from("pokemon_market")
      .update({ status: "cancelled" }).eq("id", r.id).eq("seller_id", identity.id)
      .in("status", ["pending", "active"]).select("id").maybeSingle();
    if (error || !data) { pushChat("Não foi possível cancelar (talvez já foi vendido).", "info"); void refresh(); return; }
    onReturned({
      uid: r.pokemon.uid, species: r.pokemon.species, level: r.pokemon.level,
      rarity: r.pokemon.rarity, xp: r.pokemon.xp ?? 0, traits: r.pokemon.traits ?? [], capturedAt: Date.now(),
    });
    const until = Date.now() + 5 * 60 * 1000;
    writeCancelUntil(identity.id, until);
    pushChat(`Anúncio cancelado. ${r.pokemon.species} devolvido. Cooldown de 5 min.`, "info");
    void refresh();
  };

  const doBuy = async (r: ListingRow) => {
    if (!identity?.id) return;
    if (r.seller_id === identity.id) return;
    if (r.offers_only) { pushChat("Este anúncio aceita apenas ofertas.", "info"); return; }
    if (claimedBuyerRef.current.has(r.id)) return; // já processado nesta sessão
    const have = r.currency === "gold" ? gold : crystals;
    if (have < r.price) { pushChat(`${r.currency === "gold" ? "Ouro" : "Cristal"} insuficiente.`, "info"); return; }
    // Reserva com UPDATE atômico — só um comprador vence a corrida.
    const { data, error } = await supabase.from("pokemon_market").update({
      status: "sold",
      buyer_id: identity.id,
      buyer_name: identity.name || "Treinador",
      sold_at: new Date().toISOString(),
    }).eq("id", r.id).eq("status", "active").is("buyer_id", null).select("id").maybeSingle();
    if (error || !data) { pushChat("Anúncio não está mais disponível.", "info"); void refresh(); return; }
    // Marca como processado ANTES de qualquer entrega, pra bloquear o useEffect
    // de reentregar o mesmo pokémon caso o refresh chegue antes do buyer_claimed.
    claimedBuyerRef.current.add(r.id);
    writeClaimSet(claimedBuyerKey(identity.id), claimedBuyerRef.current);
    onSpend(r.currency, r.price);
    onReturned({
      uid: `bought-${r.id}`, species: r.pokemon.species, level: r.pokemon.level,
      rarity: r.pokemon.rarity, xp: r.pokemon.xp ?? 0, traits: r.pokemon.traits ?? [], capturedAt: Date.now(),
    });
    await supabase.from("pokemon_market").update({ buyer_claimed: true }).eq("id", r.id);
    pushChat(`🛒 Comprou ${r.pokemon.species} por ${r.price} ${r.currency === "gold" ? "ouro" : "cristal"}.`, "cap");
    void refresh();
  };

  const doMakeOffer = async (r: ListingRow, amount: number) => {
    if (!identity?.id) { pushChat("Faça login pra ofertar.", "info"); return; }
    if (r.seller_id === identity.id) return;
    if (amount < 1 || amount > 100_000_000) { pushChat("Valor inválido.", "info"); return; }
    if (!r.offers_only && amount >= r.price) { pushChat(`Oferta precisa ser menor que ${r.price.toLocaleString()}.`, "info"); return; }
    const have = r.currency === "gold" ? gold : crystals;
    if (have < amount) { pushChat(`${r.currency === "gold" ? "Ouro" : "Cristal"} insuficiente pra cobrir a oferta.`, "info"); return; }
    // Só uma oferta pending por comprador+anúncio
    const existing = offers.find(o => o.listing_id === r.id && o.buyer_id === identity.id && o.status === "pending");
    if (existing) { pushChat("Você já tem uma oferta ativa nesse anúncio. Cancele antes de refazer.", "info"); return; }
    const { error } = await supabase.from("pokemon_market_offers").insert({
      listing_id: r.id, seller_id: r.seller_id,
      buyer_id: identity.id, buyer_name: identity.name || "Treinador",
      amount, currency: r.currency, status: "pending",
    });
    if (error) {
      const msg = String(error.message || "");
      if (/does not exist|relation.*pokemon_market_offers/i.test(msg)) {
        pushChat("⚠ Ofertas ainda não ativadas no banco. Rode o SQL SUPABASE_MARKETPLACE_OFFERS.sql.", "info");
      } else {
        pushChat(`Falha ao ofertar: ${msg}`, "info");
      }
      return;
    }
    pushChat(`💬 Oferta de ${amount.toLocaleString()} ${r.currency === "gold" ? "ouro" : "cristal"} enviada.`, "cap");
    void refresh();
  };

  const doAcceptOffer = async (o: OfferRow, r: ListingRow) => {
    if (!identity?.id || r.seller_id !== identity.id) return;
    // Aceita a oferta E marca o anúncio vendido, tudo num só passo por linha.
    const { data: sold, error: e1 } = await supabase.from("pokemon_market").update({
      status: "sold",
      buyer_id: o.buyer_id,
      buyer_name: o.buyer_name,
      price: o.amount,
      sold_at: new Date().toISOString(),
      via_offer: true,
    }).eq("id", r.id).eq("status", "active").is("buyer_id", null).select("id").maybeSingle();
    if (e1 || !sold) { pushChat("Não foi possível aceitar (anúncio pode ter sido vendido).", "info"); void refresh(); return; }
    await supabase.from("pokemon_market_offers").update({ status: "accepted" }).eq("id", o.id);
    // rejeita as outras ofertas do mesmo anúncio
    await supabase.from("pokemon_market_offers").update({ status: "rejected" })
      .eq("listing_id", r.id).eq("status", "pending").neq("id", o.id);
    pushChat(`✅ Oferta de ${o.buyer_name} aceita por ${o.amount.toLocaleString()} ${o.currency === "gold" ? "ouro" : "cristal"}.`, "cap");
    void refresh();
  };

  const doRejectOffer = async (o: OfferRow) => {
    if (!identity?.id || o.seller_id !== identity.id) return;
    await supabase.from("pokemon_market_offers").update({ status: "rejected" }).eq("id", o.id).eq("status", "pending");
    pushChat(`Oferta de ${o.buyer_name} recusada.`, "info");
    void refresh();
  };

  const doCancelOffer = async (o: OfferRow) => {
    if (!identity?.id || o.buyer_id !== identity.id) return;
    await supabase.from("pokemon_market_offers").update({ status: "cancelled" }).eq("id", o.id).eq("status", "pending");
    pushChat("Oferta cancelada.", "info");
    void refresh();
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ background: "linear-gradient(180deg,#0f2b3d,#02141e)", border: "2px solid #6bd4ff66", borderRadius: 12, padding: 14, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ color: "#6bd4ff", fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>🐾 MERCADO DE POKÉMON</div>
          <div style={{ color: "#8fb8d0", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
            Anuncie por Ouro ou Cristal (VIP). Aparece pra todos em <b>3 minutos</b>. Cancelar tranca novos anúncios por 5 min.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ background: "#0e0818", border: "1px solid #f5cf6b55", borderRadius: 8, padding: "6px 12px", color: "#f5cf6b", fontWeight: 800 }}>💰 {gold.toLocaleString()}</div>
          <div style={{ background: "#0e0818", border: "1px solid #6bd4ff55", borderRadius: 8, padding: "6px 12px", color: "#6bd4ff", fontWeight: 800 }}>💎 {crystals.toLocaleString()}</div>
        </div>
      </div>

      {cancelRemaining > 0 && (
        <div style={{ background: "#3d1e05", border: "1px solid #ff9d3d66", color: "#ffd0a0", fontSize: 12, padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>
          ⏳ Você cancelou um anúncio recente. Novo anúncio em <b>{fmtTime(cancelRemaining)}</b>.
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["browse","mine","create"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800,
            border: mode === m ? "1px solid #6bd4ff" : "1px solid #3a2a4a",
            background: mode === m ? "#0f2b3d" : "transparent",
            color: mode === m ? "#6bd4ff" : "#c8b8d0", cursor: "pointer",
          }}>
            {m === "browse" ? `🛍 Vitrine (${vitrine.length})` : m === "mine" ? `📃 Meus (${myListings.length})` : "📢 Anunciar"}
          </button>
        ))}
        <button onClick={() => void refresh()} style={{
          marginLeft: "auto", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800,
          border: "1px solid #3a2a4a", background: "transparent", color: "#c8b8d0", cursor: "pointer",
        }}>{loading ? "…" : "↻ Atualizar"}</button>
      </div>

      {mode === "browse" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
          {vitrine.length === 0 && <div style={{ color: "#8a7a9c", gridColumn: "1 / -1", padding: 24, textAlign: "center" }}>Nenhum Pokémon à venda no momento.</div>}
          {vitrine.map(r => {
            const myOffer = offers.find(o => o.listing_id === r.id && o.buyer_id === (identity?.id ?? "") && o.status === "pending");
            return (
              <ListingCard key={r.id} r={r} gifOf={gifOf} now={now}
                badge={r.offers_only ? "💬 Só ofertas" : undefined}
                action={r.offers_only
                  ? <div style={{ fontSize: 10, color: "#6bd4ff", fontWeight: 900, letterSpacing: 1, textAlign: "right" }}>SOMENTE<br/>OFERTAS</div>
                  : <button onClick={() => void doBuy(r)} style={btnGold}>🛒 COMPRAR</button>}
                footer={
                  <OfferBox
                    r={r} myOffer={myOffer}
                    onOffer={(amt) => void doMakeOffer(r, amt)}
                    onCancel={() => myOffer && void doCancelOffer(myOffer)}
                  />
                }
              />
            );
          })}
        </div>
      )}

      {mode === "mine" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myListings.length === 0 && mySold.length === 0 && (
            <div style={{ color: "#8a7a9c", padding: 24, textAlign: "center" }}>Você não tem anúncios ativos.</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {myListings.map(r => {
              const activateMs = new Date(r.activate_at).getTime() - now;
              const isPending = r.status === "pending" || activateMs > 0;
              const listingOffers = offers.filter(o => o.listing_id === r.id && o.status === "pending");
              return (
                <ListingCard key={r.id} r={r} gifOf={gifOf} now={now}
                  badge={isPending ? `⏳ Ativa em ${fmtTime(activateMs)}` : "✅ Ao vivo"}
                  action={<button onClick={() => void doCancel(r)} style={btnRed}>✖ CANCELAR</button>}
                  footer={
                    <OffersReceived
                      offers={listingOffers}
                      listing={r}
                      onAccept={(o) => void doAcceptOffer(o, r)}
                      onReject={(o) => void doRejectOffer(o)}
                    />
                  }
                />
              );
            })}
          </div>
        </div>
      )}


      {mode === "create" && (
        <CreateListing
          identity={identity} collection={collection} gifOf={gifOf}
          selUid={selUid} setSelUid={setSelUid}
          price={price} setPrice={setPrice}
          currency={currency} setCurrency={setCurrency}
          offersOnly={offersOnly} setOffersOnly={setOffersOnly}
          isVip={isVip} cooldownMs={cancelRemaining}
          onSubmit={() => void doList()}
        />
      )}
    </div>
  );
}

// ============ CARDS ============
function ListingCard(props: {
  r: ListingRow; gifOf: (sp: Species) => string | undefined; now: number;
  action?: React.ReactNode; badge?: string; footer?: React.ReactNode;
}) {
  const { r, gifOf, action, badge, footer } = props;
  const rc = RARITY_COLOR[r.pokemon.rarity] ?? "#c8b8d0";
  const elems = elementsOf(r.pokemon.species);
  const em = ELEMENT_META[elems[0]];
  const base = SPECIES_BASE[r.pokemon.species];
  const power = base ? computePower({
    uid: r.pokemon.uid, species: r.pokemon.species, level: r.pokemon.level,
    rarity: r.pokemon.rarity, hp: 1, maxHp: 1, xp: r.pokemon.xp ?? 0, moves: [],
    statBoost: r.pokemon.statBoost ?? 1,
  } as never) : (r.pokemon.level * 20);
  const traits = r.pokemon.traits ?? [];

  return (
    <div style={{
      background: `linear-gradient(160deg, ${em.color}22 0%, #1a0f26 45%, #0b0510 100%)`,
      border: `2px solid ${rc}`,
      borderRadius: 14, padding: 12, position: "relative", overflow: "hidden",
      boxShadow: `0 6px 20px rgba(0,0,0,0.5), 0 0 20px ${rc}33`,
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(circle at 50% 10%, ${em.color}33, transparent 55%)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#f7ecf7", textShadow: "0 2px 0 #000", textTransform: "uppercase", letterSpacing: 1 }}>
            {r.pokemon.species.replace(/_/g, " ")}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ background: `linear-gradient(180deg, ${rc}, ${rc}aa)`, color: "#0b0510", fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 999 }}>{RARITY_NAME[r.pokemon.rarity]}</span>
            <span style={{ fontSize: 10, color: "#f5cf6b", fontWeight: 900 }}>Lv {r.pokemon.level}</span>
            <span style={{ fontSize: 9, background: `${em.color}22`, color: em.color, border: `1px solid ${em.color}66`, padding: "2px 6px", borderRadius: 999, fontWeight: 900 }}>{em.emoji} {em.label}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, position: "relative" }}>
        <div style={{
          width: 82, height: 82, borderRadius: 12, flexShrink: 0,
          background: `radial-gradient(circle at 30% 25%, ${em.color}55, ${em.color}15 60%, rgba(0,0,0,0.6))`,
          border: `2px solid ${em.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {gifOf(r.pokemon.species) && <img src={gifOf(r.pokemon.species)} alt="" width={68} height={68} style={{ imageRendering: "pixelated" }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, letterSpacing: 2, color: "#c8b8d0", fontWeight: 900 }}>PODER</div>
          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace",
            background: "linear-gradient(180deg, #ffe084, #b8862a)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{power.toLocaleString()}</div>
          {traits.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 3 }}>
              {traits.slice(0, 3).map(id => {
                const t = TRAITS[id]; if (!t) return null;
                const col = TIER_COLOR[t.tier];
                return <span key={id} title={t.desc} style={{ fontSize: 8, padding: "2px 5px", borderRadius: 4, background: `${col}22`, border: `1px solid ${col}aa`, color: col, fontWeight: 900 }}>{t.icon} {t.name}</span>;
              })}
              {traits.length > 3 && <span style={{ fontSize: 8, color: "#c8b8d0" }}>+{traits.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", gap: 8 }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: "#8a7a9c", fontWeight: 900 }}>PREÇO</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: r.currency === "gold" ? "#f5cf6b" : "#6bd4ff" }}>
            {r.currency === "gold" ? "💰" : "💎"} {r.price.toLocaleString()}
          </div>
          <div style={{ fontSize: 9, color: "#8a7a9c", marginTop: 2 }}>por <b style={{ color: "#c8b8d0" }}>{r.seller_name}</b></div>
        </div>
        {action}
      </div>
      {badge && (
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 900,
          padding: "3px 7px", borderRadius: 999,
          background: "rgba(0,0,0,0.6)", border: "1px solid #6bd4ff66", color: "#6bd4ff" }}>{badge}</div>
      )}
      {footer && <div style={{ marginTop: 10, position: "relative" }}>{footer}</div>}
    </div>
  );
}

// ============ OFERTAS ============
function OfferBox(props: {
  r: ListingRow;
  myOffer?: OfferRow;
  onOffer: (amount: number) => void;
  onCancel: () => void;
}) {
  const { r, myOffer, onOffer, onCancel } = props;
  const suggested = Math.max(1, Math.floor(r.price * 0.7));
  const [val, setVal] = useState<number>(suggested);
  if (myOffer) {
    return (
      <div style={{ background: "#0e0818", border: "1px dashed #6bd4ff55", borderRadius: 8, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <div style={{ fontSize: 10, color: "#c8b8d0" }}>
          Sua oferta: <b style={{ color: myOffer.currency === "gold" ? "#f5cf6b" : "#6bd4ff" }}>{myOffer.amount.toLocaleString()}</b>
        </div>
        <button onClick={onCancel} style={{ ...btnRed, padding: "4px 8px", fontSize: 9 }}>Cancelar</button>
      </div>
    );
  }
  return (
    <div style={{ background: "#0e0818", border: "1px solid #3a2a4a", borderRadius: 8, padding: 8, display: "flex", gap: 6, alignItems: "center" }}>
      <input type="number" min={1} max={r.price - 1} value={val}
        onChange={e => setVal(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
        style={{ flex: 1, minWidth: 0, padding: "5px 8px", background: "#0b0510", border: "1px solid #3a2a4a", borderRadius: 6, color: "#eadfe8", fontFamily: "monospace", fontWeight: 900, fontSize: 12 }} />
      <button onClick={() => onOffer(val)} style={{ ...btnBlue, padding: "5px 10px", fontSize: 10 }}>💬 OFERTAR</button>
    </div>
  );
}

function OffersReceived(props: {
  offers: OfferRow[];
  listing: ListingRow;
  onAccept: (o: OfferRow) => void;
  onReject: (o: OfferRow) => void;
}) {
  const { offers, onAccept, onReject } = props;
  if (offers.length === 0) {
    return <div style={{ fontSize: 10, color: "#8a7a9c", fontStyle: "italic", padding: "6px 4px" }}>Nenhuma oferta ainda.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: "#f5cf6b", fontWeight: 900 }}>💬 OFERTAS ({offers.length})</div>
      {offers.map(o => (
        <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0e0818", border: "1px solid #3a2a4a", borderRadius: 6, padding: "4px 6px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "#eadfe8", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.buyer_name}</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: o.currency === "gold" ? "#f5cf6b" : "#6bd4ff" }}>
              {o.currency === "gold" ? "💰" : "💎"} {o.amount.toLocaleString()}
            </div>
          </div>
          <button onClick={() => onAccept(o)} title="Aceitar" style={{ ...btnGold, padding: "3px 7px", fontSize: 9 }}>✓</button>
          <button onClick={() => onReject(o)} title="Recusar" style={{ ...btnRed, padding: "3px 7px", fontSize: 9 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ============ ANUNCIAR ============
function CreateListing(props: {
  identity: { id: string; name: string } | null;
  collection: CollectionEntry[];
  gifOf: (sp: Species) => string | undefined;
  selUid: string; setSelUid: (u: string) => void;
  price: number; setPrice: (n: number) => void;
  currency: Currency; setCurrency: (c: Currency) => void;
  offersOnly: boolean; setOffersOnly: (b: boolean) => void;
  isVip: boolean; cooldownMs: number;
  onSubmit: () => void;
}) {
  const { collection, gifOf, selUid, setSelUid, price, setPrice, currency, setCurrency, offersOnly, setOffersOnly, isVip, cooldownMs, onSubmit } = props;
  const sorted = useMemo(() => [...collection].sort((a, b) => b.level - a.level), [collection]);
  const selected = collection.find(c => c.uid === selUid);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
      <div style={{ background: "#0e0818", border: "1px solid #3a2a4a", borderRadius: 10, padding: 10, maxHeight: 480, overflowY: "auto" }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "#c8b8d0", marginBottom: 8 }}>ESCOLHA UM POKÉMON DA COLEÇÃO</div>
        {sorted.length === 0 && <div style={{ color: "#8a7a9c", padding: 16 }}>Sua coleção está vazia.</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))", gap: 6 }}>
          {sorted.map(e => {
            const rc = RARITY_COLOR[e.rarity] ?? "#c8b8d0";
            const sel = selUid === e.uid;
            return (
              <button key={e.uid} onClick={() => setSelUid(e.uid)} style={{
                padding: 6, borderRadius: 8, border: `2px solid ${sel ? "#f5cf6b" : rc}`,
                background: sel ? "#2a1c05" : "#150a20", cursor: "pointer", textAlign: "center",
                boxShadow: sel ? "0 0 12px #f5cf6b88" : "none",
              }}>
                {gifOf(e.species) && <img src={gifOf(e.species)} alt="" width={42} height={42} style={{ imageRendering: "pixelated" }} />}
                <div style={{ fontSize: 9, fontWeight: 900, color: "#eadfe8", textTransform: "uppercase", marginTop: 2 }}>{e.species.slice(0, 8)}</div>
                <div style={{ fontSize: 8, color: rc, fontWeight: 900 }}>Lv{e.level}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: "linear-gradient(160deg,#0f2b3d,#04101a)", border: "2px solid #6bd4ff66", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "#6bd4ff" }}>📢 NOVO ANÚNCIO</div>
        {selected ? (
          <div style={{ background: "#0b0510", borderRadius: 8, padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
            {gifOf(selected.species) && <img src={gifOf(selected.species)} alt="" width={54} height={54} style={{ imageRendering: "pixelated" }} />}
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#f7ecf7", textTransform: "uppercase" }}>{selected.species}</div>
              <div style={{ fontSize: 10, color: RARITY_COLOR[selected.rarity] ?? "#c8b8d0", fontWeight: 900 }}>{RARITY_NAME[selected.rarity]} · Lv {selected.level}</div>
            </div>
          </div>
        ) : (
          <div style={{ color: "#8a7a9c", fontSize: 11, padding: 6 }}>Selecione um pokémon ao lado.</div>
        )}

        <div>
          <div style={{ fontSize: 10, color: "#c8b8d0", fontWeight: 900, marginBottom: 4 }}>MOEDA</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setCurrency("gold")} style={{
              flex: 1, padding: "8px", borderRadius: 8, fontWeight: 900, fontSize: 11,
              border: `1px solid ${currency === "gold" ? "#f5cf6b" : "#3a2a4a"}`,
              background: currency === "gold" ? "#2a1c05" : "transparent",
              color: currency === "gold" ? "#f5cf6b" : "#c8b8d0", cursor: "pointer",
            }}>💰 OURO</button>
            <button onClick={() => isVip && setCurrency("crystal")} disabled={!isVip} title={isVip ? "" : "Requer VIP"} style={{
              flex: 1, padding: "8px", borderRadius: 8, fontWeight: 900, fontSize: 11,
              border: `1px solid ${currency === "crystal" ? "#6bd4ff" : "#3a2a4a"}`,
              background: currency === "crystal" ? "#0f2b3d" : "transparent",
              color: !isVip ? "#5a5a70" : (currency === "crystal" ? "#6bd4ff" : "#c8b8d0"),
              cursor: isVip ? "pointer" : "not-allowed", opacity: isVip ? 1 : 0.6,
            }}>💎 CRISTAL {!isVip && "🔒"}</button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: "#c8b8d0", fontWeight: 900, marginBottom: 4 }}>PREÇO</div>
          <input type="number" min={1} max={100000000} value={price} onChange={e => setPrice(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
            style={{ width: "100%", padding: "8px 10px", background: "#0b0510", border: "1px solid #3a2a4a", borderRadius: 8, color: "#eadfe8", fontFamily: "monospace", fontSize: 14, fontWeight: 900 }} />
        </div>

        <label style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: offersOnly ? "#0f2b3d" : "#0b0510",
          border: `1px solid ${offersOnly ? "#6bd4ff" : "#3a2a4a"}`,
          borderRadius: 8, padding: "8px 10px",
        }}>
          <input type="checkbox" checked={offersOnly} onChange={e => setOffersOnly(e.target.checked)}
            style={{ accentColor: "#6bd4ff", width: 16, height: 16 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: offersOnly ? "#6bd4ff" : "#c8b8d0" }}>💬 SOMENTE OFERTAS</div>
            <div style={{ fontSize: 9, color: "#8a7a9c", marginTop: 2 }}>
              Bloqueia compra direta. O preço vira apenas referência — só vende se você aceitar uma oferta.
            </div>
          </div>
        </label>

        <div style={{ fontSize: 10, color: "#8a7a9c", lineHeight: 1.5 }}>
          • Aparece pra todos em <b style={{ color: "#f5cf6b" }}>3 minutos</b>.<br/>
          • Cancelar tranca novos anúncios por 5 min.<br/>
          • Máximo de <b>6 anúncios ativos</b> por vez.
        </div>

        <button onClick={onSubmit} disabled={!selected || cooldownMs > 0} style={{
          ...btnGold, opacity: (!selected || cooldownMs > 0) ? 0.5 : 1,
          cursor: (!selected || cooldownMs > 0) ? "not-allowed" : "pointer",
        }}>{cooldownMs > 0 ? `⏳ ${fmtTime(cooldownMs)}` : "📢 ANUNCIAR"}</button>
      </div>
    </div>
  );
}

const btnGold: React.CSSProperties = {
  padding: "8px 14px", fontSize: 11, fontWeight: 900, letterSpacing: 1,
  background: "linear-gradient(180deg, #ffd66b, #b8862a)", color: "#0b0510",
  border: "1px solid #fff4d0", borderRadius: 8, cursor: "pointer",
  boxShadow: "0 3px 8px rgba(184,134,42,0.5)",
};
const btnRed: React.CSSProperties = {
  padding: "8px 14px", fontSize: 11, fontWeight: 900, letterSpacing: 1,
  background: "linear-gradient(180deg, #ff5a5a, #8a1a1a)", color: "#fff",
  border: "1px solid #ffb8b8", borderRadius: 8, cursor: "pointer",
};
const btnBlue: React.CSSProperties = {
  padding: "8px 14px", fontSize: 11, fontWeight: 900, letterSpacing: 1,
  background: "linear-gradient(180deg, #6bd4ff, #1a5a8a)", color: "#0b0510",
  border: "1px solid #b8ecff", borderRadius: 8, cursor: "pointer",
  boxShadow: "0 3px 8px rgba(26,90,138,0.5)",
};
