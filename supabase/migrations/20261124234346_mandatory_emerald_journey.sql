-- Preparada, mas NÃO liberada: manutenção/HUD/mapas privados não mudam.
-- Ativar somente junto da liberação oficial, por operação administrativa.
create table private.emerald_journey_config (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  version text not null default 'emerald_journey_v1',
  page_count integer not null default 53 check (page_count = 53)
);
alter table private.emerald_journey_config enable row level security;
revoke all on private.emerald_journey_config from public, anon, authenticated;
insert into private.emerald_journey_config (id) values (true);

create table public.emerald_journey_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null,
  cursor integer not null default 0 check (cursor between 0 and 53),
  completed_at timestamptz,
  reset_applied_at timestamptz,
  previous_trainer_level integer,
  awarded_trainer_stars integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, version)
);
alter table public.emerald_journey_progress enable row level security;
revoke all on public.emerald_journey_progress from public, anon, authenticated;
grant select on public.emerald_journey_progress to authenticated;
create policy journey_read_own on public.emerald_journey_progress for select to authenticated
  using (user_id = (select auth.uid()));

-- Snapshot integral para recuperação administrativa; nunca exposto pelo cliente.
create table private.emerald_journey_backups (
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null,
  snapshot jsonb not null,
  normalized_trainer jsonb,
  normalized_pokemon jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, version)
);
alter table private.emerald_journey_backups enable row level security;
revoke all on private.emerald_journey_backups from public, anon, authenticated;

