-- Zona vermelha do mapa arv: penalidade e retorno atômicos no servidor.
-- A morte devolve o personagem para Revoland (mapinha6), a cidade inicial.
create or replace function public.claim_arv_red_zone_death()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_data jsonb;
  v_idle jsonb;
  v_bank jsonb;
  v_gold int;
  v_lost int;
  v_level int;
  v_new_level int;
  v_saved_at bigint;
begin
  if v_user is null then raise exception 'Entre na sua conta antes de entrar nesta área.'; end if;
  select data into v_data from public.game_saves
    where user_id = v_user for update;
  if not found or jsonb_typeof(v_data -> 'idle') <> 'object' then
    raise exception 'Salve seu progresso antes de entrar nesta área.';
  end if;
  v_idle := v_data -> 'idle';
  if v_idle ->> 'currentMap' <> 'arv' then
    raise exception 'A zona vermelha só existe no mapa arv.';
  end if;

  v_bank := case when jsonb_typeof(v_idle -> 'bank') = 'object'
    then v_idle -> 'bank' else '{}'::jsonb end;
  v_gold := greatest(0, coalesce((v_bank ->> 'gold')::int, 0));
  v_lost := least(v_gold, 1 + floor(random() * 5000)::int);
  v_level := greatest(1, coalesce((v_idle ->> 'trainerLevel')::int, 1));
  v_new_level := greatest(1, v_level - 1);

  v_idle := jsonb_set(v_idle, '{bank}', v_bank || jsonb_build_object('gold', v_gold - v_lost), true);
  v_idle := jsonb_set(v_idle, '{trainerLevel}', to_jsonb(v_new_level), true);
  v_idle := jsonb_set(v_idle, '{trainerXp}', '0'::jsonb, true);
  v_idle := jsonb_set(v_idle, '{currentMap}', '"mapinha6"'::jsonb, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  v_saved_at := greatest(coalesce((v_data ->> 'savedAt')::bigint, 0) + 1,
    floor(extract(epoch from clock_timestamp()) * 1000)::bigint);
  v_data := jsonb_set(v_data, '{savedAt}', to_jsonb(v_saved_at), true);
  update public.game_saves
    set data = v_data, save_version = save_version + 1, updated_at = now()
    where user_id = v_user;

  if to_regclass('public.trainer_state') is not null then
    update public.trainer_state
      set gold = v_gold - v_lost, trainer_level = v_new_level,
        trainer_xp = 0, active_map = 'mapinha6', updated_at = now()
      where user_id = v_user;
  end if;
  return jsonb_build_object('gold_lost', v_lost, 'level_lost', v_level - v_new_level);
end;
$$;

revoke all on function public.claim_arv_red_zone_death() from public, anon;
grant execute on function public.claim_arv_red_zone_death() to authenticated;
