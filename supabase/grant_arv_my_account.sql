-- Libera o ARV para a sua conta automaticamente (pega o e-mail da conta
-- que entrou por último) e mostra quem foi liberado. Rode uma vez só.
do $$
declare
  v_email text;
begin
  select email into v_email
  from auth.users
  where email is not null
  order by last_sign_in_at desc nulls last
  limit 1;

  if v_email is null then
    raise notice 'Nenhuma conta encontrada em auth.users';
    return;
  end if;

  perform public.admin_grant_arv(v_email, 90);
  raise notice 'ARV liberado por 90 dias para: %', v_email;
end $$;

-- Confere quem tem acesso agora
select g.user_id,
       u.email,
       g.expires_at
from private.arv_access_grants g
join auth.users u on u.id = g.user_id
order by g.expires_at desc;
