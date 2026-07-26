-- Uso único GLOBAL de códigos promocionais.
-- Um código só pode ser resgatado UMA vez em todo o servidor (unique em `code`).

create table if not exists public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid,
  username text,
  redeemed_at timestamptz not null default now()
);

grant select, insert on public.code_redemptions to authenticated;
grant select, insert on public.code_redemptions to anon;
grant all on public.code_redemptions to service_role;

alter table public.code_redemptions enable row level security;

-- Qualquer jogador pode tentar reservar um código (o unique impede o segundo resgate).
drop policy if exists "anyone can claim a code" on public.code_redemptions;
create policy "anyone can claim a code"
  on public.code_redemptions for insert
  to anon, authenticated
  with check (true);

-- Leitura permitida (apenas para checagem); não há dados sensíveis.
drop policy if exists "anyone can read redemptions" on public.code_redemptions;
create policy "anyone can read redemptions"
  on public.code_redemptions for select
  to anon, authenticated
  using (true);

-- Ninguém pode apagar/atualizar (sem policies de update/delete).
