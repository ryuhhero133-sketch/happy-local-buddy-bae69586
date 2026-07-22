-- ============================================================
-- FIX ADMIN LOJINHA CASH / TICKETS / VENDAS EM ANÁLISE
-- Rode no SQL Editor do Supabase.
-- Admin liberado: lordryuhhhuyuyghh@gmail.com
-- ============================================================

-- 1) Garante tabela de roles separada e segura
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
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

drop policy if exists user_roles_read_own_or_admin on public.user_roles;
create policy user_roles_read_own_or_admin
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- 2) Torna esse e-mail admin da Lojinha
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('lordryuhhhuyuyghh@gmail.com')
on conflict (user_id, role) do nothing;

-- 3) Permissões Data API das tabelas da lojinha
grant select, insert on public.cashshop_tickets to authenticated;
grant all on public.cashshop_tickets to service_role;
grant select, insert, update on public.pending_purchases to authenticated;
grant all on public.pending_purchases to service_role;

alter table public.cashshop_tickets enable row level security;
alter table public.pending_purchases enable row level security;

-- 4) Policies dos tickets usando a função segura
drop policy if exists ct_select_own on public.cashshop_tickets;
create policy ct_select_own on public.cashshop_tickets
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists ct_insert_own on public.cashshop_tickets;
create policy ct_insert_own on public.cashshop_tickets
  for insert to authenticated
  with check (user_id = auth.uid() and from_role = 'user');

drop policy if exists ct_select_admin on public.cashshop_tickets;
create policy ct_select_admin on public.cashshop_tickets
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists ct_insert_admin on public.cashshop_tickets;
create policy ct_insert_admin on public.cashshop_tickets
  for insert to authenticated
  with check (from_role = 'support' and public.has_role(auth.uid(), 'admin'));

-- 5) Policies de vendas em análise usando a função segura
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
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists pp_update_admin on public.pending_purchases;
create policy pp_update_admin on public.pending_purchases
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 6) Realtime (se já existir na publicação, ignora o erro de duplicado)
do $$
begin
  begin
    alter publication supabase_realtime add table public.cashshop_tickets;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.pending_purchases;
  exception when duplicate_object then null;
  end;
end $$;

-- 7) Conferência final
select u.id, u.email, ur.role
from auth.users u
left join public.user_roles ur on ur.user_id = u.id
where lower(u.email) = lower('lordryuhhhuyuyghh@gmail.com');