-- A replay previously returned server_version=0 (uninitialized local variable).
-- Never tell a client to roll its version backward after an idempotent retry.
do $migration$
declare
  v_definition text;
  v_needle text := 'if not found then return jsonb_build_object(''ok'', false, ''reason'', ''duplicate'', ''server_version'', coalesce(_cur_version, 0)); end if;';
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'checkpoint_save'
    and pg_get_function_identity_arguments(p.oid) = 'p_expected_version bigint, p_data jsonb, p_action_id text';
  if v_definition is null or strpos(v_definition, v_needle) = 0 then
    raise exception 'checkpoint_save body changed; review duplicate response';
  end if;
  execute replace(v_definition, v_needle,
    'if not found then ' ||
    'select save_version into _cur_version from public.game_saves where user_id = _uid; ' ||
    'return jsonb_build_object(''ok'', false, ''reason'', ''duplicate'', ' ||
      '''server_version'', coalesce(_cur_version, 0)); end if;');
end;
$migration$;
