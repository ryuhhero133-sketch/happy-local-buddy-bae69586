-- Teste do produto 20 Poções por 1 Cristal Vermelho. Revertido no fim.
do $test$
declare
  uid constant uuid := '16d47359-8fbb-4a81-9596-918b2d53b75b';
  original_data jsonb;
  original_version bigint;
  before_potion bigint;
  before_red bigint;
  seeded_data jsonb;
  seeded_version bigint;
  response jsonb;
  after_items jsonb;
begin
  select data, save_version into original_data, original_version
    from public.game_saves where user_id = uid;
  if original_data is null then raise exception 'Conta de teste sem save'; end if;
  before_potion := coalesce((original_data #>> '{idle,items,potion}')::bigint, 0);
  before_red := coalesce((original_data #>> '{idle,items,cr_red}')::bigint, 0);

  begin
    perform set_config('request.jwt.claim.sub', uid::text, true);
    update public.game_saves
      set data = jsonb_set(data, '{idle,items,cr_red}', to_jsonb(before_red + 1), true),
          save_version = save_version + 1
      where user_id = uid
      returning data, save_version into seeded_data, seeded_version;
    response := public.buy_red_crystal_cash_product('potion_20', seeded_version);
    if not (response->>'ok')::boolean then raise exception 'Compra falhou: %', response; end if;
    if response->>'item_id' <> 'potion' then raise exception 'Item errado: %', response; end if;
    if (response->>'item_qty')::bigint <> before_potion + 20 then
      raise exception 'Quantidade de Poções errada: %', response;
    end if;
    if (response->>'red_crystals')::bigint <> before_red then
      raise exception 'Cristal Vermelho não foi debitado corretamente: %', response;
    end if;
    select data -> 'idle' -> 'items' into after_items
      from public.game_saves where user_id = uid;
    if (after_items->>'potion')::bigint <> before_potion + 20 then
      raise exception 'Poções não creditadas no save';
    end if;
    raise sqlstate 'RP001' using message = 'rollback do teste';
  exception when sqlstate 'RP001' then null;
  end;

  if (select data from public.game_saves where user_id = uid) is distinct from original_data
    or (select save_version from public.game_saves where user_id = uid) <> original_version then
    raise exception 'O teste não reverteu o save';
  end if;
end;
$test$;
select 'PASS: 20 Poções por 1 Cristal Vermelho e rollback' as result;
