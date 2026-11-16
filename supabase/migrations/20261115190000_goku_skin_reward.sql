-- Skin Goku: resgate único por conta, atômico com o save completo.
create table if not exists public.player_reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table public.player_reward_claims enable row level security;

create or replace function public.claim_goku_skin_reward(p_code text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_data jsonb;
  v_idle jsonb;
  v_skins jsonb;
  v_now bigint;
begin
  if v_user is null then raise exception 'Entre na sua conta para resgatar.'; end if;
  if v_code <> 'GOKUSKIN1' then raise exception 'Código inválido.'; end if;

  select data into v_data from public.game_saves
    where user_id = v_user for update;
  if not found or jsonb_typeof(v_data -> 'idle') <> 'object'
    or jsonb_typeof(v_data -> 'team') <> 'array'
    or jsonb_typeof(v_data -> 'restingBench') <> 'array'
  then
    raise exception 'Salve seu progresso completo na nuvem antes de resgatar.';
  end if;
  v_idle := v_data -> 'idle';
  if v_idle #>> '{redeemedCodes,GOKUSKIN1}' = 'true'
    or exists (select 1 from public.player_reward_claims where user_id = v_user and code = v_code)
  then
    raise exception 'Código já utilizado nesta conta.';
  end if;

  insert into public.player_reward_claims (user_id, code) values (v_user, v_code);
  v_skins := case when jsonb_typeof(v_idle -> 'unlockedSkins') = 'array'
    then v_idle -> 'unlockedSkins' else '[]'::jsonb end;
  if not v_skins @> '["goku"]'::jsonb then
    v_skins := v_skins || '"goku"'::jsonb;
  end if;
  v_idle := jsonb_set(v_idle, '{unlockedSkins}', v_skins, true);
  v_idle := jsonb_set(v_idle, '{redeemedCodes}',
    (case when jsonb_typeof(v_idle -> 'redeemedCodes') = 'object'
      then v_idle -> 'redeemedCodes' else '{}'::jsonb end)
      || jsonb_build_object(v_code, true), true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  v_now := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_data := jsonb_set(v_data, '{savedAt}',
    to_jsonb(greatest(coalesce((v_data ->> 'savedAt')::bigint, 0) + 1, v_now)), true);
  update public.game_saves
    set data = v_data, save_version = save_version + 1, updated_at = now()
    where user_id = v_user;
  return jsonb_build_object('skin', 'goku');
end;
$$;

revoke all on function public.claim_goku_skin_reward(text) from public, anon;
grant execute on function public.claim_goku_skin_reward(text) to authenticated;
