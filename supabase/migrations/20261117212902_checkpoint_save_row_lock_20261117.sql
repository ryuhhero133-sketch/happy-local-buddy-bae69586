-- Serialize checkpoint_save with guild/revive mutations and other checkpoints.
-- Keep the installed validation/rate-limit logic unchanged; alter only the read lock.
do $migration$
declare
  v_definition text;
  v_needle text := 'select save_version, updated_at into _cur_version, _cur_updated from public.game_saves where user_id = _uid;';
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'checkpoint_save'
    and pg_get_function_identity_arguments(p.oid) = 'p_expected_version bigint, p_data jsonb, p_action_id text';
  if v_definition is null or strpos(v_definition, v_needle) = 0 then
    raise exception 'checkpoint_save body changed; review before applying row lock';
  end if;
  execute replace(v_definition, v_needle, replace(v_needle, ';', ' for update;'));
end;
$migration$;
