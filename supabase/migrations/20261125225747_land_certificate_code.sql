-- Código de certificados para a Land Revo: 1 uso global, 3 certificados.
-- O certificado é consumido apenas no CONFIRMAR da colocação da Land.
create table if not exists private.land_certificate_codes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  max_uses integer not null default 1 check (max_uses = 1),
  used_count integer not null default 0 check (used_count between 0 and 1),
  created_at timestamptz not null default now()
);
alter table private.land_certificate_codes enable row level security;
revoke all on table private.land_certificate_codes from public, anon, authenticated;

insert into private.land_certificate_codes(code_hash) values
  ('86cac20e5def551d4d81d8e52ca85f8c141968dba6da8d163e77f644f36fa94b')
on conflict (code_hash) do nothing;

create or replace function public.redeem_land_certificate_code(p_code text, p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_hash text;
  v_save public.game_saves%rowtype;
  v_reward private.land_certificate_codes%rowtype;
  v_items jsonb;
  v_qty bigint;
  v_version bigint;
  v_remaining integer;
  v_saved_at bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if v_code !~ '^LANDCERT[A-Z2-9]{20}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;
  v_hash := encode(sha256(convert_to(v_code, 'UTF8')), 'hex');

  select * into v_save from public.game_saves where user_id = v_uid for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') is distinct from 'object'
    or jsonb_typeof(v_save.data -> 'team') is distinct from 'array'
    or jsonb_typeof(v_save.data -> 'restingBench') is distinct from 'array' then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  select * into v_reward from private.land_certificate_codes where code_hash = v_hash for update;
  if not found or v_reward.used_count >= v_reward.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;

  v_items := coalesce(v_save.data #> '{idle,items}', '{}'::jsonb);
  if jsonb_typeof(v_items) is distinct from 'object' then v_items := '{}'::jsonb; end if;
  v_qty := private.market_nonnegative_int(v_items -> 'certificado', 999999);
  if v_qty > 999996 then
    return jsonb_build_object('ok', false, 'reason', 'inventory_cap');
  end if;
  v_qty := v_qty + 3;
  v_items := jsonb_set(v_items, '{certificado}', to_jsonb(v_qty), true);
  v_save.data := jsonb_set(v_save.data, '{idle,items}', v_items, true);
  v_save.data := jsonb_set(
    v_save.data,
    '{savedAt}',
    to_jsonb(greatest(
      case when coalesce(v_save.data ->> 'savedAt', '') ~ '^[0-9]{1,15}$'
        then (v_save.data ->> 'savedAt')::bigint else 0 end,
      v_saved_at
    )),
    true
  );

  update private.land_certificate_codes
    set used_count = used_count + 1
    where code_hash = v_hash and used_count < max_uses
    returning max_uses - used_count into v_remaining;
  if not found then raise exception 'land_certificate_limit_race'; end if;

  update public.game_saves
    set data = v_save.data,
        save_version = save_version + 1,
        updated_at = clock_timestamp()
    where user_id = v_uid and save_version = v_save.save_version
    returning save_version into v_version;
  if not found then raise exception 'save_changed_during_land_certificate_claim'; end if;

  return jsonb_build_object(
    'ok', true,
    'server_version', v_version,
    'saved_at', v_saved_at,
    'item_id', 'certificado',
    'item_qty', v_qty,
    'uses_remaining', v_remaining
  );
end;
$$;
revoke all on function public.redeem_land_certificate_code(text, bigint) from public, anon;
grant execute on function public.redeem_land_certificate_code(text, bigint) to authenticated;
