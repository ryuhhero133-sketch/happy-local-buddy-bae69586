-- ARV: sem código, o servidor NÃO trava o save — ele desfaz a entrada e
-- devolve o personagem ao mapa anterior. Assim quem entra por engano continua
-- salvando normalmente e só cai fora no próximo carregamento.
create or replace function public.enforce_arv_access()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_previous_map text;
  v_authorized boolean;
begin
  if tg_op = 'UPDATE' then v_previous_map := old.data #>> '{idle,currentMap}'; end if;
  if new.data #>> '{idle,currentMap}' <> 'arv' then return new; end if;
  if v_previous_map = 'arv' then return new; end if;  -- já estava no ARV
  if auth.uid() is null then return new; end if;     -- ferramenta administrativa
  select exists (
    select 1 from private.arv_access_grants g
    where g.user_id = new.user_id and g.user_id = auth.uid() and g.expires_at > now()
  ) into v_authorized;
  if v_authorized then return new; end if;
  new.data := jsonb_set(new.data, '{idle,currentMap}',
    to_jsonb(coalesce(v_previous_map, 'cidade_principal')), true);
  return new;
end;
$$;
revoke all on function public.enforce_arv_access() from public, anon, authenticated;

-- Liberação/revogação por conta, sem expor o código no site.
-- Uso no SQL Editor: select public.admin_grant_arv('seu@email.com');
create or replace function public.admin_grant_arv(p_email text, p_days integer default 30)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(p_email) limit 1;
  if v_uid is null then raise exception 'Conta não encontrada: %', p_email; end if;
  insert into private.arv_access_grants (user_id, expires_at)
    values (v_uid, now() + make_interval(days => greatest(1, p_days)))
    on conflict (user_id) do update set expires_at = excluded.expires_at;
  return 'liberado: ' || p_email;
end;
$$;
revoke all on function public.admin_grant_arv(text, integer) from public, anon, authenticated;

create or replace function public.admin_revoke_arv(p_email text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(p_email) limit 1;
  if v_uid is null then raise exception 'Conta não encontrada: %', p_email; end if;
  delete from private.arv_access_grants where user_id = v_uid;
  return 'revogado: ' || p_email;
end;
$$;
revoke all on function public.admin_revoke_arv(text) from public, anon, authenticated;
