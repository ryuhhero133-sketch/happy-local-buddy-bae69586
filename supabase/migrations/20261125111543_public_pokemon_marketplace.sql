-- O mercado usa somente game_saves; não reativa o antigo pokemon_market.
-- Custódia, compra, devolução e pagamento têm versão e transação únicas.
-- A versão antiga devolvia SQL NULL para itens ausentes, invalidando o JSON
-- de uma primeira compra/recompensa. Ausente é estoque zero, nunca SQL NULL.
create or replace function private.market_nonnegative_int(p_value jsonb,p_cap bigint)
returns bigint language plpgsql immutable set search_path = '' as $$
declare v_number numeric;
begin
  if p_cap is null or p_cap<0 or jsonb_typeof(p_value) is distinct from 'number' then return 0; end if;
  v_number:=floor((p_value #>> '{}')::numeric);
  return least(p_cap::numeric,greatest(0::numeric,v_number))::bigint;
exception when numeric_value_out_of_range or invalid_text_representation then return 0;
end;
$$;
revoke all on function private.market_nonnegative_int(jsonb,bigint) from public, anon, authenticated;

create table private.market_starter_locks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pet_uid text not null,
  created_at timestamptz not null default now()
);
alter table private.market_starter_locks enable row level security;
revoke all on private.market_starter_locks from public, anon, authenticated;

create function private.market_initial_uid(p_data jsonb)
returns text language sql immutable set search_path = '' as $$
  with pets as (
    select e, ord from jsonb_array_elements(
      coalesce(nullif(p_data #> '{idle,collection}', 'null'), '[]') ||
      coalesce(nullif(p_data -> 'team', 'null'), '[]') ||
      coalesce(nullif(p_data -> 'restingBench', 'null'), '[]')
    ) with ordinality as t(e, ord)
  )
  select coalesce(nullif(p_data #>> '{idle,starterPokemonUid}', ''),
    (select e ->> 'uid' from pets
      where nullif(e ->> 'uid', '') is not null
        and (e ->> 'event' = 'starter' or e ->> 'isStarter' = 'true')
      order by ord limit 1),
    (select e ->> 'uid' from pets
      where nullif(e ->> 'uid', '') is not null
        and e ->> 'species' = any(array['charmander','charmeleon','charizard','bulbasaur','ivysaur','venusaur','squirtle','wartortle','blastoise'])
        and coalesce(e ->> 'event', '') = '' and e ->> 'purchasedAt' is null
      order by private.market_nonnegative_int(e -> 'capturedAt', 9000000000000) = 0,
        private.market_nonnegative_int(e -> 'capturedAt', 9000000000000), ord limit 1))
$$;
revoke all on function private.market_initial_uid(jsonb) from public, anon, authenticated;

insert into private.market_starter_locks(user_id, pet_uid)
select user_id, private.market_initial_uid(data) from public.game_saves
where jsonb_typeof(data -> 'idle') = 'object' and private.market_initial_uid(data) is not null
on conflict (user_id) do nothing;

create unique index market_pokemon_uid_unique on public.market_listings ((pet_data ->> 'uid'))
  where kind = 'pokemon';
create index market_pokemon_seller_idx on public.market_listings(seller_id)
  where kind = 'pokemon';
create index market_active_all_created_idx on public.market_listings(created_at desc)
  where sold_at is null and kind in ('item','pokemon');
create index market_seller_open_idx on public.market_listings(seller_id,created_at desc)
  where sold_at is null;
create index market_pending_all_payout_idx on public.market_listings(seller_id,sold_at desc)
  where sold_at is not null and not payout_claimed and kind in ('item','pokemon');

create function private.guard_marketplace_save()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_starter text;
  v_removed text[];
  v_key text;
  v_list jsonb;
begin
  if jsonb_typeof(new.data -> 'idle') is distinct from 'object' then return new; end if;
  select pet_uid into v_starter from private.market_starter_locks where user_id = new.user_id;
  if v_starter is null then
    v_starter := private.market_initial_uid(new.data);
    if v_starter is not null then
      insert into private.market_starter_locks(user_id, pet_uid) values (new.user_id, v_starter)
      on conflict (user_id) do nothing;
      select pet_uid into v_starter from private.market_starter_locks where user_id = new.user_id;
    end if;
  end if;
  if v_starter is not null then
    new.data := jsonb_set(new.data, '{idle,starterPokemonUid}', to_jsonb(v_starter), true);
  end if;
  -- Inclusive anúncios vendidos: um checkpoint antigo do vendedor não pode
  -- restaurar o indivíduo. O comprador recebe um UID novo, gerado no servidor.
  select array_agg(pet_data ->> 'uid') into v_removed
    from public.market_listings where seller_id = new.user_id::text and kind = 'pokemon';
  foreach v_key in array array['team', 'restingBench', 'party', 'activeTeam', 'collection'] loop
    v_list := case when v_key = 'collection' then new.data #> '{idle,collection}' else new.data -> v_key end;
    if jsonb_typeof(v_list) is distinct from 'array' then continue; end if;
    select coalesce(jsonb_agg(case when e ->> 'uid' = v_starter
      then e || '{"isStarter":true}'::jsonb else e end order by ord), '[]'::jsonb)
    into v_list from jsonb_array_elements(v_list) with ordinality t(e, ord)
    where not coalesce((e ->> 'uid') = any(v_removed), false);
    new.data := jsonb_set(new.data, case when v_key = 'collection' then array['idle','collection'] else array[v_key] end, v_list, true);
  end loop;
  return new;
end;
$$;
revoke all on function private.guard_marketplace_save() from public, anon, authenticated;
create trigger zy_guard_marketplace_save before insert or update on public.game_saves
  for each row execute function private.guard_marketplace_save();

create function private.market_item_ids()
returns text[] language sql immutable set search_path = '' as $$
select array[
  'pokeball','greatball','ultraball','masterball','safariball','slimeball','slime_pet',
  'potion','revive','berry','key','chest_amulet','morango','limao','banana','maca','laranja',
  'picole','refrigerante','cafe','cha_verde','bolo_morango','leite_manga',
  'stone_grass','stone_fire','stone_water','stone_electric','stone_dark','stone_dragon',
  'book_atk','book_def','book_exp','book_atk_purple','book_def_purple','book_atk_gold','book_def_gold',
  'book_exp_big','book_exp_max','book_vip','book_vip_30','book_vip_60',
  'incenso_mel','incenso_mel_raro','incenso_mel_raro_24h','orb_xp_minor','orb_xp_major',
  'orb_xp_supreme','orb_xp_supreme_24h','orb_team',
  'egg_common','egg_rare','egg_epic','egg_mystic','egg_aura','egg_charizard','egg_charizard_epic',
  'egg_lugia','egg_sprigatito','egg_mew_7','egg_lucario_7','egg_ditto_shiny_1',
  'egg_anc_selado','egg_anc_plus','egg_anc_luck','black_mitic_egg','emerald_egg','egg_boost_69',
  'esfera_safira','ticket_ancestral','skin_ticket','carta_montaria','carta_incubadora','carta_plus','carta_riolu',
  'nevezinha_doll','premium_box','bau_esmeralda','fibra','ferro','agua','bronze','buque','chicote',
  'escamas','perola','pepita','flor','lenha','pedra','sucata','oleo','certificado',
  'cog_red','cog_blue','cog_orange','cog_brown','disc_raiz','disc_mare','disc_combustao'
]::text[]
$$;
revoke all on function private.market_item_ids() from public, anon, authenticated;

create or replace function public.market_list_item(
  p_item_id text, p_qty integer, p_price bigint, p_currency text, p_expected_version bigint
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_save public.game_saves%rowtype;
  v_data jsonb; v_items jsonb; v_qty bigint; v_name text; v_id uuid; v_version bigint;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','unauthenticated'); end if;
  if p_item_id is null or not(p_item_id = any(private.market_item_ids())) then
    return jsonb_build_object('ok',false,'reason','invalid_item');
  end if;
  if p_qty is null or p_qty not between 1 and 999999 or p_price is null
    or p_price not between 1 and 50000000 or p_currency is null or p_currency not in ('gold','crystal','safira')
    or (p_currency <> 'gold' and p_price > 1000000) then
    return jsonb_build_object('ok',false,'reason','invalid_listing');
  end if;
  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') is distinct from 'object' then
    return jsonb_build_object('ok',false,'reason','save_incomplete');
  end if;
  if p_expected_version is null or v_save.save_version <> p_expected_version then return jsonb_build_object('ok',false,'reason','stale'); end if;
  if (select count(*) from public.market_listings where seller_id = v_uid::text and sold_at is null) >= 100 then
    return jsonb_build_object('ok',false,'reason','listing_cap');
  end if;
  v_data := v_save.data;
  v_items := coalesce(v_data #> '{idle,items}','{}');
  v_qty := private.market_nonnegative_int(v_items -> p_item_id,999999);
  if v_qty < p_qty then return jsonb_build_object('ok',false,'reason','insufficient_items'); end if;
  select left(coalesce(nullif(btrim(username),''),'Treinador'),24) into v_name from public.profiles where id = v_uid;
  insert into public.market_listings(seller_id,seller_name,kind,item_id,qty,price,currency)
    values(v_uid::text,coalesce(v_name,'Treinador'),'item',p_item_id,p_qty,p_price,p_currency) returning id into v_id;
  v_items := jsonb_set(v_items,array[p_item_id],to_jsonb(v_qty - p_qty),true);
  v_data := jsonb_set(v_data,'{idle,items}',v_items,true);
  update public.game_saves set data=v_data,save_version=save_version+1 where user_id=v_uid returning save_version into v_version;
  return jsonb_build_object('ok',true,'server_version',v_version,'listing_id',v_id,'item_qty',v_qty-p_qty);
end;
$$;

create function public.get_marketplace()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode='42501'; end if;
  return jsonb_build_object(
    'listings',coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from (
      select * from public.market_listings where sold_at is null and seller_id <> v_uid::text and kind in ('item','pokemon')
      order by created_at desc limit 200) l),'[]'::jsonb),
    'mine',coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from public.market_listings l
      where seller_id=v_uid::text and sold_at is null and kind in ('item','pokemon')),'[]'::jsonb),
    'payouts',coalesce((select jsonb_agg(to_jsonb(l) order by l.sold_at desc) from public.market_listings l
      where seller_id=v_uid::text and sold_at is not null and not payout_claimed and kind in ('item','pokemon')),'[]'::jsonb),
    'total',(select count(*) from public.market_listings where sold_at is null and kind in ('item','pokemon')),
    'starter_uid',(select pet_uid from private.market_starter_locks where user_id=v_uid));
end;
$$;

-- Uma API de custódia para Pokémon e coleta de pagamento de ambos os tipos.
-- A ordem de locks é anúncio -> save, igual às APIs antigas de itens.
create function public.market_pokemon(
  p_action text, p_expected_version bigint, p_listing_id uuid default null,
  p_pet_uid text default null, p_price bigint default null, p_currency text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_save public.game_saves%rowtype;
  v_listing public.market_listings%rowtype;
  v_data jsonb; v_col jsonb; v_bench jsonb; v_pet jsonb; v_live jsonb; v_items jsonb; v_bank jsonb;
  v_gold bigint; v_crystals bigint; v_safira bigint; v_version bigint; v_id uuid; v_name text;
  v_starter text; v_removed text; v_now bigint := floor(extract(epoch from clock_timestamp())*1000)::bigint;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','unauthenticated'); end if;
  if p_action is null or p_action not in ('list','buy','cancel','claim') then return jsonb_build_object('ok',false,'reason','invalid_action'); end if;
  if p_action <> 'list' then
    select * into v_listing from public.market_listings where id=p_listing_id for update;
    if not found then return jsonb_build_object('ok',false,'reason','listing_unavailable'); end if;
    if p_action = 'claim' then
      if v_listing.kind not in ('item','pokemon') or v_listing.seller_id <> v_uid::text
        or v_listing.sold_at is null or v_listing.payout_claimed then
        return jsonb_build_object('ok',false,'reason','payout_unavailable');
      end if;
    else
      if v_listing.kind <> 'pokemon' or v_listing.sold_at is not null then
        return jsonb_build_object('ok',false,'reason','listing_unavailable');
      end if;
      if p_action='buy' and v_listing.seller_id=v_uid::text then return jsonb_build_object('ok',false,'reason','own_listing'); end if;
      if p_action='cancel' and v_listing.seller_id<>v_uid::text then return jsonb_build_object('ok',false,'reason','not_owner'); end if;
    end if;
    if v_listing.price < 1 or v_listing.currency not in ('gold','crystal','safira') then
      return jsonb_build_object('ok',false,'reason','invalid_listing');
    end if;
  end if;
  select * into v_save from public.game_saves where user_id=v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') is distinct from 'object'
    or jsonb_typeof(v_save.data -> 'team') is distinct from 'array' then
    return jsonb_build_object('ok',false,'reason','save_incomplete');
  end if;
  if p_expected_version is null or p_expected_version<>v_save.save_version then return jsonb_build_object('ok',false,'reason','stale'); end if;
  v_data := v_save.data;
  v_col := coalesce(v_data #> '{idle,collection}','[]');
  v_bench := coalesce(v_data -> 'restingBench','[]');
  v_items := coalesce(v_data #> '{idle,items}','{}');
  v_bank := coalesce(v_data #> '{idle,bank}','{}');
  if jsonb_typeof(v_col) <> 'array' or jsonb_typeof(v_bench) <> 'array' or jsonb_typeof(v_items) <> 'object' or jsonb_typeof(v_bank) <> 'object' then
    return jsonb_build_object('ok',false,'reason','save_incomplete');
  end if;
  v_gold := private.market_nonnegative_int(v_bank->'gold',50000000);
  v_crystals := private.market_nonnegative_int(v_bank->'crystals',1000000);
  v_safira := private.market_nonnegative_int(v_items->'safira_verde',1000000);
  if p_action='list' then
    if p_pet_uid is null or length(p_pet_uid) not between 1 and 200 or p_price is null or p_price not between 1 and 50000000
      or p_currency is null or p_currency not in ('gold','crystal','safira') or (p_currency<>'gold' and p_price>1000000) then
      return jsonb_build_object('ok',false,'reason','invalid_listing');
    end if;
    select e into v_pet from jsonb_array_elements(v_col) e where e->>'uid'=p_pet_uid limit 1;
    select e into v_live from jsonb_array_elements(v_bench) e where e->>'uid'=p_pet_uid limit 1;
    v_pet := coalesce(v_pet,'{}') || coalesce(v_live,'{}');
    if v_pet->>'uid' is distinct from p_pet_uid or coalesce(v_pet->>'species','') !~ '^[a-z0-9_]{1,80}$'
      or private.market_nonnegative_int(v_pet->'level',1000000)<1 then
      return jsonb_build_object('ok',false,'reason','pokemon_unavailable');
    end if;
    select pet_uid into v_starter from private.market_starter_locks where user_id=v_uid;
    if p_pet_uid=coalesce(v_starter,private.market_initial_uid(v_data)) or v_pet->>'isStarter'='true' or v_pet->>'event'='starter' then
      return jsonb_build_object('ok',false,'reason','starter_not_tradeable');
    end if;
    if v_pet->>'locked'='true' then return jsonb_build_object('ok',false,'reason','pokemon_locked'); end if;
    if exists(select 1 from jsonb_array_elements(v_data->'team') e where e->>'uid'=p_pet_uid)
      or v_data #>> '{idle,pvpFaintedLeader,uid}'=p_pet_uid then
      return jsonb_build_object('ok',false,'reason','pokemon_in_team');
    end if;
    if private.market_nonnegative_int(v_pet->'azulRestUntil',9000000000000)>v_now then
      return jsonb_build_object('ok',false,'reason','pokemon_resting');
    end if;
    if exists(select 1 from public.market_listings where kind='pokemon' and pet_data->>'uid'=p_pet_uid) then
      return jsonb_build_object('ok',false,'reason','pokemon_unavailable');
    end if;
    if (select count(*) from public.market_listings where seller_id=v_uid::text and sold_at is null)>=100 then
      return jsonb_build_object('ok',false,'reason','listing_cap');
    end if;
    select left(coalesce(nullif(btrim(username),''),'Treinador'),24) into v_name from public.profiles where id=v_uid;
    insert into public.market_listings(seller_id,seller_name,kind,pet_data,qty,price,currency)
      values(v_uid::text,coalesce(v_name,'Treinador'),'pokemon',v_pet,1,p_price,p_currency) returning id into v_id;
    select coalesce(jsonb_agg(e),'[]') into v_col from jsonb_array_elements(v_col) e where e->>'uid'<>p_pet_uid;
    select coalesce(jsonb_agg(e),'[]') into v_bench from jsonb_array_elements(v_bench) e where e->>'uid'<>p_pet_uid;
    v_data := jsonb_set(v_data,'{idle,collection}',v_col,true);
    v_data := jsonb_set(v_data,'{restingBench}',v_bench,true);
    v_removed := p_pet_uid;
    v_pet := null;
  elsif p_action in ('buy','cancel') then
    if jsonb_array_length(v_col)>=500 then return jsonb_build_object('ok',false,'reason','collection_full'); end if;
    v_pet := v_listing.pet_data;
    if jsonb_typeof(v_pet) is distinct from 'object' or nullif(v_pet->>'uid','') is null then
      return jsonb_build_object('ok',false,'reason','invalid_listing');
    end if;
    if p_action='buy' then
      if v_listing.currency='gold' then
        if v_gold<v_listing.price then return jsonb_build_object('ok',false,'reason','insufficient_funds'); end if;
        v_gold := v_gold-v_listing.price;
      elsif v_listing.currency='crystal' then
        if v_crystals<v_listing.price then return jsonb_build_object('ok',false,'reason','insufficient_funds'); end if;
        v_crystals := v_crystals-v_listing.price;
      else
        if v_safira<v_listing.price then return jsonb_build_object('ok',false,'reason','insufficient_funds'); end if;
        v_safira := v_safira-v_listing.price;
      end if;
      v_pet := v_pet || jsonb_build_object('uid','bought-'||gen_random_uuid()::text,'purchasedAt',v_now,'marketListingId',v_listing.id);
      update public.market_listings set buyer_id=v_uid::text,sold_at=clock_timestamp(),updated_at=clock_timestamp() where id=v_listing.id;
    else
      -- Excluir a custódia ANTES de atualizar o save (o trigger bloqueia restaurações).
      delete from public.market_listings where id=v_listing.id;
    end if;
    if exists(select 1 from jsonb_array_elements(v_col) e where e->>'uid'=v_pet->>'uid') then
      raise exception 'market_duplicate_pokemon';
    end if;
    v_pet := v_pet || jsonb_build_object('capturedAt',coalesce(v_pet->'capturedAt',to_jsonb(v_now)));
    v_col := v_col || jsonb_build_array(v_pet);
    v_data := jsonb_set(v_data,'{idle,collection}',v_col,true);
    if not coalesce(v_data #> '{idle,caughtSpecies}','[]') @> jsonb_build_array(v_pet->>'species') then
      v_data := jsonb_set(v_data,'{idle,caughtSpecies}',coalesce(v_data #> '{idle,caughtSpecies}','[]')||jsonb_build_array(v_pet->>'species'),true);
    end if;
    if not coalesce(v_data #> '{idle,seenSpecies}','[]') @> jsonb_build_array(v_pet->>'species') then
      v_data := jsonb_set(v_data,'{idle,seenSpecies}',coalesce(v_data #> '{idle,seenSpecies}','[]')||jsonb_build_array(v_pet->>'species'),true);
    end if;
  else
    if v_listing.currency='gold' then
      if v_gold>50000000-v_listing.price then return jsonb_build_object('ok',false,'reason','balance_cap'); end if;
      v_gold := v_gold+v_listing.price;
    elsif v_listing.currency='crystal' then
      if v_crystals>1000000-v_listing.price then return jsonb_build_object('ok',false,'reason','balance_cap'); end if;
      v_crystals := v_crystals+v_listing.price;
    else
      if v_safira>1000000-v_listing.price then return jsonb_build_object('ok',false,'reason','balance_cap'); end if;
      v_safira := v_safira+v_listing.price;
    end if;
    update public.market_listings set payout_claimed=true,updated_at=clock_timestamp() where id=v_listing.id;
  end if;
  v_bank := v_bank || jsonb_build_object('gold',v_gold,'crystals',v_crystals);
  v_items := jsonb_set(v_items,'{safira_verde}',to_jsonb(v_safira),true);
  v_data := jsonb_set(v_data,'{idle,bank}',v_bank,true);
  v_data := jsonb_set(v_data,'{idle,items}',v_items,true);
  v_data := jsonb_set(v_data,'{savedAt}',to_jsonb(v_now),true);
  update public.game_saves set data=v_data,save_version=save_version+1 where user_id=v_uid returning save_version into v_version;
  return jsonb_build_object('ok',true,'server_version',v_version,'listing_id',v_id,
    'removed_uid',v_removed,'pet_data',v_pet,'gold',v_gold,'crystals',v_crystals,'safira',v_safira);
end;
$$;
revoke all on function public.get_marketplace() from public, anon;
revoke all on function public.market_pokemon(text,bigint,uuid,text,bigint,text) from public, anon;
revoke all on function public.market_list_item(text,integer,bigint,text,bigint) from public, anon;
grant execute on function public.get_marketplace() to authenticated;
grant execute on function public.market_pokemon(text,bigint,uuid,text,bigint,text) to authenticated;
grant execute on function public.market_list_item(text,integer,bigint,text,bigint) to authenticated;
