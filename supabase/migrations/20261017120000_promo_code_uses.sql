-- =====================================================================
-- IDLE MON REVO — TRAVA DE USO ÚNICO POR CONTA PARA CÓDIGOS PROMOCIONAIS
-- Arquivo NOVO (idempotente, nada destrutivo). NÃO é aplicado automaticamente —
-- aplicar manualmente no Supabase (SQL Editor) ou via `supabase db push`.
--
-- O que faz:
--  Cria `promo_code_uses`: 1 linha por código resgatado. A coluna `code` é a
--  CHAVE PRIMÁRIA, então o INSERT de uma segunda conta no mesmo código falha
--  com erro 23505 (duplicate key) — o bloqueio é atômico no banco, não no
--  navegador (localStorage sozinho não impede contas diferentes no mesmo PC).
--
-- RLS:
--  - INSERT: só a própria conta autenticada (auth.uid() = user_id).
--  - SELECT: a conta só enxerga os próprios resgates.
--  - Sem policy de UPDATE/DELETE → ninguém apaga o registro para reutilizar.
-- =====================================================================

create table if not exists public.promo_code_uses (
  code        text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  username    text,
  redeemed_at timestamptz not null default now()
);

create index if not exists promo_code_uses_user_idx on public.promo_code_uses (user_id);

alter table public.promo_code_uses enable row level security;

drop policy if exists "promo_code_uses insert own" on public.promo_code_uses;
create policy "promo_code_uses insert own"
  on public.promo_code_uses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "promo_code_uses read own" on public.promo_code_uses;
create policy "promo_code_uses read own"
  on public.promo_code_uses
  for select
  to authenticated
  using (auth.uid() = user_id);