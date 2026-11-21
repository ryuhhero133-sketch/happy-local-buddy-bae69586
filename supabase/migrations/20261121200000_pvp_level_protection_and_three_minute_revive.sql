-- PvP é liberado somente no nível 11 do treinador. O banco calcula e registra
-- esse nível a partir do save, para que o cliente não consiga expor jogadores
-- iniciantes ao combate.
alter table public.pvp_presence
  add column if not exists trainer_level integer not null default 1;

update public.pvp_presence p
set trainer_level = coalesce((
  select case
    when jsonb_typeof(s.data #> '{idle,trainerLevel}') = 'number'
      then least(1000000::numeric, greatest(1::numeric, floor((s.data #>> '{idle,trainerLevel}')::numeric)))::integer
    else 1
  end
  from public.game_saves s
  where s.user_id = p.user_id
), 1);

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
  v_trainer_level integer := 1;
  result public.pvp_presence;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Identidade de combate e nível do treinador vêm somente do save persistido.
  select
    data -> 'team' -> 0,
    case
      when jsonb_typeof(data #> '{idle,trainerLevel}') = 'number'
        then least(1000000::numeric, greatest(1::numeric, floor((data #>> '{idle,trainerLevel}')::numeric)))::integer
      else 1
    end
  into v_saved_leader, v_trainer_level
  from public.game_saves
  where user_id = v_uid;

  v_leader_species := nullif(left(coalesce(v_saved_leader ->> 'species', ''), 64), '');
  v_leader_level_text := v_saved_leader ->> 'level';
  if v_leader_species is null
    or v_leader_level_text is null
    or v_leader_level_text !~ '^[0-9]{1,7}$'
  then
    raise exception 'leader_unavailable';
  end if;
  v_leader_level := v_leader_level_text::integer;
  if v_leader_level < 1 then
    raise exception 'leader_unavailable';
  end if;

  insert into public.pvp_presence (
    user_id, player_name, map_id, x, y, leader_species, leader_level, trainer_level
  )
  values (
    v_uid,
    left(coalesce(nullif(p_player_name, ''), 'Treinador'), 32),
    left(coalesce(nullif(p_map_id, ''), 'mapinha6'), 32),
    greatest(-100000, least(100000, coalesce(p_x, 0))),
    greatest(-100000, least(100000, coalesce(p_y, 0))),
    v_leader_species,
    least(1000000, v_leader_level),
    coalesce(v_trainer_level, 1)
  )
  on conflict (user_id) do update set
    player_name = excluded.player_name,
    trainer_level = excluded.trainer_level,
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
        and public.pvp_presence.last_death_at < now() - interval '3 minutes'
      then 100
      else public.pvp_presence.hp
    end,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

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

create or replace function public.pvp_attack_sem_restricao(p_target_user_id uuid)
returns table(ok boolean, reason text, target_hp integer, damage integer, target_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query select * from public.pvp_attack(p_target_user_id);
end;
$$;

-- Revives não podem pular a espera de morte PvP. O heartbeat restaura o líder
-- automaticamente após três minutos; esta função só protege clientes antigos.
create or replace function public.pvp_use_revive(p_expected_version bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_presence public.pvp_presence%rowtype;
  v_respawn_at timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  select * into v_presence
  from public.pvp_presence
  where user_id = v_uid
  for update;

  if not found or v_presence.hp <> 0 then
    return jsonb_build_object('ok', false, 'reason', 'not_fainted');
  end if;

  v_respawn_at := coalesce(v_presence.last_death_at, v_presence.updated_at, clock_timestamp()) + interval '3 minutes';
  if clock_timestamp() < v_respawn_at then
    return jsonb_build_object(
      'ok', false,
      'reason', 'pvp_revive_wait',
      'remaining_seconds', greatest(0, ceil(extract(epoch from v_respawn_at - clock_timestamp()))::integer)
    );
  end if;

  return jsonb_build_object('ok', false, 'reason', 'pvp_revive_automatic');
end;
$$;

revoke all on function public.pvp_heartbeat(text, integer, integer, text, integer, text) from public, anon, authenticated;
revoke all on function public.pvp_attack(uuid) from public, anon, authenticated;
revoke all on function public.pvp_attack_sem_restricao(uuid) from public, anon, authenticated;
revoke all on function public.pvp_use_revive(bigint) from public, anon, authenticated;
grant execute on function public.pvp_heartbeat(text, integer, integer, text, integer, text) to authenticated;
grant execute on function public.pvp_attack(uuid) to authenticated;
grant execute on function public.pvp_attack_sem_restricao(uuid) to authenticated;
grant execute on function public.pvp_use_revive(bigint) to authenticated;
