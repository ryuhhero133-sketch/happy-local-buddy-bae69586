-- Skin "One": dois vouchers globais de uso único. Apenas os hashes são
-- versionados; os códigos legíveis são entregues ao proprietário fora do Git.
create table if not exists public.one_skin_vouchers (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.one_skin_vouchers enable row level security;
revoke all on table public.one_skin_vouchers from public, anon, authenticated;
create index if not exists one_skin_vouchers_claimed_by_idx
  on public.one_skin_vouchers(claimed_by) where claimed_at is not null;

insert into public.one_skin_vouchers(code_hash) values
  ('d6f83d3dda39e9939182ed60158b1351cb525161412f845064d51dd5878e64f8'),
  ('46261976f287ac43388eb20a446fce63aae2cab1dadf25584c071656c3bdee28')
on conflict (code_hash) do nothing;

-- Um save antigo não pode remover a skin já conquistada por voucher.
create or replace function public.preserve_one_skin_unlock()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_skins jsonb;
begin
  if jsonb_typeof(new.data -> 'idle') is distinct from 'object' then return new; end if;
  v_skins := new.data #> '{idle,unlockedSkins}';
  if not exists (
    select 1 from public.one_skin_vouchers
    where claimed_by = new.user_id and claimed_at is not null
  ) then
    if jsonb_typeof(v_skins) = 'array' and v_skins @> '["one"]'::jsonb then
      new.data := jsonb_set(new.data, '{idle,unlockedSkins}',
        (select coalesce(jsonb_agg(value), '[]'::jsonb)
         from jsonb_array_elements(v_skins) as skin(value)
         where skin.value <> '"one"'::jsonb), true);
    end if;
    return new;
  end if;
  if jsonb_typeof(v_skins) is distinct from 'array' then v_skins := '[]'::jsonb; end if;
  if not v_skins @> '["one"]'::jsonb then
    new.data := jsonb_set(new.data, '{idle,unlockedSkins}', v_skins || '"one"'::jsonb, true);
  end if;
  return new;
end;
$$;
revoke all on function public.preserve_one_skin_unlock() from public, anon, authenticated;
drop trigger if exists preserve_one_skin_unlock_trg on public.game_saves;
create trigger preserve_one_skin_unlock_trg
before insert or update on public.game_saves
for each row execute function public.preserve_one_skin_unlock();

create or replace function public.redeem_one_voucher(p_code text, p_expected_version bigint)
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
  if v_code !~ '^ONP222[A-Z2-9]{20}$' then
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
  if v_skins @> '["one"]'::jsonb or exists (
    select 1 from public.one_skin_vouchers where claimed_by = v_uid and claimed_at is not null
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_owned');
  end if;
  update public.one_skin_vouchers set claimed_by = v_uid, claimed_at = now()
  where code_hash = v_hash and claimed_at is null;
  if not found then return jsonb_build_object('ok', false, 'reason', 'invalid_or_used'); end if;
  v_saved_at := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  update public.game_saves set
    data = jsonb_set(
      jsonb_set(v_save.data, '{idle,unlockedSkins}', v_skins || '"one"'::jsonb, true),
      '{savedAt}', to_jsonb(greatest(
        case when (v_save.data ->> 'savedAt') ~ '^[0-9]{1,15}$'
          then (v_save.data ->> 'savedAt')::bigint else 0 end, v_saved_at)), true),
    save_version = v_save.save_version + 1, updated_at = now()
  where user_id = v_uid and save_version = v_save.save_version
  returning save_version, (data ->> 'savedAt')::bigint into v_new_version, v_saved_at;
  if not found then raise exception 'save changed during one voucher claim'; end if;
  update public.profiles set avatar_url = 'one' where id = v_uid;
  return jsonb_build_object('ok', true, 'server_version', v_new_version,
    'saved_at', v_saved_at, 'value', 1, 'skin', 'one');
end;
$$;
revoke all on function public.redeem_one_voucher(text, bigint) from public, anon;
grant execute on function public.redeem_one_voucher(text, bigint) to authenticated;