create function private.journey_int(value jsonb, fallback integer default 0)
returns integer language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(value) = 'number'
    then least(1000000, greatest(0, floor((value #>> '{}')::numeric)))::integer else fallback end;
$$;
create function private.journey_stars(level integer)
returns integer language sql immutable set search_path = '' as $$
  select case when level >= 300 then 4 when level >= 150 then 2 when level >= 100 then 1 else 0 end;
$$;

create function private.journey_reset_snapshot(snapshot jsonb, level_hints jsonb default '{}'::jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  result jsonb := snapshot;
  idle jsonb := coalesce(snapshot->'idle', '{}'::jsonb);
  pets jsonb := '[]'::jsonb;
  canonical jsonb := '{}'::jsonb;
  container text;
  records jsonb;
  trainer_level integer;
begin
  -- Um UID pode aparecer no líder, banco e coleção: recompensa UMA vez e
  -- espelha o mesmo resultado nas cópias, usando o maior nível desse UID.
  foreach container in array array['team','restingBench','party','activeTeam','collection'] loop
    if jsonb_typeof(snapshot->container) = 'array' then pets := pets || (snapshot->container); end if;
  end loop;
  if jsonb_typeof(idle->'collection') = 'array' then pets := pets || (idle->'collection'); end if;
  select coalesce(jsonb_object_agg(uid, jsonb_build_object(
    'legacyStars', least(7, old_stars + private.journey_stars(greatest(level,
      private.journey_int(level_hints->'pokemon'->uid)))),
    'rebirths', rebirths)), '{}'::jsonb)
  into canonical from (
    select coalesce(p->>'uid', p->>'id') uid,
      max(private.journey_int(p->'level',1)) level,
      max(private.journey_int(p->'legacyStars')) old_stars,
      max(private.journey_int(p->'rebirths')) rebirths
    from jsonb_array_elements(pets) p where jsonb_typeof(p)='object'
      and coalesce(p->>'uid',p->>'id','') <> ''
    group by coalesce(p->>'uid',p->>'id')
  ) levels;
  foreach container in array array['team','restingBench','party','activeTeam','collection','idle_collection'] loop
    records := case when container='idle_collection' then idle->'collection' else snapshot->container end;
    if jsonb_typeof(records) is distinct from 'array' then continue; end if;
    select coalesce(jsonb_agg(case when jsonb_typeof(p)='object' then
      p || coalesce(canonical->coalesce(p->>'uid',p->>'id'), jsonb_build_object(
        'legacyStars',least(7,private.journey_int(p->'legacyStars') + private.journey_stars(private.journey_int(p->'level',1)))))
        || '{"level":1,"xp":0}'::jsonb
      else p end order by ordinal), '[]'::jsonb)
    into records from jsonb_array_elements(records) with ordinality a(p,ordinal);
    if container='idle_collection' then idle := jsonb_set(idle,'{collection}',records);
    else result := jsonb_set(result,array[container],records); end if;
  end loop;
  trainer_level := greatest(private.journey_int(idle->'trainerLevel',1),
    private.journey_int(idle->'trainer_level',1), private.journey_int(level_hints->'trainerLevel',1));
  idle := idle || jsonb_build_object('trainerLevel',1,'trainerXp',0,
    'trainerStars',least(7,private.journey_int(idle->'trainerStars') + private.journey_stars(trainer_level)));
  if idle ? 'trainer_level' then idle := jsonb_set(idle,'{trainer_level}','1'); end if;
  if idle ? 'trainer_xp' then idle := jsonb_set(idle,'{trainer_xp}','0'); end if;
  return jsonb_set(result,'{idle}',idle,true);
end;
$$;

create function public.emerald_journey_status(p_restart_preview boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  config private.emerald_journey_config%rowtype;
  progress public.emerald_journey_progress%rowtype;
  event_version text;
begin
  if uid is null then raise exception 'unauthenticated'; end if;
  select * into strict config from private.emerald_journey_config where id;
  if not config.enabled and uid <> '16d47359-8fbb-4a81-9596-918b2d53b75b'::uuid then
    return jsonb_build_object('required',false,'preview',false);
  end if;
  event_version := case when config.enabled then config.version else config.version || '_preview' end;
  insert into public.emerald_journey_progress (user_id,version) values(uid,event_version) on conflict do nothing;
  if p_restart_preview and not config.enabled and uid='16d47359-8fbb-4a81-9596-918b2d53b75b'::uuid then
    update public.emerald_journey_progress set cursor=0,completed_at=null,updated_at=now()
      where user_id=uid and emerald_journey_progress.version=event_version;
  end if;
  select * into strict progress from public.emerald_journey_progress p where p.user_id=uid and p.version=event_version;
  return jsonb_build_object('required',progress.completed_at is null,'preview',not config.enabled,
    'version',event_version,'cursor',progress.cursor,'page_count',config.page_count,
    'completed_at',progress.completed_at,'reset_applied_at',progress.reset_applied_at,'map_id','bobo_t2',
    'has_save',exists(select 1 from public.game_saves where user_id=uid));
end;
$$;

create function public.emerald_journey_advance(p_version text, p_expected_cursor integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  config private.emerald_journey_config%rowtype;
  progress public.emerald_journey_progress%rowtype;
  snapshot jsonb;
  transformed jsonb;
  trainer public.trainer_state%rowtype;
  pokemon jsonb;
  hints jsonb;
  version bigint;
  stars integer;
  previous_level integer;
  stamp bigint := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  preview boolean;
begin
  if uid is null then raise exception 'unauthenticated'; end if;
  select * into strict config from private.emerald_journey_config where id;
  preview := not config.enabled;
  if (preview and (uid <> '16d47359-8fbb-4a81-9596-918b2d53b75b'::uuid or p_version <> config.version||'_preview'))
    or (not preview and p_version <> config.version) then raise exception 'journey_not_available'; end if;
  select * into progress from public.emerald_journey_progress p
    where p.user_id=uid and p.version=p_version for update;
  if not found then raise exception 'journey_not_started'; end if;
  if progress.completed_at is not null then
    return jsonb_build_object('completed',true,'cursor',progress.cursor,'preview',preview);
  end if;
  if p_expected_cursor is distinct from progress.cursor then
    return jsonb_build_object('completed',false,'cursor',progress.cursor,'preview',preview);
  end if;
  if progress.cursor < config.page_count-1 then
    update public.emerald_journey_progress set cursor=cursor+1,updated_at=now()
      where user_id=uid and emerald_journey_progress.version=p_version returning cursor into progress.cursor;
    return jsonb_build_object('completed',false,'cursor',progress.cursor,'preview',preview);
  end if;
  -- Última página: lock + backup + reset + conclusão no MESMO commit.
  -- Nunca recebe níveis/estrelas/itens enviados pelo navegador.
  select data,save_version into snapshot,version from public.game_saves where user_id=uid for update;
  if not found or jsonb_typeof(snapshot->'idle') is distinct from 'object' then raise exception 'save_not_ready'; end if;
  if preview then
    transformed := snapshot; -- a prévia NÃO converte níveis nem concede estrelas
  else
    select * into trainer from public.trainer_state where user_id=uid for update;
    select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into pokemon from public.player_pokemon p where p.user_id=uid;
    insert into private.emerald_journey_backups(user_id,version,snapshot,normalized_trainer,normalized_pokemon)
      values(uid,p_version,snapshot,to_jsonb(trainer),pokemon) on conflict do nothing;
    select jsonb_build_object('trainerLevel',coalesce(trainer.trainer_level,1),'pokemon',
      coalesce(jsonb_object_agg(p->>'id',p->'level'),'{}'::jsonb)) into hints from jsonb_array_elements(pokemon) p;
    previous_level := greatest(private.journey_int(snapshot#>'{idle,trainerLevel}',1),coalesce(trainer.trainer_level,1));
    stars := private.journey_stars(previous_level);
    transformed := private.journey_reset_snapshot(snapshot,hints);
    transformed := jsonb_set(transformed,'{idle,journey}',jsonb_build_object(
      'version',p_version,'completed',true,'resetAppliedAt',stamp));
    update public.trainer_state set trainer_level=1,trainer_xp=0,current_map='emerald',state_version=state_version+1,
      progression=coalesce(progression,'{}'::jsonb)||jsonb_build_object('trainerStars',transformed#>'{idle,trainerStars}',
        'journeyVersion',p_version),updated_at=now() where user_id=uid;
    update public.player_pokemon p set level=1,xp=0,metadata=coalesce(p.metadata,'{}'::jsonb)||jsonb_build_object(
      'legacyStars',least(7,private.journey_int(p.metadata->'legacyStars')+private.journey_stars(p.level)),
      'journeyVersion',p_version),updated_at=now() where p.user_id=uid;
  end if;
  transformed := jsonb_set(transformed,'{idle,currentMap}','"emerald"');
  if jsonb_typeof(transformed->'team') is distinct from 'array' then
    transformed := transformed || '{"team":[]}'::jsonb;
  end if;
  if jsonb_typeof(transformed->'restingBench') is distinct from 'array' then
    transformed := transformed || '{"restingBench":[]}'::jsonb;
  end if;
  transformed := jsonb_set(transformed,'{savedAt}',to_jsonb(stamp),true);
  transformed := jsonb_set(transformed,'{idle,savedAt}',to_jsonb(stamp),true);
  update public.emerald_journey_progress set cursor=config.page_count,completed_at=now(),
    reset_applied_at=case when preview then null else now() end,
    previous_trainer_level=previous_level,awarded_trainer_stars=stars,updated_at=now()
    where user_id=uid and emerald_journey_progress.version=p_version;
  update public.game_saves set data=transformed,save_version=save_version+1,updated_at=now()
    where user_id=uid returning save_version into version;
  return jsonb_build_object('completed',true,'cursor',config.page_count,'preview',preview,
    'server_version',version,'snapshot',transformed,'awarded_stars',coalesce(stars,0));
end;
$$;

-- Cliente antigo / fila de antes do reborn não pode ressuscitar níveis por
-- cima do reset oficial. O versionamento normal continua protegendo o resto.
create function private.guard_emerald_journey_save()
returns trigger language plpgsql security definer set search_path = '' as $$
declare applied timestamptz;
begin
  select reset_applied_at into applied from public.emerald_journey_progress
    where user_id=new.user_id and version='emerald_journey_v1';
  if applied is not null and new.data#>>'{idle,journey,version}' is distinct from 'emerald_journey_v1' then
    raise exception 'journey_reset_requires_reload' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger zz_guard_emerald_journey_save before insert or update on public.game_saves
  for each row execute function private.guard_emerald_journey_save();

revoke all on function private.journey_int(jsonb,integer), private.journey_stars(integer),
  private.journey_reset_snapshot(jsonb,jsonb), private.guard_emerald_journey_save() from public,anon,authenticated;
revoke all on function public.emerald_journey_status(boolean), public.emerald_journey_advance(text,integer) from public,anon;
grant execute on function public.emerald_journey_status(boolean), public.emerald_journey_advance(text,integer) to authenticated;
