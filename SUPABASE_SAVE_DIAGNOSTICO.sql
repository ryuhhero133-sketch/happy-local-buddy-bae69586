-- =====================================================================
-- DIAGNÓSTICO + CORREÇÃO DO SAVE EM NUVEM (game_saves)
-- NÃO altera nível, progresso, inventário, ranking ou qualquer dado.
-- Rode PARTE POR PARTE no SQL Editor (evita timeout de conexão).
-- =====================================================================

-- ---------------------------------------------------------------------
-- PARTE 1 — DIAGNÓSTICO (somente leitura)
-- ---------------------------------------------------------------------
set lock_timeout = '3s';

-- 1.1 RLS ligado?
select relname, relrowsecurity as rls_ligado, relforcerowsecurity
from pg_class where relname = 'game_saves';

-- 1.2 Políticas existentes (precisa ter SELECT, INSERT e UPDATE do dono)
select polname, polcmd,
       pg_get_expr(polqual, polrelid)      as using_expr,
       pg_get_expr(polwithcheck, polrelid) as check_expr
from pg_policy where polrelid = 'public.game_saves'::regclass;

-- 1.3 Grants (sem GRANT o PostgREST devolve "permission denied")
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'game_saves';

-- 1.4 Triggers ativas
select tgname, tgenabled, p.proname
from pg_trigger t join pg_proc p on p.oid = t.tgfoid
where tgrelid = 'public.game_saves'::regclass and not tgisinternal;

-- 1.5 Índice único em user_id (sem ele o upsert on_conflict falha)
select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename = 'game_saves';

-- 1.6 Locks/consultas travando a tabela agora
select pid, state, wait_event_type, wait_event,
       now() - query_start as duracao, left(query, 120) as query
from pg_stat_activity
where query ilike '%game_saves%' and pid <> pg_backend_pid()
order by duracao desc nulls last;

-- ---------------------------------------------------------------------
-- PARTE 2 — GRANTS + POLÍTICAS DO DONO (idempotente, seguro)
-- ---------------------------------------------------------------------
set lock_timeout = '3s';

grant select, insert, update on public.game_saves to authenticated;
grant all on public.game_saves to service_role;

create unique index if not exists game_saves_user_id_key
  on public.game_saves (user_id);

alter table public.game_saves enable row level security;

drop policy if exists game_saves_select_own on public.game_saves;
create policy game_saves_select_own on public.game_saves
  for select to authenticated
  using (user_id::text = auth.uid()::text);

drop policy if exists game_saves_insert_own on public.game_saves;
create policy game_saves_insert_own on public.game_saves
  for insert to authenticated
  with check (user_id::text = auth.uid()::text);

drop policy if exists game_saves_update_own on public.game_saves;
create policy game_saves_update_own on public.game_saves
  for update to authenticated
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

-- ---------------------------------------------------------------------
-- PARTE 3 — TRIGGER ANTI-CHEAT À PROVA DE FALHA (rápida e sem bloquear)
-- Mantém os limites (nível 10k, ouro 50M, cristal 1M, coleção 500),
-- mas NUNCA derruba o save inteiro: em erro, deixa passar e registra.
-- ---------------------------------------------------------------------
set lock_timeout = '3s';

create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
  lvl numeric;
  gold numeric;
  crystal numeric;
begin
  begin
    d := new.data;
    if d is null or jsonb_typeof(d) <> 'object' then
      return new;
    end if;

    lvl     := nullif(d #>> '{idle,trainerLevel}', '')::numeric;
    gold    := nullif(d #>> '{idle,gold}', '')::numeric;
    crystal := nullif(d #>> '{idle,crystals}', '')::numeric;

    if lvl is not null and lvl > 10000 then
      d := jsonb_set(d, '{idle,trainerLevel}', to_jsonb(10000));
    end if;
    if gold is not null and gold > 50000000 then
      d := jsonb_set(d, '{idle,gold}', to_jsonb(50000000));
    end if;
    if crystal is not null and crystal > 1000000 then
      d := jsonb_set(d, '{idle,crystals}', to_jsonb(1000000));
    end if;

    new.data := d;
  exception when others then
    -- Falha no cap nunca pode custar o progresso do jogador.
    raise warning 'enforce_game_save_caps ignorado: %', sqlerrm;
    return new;
  end;
  return new;
end;
$$;

drop trigger if exists trg_game_saves_caps on public.game_saves;
create trigger trg_game_saves_caps
  before insert or update on public.game_saves
  for each row execute function public.enforce_game_save_caps();

-- ---------------------------------------------------------------------
-- PARTE 4 — VALIDAÇÃO FINAL
-- ---------------------------------------------------------------------
select
  (select count(*) from pg_policy where polrelid='public.game_saves'::regclass) as politicas,
  (select count(*) from information_schema.role_table_grants
     where table_name='game_saves' and grantee='authenticated') as grants_authenticated,
  (select count(*) from pg_trigger
     where tgrelid='public.game_saves'::regclass and not tgisinternal) as triggers;
