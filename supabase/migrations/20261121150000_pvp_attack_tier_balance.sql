-- O cliente chama public.pvp_attack (versão base, sem guarda) — o PvP de
-- Emerald Global estava desprotegido enquanto a guarda existia só em
-- pvp_attack_sem_restricao. Agora a função publicada é a protegida:
--   * janela de PvP (São Paulo, hora PAR) e mapa 'arv' obrigatório;
--   * chance de acerto por tier/nível (piso 55%) — tier baixo acerta em tier
--     alto, só erra com mais frequência (espelho de tierHitChance no cliente);
--   * dano relativo ao tier com underdog e clamp [4,35].
-- pvp_attack_sem_restricao vira um delegador fino para não divergir.

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

-- Mantém o nome antigo como delegador: mesma semântica, um só corpo.
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

revoke all on function public.pvp_attack(uuid) from public, anon, authenticated;
revoke all on function public.pvp_attack_sem_restricao(uuid) from public, anon, authenticated;
grant execute on function public.pvp_attack(uuid) to authenticated;
grant execute on function public.pvp_attack_sem_restricao(uuid) to authenticated;
