-- =====================================================================
-- BLINDAGEM DE SEGURANÇA (100% PREVENTIVA)
-- Rode UMA VEZ no Supabase > SQL Editor.
--
-- GARANTIAS:
--   * NENHUM UPDATE/DELETE em progresso existente (saves, itens, pokémon,
--     moedas, níveis, ranked) é executado por este script.
--   * Nada é resetado, recalculado ou restaurado.
--   * Apenas: privilégios, policies, triggers, RPCs e auditoria.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) AUDITORIA (somente leitura para admin; nunca altera jogadores)
-- ---------------------------------------------------------------------
create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  kind text not null,
  detail jsonb not null default '{}'::jsonb
);

revoke all on public.security_audit_log from anon, authenticated;
grant all on public.security_audit_log to service_role;
alter table public.security_audit_log enable row level security;

create index if not exists security_audit_log_created_idx
  on public.security_audit_log (created_at desc);
create index if not exists security_audit_log_user_idx
  on public.security_audit_log (user_id, created_at desc);

create or replace function public.log_security_event(_user uuid, _kind text, _detail jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.security_audit_log (user_id, kind, detail)
  values (_user, _kind, coalesce(_detail, '{}'::jsonb));
exception when others then
  -- auditoria nunca pode derrubar o save do jogador
  null;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) PAPÉIS ADMIN VALIDADOS NO SERVIDOR (nunca no navegador)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

revoke all on public.user_roles from anon;
grant select on public.user_roles to authenticated;   -- leitura apenas do próprio papel (RLS abaixo)
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

drop policy if exists "read own roles" on public.user_roles;
create policy "read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
-- Sem policy de INSERT/UPDATE/DELETE: papéis só mudam via service_role.

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- ---------------------------------------------------------------------
-- 3) GAME_SAVES — trigger ÚNICO, cobrindo INSERT e UPDATE
--    (limpa triggers duplicados/conflitantes; clampa, nunca apaga)
-- ---------------------------------------------------------------------

-- Marca d'água do progresso, mantida pelo servidor. Serve para detectar
-- saltos impossíveis inclusive via DELETE + INSERT.
create table if not exists public.progress_guard (
  user_id uuid primary key,
  max_trainer_level integer not null default 1,
  updated_at timestamptz not null default now()
);

revoke all on public.progress_guard from anon, authenticated;
grant all on public.progress_guard to service_role;
alter table public.progress_guard enable row level security;

create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
  _lvl_text text;
  _lvl integer;
  _prev integer;
  _prev_at timestamptz;
  _allowed integer;
