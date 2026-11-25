-- Código único de recompensa NEVENATALINOSPLUS44YHWH: 2 usos por conta.
-- O resgate e a trava são atômicos no servidor.
create table if not exists private.reward_code_uses (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  uses integer not null default 0 check (uses between 0 and 2),
  primary key (user_id, code)
);
alter table private.reward_code_uses enable row level security;
revoke all on private.reward_code_uses from public, anon, authenticated;

create or replace function public.redeem_nevenatalinos_code()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code constant text := 'NEVENATALINOSPLUS44YHWH';
  v_save public.game_saves%rowtype;
  v_data jsonb;
  v_items jsonb;
  v_rewards jsonb;
  v_uses integer;
  v_version bigint;
  v_stamp bigint;
  v_key text;
  v_qty integer;
  v_tickets integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  insert into private.reward_code_uses (user_id, code, uses)
    values (v_uid, v_code, 0)
    on conflict (user_id, code) do nothing;
  select uses into v_uses
    from private.reward_code_uses
    where user_id = v_uid and code = v_code
    for update;
  if v_uses >= 2 then
    return jsonb_build_object('ok', false, 'reason', 'already_used', 'uses', v_uses, 'remaining', 0);
  end if;

  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found
    or jsonb_typeof(v_save.data -> 'idle') is distinct from 'object'
    or jsonb_typeof(v_save.data -> 'team') is distinct from 'array'
    or jsonb_typeof(v_save.data -> 'restingBench') is distinct from 'array'
  then
    return jsonb_build_object('ok', false, 'reason', 'save_not_ready');
  end if;

  v_data := v_save.data;
  v_items := coalesce(v_data #> '{idle,items}', '{}'::jsonb);
  if jsonb_typeof(v_items) <> 'object' then v_items := '{}'::jsonb; end if;
  v_rewards := jsonb_build_object(
    'ultraball', 100,
    'pokeball', 200,
    'potion', 300,
    'morango', 300,
    'stone_grass', 50,
    'stone_fire', 50,
    'stone_water', 50,
    'stone_electric', 50,
    'stone_dark', 50,
    'stone_dragon', 50,
    'book_atk', 10,
    'orb_xp_supreme', 20,
    'disc_raiz', 1,
    'disc_combustao', 1,
    'disc_mare', 1
  );
  for v_key, v_qty in select e.key, (e.value #>> '{}')::int from jsonb_each(v_rewards) e loop
    v_items := jsonb_set(
      v_items,
      array[v_key],
      to_jsonb(least(999999, coalesce(nullif(v_items ->> v_key, '')::bigint, 0) + v_qty)),
      true
    );
  end loop;
  v_data := jsonb_set(v_data, '{idle,items}', v_items, true);
  v_stamp := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_data := jsonb_set(v_data, '{savedAt}', to_jsonb(v_stamp), true);
  v_data := jsonb_set(v_data, '{idle,savedAt}', to_jsonb(v_stamp), true);
  update public.game_saves
    set data = v_data,
        save_version = v_save.save_version + 1,
        updated_at = now()
    where user_id = v_uid
    returning save_version into v_version;

  update private.reward_code_uses
    set uses = uses + 1
    where user_id = v_uid and code = v_code
    returning uses into v_uses;

  insert into public.nevezinha_event_state (user_id) values (v_uid) on conflict do nothing;
  update public.nevezinha_event_state
    set tickets = least(999, tickets + 20), updated_at = now()
    where user_id = v_uid
    returning tickets into v_tickets;

  return jsonb_build_object(
    'ok', true,
    'uses', v_uses,
    'remaining', greatest(0, 2 - v_uses),
    'snapshot', v_data,
    'server_version', v_version,
    'tickets', v_tickets
  );
end;
$$;

revoke all on function public.redeem_nevenatalinos_code() from public, anon;
grant execute on function public.redeem_nevenatalinos_code() to authenticated;
