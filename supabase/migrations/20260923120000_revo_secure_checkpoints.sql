-- =====================================================================
-- IDLE MON REVO — persistência segura (checkpoints versionados)
-- Rodar UMA vez no SQL Editor do Supabase (projeto novo).
-- Idempotente: pode rodar de novo sem quebrar nada.
--
-- O que cria:
--   1) profiles (login/personagem) — RLS só-dono
--   2) game_saves (+ save_version) — SEM escrita direta do cliente
--   3) trigger de tetos server-side (anti-cheat)
--   4) idempotency_keys (anti replay/duplicata)
--   5) audit_log leve (só conflitos/rejeições/bootstrap)
--   6) RPCs: checkpoint_save / checkpoint_fetch / delete_own_save
--
-- Segurança: cliente NUNCA escreve direto em game_saves. Tudo passa
-- pelo RPC checkpoint_save (compare-and-swap de versão + rate-limit de
-- ouro + tetos). RLS garante: cada jogador só lê o próprio save.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_owner_select on public.profiles;
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;

create policy profiles_owner_select on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_owner_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2) game_saves (+ save_version para checkpoints versionados)
-- ---------------------------------------------------------------------
create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  save_version int not null default 0,
  updated_at timestamptz default now()
);

alter table public.game_saves
  add column if not exists save_version int not null default 0;

alter table public.game_saves enable row level security;

-- Remove políticas legadas abertas/permissivas (se existirem).
drop policy if exists game_saves_public_game_access on public.game_saves;
drop policy if exists saves_public_read   on public.game_saves;
drop policy if exists saves_public_insert on public.game_saves;
drop policy if exists saves_public_update on public.game_saves;
drop policy if exists saves_public_delete on public.game_saves;
drop policy if exists game_saves_owner_insert on public.game_saves;
drop policy if exists game_saves_owner_update on public.game_saves;
drop policy if exists game_saves_owner_select on public.game_saves;

-- Leitura: só o dono. Escrita direta: NENHUMA (só via RPC checkpoint_save).
create policy game_saves_owner_select on public.game_saves
  for select to authenticated using (user_id = auth.uid());

revoke all on public.game_saves from anon;
revoke insert, update, delete on public.game_saves from authenticated;
grant select on public.game_saves to authenticated;
grant all on public.game_saves to service_role;

