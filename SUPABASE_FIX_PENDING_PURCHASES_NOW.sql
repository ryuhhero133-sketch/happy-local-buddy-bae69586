-- ============================================================
-- FIX: "Could not find the table 'public.pending_purchases'"
-- Roda TUDO isso no SQL Editor do Supabase (pode rodar quantas vezes quiser).
-- ============================================================

-- 0) Garante que user_roles + has_role existem (necessário pras policies de admin)
do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

drop policy if exists user_roles_read_own_or_admin on public.user_roles;
create policy user_roles_read_own_or_admin on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- 1) Colunas extras em cash_products (se a tabela existir)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='cash_products') then
    execute 'alter table public.cash_products
      add column if not exists payment_link_url text,
      add column if not exists price_brl        numeric(10,2),
      add column if not exists payment_method   text';
  end if;
end $$;

-- 2) TABELA pending_purchases (é ELA que tá faltando no seu banco)
create table if not exists public.pending_purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  username          text not null,
  product_id        uuid not null,
  product_name      text not null,
  price_brl         numeric(10,2),
  payment_method    text,
  payment_link_url  text,
  transaction_ref   text,
  grants            jsonb not null default '{}'::jsonb,
  status            text not null default 'analise',
  admin_note        text,
  approved_by       text,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default (now() + interval '10 minutes'),
  resolved_at       timestamptz
);

grant select, insert, update on public.pending_purchases to authenticated;
grant all on public.pending_purchases to service_role;

alter table public.pending_purchases enable row level security;

drop policy if exists pp_select_own on public.pending_purchases;
create policy pp_select_own on public.pending_purchases
  for select to authenticated using (user_id = auth.uid());

drop policy if exists pp_insert_own on public.pending_purchases;
create policy pp_insert_own on public.pending_purchases
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists pp_update_own on public.pending_purchases;
create policy pp_update_own on public.pending_purchases
  for update to authenticated
  using (user_id = auth.uid() and status = 'analise')
  with check (user_id = auth.uid());

drop policy if exists pp_select_admin on public.pending_purchases;
create policy pp_select_admin on public.pending_purchases
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists pp_update_admin on public.pending_purchases;
create policy pp_update_admin on public.pending_purchases
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists pp_status_idx on public.pending_purchases (status, created_at desc);
create index if not exists pp_user_idx   on public.pending_purchases (user_id, created_at desc);

-- 3) Garante seu e-mail como admin
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('lordryuhhhuyuyghh@gmail.com')
on conflict (user_id, role) do nothing;

-- 4) Realtime (ignora se já estiver)
do $$
begin
  begin
    alter publication supabase_realtime add table public.pending_purchases;
  exception when duplicate_object then null;
  end;
end $$;

-- 5) FORÇA o PostgREST a recarregar o schema cache (mata o erro do print)
notify pgrst, 'reload schema';

-- 6) Conferência
select 'pending_purchases OK' as check_1,
       (select count(*) from public.pending_purchases) as total_linhas;

select u.email, ur.role
from auth.users u
left join public.user_roles ur on ur.user_id = u.id
where lower(u.email) = lower('lordryuhhhuyuyghh@gmail.com');
