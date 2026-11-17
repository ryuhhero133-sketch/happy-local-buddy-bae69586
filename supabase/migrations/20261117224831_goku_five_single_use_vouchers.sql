-- Cinco vouchers globais de uso único. Apenas hashes são versionados:
-- os códigos legíveis são entregues ao proprietário fora do Git.
create table if not exists public.goku_skin_vouchers (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.goku_skin_vouchers enable row level security;
revoke all on public.goku_skin_vouchers from public, anon, authenticated;

-- Preserva inclusive concessões legadas sem linha em player_reward_claims.
-- A lista é capturada antes de qualquer filtro novo de escrita.
create table if not exists public.goku_legacy_owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.goku_legacy_owners enable row level security;
revoke all on public.goku_legacy_owners from public, anon, authenticated;
insert into public.goku_legacy_owners (user_id)
select user_id from public.game_saves
where data #> '{idle,unlockedSkins}' @> '["goku"]'::jsonb
on conflict (user_id) do nothing;

insert into public.goku_skin_vouchers(code_hash) values
  ('87bef35712d81debf03659026ac3abaccb9908cc017745ffef30207b3aa33204'),
  ('b70bb609f149a13f1bf65116406f0f4f4342fab831621354db0e68df014389b6'),
  ('57f7fc0ede825efba9c849a48a9145ec6258bd630e606910df7a8257eaf794ca'),
  ('81073a8cb3e0cad034253664c81574ce496e20f9050a3b6129c678f5f86c2842'),
  ('b30673a5a5c0eaec2e8ad83148d065270388a2bb81cc68225f5fa428c1a1f7c5')
on conflict (code_hash) do nothing;

-- A concessão antiga continua válida para os donos, mas GOKUSKIN1 não
-- concede mais skins, inclusive a clientes que ainda não atualizaram.
create or replace function public.claim_goku_skin_reward(p_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  return jsonb_build_object('ok', false, 'reason', 'retired');
end;
$$;
revoke all on function public.claim_goku_skin_reward(text) from public, anon;
grant execute on function public.claim_goku_skin_reward(text) to authenticated;

-- Nunca perca uma skin já concedida ao salvar um snapshot antigo, inclusive
-- nos saves de jogadores que a obtiveram antes desta migração.
create or replace function public.preserve_goku_skin_unlock()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_next jsonb;
begin
  if jsonb_typeof(new.data -> 'idle') <> 'object' then return new; end if;
  if not (
    exists (select 1 from public.goku_legacy_owners where user_id = new.user_id)
    or exists (select 1 from public.player_reward_claims
      where user_id = new.user_id and code in ('GOKUSKIN1', 'MYHWH7755'))
    or exists (select 1 from public.goku_skin_vouchers
      where claimed_by = new.user_id and claimed_at is not null)
  ) then
    v_next := new.data #> '{idle,unlockedSkins}';
    if jsonb_typeof(v_next) = 'array' then
      new.data := jsonb_set(new.data, '{idle,unlockedSkins}',
        (select coalesce(jsonb_agg(value), '[]'::jsonb)
         from jsonb_array_elements(v_next) as skin(value)
         where skin.value <> '"goku"'::jsonb), true);
    end if;
    return new;
  end if;
  v_next := new.data #> '{idle,unlockedSkins}';
  if jsonb_typeof(v_next) <> 'array' then v_next := '[]'::jsonb; end if;
  if not v_next @> '["goku"]'::jsonb then
    new.data := jsonb_set(new.data, '{idle,unlockedSkins}', v_next || '"goku"'::jsonb, true);
  end if;
  return new;
end;
$$;
revoke all on function public.preserve_goku_skin_unlock() from public, anon, authenticated;
create trigger preserve_goku_skin_unlock_trg
before insert or update on public.game_saves
for each row execute function public.preserve_goku_skin_unlock();

create or replace function public.redeem_goku_voucher(p_code text, p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_hash text;
  v_save public.game_saves%rowtype;
  v_skins jsonb;
  v_new_version bigint;
  v_saved_at bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if v_code !~ '^GOKU[A-Z2-9]{20}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;
  v_hash := encode(sha256(convert_to(v_code, 'UTF8')), 'hex');
  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') <> 'object'
    or jsonb_typeof(v_save.data -> 'team') <> 'array'
    or jsonb_typeof(v_save.data -> 'restingBench') <> 'array' then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;
  v_skins := v_save.data #> '{idle,unlockedSkins}';
  if jsonb_typeof(v_skins) <> 'array' then v_skins := '[]'::jsonb; end if;
  if v_skins @> '["goku"]'::jsonb or exists (
    select 1 from public.player_reward_claims
    where user_id = v_uid and code in ('GOKUSKIN1', 'MYHWH7755')
  ) or exists (select 1 from public.goku_skin_vouchers
    where claimed_by = v_uid and claimed_at is not null) then
    return jsonb_build_object('ok', false, 'reason', 'already_owned');
  end if;
  -- Uma única UPDATE disputa o voucher entre todos os jogadores. Se a
  -- transação falhar, a reivindicação e o save voltam juntos.
  update public.goku_skin_vouchers set claimed_by = v_uid, claimed_at = now()
  where code_hash = v_hash and claimed_at is null;
  if not found then return jsonb_build_object('ok', false, 'reason', 'invalid_or_used'); end if;
  v_saved_at := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  update public.game_saves set
    data = jsonb_set(
      jsonb_set(v_save.data, '{idle,unlockedSkins}', v_skins || '"goku"'::jsonb, true),
      '{savedAt}', to_jsonb(greatest(
        case when (v_save.data ->> 'savedAt') ~ '^[0-9]{1,15}$'
          then (v_save.data ->> 'savedAt')::bigint else 0 end, v_saved_at)), true),
    save_version = v_save.save_version + 1, updated_at = now()
  where user_id = v_uid and save_version = v_save.save_version
  returning save_version, (data ->> 'savedAt')::bigint into v_new_version, v_saved_at;
  if not found then raise exception 'save changed during voucher claim'; end if;
  update public.profiles set avatar_url = 'goku' where id = v_uid;
  return jsonb_build_object('ok', true, 'server_version', v_new_version,
    'saved_at', v_saved_at, 'value', 1, 'skin', 'goku');
end;
$$;
revoke all on function public.redeem_goku_voucher(text,bigint) from public, anon;
grant execute on function public.redeem_goku_voucher(text,bigint) to authenticated;
