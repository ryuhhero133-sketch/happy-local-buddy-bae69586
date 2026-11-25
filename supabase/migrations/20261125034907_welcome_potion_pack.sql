-- Pacote único de 200 Poções para cada conta, concedido no próximo login.
-- A tabela de concessões garante que ninguém receba duas vezes.
create table if not exists private.welcome_potion_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table private.welcome_potion_grants enable row level security;
revoke all on private.welcome_potion_grants from public, anon, authenticated;

create or replace function public.claim_welcome_potions()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_save public.game_saves%rowtype;
  v_data jsonb;
  v_items jsonb;
  v_potion bigint;
  v_version bigint;
  v_stamp bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  select * into v_save
    from public.game_saves
    where user_id = v_uid
    for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') is distinct from 'object' then
    return jsonb_build_object('ok', false, 'reason', 'save_not_ready');
  end if;

  insert into private.welcome_potion_grants (user_id)
    values (v_uid)
    on conflict (user_id) do nothing;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'already_granted');
  end if;

  v_data := v_save.data;
  v_items := coalesce(v_data #> '{idle,items}', '{}'::jsonb);
  if jsonb_typeof(v_items) <> 'object' then v_items := '{}'::jsonb; end if;
  v_potion := coalesce(nullif(v_items ->> 'potion', '')::bigint, 0);
  v_potion := least(999999, v_potion + 200);
  v_items := jsonb_set(v_items, '{potion}', to_jsonb(v_potion), true);
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

  return jsonb_build_object(
    'ok', true,
    'granted', 200,
    'potions', v_potion,
    'snapshot', v_data,
    'server_version', v_version
  );
end;
$$;

revoke all on function public.claim_welcome_potions() from public, anon;
grant execute on function public.claim_welcome_potions() to authenticated;
