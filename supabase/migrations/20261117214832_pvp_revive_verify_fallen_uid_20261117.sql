-- Do not spend a Revive for a fallen UID missing from every saved Pokémon slot.
do $migration$
declare
  v_definition text;
  v_before text := $old$if jsonb_array_length(v_save.data -> 'team') = 0
   and (v_fallen_uid is null or not exists (
     select 1 from jsonb_array_elements(coalesce(v_save.data #> '{idle,collection}','[]'::jsonb)) p
     where p ->> 'uid' = v_fallen_uid
   )) then return jsonb_build_object('ok',false,'reason','leader_unavailable'); end if;$old$;
  v_after text := $new$if (v_fallen_uid is null and jsonb_array_length(v_save.data -> 'team') = 0)
    or (v_fallen_uid is not null
      and not exists (select 1 from jsonb_array_elements(v_save.data -> 'team') p
        where p ->> 'uid' = v_fallen_uid)
      and not exists (select 1 from jsonb_array_elements(v_save.data -> 'restingBench') p
        where p ->> 'uid' = v_fallen_uid)
      and not exists (select 1 from jsonb_array_elements(
        case when jsonb_typeof(v_save.data #> '{idle,collection}') = 'array'
          then v_save.data #> '{idle,collection}' else '[]'::jsonb end) p
        where p ->> 'uid' = v_fallen_uid)) then
    return jsonb_build_object('ok',false,'reason','leader_unavailable');
  end if;$new$;
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'pvp_use_revive'
    and pg_get_function_identity_arguments(p.oid) = 'p_expected_version bigint';
  if v_definition is not null and strpos(v_definition, 'if (v_fallen_uid is null and jsonb_array_length') > 0 then return; end if;
  if v_definition is null or strpos(v_definition, v_before) = 0 then
    raise exception 'pvp_use_revive body changed; inspect before applying UID check';
  end if;
  execute replace(v_definition, v_before, v_after);
end;
$migration$;
