-- The official ranking is derived from game_saves, not the legacy
-- ranked_leaderboard table. Hide accounts while Supabase Auth marks them banned.
create or replace function public.get_global_ranked(_limit integer default 300)
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
  skin_url text
)
language sql
security definer
set search_path = ''
as $$
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
      s.updated_at
    from public.game_saves s
    join auth.users u
      on u.id = s.user_id
      and (u.banned_until is null or u.banned_until <= now())
    left join public.profiles p on p.id = s.user_id
    where auth.uid() is not null
      and jsonb_typeof(s.data -> 'idle') = 'object'
  )
  select
    r.user_id,
    r.username,
    r.trainer_level,
    r.craft_points,
    null::text as guild_name,
    (r.trainer_level::bigint * 1000001) + r.craft_points::bigint as score,
    r.updated_at,
    null::text as leader_species,
    null::text as leader_rarity,
    null::text as skin_url
  from ranked r
  order by r.trainer_level desc, r.craft_points desc, r.updated_at asc
  limit least(500, greatest(1, coalesce(_limit, 300)));
$$;

revoke all on function public.get_global_ranked(integer) from public, anon;
grant execute on function public.get_global_ranked(integer) to authenticated;
