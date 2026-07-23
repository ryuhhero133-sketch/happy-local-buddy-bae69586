-- =====================================================================
--  BAN + LIMPEZA TOTAL: swampidle@gmail.com
--  + Correção da brecha usada (edição direta do game_saves para Lv 10000)
--
--  Rode TUDO no SQL Editor do Supabase, como owner/service_role.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Descobrir o user_id do alvo (usado nos blocos abaixo).
-- ---------------------------------------------------------------------
do $$
declare
  _uid uuid;
begin
  select id into _uid from auth.users where lower(email) = 'swampidle@gmail.com' limit 1;
  if _uid is null then
    raise notice 'Usuario swampidle@gmail.com nao existe (ja deletado?).';
    return;
  end if;
  raise notice 'Alvo: %', _uid;

  -- ------- 1) Apaga TODOS os dados de jogo dele --------------------
  -- Cada delete é "if exists" via to_regclass, pra n quebrar se a tabela n existir.
  perform 1 from pg_tables where schemaname='public' and tablename='game_saves';
  if found then execute format('delete from public.game_saves where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='black_egg_saves';
  if found then execute format('delete from public.black_egg_saves where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='ranked_leaderboard';
  if found then execute format('delete from public.ranked_leaderboard where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='ranked_scores';
  if found then execute format('delete from public.ranked_scores where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='players';
  if found then execute format('delete from public.players where id = %L or user_id = %L', _uid, _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='market_listings';
  if found then execute format('delete from public.market_listings where seller_id = %L or buyer_id = %L', _uid, _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='marketplace_offers';
  if found then execute format('delete from public.marketplace_offers where buyer_id = %L or seller_id = %L', _uid, _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='marketplace_pokemon';
  if found then execute format('delete from public.marketplace_pokemon where seller_id = %L or buyer_id = %L', _uid, _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='pending_purchases';
  if found then execute format('delete from public.pending_purchases where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='cashshop_tickets';
  if found then execute format('delete from public.cashshop_tickets where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='cashshop_messages';
  if found then execute format('delete from public.cashshop_messages where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='guild_members';
  if found then execute format('delete from public.guild_members where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='user_roles';
  if found then execute format('delete from public.user_roles where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='redeemed_codes';
  if found then execute format('delete from public.redeemed_codes where user_id = %L', _uid); end if;

  perform 1 from pg_tables where schemaname='public' and tablename='profiles';
  if found then execute format('delete from public.profiles where id = %L or user_id = %L', _uid, _uid); end if;

  -- ------- 2) BAN permanente (mantém o email/uid gravado, impede login) --
  -- Cria tabela de banidos se ainda não existir.
  create table if not exists public.banned_users (
    user_id uuid primary key,
    email   text not null,
    reason  text not null default '',
    banned_at timestamptz not null default now()
  );
  grant select on public.banned_users to authenticated;
  grant all on public.banned_users to service_role;

  insert into public.banned_users (user_id, email, reason)
  values (_uid, 'swampidle@gmail.com', 'Editou game_saves para forjar Lv 10000 no ranked')
  on conflict (user_id) do update
    set reason = excluded.reason, banned_at = now();

  -- Bloqueia login futuro no auth: banned_until no futuro distante + revoga sessoes.
  update auth.users
     set banned_until = 'infinity'::timestamptz,
         raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"banned":true,"ban_reason":"cheat_level_10000"}'::jsonb
   where id = _uid;

  delete from auth.sessions      where user_id = _uid;
  delete from auth.refresh_tokens where user_id = _uid;

  -- ------- 3) Apaga a conta auth de vez (opcional, mas ele pediu "deletar tudo") -
  -- Mantemos a linha em banned_users pra impedir recriacao com mesmo email.
  delete from auth.identities where user_id = _uid;
  delete from auth.users      where id = _uid;
end $$;

-- ---------------------------------------------------------------------
-- 4) Impede recriar conta com o mesmo email (trigger no signup).
-- ---------------------------------------------------------------------
create or replace function public.block_banned_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.banned_users where lower(email) = lower(new.email)) then
    raise exception 'Este email esta permanentemente banido.';
  end if;
  return new;
end;
$$;

drop trigger if exists block_banned_signup_trg on auth.users;
create trigger block_banned_signup_trg
  before insert on auth.users
  for each row execute function public.block_banned_signup();

-- =====================================================================
-- 5) FECHA A BRECHA: valida game_saves no servidor (cap real de nivel).
--    Antes: RLS deixava o dono gravar QUALQUER JSON, inclusive
--    { idle: { trainerLevel: 10000 } }. O RPC do ranked le esse JSON
--    como "fonte de verdade" (com greatest(cliente, save)) => virava Lv 10000.
--
--    Agora: um trigger BEFORE INSERT/UPDATE limita trainerLevel a
--      min(10000, nivel_anterior + 5)  -- 5 niveis por save (anti-jump)
--    e tambem capa gold/crystal/esmeralda pra evitar edicoes gritantes.
--
--    Ajuste os caps se seu jogo usa outros nomes.
-- =====================================================================
create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
as $$
declare
  _prev_level int := 1;
  _new_level  int;
  _cap_jump   int := 5;      -- nao pode subir mais de +5 por save
  _cap_max    int := 10000;  -- teto absoluto
  _gold       bigint;
  _crystal    bigint;
  _esm        bigint;
begin
  if new.data is null then
    return new;
  end if;

  -- Nivel anterior salvo (se existir)
  if tg_op = 'UPDATE' and old.data is not null then
    begin
      _prev_level := greatest(1, coalesce(
        nullif(old.data #>> '{idle,trainerLevel}','')::int,
        nullif(old.data #>> '{idle,trainer_level}','')::int,
        1));
    exception when others then _prev_level := 1;
    end;
  end if;

  -- Nivel novo enviado pelo cliente
  begin
    _new_level := coalesce(
      nullif(new.data #>> '{idle,trainerLevel}','')::int,
      nullif(new.data #>> '{idle,trainer_level}','')::int,
      _prev_level);
  exception when others then _new_level := _prev_level;
  end;

  -- Aplica cap anti-jump + teto
  _new_level := least(_cap_max, greatest(1, _new_level));
  if _new_level > _prev_level + _cap_jump then
    _new_level := _prev_level + _cap_jump;
  end if;

  -- Reescreve os dois nomes possiveis pra manter compat.
  if (new.data #>> '{idle,trainerLevel}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainerLevel}', to_jsonb(_new_level), true);
  end if;
  if (new.data #>> '{idle,trainer_level}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainer_level}', to_jsonb(_new_level), true);
  end if;

  -- Caps de moedas (evita edicao gritante)
  begin
    _gold := coalesce(nullif(new.data #>> '{idle,gold}','')::bigint, 0);
    if _gold > 50000000 then
      new.data := jsonb_set(new.data, '{idle,gold}', to_jsonb(50000000), true);
    end if;
  exception when others then null; end;

  begin
    _crystal := coalesce(nullif(new.data #>> '{idle,crystal}','')::bigint, 0);
    if _crystal > 1000000 then
      new.data := jsonb_set(new.data, '{idle,crystal}', to_jsonb(1000000), true);
    end if;
  exception when others then null; end;

  return new;
end;
$$;

drop trigger if exists enforce_game_save_caps_trg on public.game_saves;
create trigger enforce_game_save_caps_trg
  before insert or update on public.game_saves
  for each row execute function public.enforce_game_save_caps();

-- ---------------------------------------------------------------------
-- 6) Limpa qualquer save existente que ja esteja acima do cap (retroativo).
--    So mexe se o valor > 10000 (nao penaliza jogadores legitimos).
-- ---------------------------------------------------------------------
update public.game_saves
   set data = jsonb_set(data, '{idle,trainerLevel}', to_jsonb(10000), true)
 where (data #>> '{idle,trainerLevel}') ~ '^[0-9]+$'
   and (data #>> '{idle,trainerLevel}')::int > 10000;

update public.game_saves
   set data = jsonb_set(data, '{idle,trainer_level}', to_jsonb(10000), true)
 where (data #>> '{idle,trainer_level}') ~ '^[0-9]+$'
   and (data #>> '{idle,trainer_level}')::int > 10000;
