-- Preserve one session per account without granting direct table writes.
create or replace function public.claim_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_current uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  insert into public.active_sessions(user_id, session_id, claimed_at, last_seen_at)
  values(v_uid, p_session_id, now(), now())
  on conflict(user_id) do update set
    session_id = case
      when public.active_sessions.session_id = excluded.session_id
        or public.active_sessions.last_seen_at < now() - interval '90 seconds'
      then excluded.session_id else public.active_sessions.session_id end,
    claimed_at = case
      when public.active_sessions.session_id = excluded.session_id
        or public.active_sessions.last_seen_at < now() - interval '90 seconds'
      then excluded.claimed_at else public.active_sessions.claimed_at end,
    last_seen_at = case
      when public.active_sessions.session_id = excluded.session_id
        or public.active_sessions.last_seen_at < now() - interval '90 seconds'
      then now() else public.active_sessions.last_seen_at end
  returning session_id into v_current;
  return jsonb_build_object('ok', v_current = p_session_id,
    'reason', case when v_current = p_session_id then null else 'SESSION_TAKEN' end);
end;
$$;
revoke all on function public.claim_session(uuid) from public, anon;
grant execute on function public.claim_session(uuid) to authenticated;

create or replace function public.release_session(p_session_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then return false; end if;
  delete from public.active_sessions
    where user_id = auth.uid() and session_id = p_session_id;
  return found;
end;
$$;
revoke all on function public.release_session(uuid) from public, anon;
grant execute on function public.release_session(uuid) to authenticated;
