-- =====================================================================
--  BAN PERMANENTE + LIMPEZA TOTAL: jogador "pistilli01"
--  Rode TUDO no SQL Editor do Supabase (owner / service_role).
--
--  Busca o usuário por: email, username em public.players/profiles,
--  ou pelo trainerName dentro de game_saves.data.
-- =====================================================================

-- Confira antes quem vai ser banido (opcional):
-- select id, email from auth.users where lower(email) like 'pistilli01%';
-- select user_id, data #>> '{idle,trainerName}' from public.game_saves
--   where lower(data #>> '{idle,trainerName}') = 'pistilli01';

do $$
declare
  _uid uuid;
  _email text;
begin
  -- 1) Localiza o alvo
  select id, email into _uid, _email
    from auth.users
   where lower(email) = 'pistilli01' or lower(split_part(email,'@',1)) = 'pistilli01'
   limit 1;

  if _uid is null and to_regclass('public.players') is not null then
    execute $q$ select user_id from public.players where lower(username) = 'pistilli01' limit 1 $q$ into _uid;
  end if;

  if _uid is null and to_regclass('public.profiles') is not null then
    begin
      execute $q$ select id from public.profiles where lower(username) = 'pistilli01' limit 1 $q$ into _uid;
    exception when others then null;
    end;
  end if;

  if _uid is null and to_regclass('public.game_saves') is not null then
    execute $q$
      select user_id from public.game_saves
       where lower(coalesce(data #>> '{idle,trainerName}','')) = 'pistilli01'
       limit 1
    $q$ into _uid;
  end if;

  if _uid is null then
    raise notice 'Jogador pistilli01 NAO encontrado.';
    return;
  end if;

  if _email is null then
    select email into _email from auth.users where id = _uid;
  end if;
  raise notice 'Alvo: % (%)', _uid, coalesce(_email, 'sem-email');

  -- 2) Apaga TODOS os dados de jogo dele
  if to_regclass('public.game_saves')        is not null then execute format('delete from public.game_saves where user_id = %L', _uid); end if;
  if to_regclass('public.black_egg_saves')   is not null then execute format('delete from public.black_egg_saves where user_id = %L', _uid); end if;
  if to_regclass('public.ranked_leaderboard')is not null then execute format('delete from public.ranked_leaderboard where user_id = %L', _uid); end if;
  if to_regclass('public.ranked_scores')     is not null then execute format('delete from public.ranked_scores where user_id = %L', _uid); end if;
  if to_regclass('public.market_listings')   is not null then execute format('delete from public.market_listings where seller_id = %L or buyer_id = %L', _uid, _uid); end if;
  if to_regclass('public.marketplace_offers')is not null then execute format('delete from public.marketplace_offers where buyer_id = %L or seller_id = %L', _uid, _uid); end if;
  if to_regclass('public.marketplace_pokemon')is not null then execute format('delete from public.marketplace_pokemon where seller_id = %L or buyer_id = %L', _uid, _uid); end if;
  if to_regclass('public.pending_purchases') is not null then execute format('delete from public.pending_purchases where user_id = %L', _uid); end if;
  if to_regclass('public.cashshop_tickets')  is not null then execute format('delete from public.cashshop_tickets where user_id = %L', _uid); end if;
  if to_regclass('public.cashshop_messages') is not null then execute format('delete from public.cashshop_messages where user_id = %L', _uid); end if;
  if to_regclass('public.code_redemptions')  is not null then execute format('delete from public.code_redemptions where user_id = %L', _uid); end if;
  if to_regclass('public.user_roles')        is not null then execute format('delete from public.user_roles where user_id = %L', _uid); end if;
  if to_regclass('public.players')           is not null then execute format('delete from public.players where user_id = %L', _uid); end if;
  if to_regclass('public.profiles')          is not null then execute format('delete from public.profiles where id = %L', _uid); end if;

  -- 3) Registra o ban permanente
  create table if not exists public.banned_users (
    user_id uuid primary key,
    email   text not null,
    reason  text not null default '',
    banned_at timestamptz not null default now()
  );
  grant select on public.banned_users to authenticated;
  grant all on public.banned_users to service_role;

  insert into public.banned_users (user_id, email, reason)
  values (_uid, coalesce(_email, 'pistilli01'), 'Ban permanente - pistilli01')
  on conflict (user_id) do update
    set reason = excluded.reason, banned_at = now();

  -- 4) Bloqueia login e derruba sessões
  update auth.users
     set banned_until = 'infinity'::timestamptz,
         raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || '{"banned":true,"ban_reason":"pistilli01_ban"}'::jsonb
   where id = _uid;

  delete from auth.sessions       where user_id = _uid;
  delete from auth.refresh_tokens where user_id = _uid;

  -- 5) Remove a conta de vez (banned_users impede recriar com o mesmo email)
  delete from auth.identities where user_id = _uid;
  delete from auth.users      where id = _uid;
end $$;

-- 6) Garante o bloqueio de novo cadastro com o mesmo email
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

-- Conferir:
select * from public.banned_users order by banned_at desc limit 10;
