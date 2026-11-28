-- Loja Cash: item novo (ex.: book_vip_gold_30) não existia no JSON da mochila.
-- O helper recebia SQL NULL, jsonb_typeof(NULL) também é NULL e o fluxo seguia
-- até retornar NULL. O jsonb_set seguinte apagava a mochila inteira, perdia o
-- marcador da Jornada e a trigger de reset abortava a compra com 23514.
-- A partir daqui todo valor ausente/inválido vale 0.
create or replace function private.red_crystal_cash_nonnegative_int(
  p_value jsonb,
  p_cap bigint
)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_number numeric;
begin
  if p_value is null or p_cap < 0 or jsonb_typeof(p_value) <> 'number' then
    return 0;
  end if;
  begin
    v_number := floor((p_value #>> '{}')::numeric);
    if v_number < 0 then return 0; end if;
    if v_number > p_cap then return p_cap; end if;
    return v_number::bigint;
  exception when others then
    return 0;
  end;
end;
$$;

revoke all on function private.red_crystal_cash_nonnegative_int(jsonb, bigint)
  from public, anon, authenticated;
