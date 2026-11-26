-- TOP RANKED oficial em janelas de 6 horas.
-- O ranking deixa de ser recalculado a cada abertura: um snapshot é gerado
-- pelo pg_cron e todos os clientes leem exatamente a mesma classificação.
create extension if not exists pg_cron;

create table if not exists public.ranked_snapshot (
  user_id uuid primary key,
  rank_position integer not null,
  username text not null,
  trainer_level integer not null,
  craft_points integer not null,
  score bigint not null,
  updated_at timestamptz not null,
  leader_species text,
  leader_rarity text,
  skin_url text,
  refreshed_at timestamptz not null default now()
);

create index if not exists ranked_snapshot_position_idx
  on public.ranked_snapshot(rank_position);

alter table public.ranked_snapshot enable row level security;

drop policy if exists "ranked_snapshot_select_authenticated" on public.ranked_snapshot;
create policy "ranked_snapshot_select_authenticated"
  on public.ranked_snapshot for select
  to authenticated
  using (true);

revoke all on table public.ranked_snapshot from anon, authenticated;
grant select on table public.ranked_snapshot to authenticated;

create or replace function public.refresh_global_ranked_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _at timestamptz := now();
  _rows integer := 0;
begin
  delete from public.ranked_snapshot;

  with ranked as (
    select
      s.user_id,
      coalesce(nullif(btrim(p.username), ''), 'Treinador')::text as username,
      case
        when jsonb_typeof(s.data #> '{idle,trainerLevel}') = 'number'
          then least(1000000::numeric, greatest(1::numeric, floor((s.data #>> '{idle,trainerLevel}')::numeric)))::integer
        else 1
      end as trainer_level,
      case
        when jsonb_typeof(s.data #> '{idle,craftPoints}') = 'number'
          then least(1000000::numeric, greatest(0::numeric, floor((s.data #>> '{idle,craftPoints}')::numeric)))::integer
        else 0
      end as craft_points,
      coalesce(s.updated_at, _at) as updated_at
    from public.game_saves s
    join auth.users u
      on u.id = s.user_id
      and (u.banned_until is null or u.banned_until <= now())
    left join public.profiles p on p.id = s.user_id
    where jsonb_typeof(s.data -> 'idle') = 'object'
  ), numbered as (
    select
      r.*,
      row_number() over (
        order by r.trainer_level desc, r.craft_points desc, r.updated_at asc, r.user_id
      )::integer as rank_position
    from ranked r
    order by r.trainer_level desc, r.craft_points desc, r.updated_at asc, r.user_id
    limit 500
  )
  insert into public.ranked_snapshot (
    user_id, rank_position, username, trainer_level, craft_points, score, updated_at,
    leader_species, leader_rarity, skin_url, refreshed_at
  )
  select
    n.user_id,
    n.rank_position,
    n.username,
    n.trainer_level,
    n.craft_points,
    (n.trainer_level::bigint * 1000001) + n.craft_points::bigint,
    n.updated_at,
    null::text,
    null::text,
    null::text,
    _at
  from numbered n;

  get diagnostics _rows = row_count;
  return jsonb_build_object('ok', true, 'rows', _rows, 'refreshed_at', _at);
end;
$$;

revoke all on function public.refresh_global_ranked_snapshot() from public, anon, authenticated;
grant execute on function public.refresh_global_ranked_snapshot() to service_role;

-- A leitura pública passa a usar o snapshot. O cliente recebe a hora real
-- da última geração para mostrar "atualizado ..." sem inventar horário.
drop function if exists public.get_global_ranked(integer);

create function public.get_global_ranked(_limit integer default 300)
returns table (
  user_id uuid,
  username text,
  trainer_level integer,
  craft_points integer,
  guild_name text,
  score bigint,
  updated_at timestamptz,
  leader_species text,
  leader_rarity text,
  skin_url text,
  refreshed_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    r.user_id,
    r.username,
    r.trainer_level,
    r.craft_points,
    null::text as guild_name,
    r.score,
    r.updated_at,
    r.leader_species,
    r.leader_rarity,
    r.skin_url,
    r.refreshed_at
  from public.ranked_snapshot r
  where auth.uid() is not null
  order by r.rank_position asc
  limit least(500, greatest(1, coalesce(_limit, 300)));
$$;

revoke all on function public.get_global_ranked(integer) from public, anon;
grant execute on function public.get_global_ranked(integer) to authenticated;

-- Primeiro snapshot imediato para o ranking já abrir preenchido.
select public.refresh_global_ranked_snapshot();

-- Regera às 00:00, 06:00, 12:00 e 18:00 UTC.
do $$
declare
  _jobid bigint;
begin
  select jobid into _jobid from cron.job where jobname = 'refresh-global-ranked-6h';
  if _jobid is not null then
    perform cron.unschedule(_jobid);
  end if;
end;
$$;

select cron.schedule(
  'refresh-global-ranked-6h',
  '0 */6 * * *',
  'select public.refresh_global_ranked_snapshot();'
);
