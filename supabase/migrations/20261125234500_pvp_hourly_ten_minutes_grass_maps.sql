-- Agenda de PvP: a cada hora, os 10 primeiros minutos são PvP e os 50
-- restantes são Paz (America/Sao_Paulo). PvP só vale nos 8 mapas de caça com
-- Pokémon, espelhando src/game/pvpSchedule.ts e GRASS_ZONE_BY_MAP.
create or replace function private.pvp_window_open(p_at timestamptz default now())
returns boolean
language sql
stable
set search_path = ''
as $$
  select extract(minute from timezone('America/Sao_Paulo', p_at))::integer < 10
$$;
revoke all on function private.pvp_window_open(timestamptz) from public, anon, authenticated;

create or replace function private.pvp_map_allowed(p_map text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_map in (
    'rota1', 'bobo_rota2', 'bobo_uuid', 'bobo_transicao',
    'bobo_g11ds', 'bobo_rota_gelo', 'bobo_transicao_gelo', 'bobo_mmmm'
  ), false)
$$;
revoke all on function private.pvp_map_allowed(text) from public, anon, authenticated;

create or replace function public.pvp_attack(p_target_user_id uuid)
returns table(ok boolean, reason text, target_hp integer, damage integer, target_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  attacker public.pvp_presence;
  target public.pvp_presence;
  cooldown timestamptz;
  v_attacker_trainer_level integer := 1;
  v_target_trainer_level integer := 1;
  v_atk_rarity text;
  v_tgt_rarity text;
  v_atk_rank int;
  v_tgt_rank int;
  v_tier_gap int;
  v_level_gap int;
  v_hit_chance numeric;
  v_base numeric;
  v_tier_mult numeric;
  v_dmg numeric;
begin
  if auth.uid() is null then
    return query select false, 'not_authenticated', null::integer, 0, null::text;
    return;
  end if;

  if p_target_user_id = auth.uid() then
    return query select false, 'self_target', null::integer, 0, null::text;
    return;
  end if;

  -- America/Sao_Paulo é espelhado em src/game/pvpSchedule.ts.
  -- A cada hora: minutos 0-9 são PvP; 10-59 são Paz.
  if not private.pvp_window_open() then
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

  if not private.pvp_map_allowed(attacker.map_id)
    or not private.pvp_map_allowed(target.map_id) then
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

  -- Um líder derrotado não pode atacar por RPC nem pelo cliente.
  if attacker.hp <= 0 then
    return query select false, 'attacker_fainted', target.hp, 0, target.player_name;
    return;
  end if;

  -- A proteção usa o game_saves, não o nível enviado pelo navegador.
  select case
    when jsonb_typeof(data #> '{idle,trainerLevel}') = 'number'
      then least(1000000::numeric, greatest(1::numeric, floor((data #>> '{idle,trainerLevel}')::numeric)))::integer
    else 1
  end
  into v_attacker_trainer_level
  from public.game_saves
  where user_id = auth.uid();

  select case
    when jsonb_typeof(data #> '{idle,trainerLevel}') = 'number'
      then least(1000000::numeric, greatest(1::numeric, floor((data #>> '{idle,trainerLevel}')::numeric)))::integer
    else 1
  end
  into v_target_trainer_level
  from public.game_saves
  where user_id = p_target_user_id;

  if coalesce(v_attacker_trainer_level, 1) < 11 then
    return query select false, 'pvp_level_required', target.hp, 0, target.player_name;
    return;
  end if;

  if coalesce(v_target_trainer_level, 1) < 11 then
    return query select false, 'target_pvp_protected', target.hp, 0, target.player_name;
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

  -- ===== TIER BALANCE (espelho de src/game/systems.tsx: tierHitChance) =====
  -- Raridade vem do save (team[0]), nunca do corpo do request. Ausente → common.
  select coalesce(data -> 'team' -> 0 ->> 'rarity', 'common')
  into v_atk_rarity
  from public.game_saves where user_id = auth.uid();

  select coalesce(data -> 'team' -> 0 ->> 'rarity', 'common')
  into v_tgt_rarity
  from public.game_saves where user_id = p_target_user_id;

  -- RARITY_ORDER do cliente: common=0 … mythic_shiny=6 (qualquer outro → 0).
  v_atk_rank := case v_atk_rarity
    when 'uncommon' then 1 when 'rare' then 2 when 'epic' then 3
    when 'legendary' then 4 when 'mythic' then 5 when 'mythic_shiny' then 6
    else 0 end;
  v_tgt_rank := case v_tgt_rarity
    when 'uncommon' then 1 when 'rare' then 2 when 'epic' then 3
    when 'legendary' then 4 when 'mythic' then 5 when 'mythic_shiny' then 6
    else 0 end;

  v_tier_gap := greatest(0, v_tgt_rank - v_atk_rank);
  v_level_gap := greatest(0, target.leader_level - attacker.leader_level);
  v_hit_chance := least(0.99, greatest(0.55,
    0.96 - v_tier_gap * 0.045 - least(0.18, v_level_gap * 0.0015)));

  if random() > v_hit_chance then
    -- Errou: ok=true para o cliente tratar como "ERROU!", sem dano.
    return query select true, 'miss', target.hp, 0, target.player_name;
    return;
  end if;

  -- ===== DANO (mesmos números do plano aprovado) =====
  v_base := least(30, 6 + floor(attacker.leader_level / 20.0));
  v_tier_mult := greatest(0.80, least(1.30, 1 + (v_atk_rank - v_tgt_rank) * 0.06));
  v_dmg := v_base * v_tier_mult;
  if v_tgt_rank > v_atk_rank then
    v_dmg := v_dmg * 1.10; -- underdog: atacando "para cima"
  end if;
  v_dmg := round(least(35, greatest(4, v_dmg)));

  update public.pvp_presence
  set hp = greatest(0, hp - v_dmg::int),
      last_hit_at = now(),
      last_attacker_name = attacker.player_name,
      last_death_at = case when hp - v_dmg::int <= 0 then now() else last_death_at end,
      updated_at = now()
  where user_id = target.user_id
  returning hp into target.hp;

  insert into public.pvp_attack_cooldowns(user_id, last_attack_at)
  values (auth.uid(), now())
  on conflict (user_id) do update set last_attack_at = excluded.last_attack_at;

  return query select true,
    case when target.hp = 0 then 'defeated' else 'hit' end,
    target.hp, v_dmg::int, target.player_name;
end;
$$;

revoke all on function public.pvp_attack(uuid) from public, anon;
grant execute on function public.pvp_attack(uuid) to authenticated;
