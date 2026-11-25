-- Tickets extras da Nevezinha por missões concluídas. O limite diário de 3
-- continua valendo, mas tickets bônus podem passar de 3 até 999.
alter table public.nevezinha_event_state
  drop constraint if exists nevezinha_event_state_tickets_check;
alter table public.nevezinha_event_state
  add constraint nevezinha_event_state_tickets_check check (tickets between 0 and 999);

create or replace function public.nevezinha_grant_tickets(p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  _today date := private.nevezinha_today();
  _state public.nevezinha_event_state%rowtype;
begin
  if _uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 50 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  end if;
  insert into public.nevezinha_event_state (user_id) values (_uid) on conflict do nothing;
  select * into _state from public.nevezinha_event_state where user_id = _uid for update;
  if _state.last_claim_day is distinct from _today then
    update public.nevezinha_event_state
      set tickets = 3, last_claim_day = _today, last_result = null, updated_at = now()
      where user_id = _uid returning * into _state;
  end if;
  update public.nevezinha_event_state
    set tickets = least(999, tickets + p_amount), updated_at = now()
    where user_id = _uid returning * into _state;
  return jsonb_build_object('ok', true, 'tickets', _state.tickets);
end;
$$;

revoke all on function public.nevezinha_grant_tickets(integer) from public, anon;
grant execute on function public.nevezinha_grant_tickets(integer) to authenticated;
