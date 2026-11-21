-- Loja Cash por Cristal Vermelho.
-- O cliente escolhe apenas o id do produto; preços, entrega e desbloqueios
-- são decididos no servidor enquanto a linha do save está bloqueada.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- A Skin Vegeta precisa de uma prova server-side, pois o save é enviado pelo
-- cliente. O recibo privado também permite que o trigger preserve o unlock
-- depois de uma compra confirmada.
create table if not exists private.red_crystal_cash_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null check (product_id = 'vegeta_skin'),
  granted_at timestamptz not null default clock_timestamp(),
  primary key (user_id, product_id)
);

alter table private.red_crystal_cash_entitlements enable row level security;
revoke all on private.red_crystal_cash_entitlements from public, anon, authenticated;
grant all on private.red_crystal_cash_entitlements to service_role;

create or replace function private.red_crystal_cash_nonnegative_int(
  p_value jsonb,
  p_cap bigint
)
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
revoke all on function private.red_crystal_cash_nonnegative_int(jsonb, bigint)
  from public, anon, authenticated;

-- Voucher antigo e compra na Loja Cash são as duas únicas fontes autorizadas
-- para a skin. Checkpoints falsificados não conseguem introduzir Vegeta.
create or replace function public.preserve_vegeta_skin_unlock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_skins jsonb;
begin
  if jsonb_typeof(new.data -> 'idle') is distinct from 'object' then return new; end if;
  v_skins := new.data #> '{idle,unlockedSkins}';
  if not exists (
    select 1 from public.vegeta_skin_vouchers
    where claimed_by = new.user_id and claimed_at is not null
  ) and not exists (
    select 1 from private.red_crystal_cash_entitlements
    where user_id = new.user_id and product_id = 'vegeta_skin'
  ) then
    if jsonb_typeof(v_skins) = 'array' and v_skins @> '["vegeta"]'::jsonb then
      new.data := jsonb_set(new.data, '{idle,unlockedSkins}',
        (select coalesce(jsonb_agg(value), '[]'::jsonb)
         from jsonb_array_elements(v_skins) as skin(value)
         where skin.value <> '"vegeta"'::jsonb), true);
    end if;
    return new;
  end if;
  if jsonb_typeof(v_skins) is distinct from 'array' then v_skins := '[]'::jsonb; end if;
  if not v_skins @> '["vegeta"]'::jsonb then
    new.data := jsonb_set(new.data, '{idle,unlockedSkins}', v_skins || '"vegeta"'::jsonb, true);
  end if;
  return new;
end;
$$;
revoke all on function public.preserve_vegeta_skin_unlock() from public, anon, authenticated;

