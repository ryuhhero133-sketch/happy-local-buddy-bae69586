-- Marketplace and global ranking use the authoritative game save only.
-- Clients have no table access: every balance/inventory mutation is serialized
-- with game_saves.save_version inside a SECURITY DEFINER RPC.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id text not null,
  seller_name text not null,
  kind text not null default 'item',
  pet_data jsonb,
  item_id text,
  qty integer,
  price bigint not null default 0,
  currency text not null default 'gold',
  created_at timestamptz not null default now(),
  sold_at timestamptz,
  buyer_id text,
  payout_claimed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Compatible with the old, insecure market table if it exists on another branch.
alter table public.market_listings add column if not exists sold_at timestamptz;
alter table public.market_listings add column if not exists buyer_id text;
alter table public.market_listings add column if not exists payout_claimed boolean not null default false;
alter table public.market_listings add column if not exists updated_at timestamptz not null default now();
update public.market_listings set payout_claimed = false where payout_claimed is null;
alter table public.market_listings alter column payout_claimed set default false;
alter table public.market_listings alter column payout_claimed set not null;

create index if not exists market_listings_active_item_created_idx
  on public.market_listings (created_at desc)
  where sold_at is null and kind = 'item';
create index if not exists market_listings_pending_payout_idx
  on public.market_listings (seller_id, sold_at desc)
  where sold_at is not null and payout_claimed = false and kind = 'item';

alter table public.market_listings enable row level security;
revoke all on public.market_listings from public, anon, authenticated;
grant all on public.market_listings to service_role;

drop policy if exists market_public_game_access on public.market_listings;
drop policy if exists "market_public_read" on public.market_listings;
drop policy if exists "market_public_insert" on public.market_listings;
drop policy if exists "market_public_update" on public.market_listings;
drop policy if exists "market_public_delete" on public.market_listings;
drop policy if exists "Anyone authenticated can view listings" on public.market_listings;
drop policy if exists "Seller can create own listing" on public.market_listings;
drop policy if exists "Seller can cancel own unsold listing" on public.market_listings;
drop policy if exists "Any authenticated user can buy an active listing" on public.market_listings;

