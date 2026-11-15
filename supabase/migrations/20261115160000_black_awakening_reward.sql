-- Pacote de despertar: resgate atômico, uma vez por conta.
-- Aplicar no Supabase antes de divulgar o código.
create table if not exists public.player_reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table public.player_reward_claims enable row level security;
drop policy if exists player_reward_claims_read_own on public.player_reward_claims;
create policy player_reward_claims_read_own on public.player_reward_claims
  for select to authenticated using (auth.uid() = user_id);
revoke all on public.player_reward_claims from anon, authenticated;
grant select on public.player_reward_claims to authenticated;

create or replace function public.claim_black_awakening_reward(p_code text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_data jsonb;
  v_idle jsonb;
  v_items jsonb;
  v_collection jsonb;
  v_uid text;
  v_now bigint;
  v_saved_at bigint;
begin
  if v_user is null then raise exception 'Entre na sua conta para resgatar.'; end if;
  if v_code <> 'DESPERTARBLACK6' then raise exception 'Código inválido.'; end if;

  select data into v_data from public.game_saves
    where user_id = v_user for update;
  if not found or jsonb_typeof(v_data -> 'idle') <> 'object'
    or jsonb_typeof(v_data -> 'team') <> 'array'
    or jsonb_typeof(v_data -> 'restingBench') <> 'array'
  then
    raise exception 'Salve seu progresso completo na nuvem antes de resgatar.';
  end if;
  v_idle := v_data -> 'idle';
  if v_idle #>> '{redeemedCodes,DESPERTARBLACK6}' = 'true' then
    raise exception 'Código já utilizado nesta conta.';
  end if;
  if exists (select 1 from public.player_reward_claims where user_id = v_user and code = v_code) then
    raise exception 'Código já utilizado nesta conta.';
  end if;
  v_collection := case when jsonb_typeof(v_idle -> 'collection') = 'array'
    then v_idle -> 'collection' else '[]'::jsonb end;
  if jsonb_array_length(v_collection) >= 500 then
    raise exception 'Coleção cheia. Libere uma vaga antes de resgatar.';
  end if;
  -- Chave única permanece mesmo se o checkpoint do jogo for restaurado.
  -- O insert é revertido junto com todo o pacote se qualquer passo falhar.
  insert into public.player_reward_claims (user_id, code) values (v_user, v_code);

  v_items := case when jsonb_typeof(v_idle -> 'items') = 'object'
    then v_idle -> 'items' else '{}'::jsonb end;
  v_items := v_items || (
    select jsonb_object_agg(item, to_jsonb(coalesce((v_items ->> item)::int, 0) + qty))
    from (values
      ('stone_dragon', 6), ('stone_electric', 2), ('stone_dark', 3),
      ('stone_fire', 2), ('stone_grass', 2),
      ('esfera_safira', 170), ('pepita', 200),
      ('morango', 350), ('limao', 200), ('banana', 40),
      ('pokeball', 400), ('greatball', 60), ('ultraball', 70),
      ('egg_ditto_shiny_1', 6)
    ) as rewards(item, qty)
  );
  v_now := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_uid := 'code-articuno-' || replace(gen_random_uuid()::text, '-', '');

  -- Registra primeiro: o trigger anti-duplicação do save exige propriedade válida.
  insert into public.player_pokemon_registry
    (user_id, pet_uid, species, rarity, traits, level, xp, origin)
    values (v_user, v_uid, 'articuno', 'mythic', '[]'::jsonb, 1, 0, 'code');

  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_idle := jsonb_set(v_idle, '{collection}',
    v_collection || jsonb_build_array(jsonb_build_object(
      'uid', v_uid, 'species', 'articuno', 'level', 1, 'xp', 0,
      'rarity', 'mythic', 'traits', '[]'::jsonb,
      'capturedAt', v_now, 'event', 'reward_code:DESPERTARBLACK6'
    )), true);
  v_idle := jsonb_set(v_idle, '{seenSpecies}',
    case when coalesce(v_idle -> 'seenSpecies', '[]'::jsonb) @> '["articuno"]'::jsonb
      then coalesce(v_idle -> 'seenSpecies', '[]'::jsonb)
      else coalesce(v_idle -> 'seenSpecies', '[]'::jsonb) || '"articuno"'::jsonb end, true);
  v_idle := jsonb_set(v_idle, '{caughtSpecies}',
    case when coalesce(v_idle -> 'caughtSpecies', '[]'::jsonb) @> '["articuno"]'::jsonb
      then coalesce(v_idle -> 'caughtSpecies', '[]'::jsonb)
      else coalesce(v_idle -> 'caughtSpecies', '[]'::jsonb) || '"articuno"'::jsonb end, true);
  v_idle := jsonb_set(v_idle, '{redeemedCodes}',
    (case when jsonb_typeof(v_idle -> 'redeemedCodes') = 'object'
      then v_idle -> 'redeemedCodes' else '{}'::jsonb end)
      || jsonb_build_object(v_code, true), true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  v_saved_at := greatest(coalesce((v_data ->> 'savedAt')::bigint, 0) + 1, v_now);
  v_data := jsonb_set(v_data, '{savedAt}', to_jsonb(v_saved_at), true);
  update public.game_saves
    set data = v_data, save_version = save_version + 1, updated_at = now()
    where user_id = v_user
    returning data into v_data;
  return v_data;
end;
$$;

revoke all on function public.claim_black_awakening_reward(text) from public, anon;
grant execute on function public.claim_black_awakening_reward(text) to authenticated;
