-- Inclui os treinadores/bots visuais do editor na publicação global.
-- A estrutura fica em data.bots (por mapa) e é lida por todos os clientes.
create or replace function public.publish_map_editor_defaults()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  _data jsonb;
  _version bigint;
begin
  if _uid is distinct from '16d47359-8fbb-4a81-9596-918b2d53b75b'::uuid then
    raise exception 'not_owner';
  end if;
  select jsonb_build_object(
    'objects', coalesce(data -> 'objects', '{}'::jsonb) - 'arv',
    'spawns', coalesce(data -> 'spawns', '{}'::jsonb) - 'arv',
    'teleports', coalesce(data -> 'teleports', '{}'::jsonb) - 'arv',
    'bots', coalesce(data -> 'bots', '{}'::jsonb) - 'arv'
  ) into _data
  from public.map_editor_saves
  where user_id = _uid;
  if _data is null then raise exception 'no_map_editor_save'; end if;
  insert into public.map_editor_published (id, data, version, updated_at)
  values (true, _data, 1, now())
  on conflict (id) do update
    set data = excluded.data,
        version = public.map_editor_published.version + 1,
        updated_at = now()
  returning version into _version;
  return jsonb_build_object('ok', true, 'version', _version);
end;
$$;
revoke all on function public.publish_map_editor_defaults() from public, anon;
grant execute on function public.publish_map_editor_defaults() to authenticated;
