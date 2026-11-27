-- Loja Cash: nova tabela de preços (ovos, orbs, Ultra/Master, skins e montaria 30d).
-- Preço, item e quantidade continuam definidos somente no servidor.
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

  -- Catálogo autoritativo. O navegador nunca informa preço, item ou quantidade.
  case p_product_id
    when 'pokeball_50' then
      v_price := 300; v_granted_item := 'pokeball'; v_granted_qty := 50;
    when 'pokeball_100' then
      v_price := 600; v_granted_item := 'pokeball'; v_granted_qty := 100;
    when 'ultraball_50' then
      v_price := 1500; v_granted_item := 'ultraball'; v_granted_qty := 50;
    when 'ultraball_100' then
      v_price := 2300; v_granted_item := 'ultraball'; v_granted_qty := 100;
    when 'masterball' then
      v_price := 10000; v_granted_item := 'masterball'; v_granted_qty := 1;
    when 'revive_pack_10' then
      v_price := 10; v_granted_item := 'revive'; v_granted_qty := 10;
    when 'potion_20' then
      v_price := 1; v_granted_item := 'potion'; v_granted_qty := 20;
    when 'combo_revo' then
      v_price := 20; v_granted_item := 'combo_revo'; v_granted_qty := 1;
    when 'slimeball' then
      v_price := 50; v_granted_item := 'slimeball'; v_granted_qty := 1;
    when 'book_atk' then
      v_price := 500; v_granted_item := 'book_atk'; v_granted_qty := 1;
    when 'book_exp' then
      v_price := 300; v_granted_item := 'book_exp'; v_granted_qty := 1;
    when 'orb_xp_minor' then
      v_price := 500; v_granted_item := 'orb_xp_minor'; v_granted_qty := 1;
    when 'orb_xp_major' then
      v_price := 500; v_granted_item := 'orb_xp_major'; v_granted_qty := 1;
    when 'orb_xp_supreme' then
      v_price := 500; v_granted_item := 'orb_xp_supreme'; v_granted_qty := 1;
    when 'orb_team' then
      v_price := 500; v_granted_item := 'orb_team'; v_granted_qty := 1;
    when 'vip_epic' then
      v_price := 10000; v_granted_item := 'book_vip_30'; v_granted_qty := 1;
    when 'vip_gold_30' then
      v_price := 2000; v_granted_item := 'book_vip_gold_30'; v_granted_qty := 1;
    when 'mount_30' then
      v_price := 3000; v_granted_item := 'carta_montaria_30'; v_granted_qty := 1;
    when 'egg_epic' then
      v_price := 1000; v_granted_item := 'egg_epic'; v_granted_qty := 1;
    when 'egg_mythic' then
      v_price := 8000; v_granted_item := 'egg_mystic'; v_granted_qty := 1;
    when 'vegeta_skin' then
      v_price := 3000; v_skin := 'vegeta';
    when 'goku_skin' then
      v_price := 4000; v_skin := 'goku';
    when 'one_skin' then
      v_price := 3000; v_skin := 'one';
    else
      return jsonb_build_object('ok', false, 'reason', 'invalid_product');
  end case;

  -- Compartilha o mesmo lock/versionamento do checkpoint para impedir gasto
  -- duplicado em várias abas e misturas com saves concorrentes.
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

  if v_skin is not null then
    if v_skin = 'vegeta' and (
      exists (
        select 1 from public.vegeta_skin_vouchers
        where claimed_by = v_uid and claimed_at is not null
      )
      or exists (
        select 1 from private.red_crystal_cash_entitlements
        where user_id = v_uid and product_id = 'vegeta_skin'
      )
    ) then
      return jsonb_build_object('ok', false, 'reason', 'already_owned');
    end if;

    if v_skin = 'goku' and (
      exists (select 1 from public.goku_legacy_owners where user_id = v_uid)
      or exists (
        select 1 from public.player_reward_claims
        where user_id = v_uid and code in ('GOKUSKIN1', 'MYHWH7755')
      )
      or exists (
        select 1 from public.goku_skin_vouchers
        where claimed_by = v_uid and claimed_at is not null
      )
      or exists (
        select 1 from private.red_crystal_cash_entitlements
        where user_id = v_uid and product_id = 'goku_skin'
      )
    ) then
      return jsonb_build_object('ok', false, 'reason', 'already_owned');
    end if;

    if v_skin = 'one' and (
      coalesce(v_idle -> 'unlockedSkins', '[]'::jsonb) @> jsonb_build_array('one')
      or exists (
        select 1 from private.red_crystal_cash_entitlements
        where user_id = v_uid and product_id = 'one_skin'
      )
    ) then
      return jsonb_build_object('ok', false, 'reason', 'already_owned');
    end if;

    insert into private.red_crystal_cash_entitlements (user_id, product_id)
      values (v_uid, p_product_id)
      on conflict (user_id, product_id) do nothing;
    if not found then
      return jsonb_build_object('ok', false, 'reason', 'already_owned');
    end if;

    v_skins := v_idle -> 'unlockedSkins';
    if jsonb_typeof(v_skins) is distinct from 'array' then v_skins := '[]'::jsonb; end if;
    if not v_skins @> jsonb_build_array(v_skin) then
      v_skins := v_skins || jsonb_build_array(v_skin);
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
