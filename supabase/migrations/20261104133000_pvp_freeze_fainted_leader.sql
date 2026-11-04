-- Líder derrotado fica no ponto onde caiu; não acompanha o treinador.
create or replace function public.pvp_heartbeat(
  p_map_id text,
  p_x integer,
  p_y integer,
  p_leader_species text,
  p_leader_level integer,
  p_player_name text
) returns public.pvp_presence
language plpgsql security definer set search_path = public as $$
declare result public.pvp_presence;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.pvp_presence (user_id, player_name, map_id, x, y, leader_species, leader_level)
  values (auth.uid(), left(coalesce(p_player_name, 'Treinador'), 32), left(p_map_id, 32),
    greatest(-100000, least(100000, p_x)), greatest(-100000, least(100000, p_y)),
    left(coalesce(p_leader_species, ''), 64), greatest(1, least(1000000, p_leader_level)))
  on conflict (user_id) do update set
    player_name = excluded.player_name,
    map_id = case when public.pvp_presence.hp <= 0 then public.pvp_presence.map_id else excluded.map_id end,
    x = case when public.pvp_presence.hp <= 0 then public.pvp_presence.x else excluded.x end,
    y = case when public.pvp_presence.hp <= 0 then public.pvp_presence.y else excluded.y end,
    leader_species = case when public.pvp_presence.hp <= 0 then public.pvp_presence.leader_species else excluded.leader_species end,
    leader_level = case when public.pvp_presence.hp <= 0 then public.pvp_presence.leader_level else excluded.leader_level end,
    hp = case when public.pvp_presence.hp <= 0
                and public.pvp_presence.last_death_at < now() - interval '5 minutes'
              then 100 else public.pvp_presence.hp end,
    updated_at = now()
  returning * into result;
  return result;
end;
$$;

grant execute on function public.pvp_heartbeat(text, integer, integer, text, integer, text) to authenticated;
