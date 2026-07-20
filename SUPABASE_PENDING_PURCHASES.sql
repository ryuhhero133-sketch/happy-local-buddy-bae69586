-- ============================================================
-- SISTEMA DE PAGAMENTO MANUAL (PicPay / Stripe Link / Mercado Pago)
-- ============================================================
-- Roda esse SQL no SQL Editor do Supabase.

-- 1) Campos extras nos produtos (link + preço em R$)
alter table if exists public.cash_products
  add column if not exists payment_link_url text,
  add column if not exists price_brl        numeric(10,2),
  add column if not exists payment_method   text; -- "picpay" | "stripe" | "mercadopago" | "outro"

-- 2) Tabela de compras pendentes (fica "em análise" 10 min)
create table if not exists public.pending_purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  username          text not null,
  product_id        uuid not null,
  product_name      text not null,
  price_brl         numeric(10,2),
  payment_method    text,
  payment_link_url  text,
  transaction_ref   text,                -- id da transação / comprovante que o jogador informar
  grants            jsonb not null default '{}'::jsonb,
  status            text not null default 'analise', -- analise | approved | rejected | expired
  admin_note        text,
  approved_by       text,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default (now() + interval '10 minutes'),
  resolved_at       timestamptz
);

grant select, insert, update on public.pending_purchases to authenticated;
grant all on public.pending_purchases to service_role;

alter table public.pending_purchases enable row level security;

-- Jogador vê e cria só as próprias
drop policy if exists pp_select_own on public.pending_purchases;
create policy pp_select_own on public.pending_purchases
  for select to authenticated using (user_id = auth.uid());

drop policy if exists pp_insert_own on public.pending_purchases;
create policy pp_insert_own on public.pending_purchases
  for insert to authenticated with check (user_id = auth.uid());

-- Jogador pode cancelar a própria enquanto em análise
drop policy if exists pp_update_own on public.pending_purchases;
create policy pp_update_own on public.pending_purchases
  for update to authenticated
  using (user_id = auth.uid() and status = 'analise')
  with check (user_id = auth.uid());

-- Admin: precisa ter role 'admin' em user_roles (já existente no projeto)
drop policy if exists pp_select_admin on public.pending_purchases;
create policy pp_select_admin on public.pending_purchases
  for select to authenticated
  using (exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role = 'admin'));

drop policy if exists pp_update_admin on public.pending_purchases;
create policy pp_update_admin on public.pending_purchases
  for update to authenticated
  using (exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role = 'admin'))
  with check (exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role = 'admin'));

create index if not exists pp_status_idx on public.pending_purchases (status, created_at desc);
create index if not exists pp_user_idx   on public.pending_purchases (user_id, created_at desc);
