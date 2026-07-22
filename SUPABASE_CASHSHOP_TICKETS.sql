-- ============================================================
-- CHAT / TICKETS DA LOJINHA CASH
-- Rode no SQL Editor do Supabase.
-- Requer a tabela public.user_roles já existente no projeto
-- (a mesma usada em SUPABASE_PENDING_PURCHASES.sql). Para o
-- painel admin funcionar no DB, o admin precisa ter uma linha
-- em user_roles com role = 'admin'.
-- ============================================================

create table if not exists public.cashshop_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  username    text not null default '',
  from_role   text not null check (from_role in ('user','support')),
  text        text not null default '',
  image       text,
  created_at  timestamptz not null default now()
);

grant select, insert on public.cashshop_tickets to authenticated;
grant all on public.cashshop_tickets to service_role;

alter table public.cashshop_tickets enable row level security;

-- Usuário vê o próprio ticket
drop policy if exists ct_select_own on public.cashshop_tickets;
create policy ct_select_own on public.cashshop_tickets
  for select to authenticated using (user_id = auth.uid());

-- Usuário insere só como 'user' e no próprio ticket
drop policy if exists ct_insert_own on public.cashshop_tickets;
create policy ct_insert_own on public.cashshop_tickets
  for insert to authenticated
  with check (user_id = auth.uid() and from_role = 'user');

-- Admin lê todos
drop policy if exists ct_select_admin on public.cashshop_tickets;
create policy ct_select_admin on public.cashshop_tickets
  for select to authenticated
  using (exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role = 'admin'));

-- Admin responde como 'support' em qualquer ticket
drop policy if exists ct_insert_admin on public.cashshop_tickets;
create policy ct_insert_admin on public.cashshop_tickets
  for insert to authenticated
  with check (from_role = 'support'
              and exists (select 1 from public.user_roles ur
                          where ur.user_id = auth.uid() and ur.role = 'admin'));

create index if not exists ct_user_created_idx on public.cashshop_tickets (user_id, created_at);
create index if not exists ct_created_idx      on public.cashshop_tickets (created_at desc);

-- Realtime
alter publication supabase_realtime add table public.cashshop_tickets;
