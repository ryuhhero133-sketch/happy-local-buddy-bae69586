-- =========================================================
-- RANKING GLOBAL DE CRISTAL PRISMA (TOP 30)
-- Rode UMA VEZ no Supabase > SQL Editor.
--
-- Problema: o ranking só mostrava 1 jogador porque lia
-- `ranked_scores.pokedex_count`, que só é preenchido quando o
-- jogador abre o painel de ranking. Quem nunca abriu ficava 0.
--
-- Solução: função SECURITY DEFINER que cruza `ranked_scores`
-- com o valor real salvo em `game_saves`
-- (data -> idle -> items -> cristal_fragmentado) e devolve o TOP 30.
-- =========================================================

create or replace function public.top_prisma_ranked(_limit integer default 30)
returns table (
  user_id uuid,
  username text,
  trainer_level integer,
  prisma integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with saves as (
    select
      case when gs.user_id ~ '^[0-9a-fA-F-]{36}$' then gs.user_id::uuid end as uid,
      case
        when (gs.data #>> '{idle,items,cristal_fragmentado}') ~ '^[0-9]+$'
        then least((gs.data #>> '{idle,items,cristal_fragmentado}')::bigint, 100000000)::integer
        else 0
      end as prisma,
      case
        when (gs.data #>> '{idle,trainerLevel}') ~ '^[0-9]+$'
        then least((gs.data #>> '{idle,trainerLevel}')::bigint, 10000)::integer
        else 1
      end as lvl,
      gs.updated_at
    from public.game_saves gs
  ),
  merged as (
    select
      coalesce(s.uid, rs.user_id) as uid,
      coalesce(nullif(rs.username, ''), 'Treinador') as uname,
      greatest(coalesce(rs.trainer_level, 1), coalesce(s.lvl, 1)) as lvl,
      greatest(coalesce(rs.pokedex_count, 0), coalesce(s.prisma, 0)) as prisma,
      greatest(coalesce(rs.updated_at, 'epoch'::timestamptz), coalesce(s.updated_at, 'epoch'::timestamptz)) as upd
    from public.ranked_scores rs
    full join saves s on s.uid = rs.user_id
    where coalesce(s.uid, rs.user_id) is not null
  )
  select
    uid as user_id,
    uname as username,
    lvl as trainer_level,
    prisma,
    upd as updated_at
  from merged
  where prisma > 0
  order by prisma desc, upd asc
  limit greatest(1, least(coalesce(_limit, 30), 100));
$$;

grant execute on function public.top_prisma_ranked(integer) to anon, authenticated;

-- Mantém `ranked_scores` legível por todos (base do ranking global).
grant select on public.ranked_scores to anon;
grant select, insert, update on public.ranked_scores to authenticated;

drop policy if exists "Anyone can read ranked scores" on public.ranked_scores;
create policy "Anyone can read ranked scores"
  on public.ranked_scores for select
  to anon, authenticated
  using (true);

-- Sincroniza de uma vez o Prisma de todos os saves já existentes,
-- para o TOP 30 nascer completo sem esperar cada jogador entrar.
insert into public.ranked_scores (user_id, username, trainer_level, pokedex_count, updated_at)
select
  gs.user_id::uuid,
  'Treinador',
  case
    when (gs.data #>> '{idle,trainerLevel}') ~ '^[0-9]+$'
    then least((gs.data #>> '{idle,trainerLevel}')::bigint, 10000)::integer
    else 1
  end,
  least((gs.data #>> '{idle,items,cristal_fragmentado}')::bigint, 100000000)::integer,
  now()
from public.game_saves gs
where gs.user_id ~ '^[0-9a-fA-F-]{36}$'
  and (gs.data #>> '{idle,items,cristal_fragmentado}') ~ '^[0-9]+$'
  and (gs.data #>> '{idle,items,cristal_fragmentado}')::bigint > 0
on conflict (user_id) do update set
  pokedex_count = greatest(public.ranked_scores.pokedex_count, excluded.pokedex_count),
  trainer_level = greatest(public.ranked_scores.trainer_level, excluded.trainer_level),
  updated_at = now();

-- Conferência:
-- select * from public.top_prisma_ranked(30);