begin
  begin
    _uid := new.user_id::uuid;
  exception when others then
    _uid := null;
  end;

  -- Caps duros do jogo (clamp, nunca rejeita o save inteiro).
  if (new.data #>> '{idle,gold}') ~ '^[0-9]+$' and (new.data #>> '{idle,gold}')::numeric > 50000000 then
    new.data := jsonb_set(new.data, '{idle,gold}', to_jsonb(50000000));
    perform public.log_security_event(_uid, 'cap_gold', jsonb_build_object('raw', new.data #>> '{idle,gold}'));
  end if;

  if (new.data #>> '{idle,crystals}') ~ '^[0-9]+$' and (new.data #>> '{idle,crystals}')::numeric > 1000000 then
    new.data := jsonb_set(new.data, '{idle,crystals}', to_jsonb(1000000));
    perform public.log_security_event(_uid, 'cap_crystals', jsonb_build_object('raw', new.data #>> '{idle,crystals}'));
  end if;

  _lvl_text := coalesce(new.data #>> '{idle,trainerLevel}', new.data #>> '{idle,trainer_level}');

  if _lvl_text ~ '^[0-9]+$' then
    _lvl := _lvl_text::integer;

    -- Cap absoluto
    if _lvl > 10000 then
      perform public.log_security_event(_uid, 'cap_trainer_level', jsonb_build_object('raw', _lvl));
      _lvl := 10000;
    end if;

    -- Anti-salto: compara com a marca d'água do servidor.
    select max_trainer_level, updated_at into _prev, _prev_at
    from public.progress_guard where user_id = _uid;

    if _uid is not null and _prev is not null then
      -- tolerância generosa: 200 níveis + 60 níveis por minuto decorrido
      _allowed := _prev + 200 + greatest(0, floor(extract(epoch from (now() - _prev_at)) / 60) * 60)::integer;
      if _lvl > _allowed then
        perform public.log_security_event(
          _uid, 'suspicious_level_jump',
          jsonb_build_object('from', _prev, 'to', _lvl, 'allowed', _allowed, 'op', tg_op)
        );
        _lvl := _allowed;   -- clampa para o máximo plausível, nunca reduz progresso real
      end if;
    end if;

    if _uid is not null then
      insert into public.progress_guard (user_id, max_trainer_level, updated_at)
      values (_uid, greatest(1, _lvl), now())
      on conflict (user_id) do update
        set max_trainer_level = greatest(public.progress_guard.max_trainer_level, excluded.max_trainer_level),
            updated_at = now();
    end if;

    if _lvl::text <> _lvl_text then
      if new.data #>> '{idle,trainerLevel}' is not null then
        new.data := jsonb_set(new.data, '{idle,trainerLevel}', to_jsonb(_lvl));
      end if;
      if new.data #>> '{idle,trainer_level}' is not null then
        new.data := jsonb_set(new.data, '{idle,trainer_level}', to_jsonb(_lvl));
      end if;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- Remove TODOS os triggers antigos/duplicados de cap neste tabela.
do $$
declare t record;
begin
  for t in
    select tgname from pg_trigger
    where tgrelid = 'public.game_saves'::regclass and not tgisinternal
  loop
    execute format('drop trigger if exists %I on public.game_saves', t.tgname);
  end loop;
end $$;

create trigger trg_game_saves_caps
before insert or update on public.game_saves
for each row execute function public.enforce_game_save_caps();

-- Save é privado do dono (mantém o que já existe, apenas garante).
revoke all on public.game_saves from anon;
grant select, insert, update, delete on public.game_saves to authenticated;
grant all on public.game_saves to service_role;
alter table public.game_saves enable row level security;

-- ---------------------------------------------------------------------
-- 4) RANKED — o navegador perde qualquer permissão de escrita
-- ---------------------------------------------------------------------
revoke insert, update, delete on public.ranked_scores from anon, authenticated;
revoke insert, update, delete on public.ranked_leaderboard from anon, authenticated;
revoke insert, update, delete on public.ranked_seasons from anon, authenticated;
grant select on public.ranked_scores, public.ranked_leaderboard, public.ranked_seasons to anon, authenticated;
grant all on public.ranked_scores, public.ranked_leaderboard, public.ranked_seasons to service_role;

drop policy if exists "Users can upsert own ranked leaderboard" on public.ranked_leaderboard;
drop policy if exists "Users can update own ranked leaderboard" on public.ranked_leaderboard;
drop policy if exists "Users can insert own ranked score" on public.ranked_scores;
drop policy if exists "Users can update own ranked score" on public.ranked_scores;

-- Também tranca a tabela de presença `players`, se existir (fallback do ranking).
do $$
begin
  if to_regclass('public.players') is not null then
    execute 'revoke update (trainer_level, craft_points) on public.players from anon, authenticated';
  end if;
exception when others then null;
end $$;

-- ---------------------------------------------------------------------
-- 5) RPC AUTORITATIVA — ignora o valor enviado pelo cliente
-- ---------------------------------------------------------------------
create or replace function public.record_ranked_score(
  _level integer default null,
  _craft_points integer default null,
  _guild_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _season uuid;
  _username text;
  _server_level integer := 1;
  _server_prisma integer := 0;
  _save jsonb;
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  -- FONTE DA VERDADE: o save do servidor. Os parâmetros do cliente são ignorados.
  select data into _save from public.game_saves where user_id = _uid::text limit 1;

  if _save is not null then
    if (_save #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then
      _server_level := (_save #>> '{idle,trainerLevel}')::integer;
    elsif (_save #>> '{idle,trainer_level}') ~ '^[0-9]+$' then
      _server_level := (_save #>> '{idle,trainer_level}')::integer;
    end if;

    if (_save #>> '{idle,prismaCrystals}') ~ '^[0-9]+$' then
      _server_prisma := (_save #>> '{idle,prismaCrystals}')::integer;
    elsif (_save #>> '{idle,craftPoints}') ~ '^[0-9]+$' then
      _server_prisma := (_save #>> '{idle,craftPoints}')::integer;
    end if;
  end if;

  -- Divergência entre o que o cliente afirma e o que o servidor tem = auditoria.
  if _level is not null and _level > _server_level + 50 then
    perform public.log_security_event(
      _uid, 'ranked_client_level_mismatch',
      jsonb_build_object('client', _level, 'server', _server_level)
    );
  end if;

  _server_level  := greatest(1, least(_server_level, 10000));
  _server_prisma := greatest(0, least(_server_prisma, 1000000));

  select id into _season
  from public.ranked_seasons where is_current = true
  order by started_at desc limit 1;

  if _season is null then
    insert into public.ranked_seasons (started_at, ends_at, is_current)
    values (now(), now() + interval '30 days', true)
    returning id into _season;
  end if;

  _username := coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'username', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'name', ''),
    'Treinador'
  );

  insert into public.ranked_leaderboard (
    season_id, user_id, username, trainer_level, craft_points, guild_name, score, updated_at
  ) values (
    _season, _uid, _username, _server_level, _server_prisma,
    left(coalesce(_guild_name, ''), 40), (_server_level::bigint * 100) + _server_prisma, now()
  )
  on conflict (season_id, user_id) do update set
    username = excluded.username,
    trainer_level = excluded.trainer_level,
    craft_points = excluded.craft_points,
    guild_name = excluded.guild_name,
    score = excluded.score,
    updated_at = now();

  insert into public.ranked_scores (user_id, username, trainer_level, pokedex_count, updated_at)
  values (_uid, _username, _server_level, _server_prisma, now())
  on conflict (user_id) do update set
    username = excluded.username,
    trainer_level = excluded.trainer_level,
    pokedex_count = excluded.pokedex_count,
    updated_at = now();
end;
$$;

revoke all on function public.record_ranked_score(integer, integer, text) from anon;
grant execute on function public.record_ranked_score(integer, integer, text) to authenticated;

-- ---------------------------------------------------------------------
-- 6) PRESENTES/ADMIN — escrita só para quem tem papel admin no servidor
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.admin_gifts') is not null then
    execute 'alter table public.admin_gifts enable row level security';
    execute 'drop policy if exists "admin can insert gifts" on public.admin_gifts';
    execute 'create policy "admin can insert gifts" on public.admin_gifts
             for insert to authenticated with check (public.has_role(auth.uid(), ''admin''))';
    execute 'drop policy if exists "read own gifts" on public.admin_gifts';
    execute 'create policy "read own gifts" on public.admin_gifts
             for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), ''admin''))';
  end if;
exception when others then null;
end $$;

-- ---------------------------------------------------------------------
-- 7) RELATÓRIO (somente leitura — não altera nada)
-- ---------------------------------------------------------------------
-- Contas com eventos suspeitos registrados:
-- select user_id, kind, count(*), max(created_at)
-- from public.security_audit_log
-- where kind in ('suspicious_level_jump','ranked_client_level_mismatch','cap_trainer_level')
-- group by 1,2 order by 4 desc;
--
-- Divergência ranked x save (apenas listagem, sem correção automática):
-- select rs.user_id, rs.username, rs.trainer_level as ranked_level,
--        (gs.data #>> '{idle,trainerLevel}') as save_level
-- from public.ranked_scores rs
-- left join public.game_saves gs on gs.user_id = rs.user_id::text
-- where coalesce((gs.data #>> '{idle,trainerLevel}')::int, 0) < rs.trainer_level - 50
-- order by rs.trainer_level desc;
