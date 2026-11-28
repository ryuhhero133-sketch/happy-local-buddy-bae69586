-- Party: corrige a 5ª vaga.
--
-- Antes, qualquer convite pendente reservava vaga para sempre. Um convite que
-- o jogador nunca respondeu deixava a party travada em 4/5: o líder tentava
-- convidar outra pessoa e recebia "A party já reservou todas as 5 vagas".
-- Agora:
--   * convites pendentes vencem em 15 minutos;
--   * reconvidar o mesmo jogador reaproveita e renova o convite existente;
--   * o líder recebe os convites enviados e pode cancelá-los;
--   * a 5ª pessoa entra normalmente quando aceita.

create or replace function public.invite_player_to_party(
  p_target uuid,
  p_level integer default 1,
  p_map_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_from_name text;
  v_target_name text;
  v_party public.parties%rowtype;
  v_invite_id uuid;
  v_members integer;
  v_pending integer;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para convidar para a party.';
  end if;
  if p_target is null or p_target = v_uid then
    raise exception 'Escolha outro jogador para a party.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 73417));

  select nullif(left(btrim(username), 32), '')
    into v_from_name
  from public.profiles
  where id = v_uid;
  v_from_name := coalesce(v_from_name, 'Treinador');

  select nullif(left(btrim(username), 32), '')
    into v_target_name
  from public.profiles
  where id = p_target;
  if v_target_name is null then
    raise exception 'Jogador não encontrado.';
  end if;

  select p.* into v_party
  from public.party_members m
  join public.parties p on p.id = m.party_id
  where m.player_id = v_uid
  for update of m, p;

  if not found then
    insert into public.parties(name, leader_id, leader_name)
    values (left('Party de ' || v_from_name, 64), v_uid, v_from_name)
    returning * into v_party;

    insert into public.party_members(party_id, player_id, player_name, level, map_id)
    values (
      v_party.id,
      v_uid,
      v_from_name,
      greatest(1, least(coalesce(p_level, 1), 1000000)),
      nullif(left(btrim(coalesce(p_map_id, '')), 64), '')
    );
  elsif v_party.leader_id <> v_uid then
    raise exception 'Apenas o líder pode convidar jogadores para esta party.';
  end if;

  perform 1 from public.parties where id = v_party.id for update;

  -- Convite antigo não pode reservar vaga eternamente. A limpeza é feita no
  -- próprio convite, então a próxima chamada já vê a party destravada.
  update public.party_invites
     set status = 'declined'
   where party_id = v_party.id
     and status = 'pending'
     and created_at < now() - interval '15 minutes';

  if exists (select 1 from public.party_members where player_id = p_target) then
    if exists (
      select 1 from public.party_members
      where party_id = v_party.id and player_id = p_target
    ) then
      raise exception 'Este jogador já está na sua party.';
    end if;
    raise exception 'Este jogador já está em outra party.';
  end if;

  -- Reconvite: renova o pendente em vez de tentar reservar uma segunda vaga.
  select id into v_invite_id
  from public.party_invites
  where party_id = v_party.id
    and target_id = p_target
    and status = 'pending'
  for update;
  if v_invite_id is not null then
    update public.party_invites set created_at = now() where id = v_invite_id;
    return jsonb_build_object(
      'invite_id', v_invite_id,
      'party_id', v_party.id,
      'party_name', v_party.name
    );
  end if;

  select count(*) into v_members
  from public.party_members
  where party_id = v_party.id;
  select count(*) into v_pending
  from public.party_invites
  where party_id = v_party.id
    and status = 'pending'
    and created_at >= now() - interval '15 minutes';

  if v_members + v_pending >= 5 then
    raise exception 'A party já reservou todas as 5 vagas. Cancele um convite pendente ou aguarde alguém aceitar.';
  end if;

  insert into public.party_invites(
    party_id, party_name, from_id, from_name, target_id, target_name
  )
  values (
    v_party.id, v_party.name, v_uid, v_from_name, p_target, v_target_name
  )
  returning id into v_invite_id;

  return jsonb_build_object(
    'invite_id', v_invite_id,
    'party_id', v_party.id,
    'party_name', v_party.name
  );
end;
$$;

-- Leitura da própria party, agora com os convites enviados (só para o líder).
create or replace function public.get_my_party()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_party public.parties%rowtype;
  v_members jsonb;
  v_outgoing jsonb;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para ver a party.';
  end if;

  select p.* into v_party
  from public.party_members m
  join public.parties p on p.id = m.party_id
  where m.player_id = v_uid;
  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'party_id', m.party_id,
        'player_id', m.player_id,
        'player_name', m.player_name,
        'level', m.level,
        'map_id', m.map_id,
        'joined_at', m.joined_at,
        'last_seen', m.last_seen,
        'online', m.last_seen >= now() - interval '90 seconds'
      )
      order by (m.player_id = v_party.leader_id) desc, m.joined_at asc, m.player_id asc
    ),
    '[]'::jsonb
  ) into v_members
  from public.party_members m
  where m.party_id = v_party.id;

  if v_party.leader_id = v_uid then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'party_id', i.party_id,
          'party_name', i.party_name,
          'from_id', i.from_id,
          'from_name', i.from_name,
          'target_id', i.target_id,
          'target_name', i.target_name,
          'status', i.status,
          'created_at', i.created_at
        )
        order by i.created_at desc
      ),
      '[]'::jsonb
    ) into v_outgoing
    from public.party_invites i
    where i.party_id = v_party.id
      and i.status = 'pending'
      and i.created_at >= now() - interval '15 minutes';
  else
    v_outgoing := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'party', jsonb_build_object(
      'id', v_party.id,
      'name', v_party.name,
      'leader_id', v_party.leader_id,
      'leader_name', v_party.leader_name,
      'created_at', v_party.created_at,
      'updated_at', v_party.updated_at
    ),
    'members', v_members,
    'outgoingInvites', v_outgoing
  );
end;
$$;

-- O líder pode cancelar um convite enviado e liberar a vaga na hora.
create or replace function public.cancel_party_invite(p_invite uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.party_invites%rowtype;
  v_leader_id uuid;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para cancelar o convite.';
  end if;
  if p_invite is null then
    return false;
  end if;

  select * into v_invite
  from public.party_invites
  where id = p_invite
    and status = 'pending'
  for update;
  if not found then
    return false;
  end if;

  select leader_id into v_leader_id
  from public.parties
  where id = v_invite.party_id
  for update;
  if v_leader_id is null or (v_leader_id <> v_uid and v_invite.from_id <> v_uid) then
    raise exception 'Apenas o líder pode cancelar este convite.';
  end if;

  update public.party_invites
  set status = 'declined'
  where id = p_invite;
  return true;
end;
$$;

revoke all on function public.invite_player_to_party(uuid, integer, text) from public, anon;
revoke all on function public.get_my_party() from public, anon;
revoke all on function public.cancel_party_invite(uuid) from public, anon;
grant execute on function public.invite_player_to_party(uuid, integer, text) to authenticated;
grant execute on function public.get_my_party() to authenticated;
grant execute on function public.cancel_party_invite(uuid) to authenticated;
