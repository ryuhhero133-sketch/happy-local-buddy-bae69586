-- Publica a edição de mapas do dono como padrão para TODAS as contas.
-- O ARV fica fora do pacote (foi removido do jogo). A caverna BOBO MMM entra
-- com os matos salvos e spawns fixos, além da zona de mato adicionada no código.
create table public.map_editor_published (
  id boolean primary key default true check (id),
  data jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.map_editor_published enable row level security;
revoke all on public.map_editor_published from public, anon, authenticated;

create or replace function public.map_editor_published_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select data from public.map_editor_published where id), '{}'::jsonb);
$$;

-- Só o dono pode republicar a própria edição (usado por um botão futuro do editor).
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
    'teleports', coalesce(data -> 'teleports', '{}'::jsonb) - 'arv'
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

revoke all on function public.map_editor_published_data(), public.publish_map_editor_defaults()
  from public, anon;
grant execute on function public.map_editor_published_data()
  to authenticated;
grant execute on function public.publish_map_editor_defaults()
  to authenticated;

-- Primeira publicação (a conta do dono já tem a edição mais recente).
insert into public.map_editor_published (id, data, version)
select
  true,
  jsonb_build_object(
    'objects', coalesce(data -> 'objects', '{}'::jsonb) - 'arv',
    'spawns', (
      coalesce(data -> 'spawns', '{}'::jsonb) - 'arv'
    ) || jsonb_build_object(
      'bobo_mmmm', jsonb_build_array(
        jsonb_build_object('id', 1795700000000001, 'x', 580, 'y', 240,
          'species', 'zubat', 'level', 6, 'rarity', 'common', 'radius', 55, 'respawnSeconds', 50),
        jsonb_build_object('id', 1795700000000002, 'x', 610, 'y', 240,
          'species', 'geodude', 'level', 7, 'rarity', 'uncommon', 'radius', 55, 'respawnSeconds', 60),
        jsonb_build_object('id', 1795700000000003, 'x', 590, 'y', 265,
          'species', 'machop', 'level', 8, 'rarity', 'uncommon', 'radius', 55, 'respawnSeconds', 70)
      )
    ),
    'teleports', coalesce(data -> 'teleports', '{}'::jsonb) - 'arv'
  ),
  1
from public.map_editor_saves
where user_id = '16d47359-8fbb-4a81-9596-918b2d53b75b'::uuid
on conflict (id) do update
  set data = excluded.data,
      version = 1,
      updated_at = now();
