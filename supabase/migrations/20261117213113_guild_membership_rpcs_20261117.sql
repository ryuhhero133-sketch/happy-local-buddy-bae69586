create or replace function public.invite_player_to_guild(p_guild uuid, p_username text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_target uuid;
  v_name text;
  v_guild_name text;
  v_id uuid;
  v_matches integer;
begin
  if v_uid is null then raise exception 'Entre na sua conta.'; end if;
  if not exists (select 1 from public.guild_members where guild_id=p_guild and user_id=v_uid) then
    raise exception 'Você não pertence à guilda.';
  end if;
  select count(*) into v_matches from public.profiles
    where lower(username) = lower(btrim(p_username));
  if v_matches > 1 then raise exception 'Nome duplicado; peça ao jogador para usar um nome único.'; end if;
  select id, username into v_target, v_name from public.profiles
    where lower(username) = lower(btrim(p_username)) limit 1;
  if v_target is null then raise exception 'Jogador não encontrado.'; end if;
  if v_target = v_uid then raise exception 'Você não pode convidar a si mesmo.'; end if;
  if exists (select 1 from public.guild_members where user_id=v_target) then
    raise exception 'Jogador já está em uma guilda.';
  end if;
  if exists (select 1 from public.guild_invites
    where guild_id=p_guild and to_user_id=v_target and status='pending') then
    raise exception 'Convite já pendente.';
  end if;
  select name into v_guild_name from public.guilds where id=p_guild;
  insert into public.guild_invites
    (guild_id,guild_name,from_user_id,from_username,to_user_id,to_username)
  values (p_guild,v_guild_name,v_uid,
    (select username from public.profiles where id=v_uid),v_target,v_name)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.invite_player_to_guild(uuid,text) from public, anon;
grant execute on function public.invite_player_to_guild(uuid,text) to authenticated;

create or replace function public.accept_player_guild_invite(p_invite uuid, p_level integer, p_species text default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.guild_invites%rowtype;
begin
  if v_uid is null then raise exception 'Entre na sua conta.'; end if;
  select * into v_invite from public.guild_invites
    where id=p_invite and to_user_id=v_uid and status='pending' for update;
  if not found then raise exception 'Convite inexistente ou expirado.'; end if;
  if exists (select 1 from public.guild_members where user_id=v_uid) then
    raise exception 'Você já está em uma guilda.';
  end if;
  insert into public.guild_members(guild_id,user_id,username,role,level,leader_species)
  values (v_invite.guild_id,v_uid,
    (select username from public.profiles where id=v_uid),'member',
    greatest(1,least(coalesce(p_level,1),1000000)),left(p_species,100));
  update public.guild_invites set status='accepted' where id=p_invite;
  return v_invite.guild_id;
end;
$$;
revoke all on function public.accept_player_guild_invite(uuid,integer,text) from public, anon;
grant execute on function public.accept_player_guild_invite(uuid,integer,text) to authenticated;

create or replace function public.leave_player_guild()
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Entre na sua conta.'; end if;
  if exists (select 1 from public.guilds where founder_id=v_uid) then
    raise exception 'O fundador deve transferir ou dissolver a guilda antes de sair.';
  end if;
  delete from public.guild_members where user_id=v_uid;
  return found;
end;
$$;
revoke all on function public.leave_player_guild() from public, anon;
grant execute on function public.leave_player_guild() to authenticated;

create or replace function public.decline_player_guild_invite(p_invite uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  update public.guild_invites set status='declined'
    where id=p_invite and status='pending' and to_user_id=auth.uid();
  return found;
end;
$$;
revoke all on function public.decline_player_guild_invite(uuid) from public, anon;
grant execute on function public.decline_player_guild_invite(uuid) to authenticated;

create or replace function public.kick_player_guild_member(p_guild uuid, p_member uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  if not exists (select 1 from public.guilds
    where id=p_guild and founder_id=auth.uid()) then
    raise exception 'Apenas o fundador pode remover membros.';
  end if;
  if p_member=auth.uid() then raise exception 'O fundador não pode expulsar a si mesmo.'; end if;
  delete from public.guild_members where guild_id=p_guild and user_id=p_member;
  return found;
end;
$$;
revoke all on function public.kick_player_guild_member(uuid,uuid) from public, anon;
grant execute on function public.kick_player_guild_member(uuid,uuid) to authenticated;
