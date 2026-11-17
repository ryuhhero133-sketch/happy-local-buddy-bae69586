-- Pacote restrito a duas contas. Não altera níveis, coleção ou time.
create or replace function public.claim_myhwh7755_reward()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_data jsonb;
  v_idle jsonb;
  v_items jsonb;
  v_codes jsonb;
  v_skins jsonb;
  v_version bigint;
  v_now bigint;
begin
  if v_user is null or v_user not in (
    '90f72388-37e6-4ae9-82bd-c8747d4a74df'::uuid,
    '8a33251b-0f69-4090-bd9e-44ad92755aae'::uuid
  ) then
    raise exception 'Este código é exclusivo para duas contas autorizadas.';
  end if;

  select data, save_version into v_data, v_version
  from public.game_saves where user_id = v_user for update;
  if not found or jsonb_typeof(v_data -> 'idle') <> 'object'
     or jsonb_typeof(v_data -> 'team') <> 'array'
     or jsonb_typeof(v_data -> 'restingBench') <> 'array' then
    raise exception 'Save completo não encontrado; nenhum item foi alterado.';
  end if;
  v_idle := v_data -> 'idle';
  v_codes := case when jsonb_typeof(v_idle -> 'redeemedCodes') = 'object'
    then v_idle -> 'redeemedCodes' else '{}'::jsonb end;
  if v_codes ->> 'MYHWH7755' = 'true'
     or exists (select 1 from public.player_reward_claims where user_id = v_user and code = 'MYHWH7755') then
    return jsonb_build_object('ok', true, 'already_claimed', true, 'version', v_version);
  end if;
  v_items := case when jsonb_typeof(v_idle -> 'items') = 'object'
    then v_idle -> 'items' else '{}'::jsonb end;
  v_skins := case when jsonb_typeof(v_idle -> 'unlockedSkins') = 'array'
    then v_idle -> 'unlockedSkins' else '[]'::jsonb end;

  v_items := jsonb_set(v_items, '{ticket_ancestral}', to_jsonb(coalesce((v_items ->> 'ticket_ancestral')::integer, 0) + 1), true);
  v_items := jsonb_set(v_items, '{egg_mew_7}', to_jsonb(coalesce((v_items ->> 'egg_mew_7')::integer, 0) + 1), true);
  if not v_skins @> '["goku"]'::jsonb then v_skins := v_skins || '"goku"'::jsonb; end if;
  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_idle := jsonb_set(v_idle, '{unlockedSkins}', v_skins, true);
  v_idle := jsonb_set(v_idle, '{redeemedCodes}', v_codes || '{"MYHWH7755":true}'::jsonb, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  v_now := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_data := jsonb_set(v_data, '{savedAt}', to_jsonb(greatest(coalesce((v_data ->> 'savedAt')::bigint, 0) + 1, v_now)), true);
  insert into public.player_reward_claims (user_id, code) values (v_user, 'MYHWH7755');
  update public.game_saves set data = v_data, save_version = save_version + 1, updated_at = now()
    where user_id = v_user returning save_version into v_version;
  return jsonb_build_object('ok', true, 'already_claimed', false, 'version', v_version);
end;
$$;
revoke all on function public.claim_myhwh7755_reward() from public, anon;
grant execute on function public.claim_myhwh7755_reward() to authenticated;
