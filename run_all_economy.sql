-- RODAR PRIMEIRO: MIGRACAO ECONOMIA (protecoes + RLS + receipts + hatch_egg)
-- =====================================================================
-- IDLE MON REVO — economia server-authoritative (CHAVE DE OURO, etapa final)
-- Rodar UMA vez no SQL Editor. Idempotente. NADA destrutivo:
-- sem DELETE/UPDATE em dados existentes, sem DROP de tabelas,
-- sem alteração em RLS/policies/RPCs existentes.
--
-- Modelo: cliente NUNCA escolhe valores. Ele envia INTENÇÕES
-- (idle.pending_actions[]) dentro do checkpoint normal — zero requests
-- novos no gameplay. O trigger abaixo valida cada intenção contra
-- tabelas estáticas + ledger, aplica no ledger, remove da lista.
-- Economia oficial = player_balances. Blob = display otimista.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ledger + estoques + buffs + receipts
-- ---------------------------------------------------------------------
create table if not exists public.player_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold numeric not null default 0,
  crystals numeric not null default 0,
  ruby numeric not null default 0,
  esmeralda numeric not null default 0,
  craft_points numeric not null default 0,
  frozen_craft boolean not null default false,
  eggs_migrated boolean not null default false,
  last_hunt_at timestamptz,
  last_daily_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.player_stocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  qty numeric not null default 0,
  primary key (user_id, item_id)
);
create index if not exists player_stocks_user_idx on public.player_stocks (user_id);

create table if not exists public.buff_windows (
  user_id uuid not null references auth.users(id) on delete cascade,
  buff_key text not null,
  mult numeric not null default 0,
  until timestamptz not null,
  primary key (user_id, buff_key)
);

create table if not exists public.action_receipts (
  action_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  ref text not null default '',
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists action_receipts_user_idx on public.action_receipts (user_id, created_at desc);
create index if not exists action_receipts_ref_idx on public.action_receipts (user_id, action_type, ref);

alter table public.player_balances enable row level security;
alter table public.player_stocks enable row level security;
alter table public.buff_windows enable row level security;
alter table public.action_receipts enable row level security;

drop policy if exists econ_bal_owner_select on public.player_balances;
drop policy if exists econ_stocks_owner_select on public.player_stocks;
drop policy if exists econ_buff_owner_select on public.buff_windows;
drop policy if exists econ_receipts_owner_select on public.action_receipts;
create policy econ_bal_owner_select on public.player_balances
  for select to authenticated using (user_id = auth.uid());
create policy econ_stocks_owner_select on public.player_stocks
  for select to authenticated using (user_id = auth.uid());
create policy econ_buff_owner_select on public.buff_windows
  for select to authenticated using (user_id = auth.uid());
create policy econ_receipts_owner_select on public.action_receipts
  for select to authenticated using (user_id = auth.uid());

revoke all on public.player_balances from anon, authenticated;
revoke all on public.player_stocks from anon, authenticated;
revoke all on public.buff_windows from anon, authenticated;
revoke all on public.action_receipts from anon, authenticated;
grant select on public.player_balances to authenticated;
grant select on public.player_stocks to authenticated;
grant select on public.buff_windows to authenticated;
grant select on public.action_receipts to authenticated;
grant all on public.player_balances to service_role;
grant all on public.player_stocks to service_role;
grant all on public.buff_windows to service_role;
grant all on public.action_receipts to service_role;

-- ---------------------------------------------------------------------
-- 2) tabelas estáticas (regras do jogo, só leitura)
-- ---------------------------------------------------------------------
create table if not exists public.redeem_codes (
  code text primary key,
  reward jsonb not null,
  max_uses int not null default 1,
  used_count int not null default 0
);

create table if not exists public.shop_offers (
  item_id text primary key,
  price_gold numeric,
  price_crystal numeric
);

create table if not exists public.quest_rewards (
  quest_id text primary key,
  reward jsonb not null
);

