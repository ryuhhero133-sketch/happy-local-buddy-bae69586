-- Correção do TOP RANKED para Supabase externo.
-- Rode este SQL no Supabase SQL Editor.
-- Ele cria/ajusta as tabelas públicas, GRANTs, RLS e RPC usados pelo jogo.

create extension if not exists pgcrypto;

create table if not exists public.ranked_seasons (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '30 days'),
  is_current boolean not null default true
);

grant select on public.ranked_seasons to anon;
grant select on public.ranked_seasons to authenticated;
grant all on public.ranked_seasons to service_role;

alter table public.ranked_seasons enable row level security;

drop policy if exists "Anyone can read ranked seasons" on public.ranked_seasons;
create policy "Anyone can read ranked seasons"
on public.ranked_seasons
for select
to anon, authenticated
using (true);

insert into public.ranked_seasons (started_at, ends_at, is_current)
select now(), now() + interval '30 days', true
where not exists (select 1 from public.ranked_seasons where is_current = true);

create table if not exists public.ranked_leaderboard (
  season_id uuid not null references public.ranked_seasons(id) on delete cascade,
  user_id uuid not null,
  username text not null default 'Treinador',
  trainer_level integer not null default 1,
  craft_points integer not null default 0,
  guild_name text,
  score bigint not null default 100,
  updated_at timestamptz not null default now(),
  primary key (season_id, user_id)
);

grant select on public.ranked_leaderboard to anon;
grant select, insert, update on public.ranked_leaderboard to authenticated;
grant all on public.ranked_leaderboard to service_role;

alter table public.ranked_leaderboard enable row level security;

drop policy if exists "Anyone can read ranked leaderboard" on public.ranked_leaderboard;
create policy "Anyone can read ranked leaderboard"
on public.ranked_leaderboard
for select
to anon, authenticated
using (true);

drop policy if exists "Users can upsert own ranked leaderboard" on public.ranked_leaderboard;
create policy "Users can upsert own ranked leaderboard"
on public.ranked_leaderboard
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own ranked leaderboard" on public.ranked_leaderboard;
create policy "Users can update own ranked leaderboard"
on public.ranked_leaderboard
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.ranked_scores (
  user_id uuid primary key,
  username text not null default 'Treinador',
  trainer_level integer not null default 1,
  pokedex_count integer not null default 0,
  total_kills integer not null default 0,
  updated_at timestamptz not null default now()
);

grant select on public.ranked_scores to anon;
grant select, insert, update on public.ranked_scores to authenticated;
grant all on public.ranked_scores to service_role;

alter table public.ranked_scores enable row level security;

drop policy if exists "Anyone can read ranked scores" on public.ranked_scores;
create policy "Anyone can read ranked scores"
on public.ranked_scores
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert own ranked score" on public.ranked_scores;
create policy "Users can insert own ranked score"
on public.ranked_scores
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own ranked score" on public.ranked_scores;
create policy "Users can update own ranked score"
on public.ranked_scores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.record_ranked_score(
  _level integer,
  _craft_points integer,
  _guild_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _season uuid;
  _username text;
  _level_safe integer := greatest(1, least(coalesce(_level, 1), 10000));
  _craft_safe integer := greatest(0, least(coalesce(_craft_points, 0), 500));
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  select id into _season
  from public.ranked_seasons
  where is_current = true
  order by started_at desc
  limit 1;

  if _season is null then
    insert into public.ranked_seasons (started_at, ends_at, is_current)
    values (now(), now() + interval '30 days', true)
    returning id into _season;
  end if;

  _username := coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'username', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'name', ''),
    'Treinador'
  );

  insert into public.ranked_leaderboard (
    season_id, user_id, username, trainer_level, craft_points, guild_name, score, updated_at
  ) values (
    _season,
    _uid,
    _username,
    _level_safe,
    _craft_safe,
    _guild_name,
    (_level_safe::bigint * 100) + _craft_safe,
    now()
  )
  on conflict (season_id, user_id) do update set
    username = excluded.username,
    -- SEMPRE reflete o nível REAL atual do treinador (sem greatest histórico).
    trainer_level = excluded.trainer_level,
    craft_points = excluded.craft_points,
    guild_name = excluded.guild_name,
    score = excluded.score,
    updated_at = now();

  insert into public.ranked_scores (user_id, username, trainer_level, pokedex_count, updated_at)
  values (_uid, _username, _level_safe, _craft_safe, now())
  on conflict (user_id) do update set
    username = excluded.username,
    trainer_level = excluded.trainer_level,
    pokedex_count = excluded.pokedex_count,
    updated_at = now();
end;
$$;

grant execute on function public.record_ranked_score(integer, integer, text) to authenticated;

create index if not exists ranked_leaderboard_score_idx
on public.ranked_leaderboard (season_id, score desc, updated_at asc);

create index if not exists ranked_scores_level_idx
on public.ranked_scores (trainer_level desc, pokedex_count desc, total_kills desc);