create or replace function public.buy_red_crystal_cash_product(
  p_product_id text,
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
  v_skins jsonb;
  v_red_crystals bigint;
  v_price bigint;
  v_granted_item text := null;
  v_granted_qty integer := 0;
  v_item_qty bigint := 0;
  v_new_version bigint;
  v_saved_at bigint;
  v_skin text := null;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_product_id is null
    or p_product_id <> lower(p_product_id)
    or p_product_id !~ '^[a-z0-9_]{1,48}$'
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_product');
  end if;

  -- Catálogo autoritativo. Nunca use preço, quantidade ou item vindos do cliente.
  case p_product_id
    when 'pokeball_50' then
      v_price := 300; v_granted_item := 'pokeball'; v_granted_qty := 50;
    when 'pokeball_100' then
      v_price := 1000; v_granted_item := 'pokeball'; v_granted_qty := 100;
    when 'ultraball_50' then
      v_price := 2500; v_granted_item := 'ultraball'; v_granted_qty := 50;
    when 'book_atk' then
      v_price := 500; v_granted_item := 'book_atk'; v_granted_qty := 1;
    when 'book_exp' then
      v_price := 1000; v_granted_item := 'book_exp'; v_granted_qty := 1;
    when 'orb_xp_minor' then
      v_price := 2000; v_granted_item := 'orb_xp_minor'; v_granted_qty := 1;
    when 'orb_xp_major' then
      v_price := 2000; v_granted_item := 'orb_xp_major'; v_granted_qty := 1;
    when 'orb_xp_supreme' then
      v_price := 2000; v_granted_item := 'orb_xp_supreme'; v_granted_qty := 1;
    when 'orb_team' then
      v_price := 2000; v_granted_item := 'orb_team'; v_granted_qty := 1;
    when 'vip_epic' then
      v_price := 10000; v_granted_item := 'book_vip'; v_granted_qty := 1;
    when 'egg_epic' then
      v_price := 10000; v_granted_item := 'egg_epic'; v_granted_qty := 1;
    when 'vegeta_skin' then
      v_price := 50000; v_skin := 'vegeta';
    else
      return jsonb_build_object('ok', false, 'reason', 'invalid_product');
  end case;

  -- Compartilha o mesmo lock/versionamento do checkpoint para evitar gastar
  -- duas vezes em abas diferentes ou misturar uma compra com outro save.
  select * into v_save
    from public.game_saves
    where user_id = v_uid
    for update;
  if not found
    or jsonb_typeof(v_save.data -> 'idle') <> 'object'
    or jsonb_typeof(v_save.data -> 'team') <> 'array'
    or jsonb_typeof(v_save.data -> 'restingBench') <> 'array'
  then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  v_data := v_save.data;
  v_idle := v_data -> 'idle';
  v_items := coalesce(v_idle -> 'items', '{}'::jsonb);
  if jsonb_typeof(v_items) <> 'object' then v_items := '{}'::jsonb; end if;
  v_red_crystals := private.red_crystal_cash_nonnegative_int(v_items -> 'cr_red', 999999);
  if v_red_crystals < v_price then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_red_crystals');
  end if;

  if v_skin = 'vegeta' then
    if exists (
      select 1 from public.vegeta_skin_vouchers
      where claimed_by = v_uid and claimed_at is not null
    ) or exists (
      select 1 from private.red_crystal_cash_entitlements
      where user_id = v_uid and product_id = 'vegeta_skin'
    ) then
      return jsonb_build_object('ok', false, 'reason', 'already_owned');
    end if;

    insert into private.red_crystal_cash_entitlements (user_id, product_id)
      values (v_uid, 'vegeta_skin')
      on conflict (user_id, product_id) do nothing;
    if not found then
      return jsonb_build_object('ok', false, 'reason', 'already_owned');
    end if;

    v_skins := v_idle -> 'unlockedSkins';
    if jsonb_typeof(v_skins) is distinct from 'array' then v_skins := '[]'::jsonb; end if;
    if not v_skins @> '["vegeta"]'::jsonb then
      v_skins := v_skins || '"vegeta"'::jsonb;
    end if;
    v_idle := jsonb_set(v_idle, '{unlockedSkins}', v_skins, true);
  else
    v_item_qty := private.red_crystal_cash_nonnegative_int(v_items -> v_granted_item, 999999);
    if v_item_qty > 999999 - v_granted_qty then
      return jsonb_build_object('ok', false, 'reason', 'inventory_cap');
    end if;
    v_item_qty := v_item_qty + v_granted_qty;
    v_items := jsonb_set(v_items, array[v_granted_item], to_jsonb(v_item_qty), true);
  end if;

  v_red_crystals := v_red_crystals - v_price;
  v_items := jsonb_set(v_items, '{cr_red}', to_jsonb(v_red_crystals), true);
  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  v_saved_at := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_data := jsonb_set(
    v_data,
    '{savedAt}',
    to_jsonb(greatest(
      case when coalesce(v_data ->> 'savedAt', '') ~ '^[0-9]{1,15}$'
        then (v_data ->> 'savedAt')::bigint
        else 0
      end,
      v_saved_at
    )),
    true
  );

  update public.game_saves
    set data = v_data,
        save_version = v_save.save_version + 1,
        updated_at = clock_timestamp()
    where user_id = v_uid
      and save_version = v_save.save_version
    returning save_version into v_new_version;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  return jsonb_build_object(
    'ok', true,
    'server_version', v_new_version,
    'saved_at', v_saved_at,
    'red_crystals', v_red_crystals,
    'item_id', v_granted_item,
    'item_qty', case when v_granted_item is null then null else v_item_qty end,
    'skin', v_skin
  );
end;
$$;

revoke all on function public.buy_red_crystal_cash_product(text, bigint) from public, anon;
grant execute on function public.buy_red_crystal_cash_product(text, bigint) to authenticated;
