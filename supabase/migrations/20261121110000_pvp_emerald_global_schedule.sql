-- Emerald Global is the only scheduled PvP map.
-- São Paulo even hours: PvP; odd hours: Peace. The browser shows the same rule,
-- but these checks are authoritative and cannot be bypassed by changing the UI.

create or replace function public.pvp_heartbeat(
  p_map_id text,
  p_x integer,
  p_y integer,
  p_leader_species text,
  p_leader_level integer,
  p_player_name text
) returns public.pvp_presence
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_saved_leader jsonb;
  v_leader_species text;
  v_leader_level_text text;
  v_leader_level integer;
  result public.pvp_presence;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Combat identity comes from the saved party, never from the heartbeat body.
  -- Map position remains ephemeral presence data; pvp_attack enforces its map
  -- and clock independently.
  select data -> 'team' -> 0
  into v_saved_leader
  from public.game_saves
  where user_id = v_uid;

  v_leader_species := nullif(left(coalesce(v_saved_leader ->> 'species', ''), 64), '');
  v_leader_level_text := v_saved_leader ->> 'level';
  if v_leader_species is null
     or v_leader_level_text is null
     or v_leader_level_text !~ '^[0-9]{1,7}$' then
    raise exception 'leader_unavailable';
  end if;
  v_leader_level := v_leader_level_text::integer;
  if v_leader_level < 1 then
    raise exception 'leader_unavailable';
  end if;

  insert into public.pvp_presence (
    user_id, player_name, map_id, x, y, leader_species, leader_level
  )
  values (
    v_uid,
    left(coalesce(nullif(p_player_name, ''), 'Treinador'), 32),
    left(coalesce(nullif(p_map_id, ''), 'mapinha6'), 32),
    greatest(-100000, least(100000, coalesce(p_x, 0))),
    greatest(-100000, least(100000, coalesce(p_y, 0))),
    v_leader_species,
    least(1000000, v_leader_level)
  )
  on conflict (user_id) do update set
    player_name = excluded.player_name,
    map_id = case
      when public.pvp_presence.hp <= 0 then public.pvp_presence.map_id
      else excluded.map_id
    end,
    x = case
      when public.pvp_presence.hp <= 0 then public.pvp_presence.x
      else excluded.x
    end,
    y = case
      when public.pvp_presence.hp <= 0 then public.pvp_presence.y
      else excluded.y
    end,
    leader_species = case
      when public.pvp_presence.hp <= 0 then public.pvp_presence.leader_species
      else excluded.leader_species
    end,
    leader_level = case
      when public.pvp_presence.hp <= 0 then public.pvp_presence.leader_level
      else excluded.leader_level
    end,
    hp = case
      when public.pvp_presence.hp <= 0
       and public.pvp_presence.last_death_at < now() - interval '5 minutes'
      then 100
      else public.pvp_presence.hp
    end,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

create or replace function public.pvp_attack_sem_restricao(p_target_user_id uuid)
returns table(ok boolean, reason text, target_hp integer, damage integer, target_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  attacker public.pvp_presence;
  target public.pvp_presence;
  cooldown timestamptz;
  hit integer;
begin
  if auth.uid() is null then
    return query select false, 'not_authenticated', null::integer, 0, null::text;
    return;
  end if;

  if p_target_user_id = auth.uid() then
    return query select false, 'self_target', null::integer, 0, null::text;
    return;
  end if;

  -- America/Sao_Paulo is intentionally duplicated in src/game/pvpSchedule.ts.
  if mod(extract(hour from timezone('America/Sao_Paulo', now()))::integer, 2) <> 0 then
    return query select false, 'pvp_peace_window', null::integer, 0, null::text;
    return;
  end if;

  select * into attacker
  from public.pvp_presence
  where user_id = auth.uid()
    and updated_at > now() - interval '15 seconds';

  select * into target
  from public.pvp_presence
  where user_id = p_target_user_id
    and updated_at > now() - interval '15 seconds'
  for update;

  if attacker.user_id is null or target.user_id is null then
    return query select false, 'offline', null::integer, 0, null::text;
    return;
  end if;

  if attacker.map_id <> 'arv' or target.map_id <> 'arv' then
    return query select false, 'pvp_map_required', target.hp, 0, target.player_name;
    return;
  end if;

  if attacker.map_id <> target.map_id then
    return query select false, 'different_map', null::integer, 0, null::text;
    return;
  end if;

  if point(attacker.x, attacker.y) <-> point(target.x, target.y) > 600 then
    return query select false, 'out_of_range', null::integer, 0, null::text;
    return;
  end if;

  select last_attack_at into cooldown
  from public.pvp_attack_cooldowns
  where user_id = auth.uid()
  for update;

  if cooldown is not null and cooldown > now() - interval '900 milliseconds' then
    return query select false, 'cooldown', target.hp, 0, target.player_name;
    return;
  end if;

  if target.hp <= 0 then
    return query select false, 'target_fainted', 0, 0, target.player_name;
    return;
  end if;

  -- Current balance remains unchanged pending the tier-balance approval.
  hit := least(30, greatest(6, 6 + floor(attacker.leader_level::numeric / 20)::integer));

  update public.pvp_presence
  set hp = greatest(0, hp - hit),
      last_hit_at = now(),
      last_attacker_name = attacker.player_name,
      last_death_at = case when hp - hit <= 0 then now() else last_death_at end,
      updated_at = now()
  where user_id = target.user_id
  returning hp into target.hp;

  insert into public.pvp_attack_cooldowns(user_id, last_attack_at)
  values (auth.uid(), now())
  on conflict (user_id) do update set last_attack_at = excluded.last_attack_at;

  return query select true,
    case when target.hp = 0 then 'defeated' else 'hit' end,
    target.hp, hit, target.player_name;
end;
$$;

-- SECURITY DEFINER functions otherwise receive implicit PUBLIC execution.
revoke all on function public.pvp_heartbeat(text, integer, integer, text, integer, text)
  from public, anon, authenticated;
revoke all on function public.pvp_attack(uuid)
  from public, anon, authenticated;
revoke all on function public.pvp_attack_sem_restricao(uuid)
  from public, anon, authenticated;

grant execute on function public.pvp_heartbeat(text, integer, integer, text, integer, text)
  to authenticated;
grant execute on function public.pvp_attack(uuid)
  to authenticated;
