-- Teste do pacote único de 200 Poções. Roda revertido, inclusive no sucesso.
do $test$
declare
  uid constant uuid := '16d47359-8fbb-4a81-9596-918b2d53b75b';
  original_data jsonb;
  original_version bigint;
  before_potion bigint;
  first jsonb;
  second jsonb;
  after_data jsonb;
  after_potion bigint;
  after_version bigint;
begin
  if has_table_privilege('authenticated', 'private.welcome_potion_grants', 'SELECT')
    or has_function_privilege('anon', 'public.claim_welcome_potions()', 'EXECUTE') then
    raise exception 'Pacote de boas-vindas aberto para acesso direto';
  end if;
  select data, save_version into original_data, original_version
    from public.game_saves where user_id = uid;
  if original_data is null then raise exception 'Conta de teste sem save'; end if;
  before_potion := coalesce((original_data #>> '{idle,items,potion}')::bigint, 0);

  begin
    perform set_config('request.jwt.claim.sub', uid::text, true);
    delete from private.welcome_potion_grants where user_id = uid;
    first := public.claim_welcome_potions();
    if not (first->>'ok')::boolean then raise exception 'Primeiro pacote falhou: %', first; end if;
    if (first->>'granted')::int <> 200 then raise exception 'Quantidade do pacote incorreta'; end if;
    select data, save_version into after_data, after_version
      from public.game_saves where user_id = uid;
    after_potion := coalesce((after_data #>> '{idle,items,potion}')::bigint, 0);
    if after_potion <> before_potion + 200 then
      raise exception 'Poções não creditadas: antes %, depois %', before_potion, after_potion;
    end if;
    if after_version <> original_version + 1 then raise exception 'Versão do save não avançou'; end if;

    second := public.claim_welcome_potions();
    if (second->>'ok')::boolean or second->>'reason' <> 'already_granted' then
      raise exception 'Pacote foi concedido duas vezes';
    end if;
    if (select save_version from public.game_saves where user_id = uid) <> after_version then
      raise exception 'Segunda chamada alterou o save';
    end if;

    raise sqlstate 'WP001' using message = 'rollback do teste';
  exception when sqlstate 'WP001' then null;
  end;

  if (select data from public.game_saves where user_id = uid) is distinct from original_data
    or (select save_version from public.game_saves where user_id = uid) <> original_version then
    raise exception 'O teste não reverteu o save';
  end if;
end;
$test$;
select 'PASS: pacote de 200 Poções uma vez por conta e rollback' as result;
