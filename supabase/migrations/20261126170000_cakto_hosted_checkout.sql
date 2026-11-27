-- Checkout hospedado da Cakto para cartao (e demais meios do checkout).
-- O pedido continua sendo do jogador; um token aleatorio e o proprio UUID do
-- pedido viajam no link e voltam no webhook para localizar a entrega.
alter table private.cakto_orders
  add column if not exists checkout_token text;

create unique index if not exists cakto_orders_checkout_token_uidx
  on private.cakto_orders (checkout_token)
  where checkout_token is not null;

create or replace function public.cakto_server_prepare_checkout(
  p_order_id uuid,
  p_checkout_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order private.cakto_orders%rowtype;
  v_offer_id text;
  v_token text;
  v_url text;
begin
  if p_order_id is null
    or p_checkout_token is null
    or p_checkout_token !~ '^[a-f0-9]{32}$'
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_checkout');
  end if;

  select * into v_order
  from private.cakto_orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  if v_order.status not in ('created', 'pending') then
    return jsonb_build_object('ok', false, 'reason', 'order_not_pending', 'status', v_order.status);
  end if;

  select cakto_offer_id into v_offer_id
  from public.cakto_packages
  where id = v_order.package_id
    and active
    and cakto_offer_id is not null;

  if v_offer_id is null then
    return jsonb_build_object('ok', false, 'reason', 'package_not_configured');
  end if;

  if v_order.checkout_token is not null and v_order.checkout_url is not null then
    return jsonb_build_object(
      'ok', true, 'existing', true, 'order_id', v_order.id,
      'checkout_url', v_order.checkout_url, 'status', v_order.status
    );
  end if;

  v_token := coalesce(v_order.checkout_token, p_checkout_token);
  v_url := 'https://pay.cakto.com.br/' || v_offer_id
    || '?callback=' || v_token || '&sck=' || v_order.id::text;

  begin
    update private.cakto_orders
    set checkout_token = v_token,
        checkout_url = v_url,
        status = case when status = 'created' then 'pending' else status end,
        updated_at = now()
    where id = v_order.id
    returning * into v_order;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'token_conflict');
  end;

  return jsonb_build_object(
    'ok', true, 'existing', false, 'order_id', v_order.id,
    'checkout_url', v_order.checkout_url, 'status', v_order.status
  );
end;
$$;

revoke all on function public.cakto_server_prepare_checkout(uuid, text)
  from public, anon, authenticated;
grant execute on function public.cakto_server_prepare_checkout(uuid, text)
  to service_role;

create or replace function public.cakto_server_order_by_checkout(p_checkout_token text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object('order_id', o.id)
  from private.cakto_orders o
  where p_checkout_token is not null
    and p_checkout_token ~ '^[a-f0-9]{32}$'
    and o.checkout_token = p_checkout_token
  limit 1;
$$;

revoke all on function public.cakto_server_order_by_checkout(text)
  from public, anon, authenticated;
grant execute on function public.cakto_server_order_by_checkout(text)
  to service_role;
