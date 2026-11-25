-- Teste da publicação global dos mapas. Roda em subtransação revertida:
-- nenhuma conta, mapa ou save é alterado de verdade.
do $test$
declare
  owner_uid constant uuid := '16d47359-8fbb-4a81-9596-918b2d53b75b';
  data jsonb;
  blocked boolean := false;
begin
  if has_table_privilege('authenticated', 'public.map_editor_published', 'SELECT')
    or has_function_privilege('anon', 'public.map_editor_published_data()', 'EXECUTE') then
    raise exception 'Publicação de mapas aberta para acesso direto';
  end if;
  perform set_config('request.jwt.claim.sub', owner_uid::text, true);
  data := public.map_editor_published_data();
  if jsonb_typeof(data -> 'objects') is distinct from 'object' then
    raise exception 'Publicação sem objects';
  end if;
  if (data -> 'objects') ? 'arv' then
    raise exception 'ARV ainda está publicado';
  end if;
  if jsonb_array_length(coalesce(data -> 'objects' -> 'bobo_mmmm', '[]'::jsonb)) < 30 then
    raise exception 'Caverna BOBO MMM sem os matos publicados';
  end if;
  if jsonb_array_length(coalesce(data -> 'spawns' -> 'bobo_mmmm', '[]'::jsonb)) < 3 then
    raise exception 'Caverna BOBO MMM sem spawns publicados';
  end if;
  if not ((data -> 'spawns' -> 'bobo_mmmm') @> '[{"species":"zubat"}]'::jsonb) then
    raise exception 'Spawn de zubat ausente na caverna';
  end if;
  if not (data -> 'teleports' ? 'bobo_mmmm') then
    raise exception 'Teleportes da caverna não foram publicados';
  end if;

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  begin
    perform public.publish_map_editor_defaults();
  exception when others then
    blocked := true;
  end;
  if not blocked then
    raise exception 'Conta comum conseguiu republicar os mapas';
  end if;
end;
$test$;
select 'PASS: publicação global, caverna e bloqueio do dono' as result;
