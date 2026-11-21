-- Seis vouchers globais de uso único:
--   * 2 concedem 2 Tickets Ancestrais;
--   * 4 concedem 1 Livro VIP GOLD (365 dias).
-- Apenas hashes são versionados. O primeiro resgate válido consome o voucher
-- e grava a recompensa no mesmo save, na mesma transação.

create table if not exists private.global_reward_vouchers (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  reward_kind text not null check (reward_kind in ('ancestral_tickets', 'vip_annual')),
  reward_qty integer not null check (
    (reward_kind = 'ancestral_tickets' and reward_qty = 2)
    or (reward_kind = 'vip_annual' and reward_qty = 1)
  ),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table private.global_reward_vouchers enable row level security;
revoke all on table private.global_reward_vouchers from public, anon, authenticated;

insert into private.global_reward_vouchers (code_hash, reward_kind, reward_qty) values
  ('4d7a2a295c996ac29d6ecb50d18ec9dfaae29cf4c91975ce06be07b7651f7a92', 'ancestral_tickets', 2),
  ('8dad28e2deea3c13a6f0d117f86383254015c71934085408ca1218ceeead0bec', 'ancestral_tickets', 2),
  ('724cad6a5f4f13fc699b13aa3f97ea823780f7d46a2649f72e40768595bce01e', 'vip_annual', 1),
  ('021ff858f29b562dd961894b60c645e4cea21f081bf0c0eec165aa13f71f0646', 'vip_annual', 1),
  ('b86f73d5ae50e2b2a2b5e110cd417395756289309557ed2f74e33c43de430201', 'vip_annual', 1),
  ('f139ff3592d7607cd7984685559e3ea7d1668a56f87d91c005e08d04d9a9b092', 'vip_annual', 1)
on conflict (code_hash) do nothing;

create or replace function public.redeem_global_reward_voucher(
  p_code text,
  p_expected_version bigint
)
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
  v_voucher private.global_reward_vouchers%rowtype;
  v_data jsonb;
  v_idle jsonb;
  v_items jsonb;
  v_codes jsonb;
  v_item_id text;
  v_item_qty integer;
  v_new_version bigint;
  v_saved_at bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if v_code !~ '^(ANC2|VIP365)[A-Z2-9]{20}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;
  v_hash := encode(sha256(convert_to(v_code, 'UTF8')), 'hex');

  -- O save é bloqueado antes do voucher. Se qualquer etapa falhar, a transação
  -- inteira é revertida e o código continua disponível para outra tentativa.
  select * into v_save
  from public.game_saves
  where user_id = v_uid
  for update;
  if not found
    or jsonb_typeof(v_save.data -> 'idle') <> 'object'
    or jsonb_typeof(v_save.data -> 'team') <> 'array'
    or jsonb_typeof(v_save.data -> 'restingBench') <> 'array'
  then
    return jsonb_build_object('ok', false, 'reason', 'save_incomplete');
  end if;
  if v_save.save_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  select * into v_voucher
  from private.global_reward_vouchers
  where code_hash = v_hash
  for update;
  if not found or v_voucher.claimed_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;

  case v_voucher.reward_kind
    when 'ancestral_tickets' then v_item_id := 'ticket_ancestral';
    when 'vip_annual' then v_item_id := 'book_vip_60';
    else
      raise exception 'invalid_global_reward_kind';
  end case;

  v_data := v_save.data;
  v_idle := v_data -> 'idle';
  v_items := coalesce(v_idle -> 'items', '{}'::jsonb);
  if jsonb_typeof(v_items) <> 'object' then v_items := '{}'::jsonb; end if;
  v_item_qty := case
    when coalesce(v_items ->> v_item_id, '') ~ '^[0-9]{1,6}$'
      then (v_items ->> v_item_id)::integer
    else 0
  end;
  if v_item_qty > 999999 - v_voucher.reward_qty then
    return jsonb_build_object('ok', false, 'reason', 'inventory_cap');
  end if;
  v_item_qty := v_item_qty + v_voucher.reward_qty;
  v_items := jsonb_set(v_items, array[v_item_id], to_jsonb(v_item_qty), true);

  v_codes := v_idle -> 'redeemedCodes';
  if jsonb_typeof(v_codes) <> 'object' then v_codes := '{}'::jsonb; end if;
  v_codes := jsonb_set(v_codes, array[v_code], 'true'::jsonb, true);
  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_idle := jsonb_set(v_idle, '{redeemedCodes}', v_codes, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  v_saved_at := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_data := jsonb_set(
    v_data,
    '{savedAt}',
    to_jsonb(greatest(
      case when coalesce(v_data ->> 'savedAt', '') ~ '^[0-9]{1,15}$'
        then (v_data ->> 'savedAt')::bigint
        else 0
      end,
      v_saved_at
    )),
    true
  );

  -- A condição claimed_at is null é a trava global. Não há caminho de cliente
  -- que possa conceder a recompensa sem consumir esse único registro.
  update private.global_reward_vouchers
  set claimed_by = v_uid, claimed_at = clock_timestamp()
  where code_hash = v_hash
    and claimed_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;

  update public.game_saves
  set data = v_data,
      save_version = v_save.save_version + 1,
      updated_at = clock_timestamp()
  where user_id = v_uid
    and save_version = v_save.save_version
  returning save_version into v_new_version;
  if not found then
    raise exception 'save_changed_during_global_voucher_claim';
  end if;

  return jsonb_build_object(
    'ok', true,
    'server_version', v_new_version,
    'saved_at', v_saved_at,
    'reward_kind', v_voucher.reward_kind,
    'item_id', v_item_id,
    'item_qty', v_item_qty
  );
end;
$$;

revoke all on function public.redeem_global_reward_voucher(text, bigint) from public, anon;
grant execute on function public.redeem_global_reward_voucher(text, bigint) to authenticated;
