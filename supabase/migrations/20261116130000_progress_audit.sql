-- Histórico privado de progresso: não altera os saves e não bloqueia o jogo
-- caso a auditoria falhe. Aplicar e testar no Supabase antes de depender dele.
create schema if not exists private;

create table if not exists private.progress_save_history (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  recorded_at timestamptz not null default clock_timestamp(),
  save_version integer,
  reason text not null,
  snapshot jsonb not null
);
create index if not exists progress_save_history_user_time_idx
  on private.progress_save_history (user_id, recorded_at desc);
revoke all on private.progress_save_history from public, anon, authenticated;

-- Compara Pokémon por UID e nível independentemente da posição nas listas.
create or replace function private.progress_level_signature(p_data jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'trainer', p_data #> '{idle,trainerLevel}',
    'pokemon', coalesce((
      select jsonb_agg(jsonb_build_array(t.place, t.pet ->> 'uid', t.pet -> 'level')
                       order by t.place, t.pet ->> 'uid', t.pet ->> 'level')
      from (
        select 'team' as place, value as pet
        from jsonb_array_elements(case when jsonb_typeof(p_data -> 'team') = 'array' then p_data -> 'team' else '[]'::jsonb end)
        union all
        select 'bench', value
        from jsonb_array_elements(case when jsonb_typeof(p_data -> 'restingBench') = 'array' then p_data -> 'restingBench' else '[]'::jsonb end)
        union all
        select 'collection', value
        from jsonb_array_elements(case when jsonb_typeof(p_data #> '{idle,collection}') = 'array' then p_data #> '{idle,collection}' else '[]'::jsonb end)
      ) t
    ), '[]'::jsonb)
  );
$$;

create or replace function private.record_progress_save_history()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_last timestamptz;
  v_changed boolean;
begin
  if tg_op = 'INSERT' then
    insert into private.progress_save_history (user_id, save_version, reason, snapshot)
    values (new.user_id, new.save_version, 'initial', new.data);
    return new;
  end if;
  v_changed := private.progress_level_signature(old.data) is distinct from private.progress_level_signature(new.data);
  select recorded_at into v_last from private.progress_save_history
    where user_id = new.user_id order by recorded_at desc limit 1;
  if v_changed or v_last is null or v_last <= clock_timestamp() - interval '2 minutes' then
    -- Preserva também o estado anterior; quedas legítimas são registradas,
    -- não revertidas automaticamente.
    insert into private.progress_save_history (user_id, save_version, reason, snapshot)
    values (old.user_id, old.save_version, case when v_changed then 'before_level_change' else 'before_periodic' end, old.data),
           (new.user_id, new.save_version, case when v_changed then 'level_change' else 'periodic' end, new.data);
  end if;
  return new;
exception when others then
  raise warning 'progress history failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists progress_save_history_trg on public.game_saves;
create trigger progress_save_history_trg after insert or update on public.game_saves
  for each row execute function private.record_progress_save_history();
