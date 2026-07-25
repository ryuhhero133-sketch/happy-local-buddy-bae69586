-- ============================================================
-- Ranking global do evento GRASS ODDISH
-- Rode no Supabase → SQL Editor. Cria a tabela, GRANTs, RLS
-- e as RPCs usadas pelo cliente (submit + top).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.oddish_event_leaderboard (
  user_id uuid primary key,
  username text not null default 'Treinador',
  captures integer not null default 0,
  updated_at timestamptz not null default now()
);

grant select on public.oddish_event_leaderboard to anon;
grant select, insert, update on public.oddish_event_leaderboard to authenticated;
grant all on public.oddish_event_leaderboard to service_role;

alter table public.oddish_event_leaderboard enable row level security;

drop policy if exists "Anyone can read oddish leaderboard" on public.oddish_event_leaderboard;
create policy "Anyone can read oddish leaderboard"
on public.oddish_event_leaderboard
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert own oddish score" on public.oddish_event_leaderboard;
create policy "Users can insert own oddish score"
on public.oddish_event_leaderboard
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own oddish score" on public.oddish_event_leaderboard;
create policy "Users can update own oddish score"
on public.oddish_event_leaderboard
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Upsert seguro: só permite o valor subir (evita rollback por save antigo).
-- Aceita `_username` do cliente e, quando ele não vier/for fallback, busca
-- o nome real em `profiles.username`. Isso corrige "todo mundo aparece como Treinador".
drop function if exists public.record_oddish_captures(integer);
drop function if exists public.record_oddish_captures(integer, text);
create or replace function public.record_oddish_captures(_captures integer, _username text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _name text;
  _safe integer := greatest(0, least(coalesce(_captures, 0), 10000000));
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  select nullif(btrim(p.username), '') into _name
  from public.profiles p
  where p.id = _uid
  limit 1;

  _name := coalesce(
    nullif(nullif(btrim(_username), ''), 'Treinador'),
    nullif(_name, 'Treinador'),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'username', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'name', ''),
    'Treinador'
  );
  _name := left(_name, 24);

  insert into public.oddish_event_leaderboard (user_id, username, captures, updated_at)
  values (_uid, _name, _safe, now())
  on conflict (user_id) do update set
    username = excluded.username,
    captures = greatest(public.oddish_event_leaderboard.captures, excluded.captures),
    updated_at = now();
end;
$$;

grant execute on function public.record_oddish_captures(integer, text) to authenticated;

-- Corrige nomes antigos já gravados como fallback no ranking.
update public.oddish_event_leaderboard o
set username = left(btrim(p.username), 24),
    updated_at = now()
from public.profiles p
where o.user_id = p.id
  and nullif(btrim(p.username), '') is not null
  and o.username = 'Treinador';

create or replace function public.get_oddish_top(_limit integer default 100)
returns table (
  user_id uuid,
  username text,
  captures integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select user_id, username, captures, updated_at
  from public.oddish_event_leaderboard
  where captures > 0
  order by captures desc, updated_at asc
  limit greatest(1, least(coalesce(_limit, 100), 500));
$$;

grant execute on function public.get_oddish_top(integer) to anon;
grant execute on function public.get_oddish_top(integer) to authenticated;

create index if not exists oddish_event_leaderboard_captures_idx
on public.oddish_event_leaderboard (captures desc, updated_at asc);