create table if not exists public.map_rates (
  map_id text primary key,
  rate numeric not null default 1,
  gold_base numeric not null default 60,
  xp_base numeric not null default 110,
  spawn_max_ps numeric not null default 3
);

create table if not exists public.hatch_pools (
  egg_type text not null,
  element text not null,
  tier text not null,
  species text not null,
  primary key (egg_type, element, tier, species)
);

alter table public.redeem_codes enable row level security;
alter table public.shop_offers enable row level security;
alter table public.quest_rewards enable row level security;
alter table public.map_rates enable row level security;
alter table public.hatch_pools enable row level security;

drop policy if exists econ_static_read_redeem on public.redeem_codes;
drop policy if exists econ_static_read_shop on public.shop_offers;
drop policy if exists econ_static_read_quest on public.quest_rewards;
drop policy if exists econ_static_read_maps on public.map_rates;
drop policy if exists econ_static_read_hatch on public.hatch_pools;
create policy econ_static_read_redeem on public.redeem_codes for select to anon, authenticated using (true);
create policy econ_static_read_shop on public.shop_offers for select to anon, authenticated using (true);
create policy econ_static_read_quest on public.quest_rewards for select to anon, authenticated using (true);
create policy econ_static_read_maps on public.map_rates for select to anon, authenticated using (true);
create policy econ_static_read_hatch on public.hatch_pools for select to anon, authenticated using (true);
revoke all on public.redeem_codes from anon, authenticated;
revoke all on public.shop_offers from anon, authenticated;
revoke all on public.quest_rewards from anon, authenticated;
revoke all on public.map_rates from anon, authenticated;
revoke all on public.hatch_pools from anon, authenticated;
grant select on public.redeem_codes to anon, authenticated;
grant select on public.shop_offers to anon, authenticated;
grant select on public.quest_rewards to anon, authenticated;
grant select on public.map_rates to anon, authenticated;
grant select on public.hatch_pools to anon, authenticated;
grant all on public.redeem_codes to service_role;
grant all on public.shop_offers to service_role;
grant all on public.quest_rewards to service_role;
grant all on public.map_rates to service_role;
grant all on public.hatch_pools to service_role;

--__ECON_SEEDS__

-- ---------------------------------------------------------------------
-- 3) helpers internos
-- ---------------------------------------------------------------------
-- Itens rastreados no ledger (valuables). Consumíveis ficam no blob (teto).
create or replace function public.econ_tracked_item(p_item text)
returns boolean
language sql immutable
set search_path = public
as $$
  select p_item like '%egg%' or p_item like 'black_mitic%' or p_item like 'emerald%'
    or p_item like 'book_%' or p_item like 'orb_%' or p_item like '%vip%'
    or p_item like 'incenso_%' or p_item like 'scroll_%' or p_item like 'carta_%'
    or p_item like 'stone_%' or p_item in (
      'safira_verde', 'esmeralda', 'chave_ruby', 'ultraball',
      'key', 'egg_boost_69', 'stone_pack_all');
$$;

revoke all on function public.econ_tracked_item(text) from public, anon;
grant execute on function public.econ_tracked_item(text) to authenticated;
grant all on all functions in schema public to service_role;

-- Aplica recompensa fixa {gold,crystals,ruby,esmeraldas,craft,items[]} no ledger.
-- Retorna jsonb resumo do aplicado.
create or replace function public.econ_apply_reward(
  p_uid uuid, p_reward jsonb,
  inout p_gold numeric default 0, inout p_crystals numeric default 0,
  inout p_ruby numeric default 0, inout p_esm numeric default 0,
  inout p_craft numeric default 0
) returns record
language plpgsql
security definer
set search_path = public
as $$
declare
  _it jsonb; _id text; _q numeric;
