-- Recomeço voluntário: uma vez por conta; preserva Pokémon, itens e identidade.
-- Aplicar no Supabase antes de divulgar o código no jogo.
create or replace function public.claim_level_reset_reward(p_code text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_data jsonb;
  v_path text[];
  v_entries jsonb;
  v_changed jsonb;
  v_entry jsonb;
  v_name text;
  v_saved_at bigint;
begin
  if v_user is null then raise exception 'Entre na sua conta para resgatar.'; end if;
  if v_code <> 'RESETLV10TREINADOR' then raise exception 'Código inválido.'; end if;

  select data into v_data from public.game_saves
    where user_id = v_user for update;
  if not found or jsonb_typeof(v_data -> 'idle') <> 'object'
    or jsonb_typeof(v_data -> 'team') <> 'array'
    or jsonb_typeof(v_data -> 'restingBench') <> 'array'
  then
    raise exception 'Salve o progresso completo na nuvem antes de resgatar.';
  end if;
  if v_data #>> '{idle,redeemedCodes,RESETLV10TREINADOR}' = 'true' then
    raise exception 'Código já utilizado nesta conta.';
  end if;

  v_data := jsonb_set(v_data, '{idle,trainerLevel}', '1'::jsonb, true);
  v_data := jsonb_set(v_data, '{idle,trainerXp}', '0'::jsonb, true);
  v_data := jsonb_set(v_data, '{idle,redeemedCodes}',
    (case when jsonb_typeof(v_data #> '{idle,redeemedCodes}') = 'object'
      then v_data #> '{idle,redeemedCodes}' else '{}'::jsonb end)
      || jsonb_build_object(v_code, true), true);

  foreach v_name in array array['collection', 'team', 'restingBench', 'party'] loop
    if v_name = 'collection' then v_path := array['idle', 'collection'];
    else v_path := array[v_name]; end if;
    v_entries := v_data #> v_path;
    if jsonb_typeof(v_entries) <> 'array' then continue; end if;
    v_changed := '[]'::jsonb;
    for v_entry in select value from jsonb_array_elements(v_entries) loop
      v_changed := v_changed || (v_entry || jsonb_build_object('level', 10, 'xp', 0));
    end loop;
    v_data := jsonb_set(v_data, v_path, v_changed, false);
  end loop;

  -- Versão/horário posteriores ao último checkpoint para o SaveManager adotar.
  v_saved_at := greatest(
    coalesce((v_data ->> 'savedAt')::bigint, 0) + 1,
    floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );
  v_data := jsonb_set(v_data, '{savedAt}', to_jsonb(v_saved_at), true);
  update public.game_saves
    set data = v_data, save_version = save_version + 1, updated_at = now()
    where user_id = v_user
    returning data into v_data;

  -- O snapshot completo e as tabelas normalizadas devem concordar após o reset.
  if to_regclass('public.trainer_state') is not null then
    update public.trainer_state
      set trainer_level = 1, trainer_xp = 0, updated_at = now()
      where user_id = v_user;
  end if;
  if to_regclass('public.pokemon_collection') is not null then
    update public.pokemon_collection
      set level = 10, xp = 0
      where user_id = v_user;
  end if;

  return v_data;
end;
$$;

revoke all on function public.claim_level_reset_reward(text) from public, anon;
grant execute on function public.claim_level_reset_reward(text) to authenticated;
