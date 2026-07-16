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
  _save_level_text text;
  _save_level integer;
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

  -- Se o cliente chegou com level 1 por cache/timing, usa o nível REAL do save completo.
  -- O game_saves é a fonte de verdade do jogo publicado.
  select case
    when (data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then data #>> '{idle,trainerLevel}'
    when (data #>> '{idle,trainer_level}') ~ '^[0-9]+$' then data #>> '{idle,trainer_level}'
    else null
  end
  into _save_level_text
  from public.game_saves
  where user_id = _uid
  limit 1;

  if _save_level_text ~ '^[0-9]+$' then
    _save_level := greatest(1, least(_save_level_text::integer, 10000));
    _level_safe := greatest(_level_safe, _save_level);
  end if;

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

-- Backfill: corrige jogadores que já ficaram gravados como Lv 1 no ranked,
-- usando o nível real do save completo.
with real_saves as (
  select
    user_id as uid,
    greatest(1, least((case
      when (data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then (data #>> '{idle,trainerLevel}')::integer
      when (data #>> '{idle,trainer_level}') ~ '^[0-9]+$' then (data #>> '{idle,trainer_level}')::integer
      else 1
    end), 10000)) as real_level,
    updated_at
  from public.game_saves
  where ((data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' or (data #>> '{idle,trainer_level}') ~ '^[0-9]+$')
)
update public.ranked_scores rs
set trainer_level = real_saves.real_level,
    updated_at = greatest(rs.updated_at, real_saves.updated_at)
from real_saves
where rs.user_id = real_saves.uid
  and real_saves.real_level > rs.trainer_level;

with real_saves as (
  select
    user_id as uid,
    greatest(1, least((case
      when (data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then (data #>> '{idle,trainerLevel}')::integer
      when (data #>> '{idle,trainer_level}') ~ '^[0-9]+$' then (data #>> '{idle,trainer_level}')::integer
      else 1
    end), 10000)) as real_level,
    updated_at
  from public.game_saves
  where ((data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' or (data #>> '{idle,trainer_level}') ~ '^[0-9]+$')
)
update public.ranked_leaderboard rl
set trainer_level = real_saves.real_level,
    score = (real_saves.real_level::bigint * 100) + rl.craft_points,
    updated_at = greatest(rl.updated_at, real_saves.updated_at)
from real_saves
where rl.user_id = real_saves.uid
  and real_saves.real_level > rl.trainer_level;

-- Ranking público definitivo: mostra o nível REAL atual vindo do save completo.
-- Retorna só campos públicos do ranking; não expõe o JSON do save.
create or replace function public.get_global_ranked(_limit integer default 200)
returns table (
  user_id uuid,
  username text,
  trainer_level integer,
  craft_points integer,
  guild_name text,
  score bigint,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with season as (
    select id
    from public.ranked_seasons
    where is_current = true
    order by started_at desc
    limit 1
  ), saves as (
    select
      gs.user_id as uid,
      greatest(1, least((case
        when (gs.data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then (gs.data #>> '{idle,trainerLevel}')::integer
        when (gs.data #>> '{idle,trainer_level}') ~ '^[0-9]+$' then (gs.data #>> '{idle,trainer_level}')::integer
        else 1
      end), 10000)) as real_level,
      gs.updated_at as save_updated_at
    from public.game_saves gs
    where ((gs.data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' or (gs.data #>> '{idle,trainer_level}') ~ '^[0-9]+$')
  ), base as (
    select
      coalesce(rl.user_id, rs.user_id, saves.uid) as uid,
      coalesce(nullif(rl.username, ''), nullif(rs.username, ''), 'Treinador') as uname,
      greatest(coalesce(saves.real_level, 1), coalesce(rl.trainer_level, 1), coalesce(rs.trainer_level, 1)) as lvl,
      greatest(coalesce(rl.craft_points, 0), coalesce(rs.pokedex_count, 0), 0) as craft,
      rl.guild_name as guild,
      greatest(coalesce(saves.save_updated_at, 'epoch'::timestamptz), coalesce(rl.updated_at, 'epoch'::timestamptz), coalesce(rs.updated_at, 'epoch'::timestamptz)) as upd
    from saves
    full join public.ranked_scores rs on rs.user_id = saves.uid
    full join public.ranked_leaderboard rl on rl.user_id = coalesce(saves.uid, rs.user_id)
      and (not exists (select 1 from season) or rl.season_id = (select id from season))
  )
  select
    uid as user_id,
    uname as username,
    lvl as trainer_level,
    craft as craft_points,
    guild as guild_name,
    (lvl::bigint * 100) + craft as score,
    upd as updated_at
  from base
  where uid is not null
  order by lvl desc, craft desc, upd asc
  limit greatest(1, least(coalesce(_limit, 200), 500));
$$;

grant execute on function public.get_global_ranked(integer) to anon;
grant execute on function public.get_global_ranked(integer) to authenticated;

create index if not exists ranked_leaderboard_score_idx
on public.ranked_leaderboard (season_id, score desc, updated_at asc);

create index if not exists ranked_scores_level_idx
on public.ranked_scores (trainer_level desc, pokedex_count desc, total_kills desc);