-- ---------------------------------------------------------------------
-- 3) Trigger de tetos server-side (última linha de defesa)
-- ---------------------------------------------------------------------
create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _prev_level int := 1;
  _new_level  int;
  _cap_jump   int := 5000;
  _cap_level  int := 1000000;
  _cap_gold   bigint := 50000000;
  _cap_cry    bigint := 1000000;
  _cap_esm    bigint := 1000000;
  _cap_saf    bigint := 1000000;
  _cap_col    int := 500;
  _cap_item   bigint := 999999;
  _k          text;
  _v          jsonb;
  _items      jsonb;
  _out        jsonb;
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;

  new.updated_at := now();

  if new.data is null or jsonb_typeof(new.data) <> 'object' then
    return new;
  end if;

  -- nível do treinador (teto + anti-jump por save)
  if tg_op = 'UPDATE' and old.data is not null then
    begin
      _prev_level := greatest(1, coalesce(
        nullif(old.data #>> '{idle,trainerLevel}','')::int,
        nullif(old.data #>> '{idle,trainer_level}','')::int, 1));
    exception when others then _prev_level := 1;
    end;
  end if;

  begin
    _new_level := coalesce(
      nullif(new.data #>> '{idle,trainerLevel}','')::int,
      nullif(new.data #>> '{idle,trainer_level}','')::int, _prev_level);
  exception when others then _new_level := _prev_level;
  end;

  _new_level := least(_cap_level, greatest(1, _new_level));
  if _new_level > _prev_level + _cap_jump then
    _new_level := _prev_level + _cap_jump;
  end if;

  if (new.data #>> '{idle,trainerLevel}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainerLevel}', to_jsonb(_new_level), true);
  end if;
  if (new.data #>> '{idle,trainer_level}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainer_level}', to_jsonb(_new_level), true);
  end if;

  -- moedas: teto absoluto (bank e flat)
  begin
    if coalesce(nullif(new.data #>> '{idle,bank,gold}','')::bigint,
                nullif(new.data #>> '{idle,gold}','')::bigint, 0) > _cap_gold then
      if (new.data #>> '{idle,bank,gold}') is not null then
        new.data := jsonb_set(new.data, '{idle,bank,gold}', to_jsonb(_cap_gold), true);
      end if;
      if (new.data #>> '{idle,gold}') is not null then
        new.data := jsonb_set(new.data, '{idle,gold}', to_jsonb(_cap_gold), true);
      end if;
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,bank,crystals}','')::bigint,
                nullif(new.data #>> '{idle,crystal}','')::bigint, 0) > _cap_cry then
      if (new.data #>> '{idle,bank,crystals}') is not null then
        new.data := jsonb_set(new.data, '{idle,bank,crystals}', to_jsonb(_cap_cry), true);
      end if;
      if (new.data #>> '{idle,crystal}') is not null then
        new.data := jsonb_set(new.data, '{idle,crystal}', to_jsonb(_cap_cry), true);
      end if;
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,esmeralda}','')::bigint, 0) > _cap_esm then
      new.data := jsonb_set(new.data, '{idle,esmeralda}', to_jsonb(_cap_esm), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,safira}','')::bigint, 0) > _cap_saf then
      new.data := jsonb_set(new.data, '{idle,safira}', to_jsonb(_cap_saf), true);
    end if;
  exception when others then null; end;

  -- itens: teto por item
  begin
    _items := new.data #> '{idle,items}';
    if _items is not null and jsonb_typeof(_items) = 'object' then
      _out := '{}'::jsonb;
      for _k, _v in select * from jsonb_each(_items) loop
        if jsonb_typeof(_v) = 'number' then
          _out := _out || jsonb_build_object(
            _k, to_jsonb(least(_cap_item, greatest(0, floor((_v #>> '{}')::numeric)::bigint))));
        end if;
      end loop;
      new.data := jsonb_set(new.data, '{idle,items}', _out, true);
    end if;
  exception when others then null; end;

  -- coleção: máximo de 500
  begin
    if jsonb_typeof(new.data #> '{idle,collection}') = 'array'
       and jsonb_array_length(new.data #> '{idle,collection}') > _cap_col then
      new.data := jsonb_set(
        new.data, '{idle,collection}',
        (select jsonb_agg(e) from (
           select e from jsonb_array_elements(new.data #> '{idle,collection}') e limit _cap_col
         ) s), true);
    end if;
  exception when others then null; end;

  -- nível dos pokémon (teto 1M)
  begin
    if jsonb_typeof(new.data -> 'team') = 'array' then
      new.data := jsonb_set(new.data, '{team}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'team') m), true);
    end if;
  exception when others then null; end;

  begin
    if jsonb_typeof(new.data -> 'restingBench') = 'array' then
      new.data := jsonb_set(new.data, '{restingBench}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'restingBench') m), true);
    end if;
  exception when others then null; end;

  return new;
end;
$$;

revoke all on function public.enforce_game_save_caps() from anon, authenticated;

drop trigger if exists enforce_game_save_caps_trg on public.game_saves;
create trigger enforce_game_save_caps_trg
  before insert or update on public.game_saves
  for each row execute function public.enforce_game_save_caps();

-- ---------------------------------------------------------------------
-- 4) idempotency_keys (anti replay/duplicata) — só via RPC
-- ---------------------------------------------------------------------
create table if not exists public.idempotency_keys (
  action_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists idempotency_keys_created_idx on public.idempotency_keys (created_at);

alter table public.idempotency_keys enable row level security;
revoke all on public.idempotency_keys from anon, authenticated;
grant all on public.idempotency_keys to service_role;

-- ---------------------------------------------------------------------
-- 5) audit_log leve (só eventos importantes: conflitos, rejeições, bootstrap)
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists audit_log_user_idx on public.audit_log (user_id, created_at desc);

alter table public.audit_log enable row level security;
drop policy if exists audit_log_owner_select on public.audit_log;
create policy audit_log_owner_select on public.audit_log
  for select to authenticated using (user_id = auth.uid());
revoke all on public.audit_log from anon;
revoke insert, update, delete on public.audit_log from authenticated;
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;

-- ---------------------------------------------------------------------
-- 6) RPC checkpoint_save — compare-and-swap versionado + idempotente
-- ---------------------------------------------------------------------
create or replace function public.checkpoint_save(
  p_expected_version int,
  p_data jsonb,
  p_action_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _cur_version int := 0;
  _cur_gold bigint := 0;
  _cur_updated timestamptz := null;
  _has_row boolean := false;
  _new_version int;
  _new_gold bigint := 0;
  _elapsed_s numeric := 1;
  _max_gold_per_sec numeric := 200; -- folga ~30x acima do farm legítimo (~6/s)
begin
  if _uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_action_id is null or length(p_action_id) = 0 or length(p_action_id) > 200 then
    return jsonb_build_object('ok', false, 'reason', 'bad_action_id');
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'bad_snapshot');
  end if;
  if p_data -> 'idle' is null or jsonb_typeof(p_data -> 'idle') <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'bad_snapshot');
  end if;

  select save_version, updated_at into _cur_version, _cur_updated
    from public.game_saves where user_id = _uid;
  if found then
    _has_row := true;
  else
    _cur_version := 0;
  end if;

  -- Idempotência: replay do mesmo checkpoint não duplica.
  insert into public.idempotency_keys (action_id, user_id)
    values (p_action_id, _uid)
    on conflict (action_id) do nothing;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'duplicate', 'server_version', _cur_version);
  end if;

  -- Compare-and-swap: base defasada nunca sobrescreve o oficial.
  if _has_row and p_expected_version <> _cur_version then
    insert into public.audit_log (user_id, action, detail)
      values (_uid, 'checkpoint_stale',
        jsonb_build_object('expected', p_expected_version, 'server', _cur_version));
    return jsonb_build_object('ok', false, 'reason', 'stale', 'server_version', _cur_version);
  end if;

  -- Rate-limit de ouro server-side (ganho absurdo entre checkpoints = rejeita + audita).
  if _has_row then
    begin
      _cur_gold := coalesce(
        nullif((select data #>> '{idle,bank,gold}' from public.game_saves where user_id = _uid),'')::bigint,
        nullif((select data #>> '{idle,gold}' from public.game_saves where user_id = _uid),'')::bigint, 0);
    exception when others then _cur_gold := 0;
    end;
    begin
      _new_gold := coalesce(
        nullif(p_data #>> '{idle,bank,gold}','')::bigint,
        nullif(p_data #>> '{idle,gold}','')::bigint, 0);
    exception when others then _new_gold := 0;
    end;
    _elapsed_s := greatest(1, extract(epoch from (now() - _cur_updated)));
    if _new_gold > _cur_gold + (_elapsed_s * _max_gold_per_sec) then
      insert into public.audit_log (user_id, action, detail)
        values (_uid, 'checkpoint_rate_limited',
          jsonb_build_object('gold_was', _cur_gold, 'gold_now', _new_gold,
            'elapsed_s', _elapsed_s, 'server_version', _cur_version));
      return jsonb_build_object('ok', false, 'reason', 'rate_limited', 'server_version', _cur_version);
    end if;
  end if;

  if _has_row then
    _new_version := _cur_version + 1;
  else
    -- bootstrap (conta nova ou projeto novo): ancora na versão do cliente
    _new_version := greatest(1, p_expected_version + 1);
  end if;

  insert into public.game_saves (user_id, data, save_version, updated_at)
    values (_uid, p_data, _new_version, now())
    on conflict (user_id) do update
      set data = excluded.data,
          save_version = excluded.save_version,
          updated_at = excluded.updated_at;

  -- limpeza leve de chaves antigas (7 dias)
  delete from public.idempotency_keys where created_at < now() - interval '7 days';

  if not _has_row then
    insert into public.audit_log (user_id, action, detail)
      values (_uid, 'checkpoint_bootstrap', jsonb_build_object('server_version', _new_version));
  end if;

  return jsonb_build_object('ok', true, 'server_version', _new_version);
end;
$$;

-- ---------------------------------------------------------------------
-- 7) RPC delete_own_save
-- ---------------------------------------------------------------------
create or replace function public.delete_own_save()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then return false; end if;
  delete from public.game_saves where user_id = _uid;
  delete from public.idempotency_keys where user_id = _uid;
  return true;
end;
$$;

-- Grants: só authenticated executa os RPCs. Nada para anon.
revoke all on function public.checkpoint_save(int, jsonb, text) from public, anon;
grant execute on function public.checkpoint_save(int, jsonb, text) to authenticated;
revoke all on function public.delete_own_save() from public, anon;
grant execute on function public.delete_own_save() to authenticated;
grant all on all functions in schema public to service_role;

-- =====================================================================
-- VERIFICAÇÃO (rode após aplicar; tudo deve retornar 0/true):
--   select count(*) from public.game_saves;              -- tabela existe
--   select * from pg_policies where tablename='game_saves';
--   select proname from pg_proc where proname in ('checkpoint_save','delete_own_save');
-- =====================================================================
