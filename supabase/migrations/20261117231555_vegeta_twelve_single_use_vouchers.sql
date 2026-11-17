-- Vegeta: doze códigos globais de uso único; versionar somente hashes.
create table public.vegeta_skin_vouchers (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.vegeta_skin_vouchers enable row level security;
revoke all on public.vegeta_skin_vouchers from public, anon, authenticated;
create index vegeta_skin_vouchers_claimed_by_idx
  on public.vegeta_skin_vouchers(claimed_by) where claimed_at is not null;

insert into public.vegeta_skin_vouchers(code_hash) values
  ('0bc943eac3f6fd2ef8c42fdabe9d336e57b6af50ab48f659880920a24a1bfa8b'),
  ('6b6ea5a84e11486bf7f4987875aa1d837e4bf167b985dca43a7406a8b640096e'),
  ('636c9af675c415e43c3be0027b72d944740e121abef5ed16b12b5ff719520145'),
  ('36adaeb264e77500177c5ef7af18d2333e02c8807b9626a9586df2af5746e747'),
  ('e61d87db49c1a15afe29af14f04cd6156bd72deba593ba5eeabbd5ef655d288d'),
  ('7f5a6eed0030fb0e0f313098ecfaca2ab9415c242260b4e714dca46f1cf0e8cc'),
  ('9de3564e0a14c4616bf0ba1cab84ecc69c7d699f8b59daaa1635d3b66eb3815b'),
  ('332b34ad830ae144618b48b65e6a352746e6a61fe31a5474ac5182c3bd9a95e2'),
  ('8ac6cf30e2ac04bddaa996ffebfd7fead6db16f2f47e6e0d2c9a70ff7c96d6cc'),
  ('958a0d5e24c873405d92894bdadbb542431b04eb74aaf26ecb5513d5796cda12'),
  ('f1428b6ef1b23085712a42b37bc340ddfb6c189ee79e78a9205c7f8f8b12e895'),
  ('29327fca6abf4a57991eebf43cc7d8e50a269d32555ad4ea98a726dfef278564');

-- A skin só pode entrar no save de um jogador que consumiu um voucher.
-- Checkpoints antigos não podem removê-la após o resgate.
create function public.preserve_vegeta_skin_unlock()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_skins jsonb;
begin
  if jsonb_typeof(new.data -> 'idle') is distinct from 'object' then return new; end if;
  v_skins := new.data #> '{idle,unlockedSkins}';
  if not exists (
    select 1 from public.vegeta_skin_vouchers
    where claimed_by = new.user_id and claimed_at is not null
  ) then
    if jsonb_typeof(v_skins) = 'array' and v_skins @> '["vegeta"]'::jsonb then
      new.data := jsonb_set(new.data, '{idle,unlockedSkins}',
        (select coalesce(jsonb_agg(value), '[]'::jsonb)
         from jsonb_array_elements(v_skins) as skin(value)
         where skin.value <> '"vegeta"'::jsonb), true);
    end if;
    return new;
  end if;
  if jsonb_typeof(v_skins) is distinct from 'array' then v_skins := '[]'::jsonb; end if;
  if not v_skins @> '["vegeta"]'::jsonb then
    new.data := jsonb_set(new.data, '{idle,unlockedSkins}', v_skins || '"vegeta"'::jsonb, true);
  end if;
  return new;
end;
$$;
revoke all on function public.preserve_vegeta_skin_unlock() from public, anon, authenticated;
create trigger preserve_vegeta_skin_unlock_trg
before insert or update on public.game_saves
for each row execute function public.preserve_vegeta_skin_unlock();

create function public.redeem_vegeta_voucher(p_code text, p_expected_version bigint)
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
  if v_code !~ '^VEGETA[A-Z2-9]{20}$' then
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
  if jsonb_typeof(v_skins) is distinct from 'array' then v_skins := '[]'::jsonb; end if;
  if v_skins @> '["vegeta"]'::jsonb or exists (
    select 1 from public.vegeta_skin_vouchers where claimed_by = v_uid and claimed_at is not null
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_owned');
  end if;
  update public.vegeta_skin_vouchers set claimed_by = v_uid, claimed_at = now()
  where code_hash = v_hash and claimed_at is null;
  if not found then return jsonb_build_object('ok', false, 'reason', 'invalid_or_used'); end if;
  v_saved_at := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  update public.game_saves set
    data = jsonb_set(
      jsonb_set(v_save.data, '{idle,unlockedSkins}', v_skins || '"vegeta"'::jsonb, true),
      '{savedAt}', to_jsonb(greatest(
        case when (v_save.data ->> 'savedAt') ~ '^[0-9]{1,15}$'
          then (v_save.data ->> 'savedAt')::bigint else 0 end, v_saved_at)), true),
    save_version = v_save.save_version + 1, updated_at = now()
  where user_id = v_uid and save_version = v_save.save_version
  returning save_version, (data ->> 'savedAt')::bigint into v_new_version, v_saved_at;
  if not found then raise exception 'save changed during voucher claim'; end if;
  update public.profiles set avatar_url = 'vegeta' where id = v_uid;
  return jsonb_build_object('ok', true, 'server_version', v_new_version,
    'saved_at', v_saved_at, 'value', 1, 'skin', 'vegeta');
end;
$$;
revoke all on function public.redeem_vegeta_voucher(text,bigint) from public, anon;
grant execute on function public.redeem_vegeta_voucher(text,bigint) to authenticated;
