-- PvP HP and Revive inventory change in one transaction. No client-supplied
-- item count or HP is trusted. The complete save is preserved except one item.
create or replace function public.pvp_use_revive(p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_save public.game_saves%rowtype;
  v_presence public.pvp_presence%rowtype;
  v_count integer;
  v_new_version bigint;
  v_fallen_uid text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') <> 'object'
    or jsonb_typeof(v_save.data -> 'team') <> 'array'
    or jsonb_typeof(v_save.data -> 'restingBench') <> 'array' then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;
  select * into v_presence from public.pvp_presence where user_id = v_uid for update;
  if not found or v_presence.hp <> 0 then
    return jsonb_build_object('ok', false, 'reason', 'not_fainted');
  end if;
  v_fallen_uid := v_save.data #>> '{idle,pvpFaintedLeader,uid}';
  if (v_fallen_uid is null and jsonb_array_length(v_save.data -> 'team') = 0)
    or (v_fallen_uid is not null
      and not exists (select 1 from jsonb_array_elements(v_save.data -> 'team') p
        where p ->> 'uid' = v_fallen_uid)
      and not exists (select 1 from jsonb_array_elements(v_save.data -> 'restingBench') p
        where p ->> 'uid' = v_fallen_uid)
      and not exists (select 1 from jsonb_array_elements(
        case when jsonb_typeof(v_save.data #> '{idle,collection}') = 'array'
          then v_save.data #> '{idle,collection}' else '[]'::jsonb end) p
        where p ->> 'uid' = v_fallen_uid)) then
    return jsonb_build_object('ok', false, 'reason', 'leader_unavailable');
  end if;
  if coalesce(v_save.data #>> '{idle,items,revive}', '') !~ '^[0-9]{1,6}$' then
    return jsonb_build_object('ok', false, 'reason', 'no_revive');
  end if;
  v_count := (v_save.data #>> '{idle,items,revive}')::integer;
  if v_count < 1 then return jsonb_build_object('ok', false, 'reason', 'no_revive'); end if;
  update public.game_saves set
    data = jsonb_set(v_save.data, '{idle,items,revive}', to_jsonb(v_count - 1), false),
    save_version = v_save.save_version + 1,
    updated_at = now()
  where user_id = v_uid and save_version = v_save.save_version
  returning save_version into v_new_version;
  if not found then return jsonb_build_object('ok', false, 'reason', 'stale'); end if;
  update public.pvp_presence set hp = greatest(1, max_hp), updated_at = now()
  where user_id = v_uid and hp = 0;
  if not found then raise exception 'pvp_revive_race'; end if;
  return jsonb_build_object('ok', true, 'server_version', v_new_version, 'revives', v_count - 1);
end;
$$;
revoke all on function public.pvp_use_revive(bigint) from public, anon;
grant execute on function public.pvp_use_revive(bigint) to authenticated;