begin
  p_gold := p_gold + floor(coalesce(nullif(p_reward ->> 'gold', '')::numeric, 0));
  p_crystals := p_crystals + floor(coalesce(nullif(p_reward ->> 'crystals', '')::numeric, 0));
  p_ruby := p_ruby + floor(coalesce(nullif(p_reward ->> 'ruby', '')::numeric, 0));
  p_esm := p_esm + floor(coalesce(nullif(p_reward ->> 'esmeraldas', '')::numeric, 0));
  p_craft := p_craft + floor(coalesce(nullif(p_reward ->> 'craft', '')::numeric, 0));
  if jsonb_typeof(p_reward -> 'items') = 'array' then
    for _it in select * from jsonb_array_elements(p_reward -> 'items') loop
      _id := _it ->> 'itemId';
      if _id is null or _id = '' then _id := _it ->> 'id'; end if;
      _q := floor(coalesce(nullif(_it ->> 'qty', '')::numeric, 0));
      if _id is not null and _id <> '' and _q > 0 and _q <= 500 then
        if public.econ_tracked_item(_id) then
          insert into public.player_stocks (user_id, item_id, qty)
            values (p_uid, _id, _q)
            on conflict (user_id, item_id) do update set qty = player_stocks.qty + excluded.qty;
        end if;
        -- consumíveis vão ao blob via retorno (trigger soma com teto)
      end if;
    end loop;
  end if;
exception when others then
  null;
end;
$$;

revoke all on function public.econ_apply_reward(uuid, jsonb, numeric, numeric, numeric, numeric, numeric) from public, anon;
grant execute on function public.econ_apply_reward(uuid, jsonb, numeric, numeric, numeric, numeric, numeric) to authenticated;
grant all on all functions in schema public to service_role;

-- ---------------------------------------------------------------------
-- 4) egg_ledger (ovos com lastro: só entram via receipts validados)
-- ---------------------------------------------------------------------
create table if not exists public.egg_ledger (
  user_id uuid not null references auth.users(id) on delete cascade,
  egg_item text not null,
  qty numeric not null default 0,
  primary key (user_id, egg_item)
);

alter table public.egg_ledger enable row level security;
drop policy if exists econ_egg_owner_select on public.egg_ledger;
create policy econ_egg_owner_select on public.egg_ledger
  for select to authenticated using (user_id = auth.uid());
revoke all on public.egg_ledger from anon, authenticated;
grant select on public.egg_ledger to authenticated;
grant all on public.egg_ledger to service_role;

