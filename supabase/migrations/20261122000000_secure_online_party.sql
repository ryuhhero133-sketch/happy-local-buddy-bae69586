-- Party online segura: o cliente nunca recebe permissao direta de escrita.
-- Todas as transicoes (criar, convidar, aceitar, sair e remover) sao feitas
-- por RPCs autenticadas e transacionais, com limite rigido de 5 membros.

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 64),
  leader_id uuid not null references auth.users(id) on delete cascade,
  leader_name text not null check (char_length(leader_name) between 1 and 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.party_members (
  party_id uuid not null references public.parties(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 32),
  level integer not null default 1 check (level between 1 and 1000000),
  map_id text check (map_id is null or char_length(map_id) between 1 and 64),
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (party_id, player_id),
  unique (player_id)
);

create table if not exists public.party_invites (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  party_name text not null check (char_length(party_name) between 1 and 64),
  from_id uuid not null references auth.users(id) on delete cascade,
  from_name text not null check (char_length(from_name) between 1 and 32),
  target_id uuid not null references auth.users(id) on delete cascade,
  target_name text not null check (char_length(target_name) between 1 and 32),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists party_members_party_seen_idx
  on public.party_members (party_id, last_seen desc);
create index if not exists party_invites_target_pending_idx
  on public.party_invites (target_id, status, created_at desc);
create unique index if not exists party_invites_one_pending_target_idx
  on public.party_invites (party_id, target_id)
  where status = 'pending';

alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.party_invites enable row level security;

-- Defense in depth: even if a future grant is added by mistake, direct Data
-- API access remains blocked. SECURITY DEFINER RPCs below are the only path.
drop policy if exists party_no_direct_access on public.parties;
drop policy if exists party_member_no_direct_access on public.party_members;
drop policy if exists party_invite_no_direct_access on public.party_invites;
create policy party_no_direct_access on public.parties
  for all to authenticated using (false) with check (false);
create policy party_member_no_direct_access on public.party_members
  for all to authenticated using (false) with check (false);
create policy party_invite_no_direct_access on public.party_invites
  for all to authenticated using (false) with check (false);

revoke all on table public.parties, public.party_members, public.party_invites
  from public, anon, authenticated;
grant all on table public.parties, public.party_members, public.party_invites
  to service_role;

-- Cria uma party vazia (com o proprio criador como primeiro membro).
create or replace function public.create_player_party(
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
  v_name text;
  v_party public.parties%rowtype;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para criar uma party.';
  end if;

  -- Serializa criacoes concorrentes do mesmo usuario.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 73417));

  select p.* into v_party
  from public.party_members m
  join public.parties p on p.id = m.party_id
  where m.player_id = v_uid
  for update of m, p;

  if found then
    return jsonb_build_object(
      'id', v_party.id,
      'name', v_party.name,
      'leader_id', v_party.leader_id,
      'leader_name', v_party.leader_name,
      'created_at', v_party.created_at,
      'updated_at', v_party.updated_at
    );
  end if;

  select nullif(left(btrim(username), 32), '')
    into v_name
  from public.profiles
  where id = v_uid;
  v_name := coalesce(v_name, 'Treinador');

  insert into public.parties(name, leader_id, leader_name)
  values (left('Party de ' || v_name, 64), v_uid, v_name)
  returning * into v_party;

  insert into public.party_members(party_id, player_id, player_name, level, map_id)
  values (
    v_party.id,
    v_uid,
    v_name,
    greatest(1, least(coalesce(p_level, 1), 1000000)),
    nullif(left(btrim(coalesce(p_map_id, '')), 64), '')
  );

  return jsonb_build_object(
    'id', v_party.id,
    'name', v_party.name,
    'leader_id', v_party.leader_id,
    'leader_name', v_party.leader_name,
    'created_at', v_party.created_at,
    'updated_at', v_party.updated_at
  );
end;
$$;

-- Convida um jogador autenticado por ID. Se o convidador ainda nao tiver
-- party, ela e criada no mesmo commit. Nomes, lideranca e vagas sao todos
-- validados no banco, sem confiar no cliente.
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

  -- A linha da party fica bloqueada durante a contagem e o convite, evitando
  -- que aceites/convites simultaneos ultrapassem as 5 vagas.
  perform 1 from public.parties where id = v_party.id for update;

  if exists (select 1 from public.party_members where player_id = p_target) then
    if exists (
      select 1 from public.party_members
      where party_id = v_party.id and player_id = p_target
    ) then
      raise exception 'Este jogador já está na sua party.';
    end if;
    raise exception 'Este jogador já está em outra party.';
  end if;

  select count(*) into v_members
  from public.party_members
  where party_id = v_party.id;
  select count(*) into v_pending
  from public.party_invites
  where party_id = v_party.id and status = 'pending';

  if v_members + v_pending >= 5 then
    raise exception 'A party já reservou todas as 5 vagas.';
  end if;

  select id into v_invite_id
  from public.party_invites
  where party_id = v_party.id
    and target_id = p_target
    and status = 'pending';
  if v_invite_id is not null then
    raise exception 'Convite de party já está pendente para este jogador.';
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

-- Aceita somente o proprio convite. Para trocar de party, o jogador precisa
-- sair primeiro: assim nao ha troca silenciosa de lideranca.
create or replace function public.accept_party_invite(
  p_invite uuid,
  p_level integer default 1,
  p_map_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.party_invites%rowtype;
  v_party public.parties%rowtype;
  v_name text;
  v_members integer;
  v_current_party uuid;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para aceitar o convite.';
  end if;
  if p_invite is null then
    raise exception 'Convite inválido.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 73417));

  select * into v_invite
  from public.party_invites
  where id = p_invite
    and target_id = v_uid
    and status = 'pending'
  for update;
  if not found then
    raise exception 'Convite inexistente, respondido ou expirado.';
  end if;

  select * into v_party
  from public.parties
  where id = v_invite.party_id
  for update;
  if not found then
    raise exception 'A party não existe mais.';
  end if;

  select party_id into v_current_party
  from public.party_members
  where player_id = v_uid
  for update;

  if v_current_party is not null and v_current_party <> v_party.id then
    raise exception 'Saia da sua party atual antes de aceitar outro convite.';
  end if;

  if v_current_party = v_party.id then
    update public.party_invites
    set status = 'accepted'
    where id = v_invite.id;
    return v_party.id;
  end if;

  select count(*) into v_members
  from public.party_members
  where party_id = v_party.id;
  if v_members >= 5 then
    raise exception 'Esta party já está cheia.';
  end if;

  select nullif(left(btrim(username), 32), '')
    into v_name
  from public.profiles
  where id = v_uid;
  v_name := coalesce(v_name, 'Treinador');

  insert into public.party_members(party_id, player_id, player_name, level, map_id)
  values (
    v_party.id,
    v_uid,
    v_name,
    greatest(1, least(coalesce(p_level, 1), 1000000)),
    nullif(left(btrim(coalesce(p_map_id, '')), 64), '')
  );

  update public.party_invites
  set status = case when id = v_invite.id then 'accepted' else 'declined' end
  where target_id = v_uid
    and status = 'pending';

  return v_party.id;
end;
$$;

create or replace function public.decline_party_invite(p_invite uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para recusar o convite.';
  end if;

  update public.party_invites
  set status = 'declined'
  where id = p_invite
    and target_id = auth.uid()
    and status = 'pending';
  return found;
end;
$$;

-- Sair transfere a lideranca ao membro mais antigo; se era o ultimo membro,
-- dissolve a party e seus convites pendentes em cascata.
create or replace function public.leave_my_party()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_party_id uuid;
  v_leader_id uuid;
  v_next_id uuid;
  v_next_name text;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para sair da party.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 73417));

  select party_id into v_party_id
  from public.party_members
  where player_id = v_uid
  for update;
  if v_party_id is null then
    return false;
  end if;

  select leader_id into v_leader_id
  from public.parties
  where id = v_party_id
  for update;
  if v_leader_id is null then
    return false;
  end if;

  if v_leader_id = v_uid then
    select player_id, player_name into v_next_id, v_next_name
    from public.party_members
    where party_id = v_party_id
      and player_id <> v_uid
    order by joined_at asc, player_id asc
    limit 1
    for update;

    if v_next_id is null then
      delete from public.parties where id = v_party_id;
    else
      update public.parties
      set leader_id = v_next_id,
          leader_name = v_next_name,
          updated_at = now()
      where id = v_party_id;
      delete from public.party_members
      where party_id = v_party_id and player_id = v_uid;
    end if;
  else
    delete from public.party_members
    where party_id = v_party_id and player_id = v_uid;
  end if;

  return true;
end;
$$;

create or replace function public.kick_party_member(p_member uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_party_id uuid;
  v_leader_id uuid;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para remover um membro.';
  end if;
  if p_member is null or p_member = v_uid then
    raise exception 'Use sair da party para remover a si mesmo.';
  end if;

  select party_id into v_party_id
  from public.party_members
  where player_id = v_uid
  for update;
  if v_party_id is null then
    raise exception 'Você não pertence a uma party.';
  end if;

  select leader_id into v_leader_id
  from public.parties
  where id = v_party_id
  for update;
  if v_leader_id <> v_uid then
    raise exception 'Apenas o líder pode remover membros.';
  end if;

  delete from public.party_members
  where party_id = v_party_id
    and player_id = p_member;
  if not found then
    raise exception 'Membro não encontrado nesta party.';
  end if;

  return true;
end;
$$;

-- Mantido para o painel de party existente, sempre com a mesma validacao de
-- lideranca no servidor.
create or replace function public.transfer_party_leadership(p_member uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_party_id uuid;
  v_leader_id uuid;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para transferir a liderança.';
  end if;
  if p_member is null or p_member = v_uid then
    raise exception 'Escolha outro membro para a liderança.';
  end if;

  select party_id into v_party_id
  from public.party_members
  where player_id = v_uid
  for update;
  if v_party_id is null then
    raise exception 'Você não pertence a uma party.';
  end if;

  select leader_id into v_leader_id
  from public.parties
  where id = v_party_id
  for update;
  if v_leader_id <> v_uid then
    raise exception 'Apenas o líder pode transferir a liderança.';
  end if;

  select player_name into v_name
  from public.party_members
  where party_id = v_party_id and player_id = p_member
  for update;
  if v_name is null then
    raise exception 'Membro não encontrado nesta party.';
  end if;

  update public.parties
  set leader_id = p_member,
      leader_name = v_name,
      updated_at = now()
  where id = v_party_id;
  return true;
end;
$$;

-- Heartbeat de presenca: somente o proprio membro atualiza seu nivel/mapa.
create or replace function public.party_presence_heartbeat(
  p_level integer default 1,
  p_map_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para atualizar a presença.';
  end if;

  update public.party_members
  set level = greatest(1, least(coalesce(p_level, 1), 1000000)),
      map_id = nullif(left(btrim(coalesce(p_map_id, '')), 64), ''),
      last_seen = now()
  where player_id = auth.uid();
  return found;
end;
$$;

-- Leitura limitada à party do chamador; nao expõe a tabela pelo Data API.
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

  return jsonb_build_object(
    'party', jsonb_build_object(
      'id', v_party.id,
      'name', v_party.name,
      'leader_id', v_party.leader_id,
      'leader_name', v_party.leader_name,
      'created_at', v_party.created_at,
      'updated_at', v_party.updated_at
    ),
    'members', v_members
  );
end;
$$;

create or replace function public.list_my_party_invites()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para ver os convites.';
  end if;

  return (
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
    )
    from public.party_invites i
    where i.target_id = v_uid
      and i.status = 'pending'
  );
end;
$$;

revoke all on function public.create_player_party(integer, text) from public, anon;
revoke all on function public.invite_player_to_party(uuid, integer, text) from public, anon;
revoke all on function public.accept_party_invite(uuid, integer, text) from public, anon;
revoke all on function public.decline_party_invite(uuid) from public, anon;
revoke all on function public.leave_my_party() from public, anon;
revoke all on function public.kick_party_member(uuid) from public, anon;
revoke all on function public.transfer_party_leadership(uuid) from public, anon;
revoke all on function public.party_presence_heartbeat(integer, text) from public, anon;
revoke all on function public.get_my_party() from public, anon;
revoke all on function public.list_my_party_invites() from public, anon;

grant execute on function public.create_player_party(integer, text) to authenticated;
grant execute on function public.invite_player_to_party(uuid, integer, text) to authenticated;
grant execute on function public.accept_party_invite(uuid, integer, text) to authenticated;
grant execute on function public.decline_party_invite(uuid) to authenticated;
grant execute on function public.leave_my_party() to authenticated;
grant execute on function public.kick_party_member(uuid) to authenticated;
grant execute on function public.transfer_party_leadership(uuid) to authenticated;
grant execute on function public.party_presence_heartbeat(integer, text) to authenticated;
grant execute on function public.get_my_party() to authenticated;
grant execute on function public.list_my_party_invites() to authenticated;
