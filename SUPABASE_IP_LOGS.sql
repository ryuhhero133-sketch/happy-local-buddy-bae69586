-- ============================================================
-- 🌐 LOG DE IP / REDE POR CONTA  (rodar por partes)
-- Não altera progresso, nível, itens nem ranking de ninguém.
-- ============================================================

-- ---------- PARTE 1: tabela + índices + grants ----------
set lock_timeout = '3s';

create table if not exists public.ip_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  username   text,
  ip         text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists ip_logs_user_time_idx on public.ip_logs(user_id, created_at desc);
create index if not exists ip_logs_ip_idx on public.ip_logs(ip);

grant select on public.ip_logs to authenticated;
grant all on public.ip_logs to service_role;

alter table public.ip_logs enable row level security;


-- ---------- PARTE 2: policies (dono vê o seu, admin vê tudo) ----------
set lock_timeout = '3s';

drop policy if exists "ip_logs_select_own" on public.ip_logs;
create policy "ip_logs_select_own" on public.ip_logs
  for select to authenticated
  using (user_id::text = auth.uid()::text);

drop policy if exists "ip_logs_select_admin" on public.ip_logs;
create policy "ip_logs_select_admin" on public.ip_logs
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
-- Sem INSERT/UPDATE/DELETE policy: só a função SECURITY DEFINER escreve.


-- ---------- PARTE 3: RPC de registro (chamada no login) ----------
create or replace function public.log_player_ip(_ip text, _user_agent text default null, _username text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid  uuid := auth.uid();
  _last timestamptz;
begin
  if _uid is null then return; end if;
  if _ip is null or length(_ip) > 64 then return; end if;

  -- anti-flood: no máximo 1 registro por IP a cada 10 minutos
  select max(created_at) into _last
  from public.ip_logs
  where user_id = _uid and ip = _ip;

  if _last is not null and _last > now() - interval '10 minutes' then
    return;
  end if;

  insert into public.ip_logs (user_id, username, ip, user_agent)
  values (_uid, nullif(_username, ''), _ip, left(coalesce(_user_agent, ''), 400));
end;
$$;

revoke all on function public.log_player_ip(text, text, text) from public, anon;
grant execute on function public.log_player_ip(text, text, text) to authenticated;


-- ---------- PARTE 4: consultas de auditoria (ADMIN) ----------
-- Último IP de cada conta:
-- select distinct on (user_id) user_id, username, ip, user_agent, created_at
--   from public.ip_logs order by user_id, created_at desc;

-- Contas que compartilham o mesmo IP (multi-conta / bot farm):
-- select ip, count(distinct user_id) as contas, array_agg(distinct coalesce(username, user_id::text)) as quem
--   from public.ip_logs group by ip having count(distinct user_id) > 1 order by contas desc;

-- Histórico completo de um jogador:
-- select * from public.ip_logs where user_id = 'UUID_DO_JOGADOR' order by created_at desc;


-- ---------- PARTE 5: validação ----------
select relrowsecurity as rls_on from pg_class where oid = 'public.ip_logs'::regclass;
select policyname, cmd from pg_policies where tablename = 'ip_logs';
select count(*) as total_logs from public.ip_logs;
