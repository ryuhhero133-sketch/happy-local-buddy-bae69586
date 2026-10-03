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
  _pet_uid text;
  _pet jsonb;
  _prior jsonb;
  _tier text;
  _r float;
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

  -- idempotência
  begin
    select result into _prior from public.action_receipts
      where action_id = p_action_id and user_id = _uid;
    if found then
      return jsonb_build_object('ok', true, 'duplicate', true, 'pet', _prior -> 'pet');
    end if;
  exception when others then null;
  end;

  -- saldo de ovos com lastro
  begin
    select coalesce(qty, 0) into _have from public.egg_ledger
      where user_id = _uid and egg_item = p_egg;
  exception when others then _have := 0;
  end;
  _have := coalesce(_have, 0);

  if _have < 1 then
    declare _blob_today int := 0;
    begin
      select count(*) into _blob_today from public.action_receipts
        where user_id = _uid and action_type = 'hatch_egg_blob'
          and created_at > now() - interval '1 day';
    exception when others then _blob_today := 0;
    end;
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

  -- roll server-side
  begin
    if p_egg in ('black_mitic_egg', 'black_mitic_egg_plus') then
      if random() < 0.35 then
        _species := case _el when 'fire' then 'moltres' when 'electric' then 'zapdos' when 'water' then 'articuno' else null end;
      end if;
      if _species is null then
        _species := case _el
          when 'grass' then 'venusaur' when 'fire' then 'charizard'
          when 'water' then 'blastoise' when 'electric' then 'raichu'
          when 'dark' then 'gengar' when 'dragon' then 'dragonite' end;
      end if;
      _rarity := 'mythic_shiny';
      _level := 100;
      select array_agg(t order by random()) into _traits from (
        select unnest(array['alpha','prismatico','ceifador','eterno','dourado',
        'eletrizado','precioso','prodigio','mistico','esquivo','vampirico',
        'colosso','sabio','curador','venenoso','brutal','guardiao']) as t
        order by random() limit 7) s;
    elsif p_egg = 'emerald_egg' then
      _r := random();
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
    else
      _species := regexp_replace(p_egg, '^egg_', '');
      select rarity into _rarity from public.species_rules where species = _species;
      if not found or _rarity is null then return jsonb_build_object('ok', false, 'reason', 'unknown_species'); end if;
      _level := 1;
      _traits := '{}';
    end if;
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'roll_error');
  end;

  _pet_uid := 'srv-' || replace(gen_random_uuid()::text, '-', '');
  begin
    insert into public.player_pokemon_registry (user_id, pet_uid, species, rarity, traits, level, xp, origin)
      values (_uid, _pet_uid, _species, coalesce(_rarity,'common'), to_jsonb(coalesce(_traits,'{}')),
        coalesce(_level,1), 0, 'hatch_' || case when p_egg like '%emerald%' then 'emerald' when p_egg like '%shop%' or p_egg like 'egg\_%' then 'shop' else 'black' end);
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'registry_error');
  end;

  _pet := jsonb_build_object('uid', _pet_uid, 'species', _species, 'level', coalesce(_level,1),
    'xp', 0, 'rarity', coalesce(_rarity,'common'), 'traits', to_jsonb(coalesce(_traits,'{}')),
    'capturedAt', floor(extract(epoch from now()) * 1000));

  begin
    insert into public.action_receipts (action_id, user_id, action_type, ref, result)
      values (p_action_id, _uid,
        case when _blob_used then 'hatch_egg_blob' else 'hatch_egg' end,
        p_egg || ':' || _el,
        jsonb_build_object('pet', _pet));
  exception when others then null;
  end;

  return jsonb_build_object('ok', true, 'pet', _pet);
end;
$$;
