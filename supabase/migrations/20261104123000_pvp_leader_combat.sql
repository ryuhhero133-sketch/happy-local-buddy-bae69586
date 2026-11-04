-- PvP de líderes: estado efêmero e dano resolvido exclusivamente no banco.
-- O cliente nunca escolhe HP nem dano.

create table if not exists public.pvp_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  player_name text not null default 'Treinador',
  map_id text not null,
  x integer not null default 0,
  y integer not null default 0,
  leader_species text,
  leader_level integer not null default 1 check (leader_level between 1 and 1000000),
  hp integer not null default 100 check (hp between 0 and 100),
  max_hp integer not null default 100 check (max_hp = 100),
  last_hit_at timestamptz,
  last_attacker_name text,
  last_death_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists pvp_presence_map_updated_idx on public.pvp_presence(map_id, updated_at desc);
alter table public.pvp_presence enable row level security;
drop policy if exists pvp_presence_read_active on public.pvp_presence;
create policy pvp_presence_read_active on public.pvp_presence for select to authenticated using (true);
revoke all on public.pvp_presence from anon, authenticated;
grant select on public.pvp_presence to authenticated;

create table if not exists public.pvp_attack_cooldowns (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_attack_at timestamptz not null default now()
);
alter table public.pvp_attack_cooldowns enable row level security;
revoke all on public.pvp_attack_cooldowns from anon, authenticated;

create or replace function public.pvp_heartbeat(
  p_map_id text,
  p_x integer,
  p_y integer,
  p_leader_species text,
  p_leader_level integer,
  p_player_name text
) returns public.pvp_presence
language plpgsql security definer set search_path = public as $$
declare result public.pvp_presence;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.pvp_presence (user_id, player_name, map_id, x, y, leader_species, leader_level)
  values (auth.uid(), left(coalesce(p_player_name, 'Treinador'), 32), left(p_map_id, 32),
    greatest(-100000, least(100000, p_x)), greatest(-100000, least(100000, p_y)),
    left(coalesce(p_leader_species, ''), 64), greatest(1, least(1000000, p_leader_level)))
  on conflict (user_id) do update set
    player_name = excluded.player_name, map_id = excluded.map_id, x = excluded.x, y = excluded.y,
    leader_species = excluded.leader_species, leader_level = excluded.leader_level,
    hp = case when public.pvp_presence.hp <= 0
                and public.pvp_presence.last_death_at < now() - interval '5 seconds'
              then 100 else public.pvp_presence.hp end,
    updated_at = now()
  returning * into result;
  return result;
end;
$$;

create or replace function public.pvp_attack(p_target_user_id uuid)
returns table(ok boolean, reason text, target_hp integer, damage integer, target_name text)
language plpgsql security definer set search_path = public as $$
declare attacker public.pvp_presence; target public.pvp_presence; cooldown timestamptz; hit integer;
begin
  if auth.uid() is null then return query select false, 'not_authenticated', null::integer, 0, null::text; return; end if;
  if p_target_user_id = auth.uid() then return query select false, 'self_target', null::integer, 0, null::text; return; end if;
  select * into attacker from public.pvp_presence where user_id = auth.uid() and updated_at > now() - interval '15 seconds';
  select * into target from public.pvp_presence where user_id = p_target_user_id and updated_at > now() - interval '15 seconds' for update;
  if attacker.user_id is null or target.user_id is null then return query select false, 'offline', null::integer, 0, null::text; return; end if;
  if attacker.map_id <> target.map_id then return query select false, 'different_map', null::integer, 0, null::text; return; end if;
  if point(attacker.x, attacker.y) <-> point(target.x, target.y) > 600 then return query select false, 'out_of_range', null::integer, 0, null::text; return; end if;
  select last_attack_at into cooldown from public.pvp_attack_cooldowns where user_id = auth.uid() for update;
  if cooldown is not null and cooldown > now() - interval '900 milliseconds' then return query select false, 'cooldown', target.hp, 0, target.player_name; return; end if;
  if target.hp <= 0 then return query select false, 'target_fainted', 0, 0, target.player_name; return; end if;
  hit := least(30, greatest(6, 6 + floor(attacker.leader_level::numeric / 20)::integer));
  update public.pvp_presence set hp = greatest(0, hp - hit), last_hit_at = now(), last_attacker_name = attacker.player_name,
    last_death_at = case when hp - hit <= 0 then now() else last_death_at end, updated_at = now()
  where user_id = target.user_id returning hp into target.hp;
  insert into public.pvp_attack_cooldowns(user_id, last_attack_at) values (auth.uid(), now())
  on conflict (user_id) do update set last_attack_at = excluded.last_attack_at;
  return query select true, case when target.hp = 0 then 'defeated' else 'hit' end, target.hp, hit, target.player_name;
end;
$$;

revoke all on function public.pvp_heartbeat(text, integer, integer, text, integer, text) from public;
revoke all on function public.pvp_attack(uuid) from public;
grant execute on function public.pvp_heartbeat(text, integer, integer, text, integer, text) to authenticated;
grant execute on function public.pvp_attack(uuid) to authenticated;
