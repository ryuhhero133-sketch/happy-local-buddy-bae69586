-- Teste administrativo do evento da Nevezinha. Tudo roda em subtransação
-- revertida, inclusive no sucesso: nenhum ticket, item ou save real muda.
do $test$
declare
  uid constant uuid := '16d47359-8fbb-4a81-9596-918b2d53b75b';
  original_data jsonb;
  original_version bigint;
  item_before jsonb;
  snapshot jsonb;
  snapshot_items jsonb;
  version bigint;
  state jsonb;
  spin jsonb;
  spin_again jsonb;
  key text;
  qty integer;
  applied integer;
begin
  select data, save_version into original_data, original_version from public.game_saves where user_id = uid;
  if original_data is null then raise exception 'Conta de teste sem save'; end if;
  if has_table_privilege('authenticated', 'public.nevezinha_event_state', 'SELECT')
    or has_table_privilege('authenticated', 'public.nevezinha_event_state', 'UPDATE')
    or has_function_privilege('anon', 'public.nevezinha_event_spin()', 'EXECUTE') then
    raise exception 'Permissões diretas do evento abertas';
  end if;
  begin
    perform set_config('request.jwt.claim.sub', uid::text, true);
    delete from public.nevezinha_event_state where user_id = uid;
    state := public.nevezinha_event_status();
    if (state->>'tickets')::int <> 3 then raise exception 'Ticket diário não concedeu 3 tiros'; end if;
    item_before := original_data #> '{idle,items}';

    spin := public.nevezinha_event_spin();
    if not (spin->>'ok')::boolean then raise exception 'Tiro 1 falhou: %', spin; end if;
    if (spin->>'tickets')::int <> 2 then raise exception 'Tiro 1 não consumiu 1 de 3'; end if;
    select data, save_version into snapshot, version from public.game_saves where user_id = uid;
    snapshot_items := snapshot #> '{idle,items}';
    if version <> original_version + 1 then raise exception 'Save do tiro 1 não atualizou'; end if;
    for key, qty in select e.key, (e.value #>> '{}')::int from jsonb_each(spin #> '{reward,items}') e loop
      if coalesce((snapshot_items->>key)::int, 0) <> coalesce((item_before->>key)::int, 0) + qty then
        raise exception 'Tiro 1 não creditou % corretamente', key;
      end if;
    end loop;
    if spin #>> '{reward,kind}' = 'fail' then
      select count(*)::int, coalesce(sum((e.value #>> '{}')::int), 0) into applied, qty
        from jsonb_each(spin #> '{reward,items}') e;
      if applied <> 3 or qty <> 3
        or not ((spin #> '{reward,items}') ? 'pokeball')
        or not ((spin #> '{reward,items}') ? 'potion')
        or not ((spin #> '{reward,items}') ? 'berry') then
        raise exception 'Falha deveria dar Pokébola + Poção + Baga';
      end if;
    end if;
    item_before := snapshot_items;

    spin := public.nevezinha_event_spin();
    if not (spin->>'ok')::boolean or (spin->>'tickets')::int <> 1 then raise exception 'Tiro 2 inválido'; end if;
    select data into snapshot from public.game_saves where user_id = uid;
    snapshot_items := snapshot #> '{idle,items}';
    for key, qty in select e.key, (e.value #>> '{}')::int from jsonb_each(spin #> '{reward,items}') e loop
      if coalesce((snapshot_items->>key)::int, 0) <> coalesce((item_before->>key)::int, 0) + qty then
        raise exception 'Tiro 2 não creditou % corretamente', key;
      end if;
    end loop;
    item_before := snapshot_items;

    spin := public.nevezinha_event_spin();
    if not (spin->>'ok')::boolean or (spin->>'tickets')::int <> 0 then raise exception 'Tiro 3 inválido'; end if;
    if spin #>> '{reward,kind}' = 'fail' then raise exception 'Tiro 3 não pode falhar'; end if;
    if spin #> '{reward,items}' is null then raise exception 'Tiro 3 sem prêmio'; end if;
    select data into snapshot from public.game_saves where user_id = uid;
    snapshot_items := snapshot #> '{idle,items}';
    for key, qty in select e.key, (e.value #>> '{}')::int from jsonb_each(spin #> '{reward,items}') e loop
      if coalesce((snapshot_items->>key)::int, 0) <> coalesce((item_before->>key)::int, 0) + qty then
        raise exception 'Tiro 3 não creditou % corretamente', key;
      end if;
    end loop;

    spin_again := public.nevezinha_event_spin();
    if (spin_again->>'ok')::boolean or spin_again->>'reason' <> 'no_ticket' then
      raise exception 'Foi possível dar um quarto tiro';
    end if;
    state := public.nevezinha_event_status();
    if state #>> '{last_result,kind}' is distinct from spin #>> '{reward,kind}'
      or state #> '{last_result,items}' is distinct from spin #> '{reward,items}' then
      raise exception 'F5 não mantém o último resultado';
    end if;

    update public.nevezinha_event_state
      set last_claim_day = private.nevezinha_today() - 1, tickets = 0, last_result = null
      where user_id = uid;
    state := public.nevezinha_event_status();
    if (state->>'tickets')::int <> 3 then raise exception 'Novo dia não liberou 3 tiros'; end if;
    if state->'last_result' is distinct from 'null'::jsonb then raise exception 'Novo dia não limpou o último prêmio'; end if;

    update public.nevezinha_event_state set tickets = 1, pity = 19 where user_id = uid;
    spin := public.nevezinha_event_spin();
    if spin #>> '{reward,kind}' <> 'doll' or not ((spin #> '{reward,items}') ? 'nevezinha_doll') then
      raise exception 'Garantia de 20 tiros não entregou o boneco';
    end if;
    state := public.nevezinha_event_status();
    if (state->>'pity_max')::int <> 20 or (state->>'pity')::int <> 0 then
      raise exception 'Pity não reiniciou';
    end if;

    raise sqlstate 'NV001' using message = 'rollback do teste, inclusive no sucesso';
  exception when sqlstate 'NV001' then null;
  end;
  if (select data from public.game_saves where user_id = uid) is distinct from original_data
    or (select save_version from public.game_saves where user_id = uid) <> original_version then
    raise exception 'O teste não reverteu o save';
  end if;
end;
$test$;
select 'PASS: 3 tiros, falha com Pokébola+Poção+Baga, 3º garantido, F5, novo dia, pity e rollback' as result;