-- Safely reads a non-negative whole number from a JSON save without trusting
-- malformed or out-of-range JSON supplied by a client.
create or replace function private.market_nonnegative_int(p_value jsonb, p_cap bigint)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_number numeric;
begin
  if p_cap < 0 or jsonb_typeof(p_value) <> 'number' then return 0; end if;
  begin
    v_number := floor((p_value #>> '{}')::numeric);
    if v_number < 0 then return 0; end if;
    if v_number > p_cap then return p_cap; end if;
    return v_number::bigint;
  exception when others then
    return 0;
  end;
end;
$$;
revoke all on function private.market_nonnegative_int(jsonb, bigint) from public, anon, authenticated;

create or replace function public.get_market_listings(p_limit integer default 100)
returns table (
  id uuid,
  seller_id text,
  seller_name text,
  item_id text,
  qty integer,
  price bigint,
  currency text,
  created_at timestamptz,
  sold_at timestamptz,
  buyer_id text,
  payout_claimed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(100, greatest(1, coalesce(p_limit, 100)));
begin
  if auth.uid() is null then return; end if;
  return query
    select
      l.id, l.seller_id, l.seller_name, l.item_id, l.qty, l.price::bigint,
      l.currency, l.created_at, l.sold_at, l.buyer_id, l.payout_claimed
    from public.market_listings l
    where l.kind = 'item' and l.sold_at is null
    order by l.created_at desc
    limit v_limit;
end;
$$;

create or replace function public.get_market_payouts(p_limit integer default 50)
returns table (
  id uuid,
  seller_id text,
  seller_name text,
  item_id text,
  qty integer,
  price bigint,
  currency text,
  created_at timestamptz,
  sold_at timestamptz,
  buyer_id text,
  payout_claimed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := least(100, greatest(1, coalesce(p_limit, 50)));
begin
  if v_uid is null then return; end if;
  return query
    select
      l.id, l.seller_id, l.seller_name, l.item_id, l.qty, l.price::bigint,
      l.currency, l.created_at, l.sold_at, l.buyer_id, l.payout_claimed
    from public.market_listings l
    where l.kind = 'item'
      and l.seller_id = v_uid::text
      and l.sold_at is not null
      and l.payout_claimed = false
    order by l.sold_at desc
    limit v_limit;
end;
$$;

create or replace function public.market_list_item(
  p_item_id text,
  p_qty integer,
  p_price bigint,
  p_currency text,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_save public.game_saves%rowtype;
  v_data jsonb;
  v_idle jsonb;
  v_items jsonb;
  v_item_qty bigint;
  v_vip_until bigint;
  v_name text;
  v_listing_id uuid;
  v_new_version bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if p_item_id is null
    or p_item_id <> lower(p_item_id)
    or not (p_item_id = any (array[
      'pokeball', 'greatball', 'ultraball', 'chest_amulet', 'potion', 'berry',
      'revive', 'key', 'incenso_mel', 'incenso_mel_raro',
      'stone_grass', 'stone_fire', 'stone_water', 'stone_electric', 'stone_dark', 'stone_dragon',
      'book_atk', 'book_def', 'book_exp', 'book_atk_purple', 'book_def_purple',
      'book_atk_gold', 'book_def_gold'
    ]::text[]))
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_item');
  end if;
  if p_qty is null or p_qty < 1 or p_qty > 999999
    or p_price is null or p_price < 1 or p_price > 50000000
    or p_currency is null or p_currency not in ('gold', 'crystal', 'safira')
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_listing');
  end if;

  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  v_data := v_save.data;
  v_idle := v_data -> 'idle';
  v_items := coalesce(v_idle -> 'items', '{}'::jsonb);
  if jsonb_typeof(v_items) <> 'object' then v_items := '{}'::jsonb; end if;
  v_item_qty := private.market_nonnegative_int(v_items -> p_item_id, 999999);
  if v_item_qty < p_qty then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_items');
  end if;

  if p_currency = 'safira' then
    v_vip_until := private.market_nonnegative_int(v_idle #> '{buffs,goldMultUntil}', 9000000000000);
    if v_vip_until <= floor(extract(epoch from clock_timestamp()) * 1000)::bigint then
      return jsonb_build_object('ok', false, 'reason', 'vip_required');
    end if;
  end if;

  select left(coalesce(nullif(btrim(p.username), ''), 'Treinador'), 24)
    into v_name
    from public.profiles p
    where p.id = v_uid;
  v_name := coalesce(v_name, 'Treinador');

  insert into public.market_listings (
    seller_id, seller_name, kind, item_id, qty, price, currency
  ) values (
    v_uid::text, v_name, 'item', p_item_id, p_qty, p_price, p_currency
  ) returning id into v_listing_id;

  v_items := jsonb_set(v_items, array[p_item_id], to_jsonb(v_item_qty - p_qty), true);
  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  update public.game_saves
    set data = v_data, save_version = save_version + 1
    where user_id = v_uid
    returning save_version into v_new_version;

  return jsonb_build_object(
    'ok', true,
    'server_version', v_new_version,
    'listing_id', v_listing_id,
    'item_qty', v_item_qty - p_qty
  );
end;
$$;

create or replace function public.market_buy_item(
  p_listing_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_listing public.market_listings%rowtype;
  v_save public.game_saves%rowtype;
  v_data jsonb;
  v_idle jsonb;
  v_items jsonb;
  v_bank jsonb;
  v_item_qty bigint;
  v_gold bigint;
  v_crystals bigint;
  v_safira bigint;
  v_price bigint;
  v_new_version bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  select * into v_listing
    from public.market_listings
    where id = p_listing_id and kind = 'item' and sold_at is null
    for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'listing_unavailable'); end if;
  if v_listing.seller_id = v_uid::text then
    return jsonb_build_object('ok', false, 'reason', 'own_listing');
  end if;
  if v_listing.item_id is null
    or coalesce(v_listing.qty, 0) < 1
    or coalesce(v_listing.price, 0) < 1
    or v_listing.currency is null or v_listing.currency not in ('gold', 'crystal', 'safira')
  then
    return jsonb_build_object('ok', false, 'reason', 'listing_unavailable');
  end if;

  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  v_data := v_save.data;
  v_idle := v_data -> 'idle';
  v_items := coalesce(v_idle -> 'items', '{}'::jsonb);
  v_bank := coalesce(v_idle -> 'bank', '{}'::jsonb);
  if jsonb_typeof(v_items) <> 'object' then v_items := '{}'::jsonb; end if;
  if jsonb_typeof(v_bank) <> 'object' then v_bank := '{}'::jsonb; end if;
  v_gold := private.market_nonnegative_int(v_bank -> 'gold', 50000000);
  v_crystals := private.market_nonnegative_int(v_bank -> 'crystals', 1000000);
  v_safira := private.market_nonnegative_int(v_items -> 'safira_verde', 1000000);
  v_price := v_listing.price::bigint;
  v_item_qty := private.market_nonnegative_int(v_items -> v_listing.item_id, 999999);
  if v_item_qty > 999999 - v_listing.qty then
    return jsonb_build_object('ok', false, 'reason', 'inventory_cap');
  end if;

  if v_listing.currency = 'gold' then
    if v_gold < v_price then return jsonb_build_object('ok', false, 'reason', 'insufficient_funds'); end if;
    v_gold := v_gold - v_price;
  elsif v_listing.currency = 'crystal' then
    if v_crystals < v_price then return jsonb_build_object('ok', false, 'reason', 'insufficient_funds'); end if;
    v_crystals := v_crystals - v_price;
  else
    if v_safira < v_price then return jsonb_build_object('ok', false, 'reason', 'insufficient_funds'); end if;
    v_safira := v_safira - v_price;
  end if;

  v_items := jsonb_set(v_items, array[v_listing.item_id], to_jsonb(v_item_qty + v_listing.qty), true);
  v_items := jsonb_set(v_items, '{safira_verde}', to_jsonb(v_safira), true);
  v_bank := jsonb_set(v_bank, '{gold}', to_jsonb(v_gold), true);
  v_bank := jsonb_set(v_bank, '{crystals}', to_jsonb(v_crystals), true);
  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_idle := jsonb_set(v_idle, '{bank}', v_bank, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  update public.game_saves
    set data = v_data, save_version = save_version + 1
    where user_id = v_uid
    returning save_version into v_new_version;

  update public.market_listings
    set buyer_id = v_uid::text,
        sold_at = clock_timestamp(),
        payout_claimed = false,
        updated_at = clock_timestamp()
    where id = v_listing.id;

  return jsonb_build_object(
    'ok', true,
    'server_version', v_new_version,
    'item_qty', v_item_qty + v_listing.qty,
    'gold', v_gold,
    'crystals', v_crystals,
    'safira', v_safira
  );
end;
$$;

create or replace function public.market_claim_payout(
  p_listing_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_listing public.market_listings%rowtype;
  v_save public.game_saves%rowtype;
  v_data jsonb;
  v_idle jsonb;
  v_items jsonb;
  v_bank jsonb;
  v_gold bigint;
  v_crystals bigint;
  v_safira bigint;
  v_price bigint;
  v_new_version bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  select * into v_listing
    from public.market_listings
    where id = p_listing_id
      and kind = 'item'
      and seller_id = v_uid::text
      and sold_at is not null
      and payout_claimed = false
    for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'payout_unavailable'); end if;
  if coalesce(v_listing.price, 0) < 1
    or v_listing.currency is null or v_listing.currency not in ('gold', 'crystal', 'safira')
  then
    return jsonb_build_object('ok', false, 'reason', 'payout_unavailable');
  end if;

  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  v_data := v_save.data;
  v_idle := v_data -> 'idle';
  v_items := coalesce(v_idle -> 'items', '{}'::jsonb);
  v_bank := coalesce(v_idle -> 'bank', '{}'::jsonb);
  if jsonb_typeof(v_items) <> 'object' then v_items := '{}'::jsonb; end if;
  if jsonb_typeof(v_bank) <> 'object' then v_bank := '{}'::jsonb; end if;
  v_gold := private.market_nonnegative_int(v_bank -> 'gold', 50000000);
  v_crystals := private.market_nonnegative_int(v_bank -> 'crystals', 1000000);
  v_safira := private.market_nonnegative_int(v_items -> 'safira_verde', 1000000);
  v_price := v_listing.price::bigint;

  if v_listing.currency = 'gold' then
    if v_gold > 50000000 - v_price then return jsonb_build_object('ok', false, 'reason', 'balance_cap'); end if;
    v_gold := v_gold + v_price;
  elsif v_listing.currency = 'crystal' then
    if v_crystals > 1000000 - v_price then return jsonb_build_object('ok', false, 'reason', 'balance_cap'); end if;
    v_crystals := v_crystals + v_price;
  else
    if v_safira > 1000000 - v_price then return jsonb_build_object('ok', false, 'reason', 'balance_cap'); end if;
    v_safira := v_safira + v_price;
  end if;

  v_items := jsonb_set(v_items, '{safira_verde}', to_jsonb(v_safira), true);
  v_bank := jsonb_set(v_bank, '{gold}', to_jsonb(v_gold), true);
  v_bank := jsonb_set(v_bank, '{crystals}', to_jsonb(v_crystals), true);
  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_idle := jsonb_set(v_idle, '{bank}', v_bank, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  update public.game_saves
    set data = v_data, save_version = save_version + 1
    where user_id = v_uid
    returning save_version into v_new_version;

  update public.market_listings
    set payout_claimed = true, updated_at = clock_timestamp()
    where id = v_listing.id;

  return jsonb_build_object(
    'ok', true,
    'server_version', v_new_version,
    'gold', v_gold,
    'crystals', v_crystals,
    'safira', v_safira
  );
end;
$$;

create or replace function public.market_cancel_listing(
  p_listing_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_listing public.market_listings%rowtype;
  v_save public.game_saves%rowtype;
  v_data jsonb;
  v_idle jsonb;
  v_items jsonb;
  v_item_qty bigint;
  v_new_version bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  select * into v_listing
    from public.market_listings
    where id = p_listing_id
      and kind = 'item'
      and seller_id = v_uid::text
      and sold_at is null
    for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'listing_unavailable'); end if;
  if v_listing.item_id is null or coalesce(v_listing.qty, 0) < 1 then
    return jsonb_build_object('ok', false, 'reason', 'listing_unavailable');
  end if;

  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  v_data := v_save.data;
  v_idle := v_data -> 'idle';
  v_items := coalesce(v_idle -> 'items', '{}'::jsonb);
  if jsonb_typeof(v_items) <> 'object' then v_items := '{}'::jsonb; end if;
  v_item_qty := private.market_nonnegative_int(v_items -> v_listing.item_id, 999999);
  if v_item_qty > 999999 - v_listing.qty then
    return jsonb_build_object('ok', false, 'reason', 'inventory_cap');
  end if;

  v_items := jsonb_set(v_items, array[v_listing.item_id], to_jsonb(v_item_qty + v_listing.qty), true);
  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  update public.game_saves
    set data = v_data, save_version = save_version + 1
    where user_id = v_uid
    returning save_version into v_new_version;
  delete from public.market_listings where id = v_listing.id;

  return jsonb_build_object(
    'ok', true,
    'server_version', v_new_version,
    'item_qty', v_item_qty + v_listing.qty
  );
end;
$$;

-- Ranking has no write endpoint. It reads saved trainerLevel/craftPoints, never
-- presence rows, Pokémon levels, or client-provided score arguments.
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

revoke all on function public.get_market_listings(integer) from public, anon;
revoke all on function public.get_market_payouts(integer) from public, anon;
revoke all on function public.market_list_item(text, integer, bigint, text, bigint) from public, anon;
revoke all on function public.market_buy_item(uuid, bigint) from public, anon;
revoke all on function public.market_claim_payout(uuid, bigint) from public, anon;
revoke all on function public.market_cancel_listing(uuid, bigint) from public, anon;
revoke all on function public.get_global_ranked(integer) from public, anon;
grant execute on function public.get_market_listings(integer) to authenticated;
grant execute on function public.get_market_payouts(integer) to authenticated;
grant execute on function public.market_list_item(text, integer, bigint, text, bigint) to authenticated;
grant execute on function public.market_buy_item(uuid, bigint) to authenticated;
grant execute on function public.market_claim_payout(uuid, bigint) to authenticated;
grant execute on function public.market_cancel_listing(uuid, bigint) to authenticated;
grant execute on function public.get_global_ranked(integer) to authenticated;

-- Legacy write RPCs accepted a client-provided trainer level. Disable them if a
-- project has them from the old setup; the new read-only RPC above supersedes it.
do $$
begin
  if to_regprocedure('public.record_ranked_score(integer,integer,text)') is not null then
    execute 'revoke all on function public.record_ranked_score(integer, integer, text) from public, anon, authenticated';
  end if;
  if to_regclass('public.ranked_scores') is not null then
    execute 'revoke all on public.ranked_scores from public, anon, authenticated';
  end if;
end;
$$;

revoke all on public.ranked_leaderboard, public.ranked_seasons from public, anon, authenticated;
grant all on public.ranked_leaderboard, public.ranked_seasons to service_role;
