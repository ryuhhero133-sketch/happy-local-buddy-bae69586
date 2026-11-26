-- Integração Cakto PIX para Diamantes Vermelhos.
-- O cliente nunca define preço, quantidade ou destinatário: o catálogo e a
-- entrega vivem no servidor. A entrega é idempotente por pedido/evento.
create table if not exists public.cakto_packages (
  id text primary key,
  name text not null,
  diamonds integer not null check (diamonds > 0),
  price_cents integer check (price_cents is null or price_cents > 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  cakto_offer_id text unique,
  active boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.cakto_packages (id, name, diamonds, sort_order)
values
  ('bau_inicial', 'Pacote 1 — Baú Inicial', 1000, 1),
  ('bau_avancado', 'Pacote 2 — Baú Avançado', 2000, 2),
  ('bau_supremo', 'Pacote 3 — Baú Supremo', 3200, 3)
on conflict (id) do update
  set name = excluded.name,
      diamonds = excluded.diamonds,
      sort_order = excluded.sort_order,
      updated_at = now();

alter table public.cakto_packages enable row level security;
drop policy if exists "cakto_packages_public_read" on public.cakto_packages;
create policy "cakto_packages_public_read"
  on public.cakto_packages for select
  to anon, authenticated
  using (true);
revoke all on table public.cakto_packages from anon, authenticated;
grant select on table public.cakto_packages to anon, authenticated;

create table if not exists private.cakto_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null references public.cakto_packages(id),
  diamonds integer not null check (diamonds > 0),
  price_cents integer,
  amount_cents integer,
  currency text not null default 'BRL',
  status text not null default 'created' check (status in (
    'created', 'pending', 'paid', 'expired', 'failed', 'refunded', 'chargedback', 'review'
  )),
  cakto_payment_id text unique,
  cakto_ref_id text,
  checkout_url text,
  pix_qr_code text,
  pix_expiration timestamptz,
  idempotency_key text not null unique,
  last_error text,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz
);

create index if not exists cakto_orders_user_created_idx
  on private.cakto_orders(user_id, created_at desc);
create index if not exists cakto_orders_status_idx
  on private.cakto_orders(status, created_at desc);

create table if not exists private.cakto_order_customers (
  order_id uuid primary key references private.cakto_orders(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  doc_type text not null default 'cpf' check (doc_type in ('cpf', 'cnpj')),
  doc_number text not null,
  fingerprint text not null,
  created_at timestamptz not null default now()
);

create table if not exists private.cakto_deliveries (
  order_id uuid primary key references private.cakto_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  diamonds integer not null,
  credited integer not null,
  overflow integer not null default 0,
  game_save_version bigint,
  delivered_at timestamptz not null default now()
);

create table if not exists private.cakto_webhook_events (
  event_key text primary key,
  event_type text not null,
  order_id uuid references private.cakto_orders(id) on delete set null,
  status text not null,
  payload_hash text,
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists private.cakto_reversals (
  event_key text primary key,
  order_id uuid not null references private.cakto_orders(id) on delete cascade,
  kind text not null check (kind in ('refund', 'chargeback')),
  amount_cents integer,
  created_at timestamptz not null default now()
);

revoke all on table private.cakto_orders, private.cakto_order_customers, private.cakto_deliveries,
  private.cakto_webhook_events, private.cakto_reversals from public, anon, authenticated;
grant usage on schema private to service_role;
grant all on table private.cakto_orders, private.cakto_order_customers, private.cakto_deliveries,
  private.cakto_webhook_events, private.cakto_reversals to service_role;

create or replace function private.cakto_deliver_order(
  p_event_key text,
  p_event_type text,
  p_payment_id text,
  p_order_id uuid,
  p_offer_id text,
  p_amount numeric,
  p_currency text,
  p_paid_at timestamptz,
  p_payload_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order private.cakto_orders%rowtype;
  v_package public.cakto_packages%rowtype;
  v_save public.game_saves%rowtype;
  v_data jsonb;
  v_idle jsonb;
  v_items jsonb;
  v_current bigint;
  v_credit integer;
  v_overflow integer := 0;
  v_new_version bigint;
  v_saved_at bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_event_order uuid;
begin
  select * into v_order
  from private.cakto_orders
  where (p_payment_id is not null and cakto_payment_id = p_payment_id)
     or (p_order_id is not null and id = p_order_id)
  order by (id = p_order_id) desc nulls last
  limit 1
  for update;

  if not found then
    insert into private.cakto_webhook_events (event_key, event_type, status, payload_hash)
    values (p_event_key, p_event_type, 'order_not_found', p_payload_hash)
    on conflict (event_key) do nothing;
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  v_event_order := v_order.id;

  insert into private.cakto_webhook_events (event_key, event_type, order_id, status, payload_hash, received_at)
  values (p_event_key, p_event_type, v_order.id, 'received', p_payload_hash, now())
  on conflict (event_key) do nothing;
  if not found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'reason', 'event_already_processed');
  end if;

  if exists (select 1 from private.cakto_deliveries where order_id = v_order.id) then
    update private.cakto_webhook_events
      set status = 'duplicate', processed_at = now()
      where event_key = p_event_key;
    return jsonb_build_object('ok', true, 'duplicate', true, 'reason', 'order_already_delivered');
  end if;

  if v_order.status not in ('created', 'pending', 'failed') then
    update private.cakto_webhook_events
      set status = 'ignored', processed_at = now()
      where event_key = p_event_key;
    return jsonb_build_object('ok', true, 'duplicate', true, 'reason', 'order_not_pending');
  end if;

  select * into v_package from public.cakto_packages where id = v_order.package_id;
  if not found or not v_package.active or v_package.cakto_offer_id is null or v_package.price_cents is null then
    update private.cakto_orders
      set status = 'review', review_note = 'package_not_configured', updated_at = now()
      where id = v_order.id;
    update private.cakto_webhook_events
      set status = 'review', error = 'package_not_configured', processed_at = now()
      where event_key = p_event_key;
    return jsonb_build_object('ok', false, 'reason', 'package_not_configured');
  end if;

  if p_offer_id is distinct from v_package.cakto_offer_id then
    update private.cakto_orders
      set status = 'review', review_note = 'offer_mismatch', updated_at = now()
      where id = v_order.id;
    update private.cakto_webhook_events
      set status = 'review', error = 'offer_mismatch', processed_at = now()
      where event_key = p_event_key;
    return jsonb_build_object('ok', false, 'reason', 'offer_mismatch');
  end if;

  if p_currency is distinct from 'BRL'
    or p_amount is null
    or p_amount < (v_package.price_cents::numeric / 100.0) - 0.01
  then
    update private.cakto_orders
      set status = 'review', review_note = 'amount_or_currency_mismatch', updated_at = now()
      where id = v_order.id;
    update private.cakto_webhook_events
      set status = 'review', error = 'amount_or_currency_mismatch', processed_at = now()
      where event_key = p_event_key;
    return jsonb_build_object('ok', false, 'reason', 'amount_or_currency_mismatch');
  end if;

  select * into v_save from public.game_saves where user_id = v_order.user_id for update;
  if not found or jsonb_typeof(v_save.data -> 'idle') is distinct from 'object' then
    update private.cakto_orders
      set status = 'review', review_note = 'save_missing', updated_at = now()
      where id = v_order.id;
    update private.cakto_webhook_events
      set status = 'review', error = 'save_missing', processed_at = now()
      where event_key = p_event_key;
    return jsonb_build_object('ok', false, 'reason', 'save_missing');
  end if;

  v_data := v_save.data;
  v_idle := v_data -> 'idle';
  v_items := coalesce(v_idle -> 'items', '{}'::jsonb);
  if jsonb_typeof(v_items) is distinct from 'object' then v_items := '{}'::jsonb; end if;

  if coalesce(v_items ->> 'cr_red', '') ~ '^[0-9]{1,9}$' then
    v_current := (v_items ->> 'cr_red')::bigint;
  else
    v_current := 0;
  end if;

  -- O limite legado da mochila é 999.999. Se o saldo ultrapassar, creditamos
  -- até o teto e registramos o excedente para análise administrativa.
  v_credit := least(v_order.diamonds, greatest(0, 999999 - v_current));
  v_overflow := v_order.diamonds - v_credit;
  v_items := jsonb_set(v_items, '{cr_red}', to_jsonb(v_current + v_credit), true);
  v_idle := jsonb_set(v_idle, '{items}', v_items, true);
  v_data := jsonb_set(v_data, '{idle}', v_idle, true);
  v_data := jsonb_set(
    v_data,
    '{savedAt}',
    to_jsonb(greatest(
      case when coalesce(v_data ->> 'savedAt', '') ~ '^[0-9]{1,15}$'
        then (v_data ->> 'savedAt')::bigint else 0 end,
      v_saved_at
    )),
    true
  );

  update public.game_saves
    set data = v_data,
        save_version = v_save.save_version + 1,
        updated_at = clock_timestamp()
    where user_id = v_order.user_id and save_version = v_save.save_version
    returning save_version into v_new_version;
  if not found then
    raise exception 'save_changed_during_cakto_delivery';
  end if;

  insert into private.cakto_deliveries
    (order_id, user_id, diamonds, credited, overflow, game_save_version)
  values
    (v_order.id, v_order.user_id, v_order.diamonds, v_credit, v_overflow, v_new_version);

  update private.cakto_orders
    set status = 'paid',
        cakto_payment_id = coalesce(cakto_payment_id, p_payment_id),
        amount_cents = coalesce(amount_cents, round(p_amount * 100)::integer),
        currency = coalesce(p_currency, currency),
        paid_at = coalesce(p_paid_at, now()),
        review_note = case when v_overflow > 0 then 'overflow_credit' else null end,
        updated_at = now()
    where id = v_order.id;

  update private.cakto_webhook_events
    set status = case when v_overflow > 0 then 'paid_overflow' else 'processed' end,
        processed_at = now()
    where event_key = p_event_key;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'credited', v_credit,
    'overflow', v_overflow,
    'server_version', v_new_version,
    'red_crystals', v_current + v_credit
  );
exception
  when others then
    insert into private.cakto_webhook_events (event_key, event_type, order_id, status, error, payload_hash)
    values (p_event_key, p_event_type, v_event_order, 'error', left(sqlerrm, 300), p_payload_hash)
    on conflict (event_key) do update
      set status = 'error', error = left(sqlerrm, 300), processed_at = now();
    raise;
end;
$$;

create or replace function private.cakto_mark_order_event(
  p_event_key text,
  p_event_type text,
  p_payment_id text,
  p_order_id uuid,
  p_target_status text,
  p_payload_hash text,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order private.cakto_orders%rowtype;
begin
  select * into v_order
  from private.cakto_orders
  where (p_payment_id is not null and cakto_payment_id = p_payment_id)
     or (p_order_id is not null and id = p_order_id)
  order by (id = p_order_id) desc nulls last
  limit 1
  for update;

  if not found then
    insert into private.cakto_webhook_events (event_key, event_type, status, payload_hash, error)
    values (p_event_key, p_event_type, 'order_not_found', p_payload_hash, p_error)
    on conflict (event_key) do nothing;
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  insert into private.cakto_webhook_events (event_key, event_type, order_id, status, payload_hash, error, processed_at)
  values (p_event_key, p_event_type, v_order.id, 'processed', p_payload_hash, p_error, now())
  on conflict (event_key) do nothing;
  if not found then return jsonb_build_object('ok', true, 'duplicate', true); end if;

  if p_target_status = 'expired' and v_order.status in ('created', 'pending') then
    update private.cakto_orders set status = 'expired', updated_at = now() where id = v_order.id;
  elsif p_target_status = 'failed' and v_order.status in ('created', 'pending') then
    update private.cakto_orders
      set status = 'failed', last_error = coalesce(p_error, 'payment_failed'), updated_at = now()
      where id = v_order.id;
  elsif p_target_status = 'pending' and v_order.status = 'created' then
    update private.cakto_orders set status = 'pending', updated_at = now() where id = v_order.id;
  end if;

  return jsonb_build_object('ok', true, 'order_id', v_order.id);
end;
$$;

create or replace function private.cakto_mark_order_reversed(
  p_event_key text,
  p_event_type text,
  p_payment_id text,
  p_order_id uuid,
  p_kind text,
  p_amount numeric,
  p_payload_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order private.cakto_orders%rowtype;
begin
  if p_kind not in ('refund', 'chargeback') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_kind');
  end if;

  select * into v_order
  from private.cakto_orders
  where (p_payment_id is not null and cakto_payment_id = p_payment_id)
     or (p_order_id is not null and id = p_order_id)
  order by (id = p_order_id) desc nulls last
  limit 1
  for update;

  if not found then
    insert into private.cakto_webhook_events (event_key, event_type, status, payload_hash)
    values (p_event_key, p_event_type, 'order_not_found', p_payload_hash)
    on conflict (event_key) do nothing;
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  insert into private.cakto_webhook_events (event_key, event_type, order_id, status, payload_hash, processed_at)
  values (p_event_key, p_event_type, v_order.id, 'processed', p_payload_hash, now())
  on conflict (event_key) do nothing;
  if not found then return jsonb_build_object('ok', true, 'duplicate', true); end if;

  insert into private.cakto_reversals (event_key, order_id, kind, amount_cents)
  values (p_event_key, v_order.id, p_kind, case when p_amount is null then null else round(p_amount * 100)::integer end)
  on conflict (event_key) do nothing;

  update private.cakto_orders
    set status = case when p_kind = 'chargeback' then 'chargedback' else 'refunded' end,
        refunded_at = now(),
        updated_at = now()
    where id = v_order.id;

  return jsonb_build_object('ok', true, 'order_id', v_order.id, 'kind', p_kind);
end;
$$;

revoke all on function private.cakto_deliver_order(text, text, text, uuid, text, numeric, text, timestamptz, text)
  from public, anon, authenticated;
revoke all on function private.cakto_mark_order_event(text, text, text, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function private.cakto_mark_order_reversed(text, text, text, uuid, text, numeric, text)
  from public, anon, authenticated;
grant execute on function private.cakto_deliver_order(text, text, text, uuid, text, numeric, text, timestamptz, text) to service_role;
grant execute on function private.cakto_mark_order_event(text, text, text, uuid, text, text, text) to service_role;
grant execute on function private.cakto_mark_order_reversed(text, text, text, uuid, text, numeric, text) to service_role;

-- Wrappers públicos: o PostgREST não expõe o schema private, mas a Edge
-- Function com service_role precisa chamar estas operações por RPC.
create or replace function public.cakto_deliver_order(
  p_event_key text, p_event_type text, p_payment_id text, p_order_id uuid,
  p_offer_id text, p_amount numeric, p_currency text, p_paid_at timestamptz,
  p_payload_hash text
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.cakto_deliver_order(
    p_event_key, p_event_type, p_payment_id, p_order_id, p_offer_id,
    p_amount, p_currency, p_paid_at, p_payload_hash
  );
$$;

create or replace function public.cakto_mark_order_event(
  p_event_key text, p_event_type text, p_payment_id text, p_order_id uuid,
  p_target_status text, p_payload_hash text, p_error text default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.cakto_mark_order_event(
    p_event_key, p_event_type, p_payment_id, p_order_id,
    p_target_status, p_payload_hash, p_error
  );
$$;

create or replace function public.cakto_mark_order_reversed(
  p_event_key text, p_event_type text, p_payment_id text, p_order_id uuid,
  p_kind text, p_amount numeric, p_payload_hash text
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.cakto_mark_order_reversed(
    p_event_key, p_event_type, p_payment_id, p_order_id, p_kind, p_amount, p_payload_hash
  );
$$;

create or replace function public.cakto_server_create_order(
  p_user_id uuid,
  p_package_id text,
  p_request_id text,
  p_customer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_package public.cakto_packages%rowtype;
  v_order private.cakto_orders%rowtype;
begin
  if p_user_id is null
    or p_request_id is null
    or p_request_id !~ '^[0-9a-fA-F-]{36}$'
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_request');
  end if;

  select * into v_package
  from public.cakto_packages
  where id = p_package_id
    and active
    and cakto_offer_id is not null
    and price_cents is not null
    and price_cents > 0;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'package_not_configured');
  end if;

  select * into v_order
  from private.cakto_orders
  where idempotency_key = p_request_id
  for update;
  if found then
    if v_order.user_id <> p_user_id then
      return jsonb_build_object('ok', false, 'reason', 'request_conflict');
    end if;
    return jsonb_build_object(
      'ok', true, 'existing', true, 'order_id', v_order.id,
      'status', v_order.status, 'package_id', v_order.package_id,
      'diamonds', v_order.diamonds, 'price_cents', v_order.price_cents,
      'currency', v_order.currency, 'pix_qr_code', v_order.pix_qr_code,
      'pix_expiration', v_order.pix_expiration, 'checkout_url', v_order.checkout_url,
      'amount_cents', v_order.amount_cents, 'cakto_offer_id', v_package.cakto_offer_id
    );
  end if;

  insert into private.cakto_orders
    (user_id, package_id, diamonds, price_cents, currency, status, idempotency_key)
  values
    (p_user_id, v_package.id, v_package.diamonds, v_package.price_cents, v_package.currency, 'created', p_request_id)
  returning * into v_order;

  insert into private.cakto_order_customers
    (order_id, name, email, phone, doc_type, doc_number, fingerprint)
  values (
    v_order.id,
    left(coalesce(p_customer ->> 'name', ''), 255),
    left(coalesce(p_customer ->> 'email', ''), 254),
    left(coalesce(p_customer ->> 'phone', ''), 32),
    case when p_customer ->> 'docType' = 'cnpj' then 'cnpj' else 'cpf' end,
    left(regexp_replace(coalesce(p_customer ->> 'docNumber', ''), '[^0-9]', '', 'g'), 32),
    left(coalesce(p_customer ->> 'fingerprint', ''), 255)
  );

  return jsonb_build_object(
    'ok', true, 'existing', false, 'order_id', v_order.id,
    'status', v_order.status, 'package_id', v_order.package_id,
    'diamonds', v_order.diamonds, 'price_cents', v_order.price_cents,
    'currency', v_order.currency, 'cakto_offer_id', v_package.cakto_offer_id
  );
end;
$$;

create or replace function public.cakto_server_save_payment(
  p_order_id uuid,
  p_payment_id text,
  p_ref_id text,
  p_checkout_url text,
  p_pix_qr_code text,
  p_pix_expiration timestamptz,
  p_status text,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_order_id is null or p_status not in ('pending', 'failed') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_payment_update');
  end if;

  update private.cakto_orders
    set cakto_payment_id = coalesce(p_payment_id, cakto_payment_id),
        cakto_ref_id = coalesce(p_ref_id, cakto_ref_id),
        checkout_url = coalesce(p_checkout_url, checkout_url),
        pix_qr_code = coalesce(p_pix_qr_code, pix_qr_code),
        pix_expiration = coalesce(p_pix_expiration, pix_expiration),
        status = p_status,
        last_error = p_error,
        updated_at = now()
    where id = p_order_id
      and status in ('created', 'pending', 'failed');

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.cakto_deliver_order(text, text, text, uuid, text, numeric, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.cakto_mark_order_event(text, text, text, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.cakto_mark_order_reversed(text, text, text, uuid, text, numeric, text) from public, anon, authenticated;
revoke all on function public.cakto_server_create_order(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.cakto_server_save_payment(uuid, text, text, text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.cakto_deliver_order(text, text, text, uuid, text, numeric, text, timestamptz, text) to service_role;
grant execute on function public.cakto_mark_order_event(text, text, text, uuid, text, text, text) to service_role;
grant execute on function public.cakto_mark_order_reversed(text, text, text, uuid, text, numeric, text) to service_role;
grant execute on function public.cakto_server_create_order(uuid, text, text, jsonb) to service_role;
grant execute on function public.cakto_server_save_payment(uuid, text, text, text, text, timestamptz, text, text) to service_role;

create or replace function public.get_my_cakto_order(p_order_id uuid)
returns table (
  order_id uuid,
  package_id text,
  package_name text,
  diamonds integer,
  status text,
  pix_qr_code text,
  pix_expiration timestamptz,
  amount_cents integer,
  currency text,
  credited_diamonds integer,
  overflow_diamonds integer,
  red_crystals bigint,
  created_at timestamptz,
  paid_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    o.id as order_id,
    o.package_id,
    p.name as package_name,
    o.diamonds,
    o.status,
    o.pix_qr_code,
    o.pix_expiration,
    o.amount_cents,
    o.currency,
    coalesce(d.credited, 0)::integer as credited_diamonds,
    coalesce(d.overflow, 0)::integer as overflow_diamonds,
    case
      when coalesce(s.data #>> '{idle,items,cr_red}', '') ~ '^[0-9]{1,9}$'
        then (s.data #>> '{idle,items,cr_red}')::bigint
      else 0
    end as red_crystals,
    o.created_at,
    o.paid_at
  from private.cakto_orders o
  join public.cakto_packages p on p.id = o.package_id
  left join private.cakto_deliveries d on d.order_id = o.id
  left join public.game_saves s on s.user_id = o.user_id
  where o.user_id = auth.uid()
    and o.id = p_order_id
  limit 1;
$$;

revoke all on function public.get_my_cakto_order(uuid) from public, anon;
grant execute on function public.get_my_cakto_order(uuid) to authenticated;
