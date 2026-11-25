-- Código GOLDVIP: 2 usos globais. Cada resgate entrega:
--   1 Livro VIP GOLD 30 dias, 10 Ultra Balls, 20 Pokébolas e 3 tiros da Nevezinha.
-- Apenas o hash fica versionado; o código legível é entregue ao proprietário fora do Git.
create table if not exists private.goldvip_reward_codes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  max_uses integer not null default 2 check (max_uses = 2),
  used_count integer not null default 0 check (used_count between 0 and 2),
  created_at timestamptz not null default now()
);
alter table private.goldvip_reward_codes enable row level security;
revoke all on table private.goldvip_reward_codes from public, anon, authenticated;

insert into private.goldvip_reward_codes(code_hash) values
  ('8f2c5480d4effc0f78adb546b36ac73f5deb3623fbd5e3508642bf50dd049c80')
on conflict (code_hash) do nothing;

create or replace function public.redeem_goldvip_code(p_code text, p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_hash text;
  v_save public.game_saves%rowtype;
  v_reward private.goldvip_reward_codes%rowtype;
  v_data jsonb;
  v_items jsonb;
  v_book bigint;
  v_ultra bigint;
  v_poke bigint;
  v_version bigint;
  v_remaining integer;
  v_saved_at bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if v_code !~ '^GOLDVIP[A-Z2-9]{20}$' then
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

  select * into v_reward from private.goldvip_reward_codes where code_hash = v_hash for update;
  if not found or v_reward.used_count >= v_reward.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_used');
  end if;

  v_items := coalesce(v_save.data #> '{idle,items}', '{}'::jsonb);
  if jsonb_typeof(v_items) is distinct from 'object' then v_items := '{}'::jsonb; end if;
  v_book := private.market_nonnegative_int(v_items -> 'book_vip_gold_30', 999999);
  v_ultra := private.market_nonnegative_int(v_items -> 'ultraball', 999999);
  v_poke := private.market_nonnegative_int(v_items -> 'pokeball', 999999);
  if v_book > 999998 or v_ultra > 999989 or v_poke > 999979 then
    return jsonb_build_object('ok', false, 'reason', 'inventory_cap');
  end if;
  v_book := v_book + 1;
  v_ultra := v_ultra + 10;
  v_poke := v_poke + 20;
  v_items := jsonb_set(v_items, '{book_vip_gold_30}', to_jsonb(v_book));
  v_items := jsonb_set(v_items, '{ultraball}', to_jsonb(v_ultra));
  v_items := jsonb_set(v_items, '{pokeball}', to_jsonb(v_poke));
  v_data := jsonb_set(v_save.data, '{idle,items}', v_items, true);
  v_data := jsonb_set(
    v_data,
    '{savedAt}',
    to_jsonb(greatest(
      case when coalesce(v_save.data ->> 'savedAt', '') ~ '^[0-9]{1,15}$'
        then (v_save.data ->> 'savedAt')::bigint else 0 end,
      v_saved_at
    )),
    true
  );

  -- O contador é a trava global: duas requisições concorrentes jamais
  -- conseguem consumir mais que os 2 usos.
  update private.goldvip_reward_codes
    set used_count = used_count + 1
    where code_hash = v_hash and used_count < max_uses
    returning max_uses - used_count into v_remaining;
  if not found then raise exception 'goldvip_limit_race'; end if;

  update public.game_saves
    set data = v_data,
        save_version = save_version + 1,
        updated_at = clock_timestamp()
    where user_id = v_uid and save_version = v_save.save_version
    returning save_version into v_version;
  if not found then raise exception 'save_changed_during_goldvip_claim'; end if;

  -- +3 tiros do Festival da Nevezinha, na mesma transação do save.
  perform public.nevezinha_grant_tickets(3);

  return jsonb_build_object(
    'ok', true,
    'server_version', v_version,
    'saved_at', v_saved_at,
    'items', jsonb_build_object(
      'book_vip_gold_30', v_book,
      'ultraball', v_ultra,
      'pokeball', v_poke
    ),
    'uses_remaining', v_remaining,
    'tickets', 3
  );
end;
$$;
revoke all on function public.redeem_goldvip_code(text, bigint) from public, anon;
grant execute on function public.redeem_goldvip_code(text, bigint) to authenticated;
