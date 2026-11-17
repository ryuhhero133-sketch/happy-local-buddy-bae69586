-- Cliente não recebe INSERT/UPDATE/DELETE em guildas/membros; a API
-- deve usar funções autenticadas que validam o vínculo e aplicam a transação.
create or replace function public.create_player_guild(
  p_name text, p_element text, p_level integer, p_expected_version bigint, p_species text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_save public.game_saves%rowtype;
  v_gold bigint;
  v_new_version bigint;
begin
  if v_uid is null then raise exception 'Entre na sua conta.'; end if;
  if length(btrim(coalesce(p_name,''))) not between 1 and 18 then
    raise exception 'Nome da guilda deve ter de 1 a 18 caracteres.';
  end if;
  if p_element not in ('fire','water','grass','psychic','poison','fairy','flying') then
    raise exception 'Elemento inválido.';
  end if;
  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'team') <> 'array'
    or jsonb_typeof(v_save.data -> 'restingBench') <> 'array'
    or jsonb_typeof(v_save.data -> 'idle') <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;
  if coalesce(v_save.data #>> '{idle,bank,gold}', '') !~ '^[0-9]{1,9}$' then
    return jsonb_build_object('ok', false, 'reason', 'gold_unavailable');
  end if;
  v_gold := (v_save.data #>> '{idle,bank,gold}')::bigint;
  if v_gold < 5000 then return jsonb_build_object('ok', false, 'reason', 'insufficient_gold'); end if;
  if exists (select 1 from public.guild_members where user_id = v_uid) then
    raise exception 'Você já está em uma guilda.';
  end if;
  insert into public.guilds(name,element,founder_id)
  values(btrim(p_name),p_element,v_uid) returning id into v_id;
  insert into public.guild_members(guild_id,user_id,username,role,level,leader_species)
  values(v_id,v_uid,coalesce((select username from public.profiles where id = v_uid),'Treinador'),
    'leader',greatest(1,least(coalesce(p_level,1),1000000)),left(p_species,100));
  update public.game_saves set
    data = jsonb_set(v_save.data, '{idle,bank,gold}', to_jsonb(v_gold - 5000), false),
    save_version = v_save.save_version + 1, updated_at = now()
  where user_id = v_uid and save_version = v_save.save_version
  returning save_version into v_new_version;
  if not found then raise exception 'O save mudou; guilda não criada.'; end if;
  return jsonb_build_object('ok', true, 'server_version', v_new_version,
    'gold', v_gold - 5000, 'guild_id', v_id);
end;
$$;
revoke all on function public.create_player_guild(text,text,integer,bigint,text) from public, anon;
grant execute on function public.create_player_guild(text,text,integer,bigint,text) to authenticated;
