-- ============================================================
-- SAVE DIRETO NO BANCO — game_saves  (rodar por partes)
-- Não altera progresso, nível, itens nem ranking de ninguém.
-- ============================================================

-- ---------- PARTE 1: tabela + índice + grants ----------
set lock_timeout = '3s';

create table if not exists public.game_saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists game_saves_user_id_uidx on public.game_saves(user_id);
create index if not exists game_saves_updated_at_idx on public.game_saves(updated_at desc);

grant select, insert, update on public.game_saves to authenticated;
grant all on public.game_saves to service_role;

alter table public.game_saves enable row level security;


-- ---------- PARTE 2: policies de dono ----------
set lock_timeout = '3s';

drop policy if exists "own_select" on public.game_saves;
drop policy if exists "own_insert" on public.game_saves;
drop policy if exists "own_update" on public.game_saves;

create policy "own_select" on public.game_saves
  for select to authenticated using (user_id::text = auth.uid()::text);

create policy "own_insert" on public.game_saves
  for insert to authenticated with check (user_id::text = auth.uid()::text);

create policy "own_update" on public.game_saves
  for update to authenticated
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);


-- ---------- PARTE 3: RPC de save direto (1 chamada = 1 gravação) ----------
create or replace function public.save_game_state(_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _now timestamptz := now();
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;
  if _data is null or jsonb_typeof(_data) <> 'object' then
    raise exception 'invalid payload';
  end if;

  insert into public.game_saves (user_id, data, updated_at)
  values (_uid, _data, _now)
  on conflict (user_id) do update
    set data = excluded.data,
        updated_at = excluded.updated_at;

  return _now;
end;
$$;

revoke all on function public.save_game_state(jsonb) from public, anon;
grant execute on function public.save_game_state(jsonb) to authenticated;


-- ---------- PARTE 4: trigger anti-cheat à prova de falha ----------
create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare d jsonb;
begin
  begin
    d := new.data;
    if d ? 'trainerLevel' and (d->>'trainerLevel') ~ '^[0-9]+$'
       and (d->>'trainerLevel')::bigint > 10000 then
      d := jsonb_set(d, '{trainerLevel}', to_jsonb(10000));
    end if;
    if d ? 'gold' and (d->>'gold') ~ '^[0-9]+$'
       and (d->>'gold')::bigint > 50000000 then
      d := jsonb_set(d, '{gold}', to_jsonb(50000000));
    end if;
    if d ? 'crystals' and (d->>'crystals') ~ '^[0-9]+$'
       and (d->>'crystals')::bigint > 1000000 then
      d := jsonb_set(d, '{crystals}', to_jsonb(1000000));
    end if;
    new.data := d;
  exception when others then
    -- nunca bloquear um save legítimo
    null;
  end;
  new.updated_at := now();
  return new;
end;
$$;

set lock_timeout = '3s';
drop trigger if exists trg_game_saves_caps on public.game_saves;
create trigger trg_game_saves_caps
  before insert or update on public.game_saves
  for each row execute function public.enforce_game_save_caps();


-- ---------- PARTE 5: validação ----------
select relrowsecurity as rls_on from pg_class where oid = 'public.game_saves'::regclass;
select policyname, cmd from pg_policies where tablename = 'game_saves';
select tgname from pg_trigger where tgrelid = 'public.game_saves'::regclass and not tgisinternal;
select count(*) as total_saves, max(updated_at) as ultimo_save from public.game_saves;
