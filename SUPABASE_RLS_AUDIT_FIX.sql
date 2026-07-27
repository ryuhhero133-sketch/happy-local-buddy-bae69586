-- =====================================================================
-- AUDITORIA + CORREÇÃO DE RLS EM TODO O SCHEMA public
--
-- Objetivo: ligar Row Level Security em TODAS as tabelas públicas que
-- ainda estão sem RLS, SEM quebrar nada do jogo e SEM tocar em nenhum
-- dado (nenhum save, nível, ranking, inventário ou marketplace é lido,
-- alterado ou apagado por este script).
--
-- Regras aplicadas automaticamente por tabela:
--   A) Tabela ADMINISTRATIVA/INTERNA (banidos, logs, auditoria, guardas,
--      compras pendentes, resgates de código): RLS ligado, acesso de
--      anon/authenticated REVOGADO. Só service_role (Edge Functions /
--      backend) enxerga. service_role ignora RLS por design.
--   B) Tabela COM DONO (user_id / owner_id / seller_id / trainer_id /
--      profiles.id): RLS ligado + 4 policies do dono (select/insert/
--      update/delete) comparando SEMPRE em texto, então funciona com a
--      coluna sendo uuid OU text. Se a tabela já era lida publicamente
--      (anon tinha SELECT), a leitura pública é preservada por policy.
--   C) Tabela PÚBLICA DE LEITURA (ranking, snapshots, listagens sem
--      coluna de dono): RLS ligado + policy de SELECT para anon e
--      authenticated. Escrita continua só por RPC/service_role, que é
--      exatamente como o jogo já grava hoje.
--
-- Rode PARTE 1, confira, depois PARTE 2, depois PARTE 3.
-- Cada parte é curta e usa lock_timeout para nunca travar a conexão
-- (era isso que causava "connection timeout" nos scripts grandes).
-- =====================================================================


-- =====================================================================
-- PARTE 1 — DIAGNÓSTICO (não altera nada). Rode e veja a lista.
-- =====================================================================
set statement_timeout = '30s';

select c.relname                                as tabela,
       c.relrowsecurity                         as rls_ligado,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policies,
       (select string_agg(distinct g.grantee, ', ')
          from information_schema.role_table_grants g
         where g.table_schema = 'public' and g.table_name = c.relname
           and g.grantee in ('anon','authenticated','service_role')) as grants
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relrowsecurity, c.relname;


-- =====================================================================
-- PARTE 2 — CORREÇÃO AUTOMÁTICA (rode depois da Parte 1)
-- Só mexe em tabelas que estão SEM RLS. Tabelas já protegidas e suas
-- policies existentes ficam intactas.
-- =====================================================================
set lock_timeout = '3s';
set statement_timeout = '120s';

do $$
declare
  t          record;
  own_col    text;
  is_admin   boolean;
  anon_read  boolean;
