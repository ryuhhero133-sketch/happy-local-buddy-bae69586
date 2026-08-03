-- =====================================================================
-- AUDITORIA ROBUSTA + REFORÇO DE SEGURANÇA (100% PREVENTIVO)
-- Rode UMA VEZ no Supabase > SQL Editor. Idempotente.
--
-- GARANTIAS:
--   * NENHUM UPDATE/DELETE em save, nível, inventário, moedas, pokémon
--     ou ranking é executado por este script.
--   * Nada é resetado, recalculado ou restaurado.
--   * Apenas: tabela de auditoria, RPC de log, e registro automático
--     das mudanças críticas de save via trigger.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) TABELA DE AUDITORIA (somente service_role lê/escreve direto)
-- ---------------------------------------------------------------------
create table if not exists public.audit_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid,
  username    text,
  kind        text not null,        -- login | ip | save_delta | currency | level | purchase | admin_action
  ip          text,
  user_agent  text,
  detail      jsonb not null default '{}'::jsonb
);

create index if not exists audit_events_created_idx on public.audit_events (created_at desc);
create index if not exists audit_events_user_idx    on public.audit_events (user_id, created_at desc);
create index if not exists audit_events_kind_idx    on public.audit_events (kind, created_at desc);

revoke all on public.audit_events from anon, authenticated;
grant all on public.audit_events to service_role;
alter table public.audit_events enable row level security;

-- Admin (papel no servidor) pode ler a auditoria.
drop policy if exists audit_events_admin_read on public.audit_events;
create policy audit_events_admin_read on public.audit_events
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

grant select on public.audit_events to authenticated;  -- filtrado pela policy acima

-- ---------------------------------------------------------------------
-- 2) RPC DE LOG (cliente só pode registrar em nome de si mesmo)
--    O user_id NUNCA vem do cliente: é lido de auth.uid().
-- ---------------------------------------------------------------------
create or replace function public.log_audit_event(
  _kind text,
  _detail jsonb default '{}'::jsonb,
  _ip text default null,
  _user_agent text default null,
  _username text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then return; end if;
  if _kind is null or length(_kind) > 40 then return; end if;

  insert into public.audit_events (user_id, username, kind, ip, user_agent, detail)
  values (
    _uid,
    nullif(left(coalesce(_username, ''), 40), ''),
    _kind,
    nullif(left(coalesce(_ip, ''), 64), ''),
    nullif(left(coalesce(_user_agent, ''), 400), ''),
    coalesce(_detail, '{}'::jsonb)
  );
exception when others then
  null;  -- auditoria nunca pode derrubar a ação do jogador
end;
$$;

revoke all on function public.log_audit_event(text, jsonb, text, text, text) from public, anon;
grant execute on function public.log_audit_event(text, jsonb, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3) AUDITORIA AUTOMÁTICA DE SAVE (delta de nível / ouro / cristais)
--    Apenas REGISTRA. Não altera, não bloqueia, não clampa nada aqui —
--    o clamp continua no trigger de segurança já existente.
-- ---------------------------------------------------------------------
create or replace function public.audit_game_save_delta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
  _old_lvl numeric := 0; _new_lvl numeric := 0;
  _old_gold numeric := 0; _new_gold numeric := 0;
begin
  begin _uid := new.user_id::uuid; exception when others then _uid := null; end;

  if tg_op = 'UPDATE' then
    _old_lvl  := coalesce(nullif(old.data #>> '{idle,trainerLevel}', '')::numeric, 0);
    _old_gold := coalesce(nullif(old.data #>> '{idle,gold}', '')::numeric, 0);
  end if;
  _new_lvl  := coalesce(nullif(new.data #>> '{idle,trainerLevel}', '')::numeric, 0);
  _new_gold := coalesce(nullif(new.data #>> '{idle,gold}', '')::numeric, 0);

  -- Saltos anormais entre dois saves consecutivos = registro para investigação.
  if (_new_lvl - _old_lvl) > 250 or (_new_gold - _old_gold) > 20000000 then
    insert into public.audit_events (user_id, kind, detail)
    values (_uid, 'save_delta', jsonb_build_object(
      'op', tg_op,
      'level_from', _old_lvl, 'level_to', _new_lvl,
      'gold_from', _old_gold, 'gold_to', _new_gold
    ));
  end if;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_game_saves_audit on public.game_saves;
create trigger trg_game_saves_audit
after insert or update on public.game_saves
for each row execute function public.audit_game_save_delta();

-- ---------------------------------------------------------------------
-- 4) RELATÓRIOS (somente leitura — nada é alterado)
-- ---------------------------------------------------------------------
-- Contas com saltos suspeitos de save:
-- select user_id, count(*), max(created_at), max(detail->>'level_to')
-- from public.audit_events where kind = 'save_delta'
-- group by 1 order by 3 desc limit 50;

-- Logins e IPs recentes:
-- select created_at, username, ip, user_agent from public.audit_events
-- where kind in ('login','ip') order by created_at desc limit 100;

-- Multi-conta pelo mesmo IP:
-- select ip, count(distinct user_id) contas, array_agg(distinct username) quem
-- from public.audit_events where ip is not null
-- group by ip having count(distinct user_id) > 1 order by contas desc;
