-- =====================================================
-- LOJINHA CASH — Setup completo
-- Rodar UMA vez no Supabase Studio → SQL Editor.
-- Idempotente: pode ser re-executado sem quebrar.
-- =====================================================

-- 1) Produtos (todos os itens vendidos na loja)
create table if not exists public.cash_products (
  id text primary key,
  category text not null check (category in ('featured','sapphire','package','egg','premium','promo','other')),
  name text not null,
  description text,
  image_url text,
  currency text not null default 'cash' check (currency in ('cash','sapphires','tokens','tickets','coins','crystals')),
  price integer not null default 0,
  discount_pct integer,
  grants jsonb default '{}'::jsonb,     -- ex: {"crystals":1000,"ultraball":25}
  active boolean not null default true,
  sort integer default 0,
  badge text,                           -- ex: "HOT", "NOVO", "-50%"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.cash_products to authenticated, anon;
grant all on public.cash_products to service_role;

alter table public.cash_products enable row level security;

drop policy if exists "cash_products_read_all" on public.cash_products;
create policy "cash_products_read_all" on public.cash_products
  for select to authenticated, anon using (active = true);

-- 2) Carteira do jogador (moedas premium)
create table if not exists public.cash_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins bigint not null default 0,
  crystals bigint not null default 0,
  sapphires bigint not null default 0,
  tokens bigint not null default 0,
  tickets bigint not null default 0,
  cash bigint not null default 0,
  vip_until timestamptz,
  premium_until timestamptz,
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.cash_wallets to authenticated;
grant all on public.cash_wallets to service_role;

alter table public.cash_wallets enable row level security;

drop policy if exists "cash_wallets_read_own" on public.cash_wallets;
create policy "cash_wallets_read_own" on public.cash_wallets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cash_wallets_upsert_own" on public.cash_wallets;
create policy "cash_wallets_upsert_own" on public.cash_wallets
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "cash_wallets_update_own" on public.cash_wallets;
create policy "cash_wallets_update_own" on public.cash_wallets
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3) Histórico de compras
create table if not exists public.cash_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text,
  product_id text not null,
  currency text not null,
  price_paid integer not null,
  grants jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant select, insert on public.cash_purchases to authenticated;
grant all on public.cash_purchases to service_role;

alter table public.cash_purchases enable row level security;

drop policy if exists "cash_purchases_read_own" on public.cash_purchases;
create policy "cash_purchases_read_own" on public.cash_purchases
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cash_purchases_insert_own" on public.cash_purchases;
create policy "cash_purchases_insert_own" on public.cash_purchases
  for insert to authenticated with check (user_id = auth.uid());

-- 4) Histórico de conversões
create table if not exists public.cash_conversions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_currency text not null,
  to_currency text not null,
  amount_from integer not null,
  amount_to integer not null,
  created_at timestamptz not null default now()
);

grant select, insert on public.cash_conversions to authenticated;
grant all on public.cash_conversions to service_role;

alter table public.cash_conversions enable row level security;

drop policy if exists "cash_conv_read_own" on public.cash_conversions;
create policy "cash_conv_read_own" on public.cash_conversions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cash_conv_insert_own" on public.cash_conversions;
create policy "cash_conv_insert_own" on public.cash_conversions
  for insert to authenticated with check (user_id = auth.uid());

-- =====================================================
-- Produtos de exemplo (opcional — remova se preferir vazio)
-- =====================================================
insert into public.cash_products (id, category, name, description, currency, price, grants, badge, sort) values
  ('pkg_starter', 'package', 'Pacote Inicial', '5000 cristais + 30 pokébolas para começar', 'cash', 990, '{"crystals":5000,"pokeball":30}'::jsonb, 'NOVO', 10),
  ('pkg_vip30',   'premium', 'VIP 30 dias', 'Bônus de XP e Gold por 30 dias', 'cash', 1990, '{"vip_days":30}'::jsonb, 'HOT', 20),
  ('safira_1k',   'sapphire','1.000 Safiras', 'Pacote de 1000 safiras premium', 'cash', 490, '{"sapphires":1000}'::jsonb, null, 30),
  ('egg_myth',    'egg',     'Ovo Mítico ✦', 'Ovo raro com pokemon lendário garantido', 'sapphires', 500, '{"egg_myth":1}'::jsonb, 'RARO', 40)
on conflict (id) do nothing;