begin
  for t in
    select c.relname as tbl
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind = 'r'
       and c.relrowsecurity = false
     order by c.relname
  loop
    -- ---- classificação A: administrativa / interna --------------------
    is_admin :=
         t.tbl in ('banned_users','security_audit_log','progress_guard',
                   'pending_purchases','code_redemptions','admin_users',
                   'support_tickets_internal')
      or t.tbl like '%\_log'   or t.tbl like '%\_logs'
      or t.tbl like 'audit%'   or t.tbl like '%audit%'
      or t.tbl like '%\_guard' or t.tbl like 'internal\_%';

    -- ---- a tabela já era lida publicamente? ---------------------------
    select exists (
      select 1 from information_schema.role_table_grants
       where table_schema = 'public' and table_name = t.tbl
         and grantee = 'anon' and privilege_type = 'SELECT'
    ) into anon_read;

    -- ---- coluna de dono, se houver ------------------------------------
    select col into own_col from (
      select a.attname as col,
             case a.attname when 'user_id' then 1 when 'owner_id' then 2
                            when 'seller_id' then 3 when 'trainer_id' then 4
                            when 'profile_id' then 5 else 9 end as pri
        from pg_attribute a
       where a.attrelid = format('public.%I', t.tbl)::regclass
         and a.attnum > 0 and not a.attisdropped
         and a.attname in ('user_id','owner_id','seller_id','trainer_id','profile_id')
       order by pri limit 1
    ) s;
    if t.tbl = 'profiles' and own_col is null then own_col := 'id'; end if;

    -- ---- A) administrativa: fecha para jogadores -----------------------
    if is_admin then
      execute format('revoke all on public.%I from anon, authenticated', t.tbl);
      execute format('grant all on public.%I to service_role', t.tbl);
      execute format('alter table public.%I enable row level security', t.tbl);
      raise notice 'ADMIN protegida: %', t.tbl;

    -- ---- B) tabela com dono -------------------------------------------
    elsif own_col is not null then
      execute format('grant select, insert, update, delete on public.%I to authenticated', t.tbl);
      execute format('grant all on public.%I to service_role', t.tbl);
      execute format('alter table public.%I enable row level security', t.tbl);

      execute format($f$create policy %I on public.%I for select to authenticated
                        using (%I::text = auth.uid()::text)$f$,
                     t.tbl||'_own_select', t.tbl, own_col);
      execute format($f$create policy %I on public.%I for insert to authenticated
                        with check (%I::text = auth.uid()::text)$f$,
                     t.tbl||'_own_insert', t.tbl, own_col);
      execute format($f$create policy %I on public.%I for update to authenticated
                        using (%I::text = auth.uid()::text)
                        with check (%I::text = auth.uid()::text)$f$,
                     t.tbl||'_own_update', t.tbl, own_col, own_col);
      execute format($f$create policy %I on public.%I for delete to authenticated
                        using (%I::text = auth.uid()::text)$f$,
                     t.tbl||'_own_delete', t.tbl, own_col);

      -- leitura pública preservada só se JÁ existia antes (ranking, mercado)
      if anon_read then
        execute format($f$create policy %I on public.%I for select to anon, authenticated
                          using (true)$f$, t.tbl||'_public_read', t.tbl);
      end if;
      raise notice 'DONO (%): %', own_col, t.tbl;

    -- ---- C) tabela pública de leitura (ranking/snapshot/listas) --------
    else
      execute format('grant select on public.%I to anon, authenticated', t.tbl);
      execute format('grant all on public.%I to service_role', t.tbl);
      execute format('alter table public.%I enable row level security', t.tbl);
      execute format($f$create policy %I on public.%I for select to anon, authenticated
                        using (true)$f$, t.tbl||'_public_read', t.tbl);
      raise notice 'LEITURA PUBLICA: % (escrita só via RPC/service_role)', t.tbl;
    end if;
  end loop;
end $$;


-- =====================================================================
-- PARTE 3 — VALIDAÇÃO (rode por último e me mande o resultado)
-- Esperado: rls_ligado = true em tudo, e nenhuma tabela com RLS ligado
-- e ZERO policies (exceto as administrativas, que são só service_role).
-- =====================================================================
set statement_timeout = '30s';

select c.relname as tabela,
       c.relrowsecurity as rls_ligado,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as policies,
       (select string_agg(distinct g.grantee, ', ')
          from information_schema.role_table_grants g
         where g.table_schema='public' and g.table_name=c.relname
           and g.grantee in ('anon','authenticated','service_role')) as grants
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r'
 order by c.relname;

-- Checagem de risco: tabela de jogador com RLS mas SEM policy nenhuma
-- (isso bloquearia o jogo). O resultado deve vir VAZIO, tirando as admin.
select c.relname as tabela_sem_policy
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and c.relrowsecurity
   and not exists (select 1 from pg_policies p
                    where p.schemaname='public' and p.tablename=c.relname)
 order by 1;

-- Save do jogador continua com as 4 policies do dono?
select policyname, cmd from pg_policies
 where schemaname='public' and tablename='game_saves' order by policyname;
