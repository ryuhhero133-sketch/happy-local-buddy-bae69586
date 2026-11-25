-- Execução administrativa. Todos os testes com conta real ficam numa
-- SUBTRANSAÇÃO revertida inclusive no sucesso. Nenhum reset é efetivado.
do $test$
declare
  lv integer;
  expected integer;
  original jsonb;
  transformed jsonb;
  result jsonb;
  progress jsonb;
  uid constant uuid := '16d47359-8fbb-4a81-9596-918b2d53b75b';
  i integer;
begin
  if (select enabled from private.emerald_journey_config where id) then
    raise exception 'A jornada deveria continuar desligada para o público';
  end if;
  if has_table_privilege('authenticated','public.emerald_journey_progress','INSERT')
    or has_table_privilege('authenticated','public.emerald_journey_progress','UPDATE')
    or has_function_privilege('anon','public.emerald_journey_advance(text,integer)','EXECUTE') then
    raise exception 'Permissões da jornada abertas indevidamente';
  end if;
  foreach lv in array array[1,28,99,100,149,150,190,199,200,299,300,400,1000] loop
    expected := case when lv>=300 then 4 when lv>=150 then 2 when lv>=100 then 1 else 0 end;
    original := jsonb_build_object(
      'idle',jsonb_build_object('trainerLevel',lv,'trainerXp',500,'trainerStars',1,
        'bank',jsonb_build_object('gold',12345,'crystals',42),
        'items',jsonb_build_object('potion',20,'black_mitic_egg',1),
        'collection',jsonb_build_array(jsonb_build_object('uid','same','level',lv,'xp',999,
          'legacyStars',1,'traits',jsonb_build_array('trait'),'rarity','mythic','event','ancestral')),
        'isVip',true,'craftPoints',120),
      'team',jsonb_build_array(jsonb_build_object('uid','same','level',lv,'xp',999,'rebirths',1,'legacyStars',1)),
      'restingBench',jsonb_build_array(jsonb_build_object('uid','bench','level',lv,'xp',222)));
    transformed := private.journey_reset_snapshot(original);
    if transformed#>>'{idle,trainerLevel}' <> '1' or transformed#>>'{idle,trainerXp}' <> '0'
      or private.journey_int(transformed#>'{idle,trainerStars}') <> 1+expected
      or transformed#>>'{team,0,level}' <> '1' or transformed#>>'{team,0,xp}' <> '0'
      or private.journey_int(transformed#>'{team,0,legacyStars}') <> 1+expected
      or transformed#>>'{team,0,rebirths}' <> '1'
      or transformed#>>'{restingBench,0,level}' <> '1'
      or transformed#>>'{idle,collection,0,level}' <> '1'
      or transformed#>>'{idle,collection,0,legacyStars}' <> transformed#>>'{team,0,legacyStars}'
      or transformed#>'{idle,bank}' <> original#>'{idle,bank}'
      or transformed#>'{idle,items}' <> original#>'{idle,items}'
      or transformed#>'{idle,collection,0,traits}' <> original#>'{idle,collection,0,traits}'
      or transformed#>'{idle,isVip}' <> original#>'{idle,isVip}'
      or transformed#>'{idle,craftPoints}' <> original#>'{idle,craftPoints}' then
      raise exception 'Conversão incorreta no nível %',lv;
    end if;
  end loop;
  transformed := private.journey_reset_snapshot('{"idle":{"trainerLevel":100,"collection":[{"uid":"same","level":400}]},"team":[{"uid":"same","level":100}]}');
  if transformed#>>'{team,0,legacyStars}' <> '4' or transformed#>>'{idle,collection,0,legacyStars}' <> '4' then
    raise exception 'UID duplicado recebeu recompensas inconsistentes';
  end if;
  select data into strict original from public.game_saves where user_id=uid;
  begin
    perform set_config('request.jwt.claim.sub',uid::text,true);
    progress := public.emerald_journey_status(true);
    if not (progress->>'preview')::boolean or progress->>'cursor' <> '0' then raise exception 'Prévia incorreta'; end if;
    result := public.emerald_journey_advance(progress->>'version',10);
    if result->>'cursor' <> '0' then raise exception 'Foi possível pular falas'; end if;
    result := public.emerald_journey_advance(progress->>'version',0);
    result := public.emerald_journey_advance(progress->>'version',0);
    if result->>'cursor' <> '1' then raise exception 'Replay duplicou avanço'; end if;
    progress := public.emerald_journey_status(false);
    if progress->>'cursor' <> '1' then raise exception 'F5 perdeu progresso'; end if;
    for i in 1..52 loop result := public.emerald_journey_advance(progress->>'version',i); end loop;
    if not (result->>'completed')::boolean
      or result#>'{snapshot,idle,trainerLevel}' is distinct from original#>'{idle,trainerLevel}'
      or result#>'{snapshot,team}' is distinct from original->'team' then raise exception 'Prévia alterou níveis'; end if;
    update private.emerald_journey_config set enabled=true where id;
    progress := public.emerald_journey_status(false);
    if progress->>'cursor' <> '0' or (progress->>'preview')::boolean then raise exception 'Prévia pulou jornada oficial'; end if;
    for i in 0..52 loop result := public.emerald_journey_advance(progress->>'version',i); end loop;
    transformed := result->'snapshot';
    if transformed#>>'{idle,trainerLevel}' <> '1' or transformed#>>'{idle,trainerXp}' <> '0'
      or transformed#>>'{idle,currentMap}' <> 'emerald'
      or transformed#>'{idle,bank}' is distinct from original#>'{idle,bank}'
      or transformed#>'{idle,items}' is distinct from original#>'{idle,items}' then
      raise exception 'Reset oficial alterou outros recursos';
    end if;
    if exists(select 1 from jsonb_array_elements(coalesce(transformed->'team','[]')) p where p->>'level'<>'1')
      or exists(select 1 from jsonb_array_elements(coalesce(transformed#>'{idle,collection}','[]')) p where p->>'level'<>'1')
      or exists(select 1 from public.player_pokemon where user_id=uid and (level<>1 or xp<>0)) then
      raise exception 'Algum Pokémon não foi convertido';
    end if;
    result := public.emerald_journey_advance(progress->>'version',52);
    if not (result->>'completed')::boolean or (select data from public.game_saves where user_id=uid) <> transformed then
      raise exception 'Repetir conclusão reaplicou reset/recompensas';
    end if;
    begin
      update public.game_saves set data=original where user_id=uid;
      raise exception 'Save antigo foi aceito depois do reset';
    exception when check_violation then null; end;
    if not exists(select 1 from private.emerald_journey_backups where user_id=uid and version=progress->>'version') then
      raise exception 'Backup integral não foi criado';
    end if;
    raise sqlstate 'JZ001' using message='rollback do teste, inclusive no sucesso';
  exception when sqlstate 'JZ001' then null;
  end;
  if (select enabled from private.emerald_journey_config where id)
    or (select data from public.game_saves where user_id=uid) is distinct from original then
    raise exception 'Teste não reverteu integralmente';
  end if;
end;
$test$;
select 'PASS: faixas, preservação, progresso, replay, reset único e rollback completo' as result;
