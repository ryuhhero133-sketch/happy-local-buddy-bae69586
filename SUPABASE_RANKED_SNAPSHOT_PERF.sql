-- ============================================================
-- PERFORMANCE: tira o peso do ranking do banco.
-- Problema: get_global_ranked / top_prisma_ranked liam o JSONB de
-- TODOS os game_saves a cada chamada (full scan + jsonb parse).
-- Com muitos jogadores online isso estoura CPU/memória.
-- Solução: snapshot pré-calculado, atualizado a cada 2 horas.
-- Não apaga progresso de ninguém.
-- ============================================================

create table if not exists public.ranked_snapshot (
  kind          text    not null,          -- 'trainer' | 'prisma'
  rank          int     not null,
  user_id       uuid    not null,
  username      text,
  trainer_level int     not null default 1,
  craft_points  bigint  not null default 0,
  guild_name    text,
  score         bigint  not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (kind, rank)
);

grant select on public.ranked_snapshot to anon, authenticated;
grant all    on public.ranked_snapshot to service_role;
alter table public.ranked_snapshot enable row level security;

drop policy if exists "ranked_snapshot_read" on public.ranked_snapshot;
create policy "ranked_snapshot_read" on public.ranked_snapshot
  for select to anon, authenticated using (true);

-- ---------- refresh (roda no servidor, não no cliente) ----------
create or replace function public.refresh_ranked_snapshot()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ranked_snapshot;

  -- Top 30 treinadores (nível vindo do save autoritativo)
  insert into public.ranked_snapshot (kind, rank, user_id, username, trainer_level, craft_points, score, updated_at)
  select 'trainer',
         row_number() over (order by lvl desc, upd asc),
         user_id, username, lvl, 0, lvl, upd
  from (
    select gs.user_id,
           coalesce(p.username, 'Treinador') as username,
           least(10000, greatest(1, coalesce(nullif(gs.data #>> '{idle,trainerLevel}','')::int, 1))) as lvl,
           gs.updated_at as upd
    from public.game_saves gs
    left join public.profiles p on p.id = gs.user_id
  ) t
  order by lvl desc, upd asc
  limit 30;

  -- Top 30 Cristal Prisma
  insert into public.ranked_snapshot (kind, rank, user_id, username, trainer_level, craft_points, score, updated_at)
  select 'prisma',
         row_number() over (order by prisma desc, upd asc),
         user_id, username, lvl, prisma, prisma, upd
  from (
    select gs.user_id,
           coalesce(p.username, 'Treinador') as username,
           least(10000, greatest(1, coalesce(nullif(gs.data #>> '{idle,trainerLevel}','')::int, 1))) as lvl,
           greatest(0, coalesce(nullif(gs.data #>> '{idle,prismaCrystals}','')::bigint, 0)) as prisma,
           gs.updated_at as upd
    from public.game_saves gs
    left join public.profiles p on p.id = gs.user_id
  ) t
  where prisma > 0
  order by prisma desc, upd asc
  limit 30;
end;
$$;

revoke all on function public.refresh_ranked_snapshot() from anon, authenticated;
grant execute on function public.refresh_ranked_snapshot() to service_role;

-- ---------- leitura barata para o jogo ----------
create or replace function public.get_global_ranked(_limit int default 30)
returns table (user_id uuid, username text, trainer_level int, craft_points bigint, guild_name text, score bigint, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select user_id, username, trainer_level, craft_points, guild_name, score, updated_at
  from public.ranked_snapshot where kind = 'trainer'
  order by rank limit least(coalesce(_limit,30), 30);
$$;

create or replace function public.top_prisma_ranked(_limit int default 30)
returns table (user_id uuid, username text, trainer_level int, prisma bigint, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select user_id, username, trainer_level, craft_points, updated_at
  from public.ranked_snapshot where kind = 'prisma'
  order by rank limit least(coalesce(_limit,30), 30);
$$;

grant execute on function public.get_global_ranked(int)  to anon, authenticated;
grant execute on function public.top_prisma_ranked(int)  to anon, authenticated;

-- ---------- agendamento: 1x a cada 2 horas ----------
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname in ('refresh_ranked_snapshot','sync_trainer_ranked');
select cron.schedule('refresh_ranked_snapshot', '0 */2 * * *', $$select public.refresh_ranked_snapshot();$$);

-- primeira carga imediata
select public.refresh_ranked_snapshot();

-- índice que ajuda o refresh
create index if not exists game_saves_updated_at_idx on public.game_saves (updated_at desc);
