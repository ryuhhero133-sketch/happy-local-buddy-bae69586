-- =====================================================
-- Ofertas do Marketplace de Pokémon
-- Rode UMA vez no Supabase Studio → SQL Editor.
-- Requer que SUPABASE_MARKETPLACE_POKEMON.sql já esteja rodado.
-- Idempotente.
-- =====================================================

-- Coluna opcional na listing pra marcar "vendido via oferta"
alter table public.pokemon_market
  add column if not exists via_offer boolean not null default false;

create table if not exists public.pokemon_market_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.pokemon_market(id) on delete cascade,
  seller_id uuid not null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  buyer_name text not null,
  amount bigint not null check (amount > 0 and amount <= 100000000),
  currency text not null check (currency in ('gold','crystal')),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists pkm_offers_listing_idx on public.pokemon_market_offers (listing_id, status);
create index if not exists pkm_offers_buyer_idx   on public.pokemon_market_offers (buyer_id, status);
create index if not exists pkm_offers_seller_idx  on public.pokemon_market_offers (seller_id, status);

grant select, insert, update on public.pokemon_market_offers to authenticated;
grant all on public.pokemon_market_offers to service_role;

alter table public.pokemon_market_offers enable row level security;

drop policy if exists "pkm_offers_select"        on public.pokemon_market_offers;
drop policy if exists "pkm_offers_insert_buyer"  on public.pokemon_market_offers;
drop policy if exists "pkm_offers_update_seller" on public.pokemon_market_offers;
drop policy if exists "pkm_offers_update_buyer"  on public.pokemon_market_offers;

-- SELECT: comprador vê as próprias; vendedor vê as do próprio anúncio
create policy "pkm_offers_select" on public.pokemon_market_offers
  for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- INSERT: comprador cria em nome próprio, sempre pending, nunca no próprio anúncio
create policy "pkm_offers_insert_buyer" on public.pokemon_market_offers
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and status = 'pending'
    and seller_id <> auth.uid()
  );

-- UPDATE do vendedor: aceitar/rejeitar
create policy "pkm_offers_update_seller" on public.pokemon_market_offers
  for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

-- UPDATE do comprador: cancelar a própria oferta pending
create policy "pkm_offers_update_buyer" on public.pokemon_market_offers
  for update to authenticated
  using (buyer_id = auth.uid() and status = 'pending')
  with check (buyer_id = auth.uid() and status = 'cancelled');
