-- Permite creditar um PIX aprovado depois de pix_expirado, cenario em que o
-- banco confirma o pagamento apos o vencimento. A entrega continua unica e
-- transacional; pedidos em analise, pagos, reembolsados ou contestados nao
-- recebem credito duplicado.
do $migration$
declare
  v_definition text;
  v_old text := 'if v_order.status not in (''created'', ''pending'', ''failed'') then';
  v_new text := 'if v_order.status not in (''created'', ''pending'', ''failed'', ''expired'') then';
begin
  v_definition := pg_get_functiondef(
    'private.cakto_deliver_order(text,text,text,uuid,text,numeric,text,timestamptz,text)'::regprocedure
  );
  if position(v_old in v_definition) = 0 then
    raise exception 'cakto_deliver_order: status guard not found';
  end if;
  execute replace(v_definition, v_old, v_new);
end
$migration$;

-- A funcao publica apenas delega para a privada; nada mais precisa mudar.
