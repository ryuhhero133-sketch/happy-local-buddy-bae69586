create or replace function public.claim_player_guild_mission(p_mission_id text, p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_guild uuid;
  v_save public.game_saves%rowtype;
  v_target integer;
  v_progress integer;
  v_gold_reward integer;
  v_crystal_reward integer;
  v_xp_reward integer;
  v_gold bigint;
  v_crystals bigint;
  v_claimed jsonb;
  v_new_version bigint;
begin
  if v_uid is null then raise exception 'Entre na sua conta.'; end if;
  select guild_id into v_guild from public.guild_members where user_id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_in_guild'); end if;
  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;
  select target, gold_reward, crystal_reward, xp_reward
    into v_target, v_gold_reward, v_crystal_reward, v_xp_reward
  from (values
    ('g_cap10',10,2000,0,50), ('g_cap50',50,8000,0,150),
    ('g_cap150',150,25000,10,400), ('g_rare15',15,12000,5,250),
    ('g_kill100',100,5000,0,100), ('g_kill500',500,20000,8,300)
  ) m(id,target,gold_reward,crystal_reward,xp_reward) where id=p_mission_id;
  if v_target is null then return jsonb_build_object('ok', false, 'reason', 'invalid_mission'); end if;
  if coalesce(v_save.data #>> array['idle','guildMissionProgress',p_mission_id], '') !~ '^[0-9]{1,6}$' then
    return jsonb_build_object('ok', false, 'reason', 'not_complete');
  end if;
  v_progress := (v_save.data #>> array['idle','guildMissionProgress',p_mission_id])::integer;
  if v_progress < v_target then return jsonb_build_object('ok', false, 'reason', 'not_complete'); end if;
  if exists (select 1 from public.guild_mission_claims
    where guild_id=v_guild and user_id=v_uid and mission_id=p_mission_id) then
    return jsonb_build_object('ok', false, 'reason', 'already_claimed');
  end if;
  if coalesce(v_save.data #>> '{idle,bank,gold}', '') !~ '^[0-9]{1,9}$'
    or coalesce(v_save.data #>> '{idle,bank,crystals}', '') !~ '^[0-9]{1,7}$' then
    return jsonb_build_object('ok', false, 'reason', 'currency_unavailable');
  end if;
  v_gold := (v_save.data #>> '{idle,bank,gold}')::bigint + v_gold_reward;
  v_crystals := (v_save.data #>> '{idle,bank,crystals}')::bigint + v_crystal_reward;
  if v_gold > 50000000 or v_crystals > 1000000 then
    return jsonb_build_object('ok', false, 'reason', 'currency_cap');
  end if;
  v_claimed := v_save.data #> '{idle,guildMissionsClaimed}';
  if jsonb_typeof(v_claimed) <> 'array' then v_claimed := '[]'::jsonb; end if;
  insert into public.guild_mission_claims(guild_id,user_id,mission_id)
    values(v_guild,v_uid,p_mission_id);
  update public.game_saves set
    data = jsonb_set(
      jsonb_set(
        jsonb_set(v_save.data, '{idle,bank,gold}', to_jsonb(v_gold), false),
        '{idle,bank,crystals}', to_jsonb(v_crystals), false),
      '{idle,guildMissionsClaimed}', v_claimed || to_jsonb(p_mission_id), true),
    save_version = v_save.save_version + 1, updated_at = now()
  where user_id = v_uid and save_version = v_save.save_version
  returning save_version into v_new_version;
  if not found then raise exception 'Save changed during mission claim'; end if;
  update public.guilds set xp = xp + v_xp_reward where id = v_guild;
  return jsonb_build_object('ok', true, 'server_version', v_new_version,
    'gold', v_gold, 'crystals', v_crystals, 'guild_xp', v_xp_reward);
end;
$$;
revoke all on function public.claim_player_guild_mission(text,bigint) from public, anon;
grant execute on function public.claim_player_guild_mission(text,bigint) to authenticated;
