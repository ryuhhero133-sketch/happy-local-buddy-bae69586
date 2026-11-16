-- Configure o código separadamente no SQL Editor; nunca o inclua nesta migration pública.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.arv_access_config (
  id boolean primary key default true check (id),
  access_code text not null
);
revoke all on private.arv_access_config from public, anon, authenticated;

create table if not exists private.arv_access_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);
revoke all on private.arv_access_grants from public, anon, authenticated;

create table if not exists private.arv_access_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempts int not null default 0,
  window_start timestamptz not null default now()
);
revoke all on private.arv_access_attempts from public, anon, authenticated;

create or replace function public.unlock_arv(p_code text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_attempts int;
  v_code text;
begin
  if v_uid is null then return false; end if;
  insert into private.arv_access_attempts (user_id, attempts, window_start)
    values (v_uid, 0, now()) on conflict (user_id) do nothing;
  update private.arv_access_attempts
    set attempts = case when window_start < now() - interval '10 minutes' then 1 else attempts + 1 end,
        window_start = case when window_start < now() - interval '10 minutes' then now() else window_start end
    where user_id = v_uid
    returning attempts into v_attempts;
  if v_attempts > 5 then return false; end if;
  select access_code into v_code from private.arv_access_config where id = true;
  if v_code is null or p_code is null or length(p_code) <> 5 or p_code <> v_code then return false; end if;
  insert into private.arv_access_grants (user_id, expires_at)
    values (v_uid, now() + interval '12 hours')
    on conflict (user_id) do update set expires_at = excluded.expires_at;
  delete from private.arv_access_attempts where user_id = v_uid;
  return true;
end;
$$;
revoke all on function public.unlock_arv(text) from public, anon;
grant execute on function public.unlock_arv(text) to authenticated;

-- O checkpoint do jogo é gravado por security definer: o trigger confere
-- o usuário autenticado real antes de aceitar a transição para o ARV.
create or replace function public.enforce_arv_access()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_previous_map text;
begin
  if tg_op = 'UPDATE' then v_previous_map := old.data #>> '{idle,currentMap}'; end if;
  if new.data #>> '{idle,currentMap}' = 'arv'
     and v_previous_map is distinct from 'arv'
     and not exists (
       select 1 from private.arv_access_grants
       where user_id = auth.uid() and user_id = new.user_id and expires_at > now()
     ) then
    raise exception 'Acesso ao ARV requer código válido.';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_arv_access() from public, anon, authenticated;
drop trigger if exists enforce_arv_access_trg on public.game_saves;
create trigger enforce_arv_access_trg
  before insert or update on public.game_saves
  for each row execute function public.enforce_arv_access();
