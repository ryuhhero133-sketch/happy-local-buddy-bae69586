-- Falha também entrega 1 Poção e 1 Baga (comida Pokémon), além da Pokébola.
create or replace function public.nevezinha_event_spin()
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  _uid uuid := auth.uid();
  _today date;
  _state public.nevezinha_event_state%rowtype;
  _snapshot jsonb;
  _data jsonb;
  _version bigint;
  _stamp bigint;
  _shots_left integer;
  _fail boolean := false;
  _roll numeric;
  _outcome text;
  _stone text;
  _items jsonb;
  _label text;
  _rarity text;
  _video text;
  _key text;
  _qty integer;
begin
  if _uid is null then raise exception 'unauthenticated'; end if;
  _today := private.nevezinha_today();
  insert into public.nevezinha_event_state (user_id) values (_uid) on conflict do nothing;
  select * into _state from public.nevezinha_event_state where user_id = _uid for update;
  if _state.last_claim_day is distinct from _today then
    update public.nevezinha_event_state
      set tickets = 3, last_claim_day = _today, last_result = null, updated_at = now()
      where user_id = _uid returning * into _state;
  end if;
  if _state.tickets < 1 then
    return jsonb_build_object('ok', false, 'reason', 'no_ticket', 'tickets', 0,
      'next_ticket_at', private.nevezinha_next_ticket());
  end if;
  select data, save_version into _snapshot, _version
    from public.game_saves where user_id = _uid for update;
  if not found or jsonb_typeof(_snapshot -> 'idle') is distinct from 'object' then
    return jsonb_build_object('ok', false, 'reason', 'save_not_ready');
  end if;

  _shots_left := _state.tickets;
  -- Os dois primeiros tiros podem falhar; o terceiro é sempre um prêmio.
  if _shots_left > 1 and random() < 0.70 then
    _fail := true;
    _outcome := 'fail';
    _items := jsonb_build_object('pokeball', 1, 'potion', 1, 'berry', 1);
    _label := 'Falhou'; _rarity := 'comum'; _video := 'fail';
  else
    _roll := random();
    if _state.pity >= 19 then _outcome := 'doll';
    elsif _roll < 0.05 then _outcome := 'doll';
    elsif _roll < 0.30 then _outcome := 'stone';
    elsif _roll < 0.45 then _outcome := 'ultra';
    elsif _roll < 0.75 then _outcome := 'items';
    else _outcome := 'food';
    end if;

    if _outcome = 'doll' then
      _items := jsonb_build_object('nevezinha_doll', 1);
      _label := 'Boneco da Nevezinha'; _rarity := 'lendario'; _video := 'show';
    elsif _outcome = 'stone' then
      _stone := (array['stone_grass','stone_fire','stone_water','stone_electric','stone_dark','stone_dragon'])
        [1 + floor(random() * 6)::int];
      _items := jsonb_build_object(_stone, 1 + floor(random() * 3)::int);
      _label := 'Stone Elemental'; _rarity := 'raro'; _video := 'stone';
    elsif _outcome = 'ultra' then
      _items := jsonb_build_object('ultraball', 1 + floor(random() * 3)::int);
      _label := 'Ultra Ball'; _rarity := 'epico'; _video := 'items';
    elsif _outcome = 'items' then
      _items := jsonb_build_object(
        'pokeball', 5 + floor(random() * 8)::int,
        'greatball', 1 + floor(random() * 3)::int);
      _label := 'Pokébolas'; _rarity := 'comum'; _video := 'items';
    else
      _items := jsonb_build_object(
        'berry', 2 + floor(random() * 4)::int,
        'refeicao', 1);
      _label := 'Comida Pokémon'; _rarity := 'comum'; _video := 'items';
    end if;
  end if;

  _data := jsonb_set(_snapshot, '{idle,items}',
    coalesce(_snapshot #> '{idle,items}', '{}'::jsonb), true);
  for _key, _qty in select e.key, (e.value #>> '{}')::int from jsonb_each(_items) e loop
    _data := jsonb_set(_data, array['idle','items',_key],
      to_jsonb(coalesce((_data #>> array['idle','items',_key])::int, 0) + _qty), true);
  end loop;
  _stamp := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  _data := jsonb_set(_data, '{savedAt}', to_jsonb(_stamp), true);
  _data := jsonb_set(_data, '{idle,savedAt}', to_jsonb(_stamp), true);
  update public.game_saves set data = _data, save_version = save_version + 1, updated_at = now()
    where user_id = _uid returning save_version into _version;

  update public.nevezinha_event_state
    set tickets = _state.tickets - 1,
      pity = case when _outcome = 'doll' then 0 else least(19, _state.pity + 1) end,
      last_result = jsonb_build_object(
        'kind', _outcome, 'label', _label, 'rarity', _rarity,
        'items', _items, 'video', _video, 'at', _stamp),
      last_spin_at = now(), updated_at = now()
    where user_id = _uid returning * into _state;

  return jsonb_build_object(
    'ok', true,
    'reward', jsonb_build_object(
      'kind', _outcome, 'label', _label, 'rarity', _rarity,
      'items', _items, 'video', _video),
    'snapshot', _data,
    'server_version', _version,
    'tickets', _state.tickets,
    'pity', _state.pity,
    'next_ticket_at', private.nevezinha_next_ticket()
  );
end;
$$;

revoke all on function public.nevezinha_event_status(), public.nevezinha_event_spin()
  from public, anon;
grant execute on function public.nevezinha_event_status(), public.nevezinha_event_spin()
  to authenticated;
