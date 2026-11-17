-- Installed on the live project as fix_bootstrap_player_missing_column_and_fake_session_20261117.
-- Existing profiles, game saves and sessions are never updated by this migration.
create or replace function public.bootstrap_player(p_username text default 'Treinador')
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  v_username := left(coalesce(nullif(btrim(p_username), ''), 'Treinador'), 24);
  insert into public.profiles(id, username)
    values(v_uid, v_username) on conflict(id) do nothing;
  insert into public.trainer_state(user_id)
    values(v_uid) on conflict(user_id) do nothing;
  insert into public.game_saves(user_id, data, save_version)
    values(v_uid, jsonb_build_object('idle', jsonb_build_object()), 1)
    on conflict(user_id) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.bootstrap_player(text) from public, anon;
grant execute on function public.bootstrap_player(text) to authenticated;
