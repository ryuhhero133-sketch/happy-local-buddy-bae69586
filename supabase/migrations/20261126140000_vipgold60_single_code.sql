-- Código único VIP GOLD 60 dias (1 uso global).
-- Apenas o hash fica versionado; o código legível é entregue ao proprietário
-- fora do Git. O resgate ativa +40% Ouro/EXP por 60 dias, somando ao tempo
-- restante de VIP que a conta já tiver.
create table if not exists private.vipgold60_reward_codes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table private.vipgold60_reward_codes enable row level security;
revoke all on table private.vipgold60_reward_codes from public, anon, authenticated;

insert into private.vipgold60_reward_codes (code_hash) values
  ('665f6f46d84e15cc78578acdff981ea8eefa247da38bf8892559294d279fd75a')
on conflict (code_hash) do nothing;

create or replace function public.redeem_vipgold60_code(p_code text, p_expected_version bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_hash text;
  v_save public.game_saves%rowtype;
  v_reward private.vipgold60_reward_codes%rowtype;
  v_data jsonb;
  v_idle jsonb;
  v_buffs jsonb;
  v_codes jsonb;
  v_old_gold_until bigint := 0;
  v_old_exp_until bigint := 0;
  v_old_gold_mult numeric := 0;
  v_old_exp_mult numeric := 0;
  v_mult numeric;
  v_until bigint;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_new_version bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if v_code !~ '^VIPGOLD60[A-Z2-9]{20}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;
  v_hash := encode(sha256(convert_to(v_code, 'UTF8')), 'hex');

  select * into v_save
  from public.game_saves
  where user_id = v_uid
  for update;
  if not found
    or jsonb_typeof(v_save.data -> 'idle') is distinct from 'object'
    or jsonb_typeof(v_save.data -> 'team') is distinct from 'array'
    or jsonb_typeof(v_save.data -> 'restingBench') is distinct from 'array'
  then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  select * into v_reward
  from private.vipgold60_reward_codes
  where code_hash = v_hash
  for update;
  if not found or v_reward.claimed_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;

  v_data := v_save.data;
  v_idle := v_data -> 'idle';
  v_buffs := coalesce(v_idle -> 'buffs', '{}'::jsonb);
  if jsonb_typeof(v_buffs) is distinct from 'object' then v_buffs := '{}'::jsonb; end if;

  if coalesce(v_buffs ->> 'goldMultUntil', '') ~ '^[0-9]{1,15}$' then
    v_old_gold_until := (v_buffs ->> 'goldMultUntil')::bigint;
  end if;
  if coalesce(v_buffs ->> 'expMultUntil', '') ~ '^[0-9]{1,15}$' then
    v_old_exp_until := (v_buffs ->> 'expMultUntil')::bigint;
  end if;
  if coalesce(v_buffs ->> 'goldMult', '') ~ '^[0-9]+([.][0-9]+)?$' then
    v_old_gold_mult := (v_buffs ->> 'goldMult')::numeric;
  end if;
  if coalesce(v_buffs ->> 'expMult', '') ~ '^[0-9]+([.][0-9]+)?$' then
    v_old_exp_mult := (v_buffs ->> 'expMult')::numeric;
  end if;

  -- Soma 60 dias ao tempo restante e garante o bônus GOLD de +40%.
  v_until := greatest(v_old_gold_until, v_old_exp_until, v_now_ms) + (60::bigint * 24 * 60 * 60 * 1000);
  v_mult := greatest(v_old_gold_mult, v_old_exp_mult, 0.40::numeric);
  v_buffs := jsonb_set(v_buffs, '{goldMult}', to_jsonb(v_mult), true);
  v_buffs := jsonb_set(v_buffs, '{goldMultUntil}', to_jsonb(v_until), true);
  v_buffs := jsonb_set(v_buffs, '{expMult}', to_jsonb(v_mult), true);
  v_buffs := jsonb_set(v_buffs, '{expMultUntil}', to_jsonb(v_until), true);

  v_codes := v_idle -> 'redeemedCodes';
  if jsonb_typeof(v_codes) is distinct from 'object' then v_codes := '{}'::jsonb; end if;
  v_codes := jsonb_set(v_codes, array[v_code], 'true'::jsonb, true);

  v_idle := jsonb_set(v_idle, '{buffs}', v_buffs, true);
  v_idle := jsonb_set(v_idle, '{redeemedCodes}', v_codes, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  v_data := jsonb_set(
    v_data,
    '{savedAt}',
    to_jsonb(greatest(
      case when coalesce(v_data ->> 'savedAt', '') ~ '^[0-9]{1,15}$'
        then (v_data ->> 'savedAt')::bigint else 0 end,
      v_now_ms
    )),
    true
  );

  update private.vipgold60_reward_codes
    set claimed_by = v_uid, claimed_at = clock_timestamp()
    where code_hash = v_hash and claimed_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;

  update public.game_saves
    set data = v_data,
        save_version = v_save.save_version + 1,
        updated_at = clock_timestamp()
    where user_id = v_uid and save_version = v_save.save_version
    returning save_version into v_new_version;
  if not found then
    raise exception 'save_changed_during_vipgold60_claim';
  end if;

  return jsonb_build_object(
    'ok', true,
    'server_version', v_new_version,
    'saved_at', v_now_ms,
    'days', 60,
    'gold_mult', v_mult,
    'until', v_until
  );
end;
$$;

revoke all on function public.redeem_vipgold60_code(text, bigint) from public, anon;
grant execute on function public.redeem_vipgold60_code(text, bigint) to authenticated;
