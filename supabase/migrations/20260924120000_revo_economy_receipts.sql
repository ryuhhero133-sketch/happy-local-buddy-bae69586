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