-- ---------------------------------------------------------------------
-- 5) RPC hatch_egg — choca com roll do servidor (único caminho legítimo)
-- ---------------------------------------------------------------------
create or replace function public.hatch_egg(
  p_egg text,
  p_element text,
  p_action_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _el text := lower(coalesce(p_element, ''));
  _species text;
  _rarity text;
  _level int;
  _traits text[];
  _have numeric := 0;
  _blob_used boolean := false;
  _pool text[];
begin
  if _uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_action_id is null or length(p_action_id) = 0 or length(p_action_id) > 200 then
    return jsonb_build_object('ok', false, 'reason', 'bad_action_id');
  end if;
  if p_egg not in ('black_mitic_egg', 'black_mitic_egg_plus', 'emerald_egg')
     and (p_egg not like 'egg\_%' or not exists (
       select 1 from public.species_rules
       where species = regexp_replace(p_egg, '^egg_', ''))) then
    return jsonb_build_object('ok', false, 'reason', 'bad_egg');
  end if;
  if _el not in ('grass', 'fire', 'water', 'electric', 'dark', 'dragon') then
    return jsonb_build_object('ok', false, 'reason', 'bad_element');
  end if;

  -- idempot�ncia: replay devolve resultado original, sem consumir de novo
  declare _prior jsonb;
  begin
    select result into _prior from public.action_receipts
      where action_id = p_action_id and user_id = _uid;
    if found then
      return jsonb_build_object('ok', true, 'duplicate', true, 'pet', _prior -> 'pet');
    end if;
  exception when others then null;
  end;

  declare _have numeric := 0; _blob_used boolean := false;
  begin
    select coalesce(qty,0) into _have from public.egg_ledger
      where user_id = _uid and egg_item = p_egg;
  exception when others then _have := 0; end;
  _have := coalesce(_have,0);

  if _have < 1 then
    declare _blob_today int := 0;
    begin
      select count(*) into _blob_today from public.action_receipts
        where user_id = _uid and action_type = 'hatch_egg_blob'
          and created_at > now() - interval '1 day';
    exception when others then _blob_today := 0; end;
    if _blob_today >= 5 then
      return jsonb_build_object('ok', false, 'reason', 'no_egg');
    end if;
    _blob_used := true;
  else
    begin
      update public.egg_ledger set qty = qty - 1
        where user_id = _uid and egg_item = p_egg;
    exception when others then
      return jsonb_build_object('ok', false, 'reason', 'ledger_error');
    end;
  end if;

  declare _species text; _rarity text; _level int; _traits text[]; _pet_uid text;
  begin
    if p_egg in ('black_mitic_egg', 'black_mitic_egg_plus') then
      if random() < 0.35 then
        _species := case _el when 'fire' then 'moltres' when 'electric' then 'zapdos' when 'water' then 'articuno' else null end;
      end if;
      if _species is null then
        _species := case _el when 'grass' then 'venusaur' when 'fire' then 'charizard'
          when 'water' then 'blastoise' when 'electric' then 'raichu'
          when 'dark' then 'gengar' when 'dragon' then 'dragonite' end;
      end if;
      _rarity := 'mythic_shiny'; _level := 100;
      select array_agg(t order by random()) into _traits from (
        select unnest(array['alpha','prismatico','ceifador','eterno','dourado',
        'eletrizado','precioso','prodigio','mistico','esquivo','vampirico',
        'colosso','sabio','curador','venenoso','brutal','guardiao']) as t
        order by random() limit 7) s;
    elsif p_egg = 'emerald_egg' then
      declare _tier text; _r float := random();
      begin
        _tier := case when _r < 0.65 then 'common' when _r < 0.90 then 'rare' else 'epic' end;
        select species into _species from public.hatch_pools
          where egg_type = 'emerald' and element = _el and tier = _tier
          order by random() limit 1;
        if not found then
          select species into _species from public.hatch_pools
            where egg_type = 'emerald' and element = _el order by random() limit 1;
        end if;
        if not found then return jsonb_build_object('ok', false, 'reason', 'no_pool'); end if;
        select rarity into _rarity from public.species_rules where species = _species;
        _level := 5;
        select array_agg(t order by random()) into _traits from (
          select unnest(array['feroz','resistente','agil','sortudo','sabio',
            'curador','venenoso','brutal','guardiao','eletrizado','precioso',
            'prodigio','mistico','esquivo','vampirico','colosso']) as t
          order by random() limit 3) s;
      exception when others then return jsonb_build_object('ok', false, 'reason', 'pool_error'); end;
    else
      _species := regexp_replace(p_egg, '^egg_', '');
      select rarity into _rarity from public.species_rules where species = _species;
      if not found or _rarity is null then return jsonb_build_object('ok', false, 'reason', 'unknown_species'); end if;
      _level := 1; _traits := '{}';
    end if;
  exception when others then return jsonb_build_object('ok', false, 'reason', 'roll_error'); end;

  _pet_uid := 'srv-' || replace(gen_random_uuid()::text, '-', '');
  begin
    insert into public.player_pokemon_registry (user_id, pet_uid, species, rarity, traits, level, xp, origin)
      values (_uid, _pet_uid, _species, coalesce(_rarity,'common'), to_jsonb(coalesce(_traits,'{}')),
        coalesce(_level,1), 0, 'hatch_' || case when p_egg like '%emerald%' then 'emerald' when p_egg like '%shop%' or p_egg like 'egg_%' then 'shop' else 'black' end);
  exception when others then return jsonb_build_object('ok', false, 'reason', 'registry_error'); end;

  declare _pet jsonb := jsonb_build_object('uid',_pet_uid,'species',_species,'level',coalesce(_level,1),
    'xp',0,'rarity',coalesce(_rarity,'common'),'traits',to_jsonb(coalesce(_traits,'{}')),
    'capturedAt',floor(extract(epoch from now())*1000));
  begin
    insert into public.action_receipts (action_id, user_id, action_type, ref, result)
      values (p_action_id, _uid,
        case when _blob_used then 'hatch_egg_blob' else 'hatch_egg' end,
        p_egg || ':' || _el,
        jsonb_build_object('pet', _pet));
  exception when others then null; end;
  return jsonb_build_object('ok', true, 'pet', _pet);
end;
$$;
-- RODAR DEPOIS: SEEDS (dados estaticos)
insert into public.quest_rewards (quest_id, reward) values ('task:t1', '{"crystals":3}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('task:t2', '{"crystals":2}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('task:t3', '{"crystals":4}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_kill', '{"gold":680}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_cap', '{"gold":880}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_berry', '{"gold":460}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_ep1', '{"gold":750}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_kill2', '{"gold":900}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_cap2', '{"gold":1200}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_berry2', '{"gold":650}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_ep2', '{"gold":1100}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('quest:q_vip', '{"gold":1850}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:rir', '{"items":[{"itemId":"pokeball","qty":5}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:boby2', '{"items":[{"itemId":"pokeball","qty":8}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:boby3', '{"items":[{"itemId":"greatball","qty":3}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:prometo', '{"items":[{"itemId":"pokeball","qty":5}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:san1', '{"items":[{"itemId":"orb_xp_minor","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:san2', '{"items":[{"itemId":"orb_xp_minor","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:san3', '{"items":[{"itemId":"orb_team","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:sei', '{"items":[{"itemId":"orb_xp_minor","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:nani1', '{"items":[{"itemId":"fruta","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:nani2', '{"items":[{"itemId":"suco","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:nani3', '{"items":[{"itemId":"refeicao","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:nani4', '{"items":[{"itemId":"morango","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:payka2', '{"gold":800}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:payka3', '{"gold":500}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:jamais', '{"gold":1200}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:pan1', '{"items":[{"itemId":"potion","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:pan2', '{"gold":300,"items":[{"itemId":"revive","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:pan3', '{"gold":500}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('saga:juntos', '{"items":[{"itemId":"potion","qty":3}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:boby_s1', '{"crystals":4,"items":[{"itemId":"pokeball","qty":3}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:boby_s2', '{"crystals":4,"items":[{"itemId":"greatball","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:boby_s3', '{"crystals":5,"items":[{"itemId":"pokeball","qty":5}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:boby_s4', '{"crystals":5,"items":[{"itemId":"ultraball","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:boby_s5', '{"crystals":5,"items":[{"itemId":"ultraball","qty":3}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:san_s1', '{"crystals":4,"items":[{"itemId":"orb_xp_minor","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:san_s2', '{"crystals":4,"items":[{"itemId":"book_exp","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:san_s3', '{"crystals":5,"items":[{"itemId":"orb_xp_minor","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:san_s4', '{"crystals":5,"items":[{"itemId":"orb_xp_minor","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:san_s5', '{"crystals":5,"items":[{"itemId":"orb_team","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:nan_s1', '{"crystals":4,"items":[{"itemId":"fruta","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:nan_s2', '{"crystals":4,"items":[{"itemId":"morango","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:nan_s3', '{"crystals":5,"items":[{"itemId":"refeicao","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:nan_s4', '{"crystals":5,"items":[{"itemId":"refeicao","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:nan_s5', '{"crystals":5,"items":[{"itemId":"morango","qty":4}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pay_s1', '{"crystals":4}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pay_s2', '{"crystals":4}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pay_s3', '{"crystals":5}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pay_s4', '{"crystals":5}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pay_s5', '{"crystals":5}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pan_s1', '{"crystals":4,"items":[{"itemId":"potion","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pan_s2', '{"crystals":4,"items":[{"itemId":"revive","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pan_s3', '{"crystals":5}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pan_s4', '{"crystals":5,"items":[{"itemId":"ultraball","qty":1}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('side:pan_s5', '{"crystals":5,"items":[{"itemId":"revive","qty":2}]}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:1', '{"gold":500}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:2', '{"gold":1000}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:3', '{"gold":1500}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:4', '{"gold":2000}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:5', '{"gold":2500}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:6', '{"gold":3000}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:7', '{"gold":5000}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:8', '{"gold":4000}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:9', '{"gold":4500}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.quest_rewards (quest_id, reward) values ('daily:10', '{"gold":5000}') on conflict (quest_id) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC01', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC02', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC03', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC04', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC05', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC06', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC07', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC08', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC09', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITIC10', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS6X01', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":6}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS1X01', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS6X02', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":6}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS1X02', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS6X03', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":6}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS1X03', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS6X04', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":6}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS1X04', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS6X05', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":6}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUS1X05', '{"egg_tokens":[{"egg":"black_mitic_egg_plus","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K01', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K01', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K02', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K02', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K03', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K03', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K04', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K04', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K05', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K05', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K06', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K06', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K07', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K07', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K08', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K08', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K09', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K09', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL10K10', '{"crystals":10000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CRYSTAL50K10', '{"crystals":50000}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITICPLUS', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITICPLUS1', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITICPLUS2', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITICPLUS3', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITICPLUS4', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKMITICPLUS5', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BMP2026', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BMP2X26', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BLACKPLUSCOLECAO', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BMPCOLECAO', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('PLUSCOLECAO2026', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARATAGOV', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAGOV2026', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAPOW1', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAPOW2', '{"carta_plus":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAGOV2X', '{"carta_plus":2}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTARIOLU1', '{"carta_riolu":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTARIOLU2', '{"carta_riolu":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOV6CARDS1', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOV6CARDS2', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOV6CARDS3', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOV6CARDS4', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD6A', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD6B', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD6C', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD6D', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD6E', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB6A', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB6B', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB6C', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB6D', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB6E', '{"carta_incubadora":6}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOV5CARDS1', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOV5CARDS2', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD5A', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD5B', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD5C', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD5D', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD5E', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB5A', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB5B', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB5C', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB5D', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB5E', '{"carta_incubadora":5}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOV1CARD', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD1A', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD1B', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARD1C', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB1A', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB1B', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUB1C', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUBKEY2X26', '{"carta_incubadora":2}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVLEND1', '{"carta_governante":1,"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVLEND2', '{"carta_governante":1,"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVLEND3', '{"carta_governante":1,"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVLEND4', '{"carta_governante":1,"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVLEND5', '{"carta_governante":1,"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVLENDKIT1', '{"carta_governante":1,"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVLENDKIT2', '{"carta_governante":1,"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAGOV1', '{"carta_governante":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAGOV2', '{"carta_governante":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAGOV3', '{"carta_governante":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAGOV4', '{"carta_governante":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('CARTAGOV5', '{"carta_governante":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVKEY2026', '{"carta_governante":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('GOVKEY2X26', '{"carta_governante":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUBLENDA1', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUBLENDA2', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUBLENDA3', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUBLENDA4', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUBLENDA5', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('INCUBKEY2026', '{"carta_incubadora":1}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('EGGBOOST69', '{"esmeraldas":500,"items":[{"itemId":"egg_boost_69","qty":6},{"itemId":"stone_pack_all","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('EGG69BOOST', '{"esmeraldas":500,"items":[{"itemId":"egg_boost_69","qty":6},{"itemId":"stone_pack_all","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('BOOST69EGG', '{"esmeraldas":500,"items":[{"itemId":"egg_boost_69","qty":6},{"itemId":"stone_pack_all","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('IDLM4L4USAFH', '{"egg_tokens":[{"egg":"emerald_egg","qty":1}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('IDLMWZNHZFJT', '{"items":[{"itemId":"stone_grass","qty":50},{"itemId":"stone_fire","qty":50},{"itemId":"stone_water","qty":50},{"itemId":"stone_electric","qty":50},{"itemId":"stone_dark","qty":50},{"itemId":"stone_dragon","qty":50}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('IDLMZMMGAMDV', '{"crystals":300}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('IDLMGKPAHVTZ', '{"items":[{"itemId":"book_exp","qty":3},{"itemId":"orb_xp_minor","qty":3}]}', 1) on conflict (code) do update set reward = excluded.reward;
insert into public.redeem_codes (code, reward, max_uses) values ('IDLMZKPX2HW4', '{"gold":30000}', 1) on conflict (code) do update set reward = excluded.reward;
-- shop_offers
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('pokeball', 500, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('greatball', 5000, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('ultraball', 100, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('book_atk', 100, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('book_def', 100, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('book_exp', 30, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('maca', 200, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('laranja', 200, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('energetico', 900, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('potion', 250, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('revive', 400, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('antidoto', 150, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('orb_xp_minor', 100, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('orb_team', 2000, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('bolo_morango', 1200, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('refrigerante', 600, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('cafe', 500, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('picole', 300, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('cha_verde', 350, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('leite_manga', 700, null) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('emerald_egg', null, 500) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('scroll_teleport', null, 100) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
insert into public.shop_offers (item_id, price_gold, price_crystal) values ('ultraball_bundle', null, 2000) on conflict (item_id) do update set price_gold = excluded.price_gold, price_crystal = excluded.price_crystal;
-- map_rates
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha6', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('arena', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('terra', 1.2, 72, 132, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha5', 1.8, 108, 198, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha7', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha8', 1.1, 66, 121, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha10', 2.2, 132, 242, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha9', 2.2, 132, 242, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha11', 2.4, 144, 264, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha12', 2.6, 156, 286, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('mapinha13', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('cave01', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('cristal_cave', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('florest_bone', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('florest_ice', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('florest_shiny', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('ruinas_de_venus', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('ruinas', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('valley_plume', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('revo_rout', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
insert into public.map_rates (map_id, rate, gold_base, xp_base, spawn_max_ps) values ('cidade_principal', 1, 60, 110, 3) on conflict (map_id) do update set rate = excluded.rate, gold_base = excluded.gold_base, xp_base = excluded.xp_base;
-- hatch_pools
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'common', 'caterpie') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'common', 'weedle') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'common', 'metapod') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'common', 'kakuna') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'rare', 'butterfree') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'rare', 'ivysaur') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'rare', 'tangela') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'rare', 'gloom') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'rare', 'weepinbell') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'epic', 'venusaur') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'epic', 'victreebel') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'grass', 'epic', 'vileplume') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'fire', 'common', 'charmander') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'fire', 'common', 'vulpix') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'fire', 'common', 'growlithe') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'fire', 'rare', 'charmeleon') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'fire', 'rare', 'magmar') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'fire', 'epic', 'charizard') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'fire', 'epic', 'arcanine') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'fire', 'epic', 'flareon') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'water', 'common', 'squirtle') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'water', 'common', 'poliwag') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'water', 'common', 'psyduck') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'water', 'rare', 'wartortle') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'water', 'epic', 'blastoise') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'water', 'epic', 'vaporeon') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'water', 'epic', 'lapras') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'water', 'epic', 'gyarados') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'electric', 'common', 'pikachu') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'electric', 'common', 'voltorb') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'electric', 'common', 'magnemite') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'electric', 'rare', 'electabuzz') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'electric', 'epic', 'jolteon') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'electric', 'epic', 'raichu') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'electric', 'epic', 'magneton') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dark', 'common', 'ekans') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dark', 'common', 'gastly') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dark', 'common', 'meowth') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dark', 'rare', 'arbok') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dark', 'rare', 'haunter') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dark', 'rare', 'muk') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dark', 'epic', 'gengar') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dark', 'epic', 'umbreon') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dragon', 'epic', 'dragonair') on conflict do nothing;
insert into public.hatch_pools (egg_type, element, tier, species) values ('emerald', 'dragon', 'epic', 'exeggutor_alola') on conflict do nothing;
