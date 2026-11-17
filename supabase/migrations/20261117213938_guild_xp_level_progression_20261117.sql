-- Mission XP levels the guild persistently; keep claim security and rewards unchanged.
create or replace function public.guild_progress_after_xp(
  p_level integer, p_xp integer, p_gain integer)
returns jsonb language plpgsql immutable set search_path = ''
as $$
declare
  v_level integer := greatest(1, least(coalesce(p_level, 1), 10));
  v_xp integer := greatest(0, coalesce(p_xp, 0)) + greatest(0, coalesce(p_gain, 0));
  v_needed integer;
begin
  while v_level < 10 loop
    v_needed := round(50 * power(1.55, v_level - 1))::integer;
    exit when v_xp < v_needed;
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
  end loop;
  return jsonb_build_object('level', v_level, 'xp', case when v_level >= 10 then 0 else v_xp end);
end;
$$;
revoke all on function public.guild_progress_after_xp(integer,integer,integer) from public, anon;
grant execute on function public.guild_progress_after_xp(integer,integer,integer) to authenticated;

do $migration$
declare
  v_definition text;
  v_needle text := 'update public.guilds set xp=xp+v_xp_reward where id=v_guild;';
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'claim_player_guild_mission'
    and pg_get_function_identity_arguments(p.oid) = 'p_mission_id text, p_expected_version bigint';
  if v_definition is null or strpos(v_definition, v_needle) = 0 then
    raise exception 'claim_player_guild_mission body changed; review before adding guild level progression';
  end if;
  execute replace(v_definition, v_needle,
    'update public.guilds set ' ||
    'xp = (public.guild_progress_after_xp(level,xp,v_xp_reward)->>''xp'')::integer, ' ||
    'level = (public.guild_progress_after_xp(level,xp,v_xp_reward)->>''level'')::integer ' ||
    'where id = v_guild;');
end;
$migration$;
