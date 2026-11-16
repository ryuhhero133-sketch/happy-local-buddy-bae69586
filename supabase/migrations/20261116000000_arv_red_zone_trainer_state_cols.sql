-- A morte na zona vermelha quebrava se public.trainer_state não tivesse a
-- coluna active_map (a tabela real pode ter sido criada com outro schema).
-- Agora a função só grava as colunas que existem — game_saves continua sendo
-- a fonte de verdade e o save nunca é perdido por causa da tabela espelho.
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
  v_col text;
  v_sets text[] := '{}';
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

  -- Espelho trainer_state: só o que existir nesta instalação.
  if to_regclass('public.trainer_state') is not null then
    foreach v_col in array array['gold', 'trainer_level', 'trainer_xp', 'active_map', 'updated_at']
    loop
      if exists (
        select 1 from information_schema.columns c
        where c.table_schema = 'public' and c.table_name = 'trainer_state' and c.column_name = v_col
      ) then
        v_sets := v_sets || case v_col
          when 'gold'         then format('gold = %s', v_gold - v_lost)
          when 'trainer_level' then format('trainer_level = %s', v_new_level)
          when 'trainer_xp'   then 'trainer_xp = 0'
          when 'active_map'   then quote_literal('mapinha6')
          when 'updated_at'   then 'updated_at = now()'
        end;
      end if;
    end loop;
    if coalesce(array_length(v_sets, 1), 0) > 0 then
      execute format('update public.trainer_state set %s where user_id = %L',
        array_to_string(v_sets, ', '), v_user::text);
    end if;
  end if;

  return jsonb_build_object('gold_lost', v_lost, 'level_lost', v_level - v_new_level);
end;
$$;

revoke all on function public.claim_arv_red_zone_death() from public, anon;
grant execute on function public.claim_arv_red_zone_death() to authenticated;
