-- =====================================================
-- Marketplace de Pokémon (P2P entre jogadores)
-- Rode este SQL uma vez no Supabase Studio → SQL Editor.
-- Já tolera "rodei duas vezes" (uses IF NOT EXISTS / OR REPLACE).
-- =====================================================

create table if not exists public.pokemon_market (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_name text not null,
  pokemon jsonb not null,
  price bigint not null check (price > 0 and price <= 100000000),
  currency text not null check (currency in ('gold','crystal')),
  status text not null default 'pending' check (status in ('pending','active','sold','cancelled')),
  activate_at timestamptz not null,
  buyer_id uuid references auth.users(id),
  buyer_name text,
  sold_at timestamptz,
  payout_claimed boolean not null default false,
  buyer_claimed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists pokemon_market_status_idx on public.pokemon_market (status, activate_at);
create index if not exists pokemon_market_seller_idx on public.pokemon_market (seller_id, status);
create index if not exists pokemon_market_buyer_idx  on public.pokemon_market (buyer_id, status);

-- GRANTs obrigatórios (PostgREST não concede nada por padrão)
grant select, insert, update on public.pokemon_market to authenticated;
grant all on public.pokemon_market to service_role;

alter table public.pokemon_market enable row level security;

-- limpa políticas antigas se re-executar
drop policy if exists "pkm_market_select"        on public.pokemon_market;
drop policy if exists "pkm_market_insert_own"    on public.pokemon_market;
drop policy if exists "pkm_market_update_seller" on public.pokemon_market;
drop policy if exists "pkm_market_update_buyer"  on public.pokemon_market;

-- SELECT: qualquer autenticado vê vitrine ativa; dono/comprador vê o próprio
create policy "pkm_market_select" on public.pokemon_market
  for select to authenticated
  using (
    (status = 'active' and activate_at <= now())
    or (status = 'pending' and seller_id = auth.uid())
    or seller_id = auth.uid()
    or buyer_id = auth.uid()
  );

-- INSERT: só cria em nome próprio, sempre em estado pending
create policy "pkm_market_insert_own" on public.pokemon_market
  for insert to authenticated
  with check (
    seller_id = auth.uid()
    and status = 'pending'
    and activate_at >= now()
  );

-- UPDATE do vendedor: promover pending→active, cancelar, marcar payout
create policy "pkm_market_update_seller" on public.pokemon_market
  for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

-- UPDATE do comprador: comprar (status active→sold)
create policy "pkm_market_update_buyer" on public.pokemon_market
  for update to authenticated
  using (
    status = 'active'
    and activate_at <= now()
    and seller_id <> auth.uid()
    and buyer_id is null
  )
  with check (
    buyer_id = auth.uid()
    and status = 'sold'
  );
