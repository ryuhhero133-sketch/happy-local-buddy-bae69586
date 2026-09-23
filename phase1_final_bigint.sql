-- FASE 1 FINAL — ÚNICAMENTE checkpoint_save(bigint, jsonb, text)
-- Drop da assinatura int (se existir overload) — seguro, sem dados
DROP FUNCTION IF EXISTS public.checkpoint_save(int, jsonb, text);

-- Cria apenas a assinatura bigint conforme exigido
CREATE OR REPLACE FUNCTION public.checkpoint_save(
  p_expected_version bigint,
  p_data jsonb,
  p_action_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  _uid uuid := auth.uid();
  _cur_version bigint := 0;
  _cur_updated timestamptz := null;
  _has_row boolean := false;
  _new_version bigint;
  _new_gold bigint := 0;
  _elapsed_s numeric := 1;
  _max_gold_per_sec numeric := 200;
  _server_gold bigint := 0;
  _server_cristal bigint := 0;
  _server_ruby bigint := 0;
  _server_egg bigint := 0;
  _blob_gold bigint := 0;
  _blob_cristal bigint := 0;
  _blob_ruby bigint := 0;
  _cur_gold bigint := 0;
begin
  if _uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if p_action_id is null or length(p_action_id) = 0 or length(p_action_id) > 200 then return jsonb_build_object('ok', false, 'reason', 'bad_action_id'); end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then return jsonb_build_object('ok', false, 'reason', 'bad_snapshot'); end if;
  if p_data -> 'idle' is null or jsonb_typeof(p_data -> 'idle') <> 'object' then return jsonb_build_object('ok', false, 'reason', 'bad_snapshot'); end if;

  -- Idempotência
  begin
    insert into public.idempotency_keys (action_id, user_id) values (p_action_id, _uid) on conflict (action_id) do nothing;
    if not found then return jsonb_build_object('ok', false, 'reason', 'duplicate', 'server_version', coalesce(_cur_version,0)); end if;
  exception when others then null;
  end;

  -- CAS
  select save_version, updated_at into _cur_version, _cur_updated from public.game_saves where user_id = _uid;
  if found then _has_row := true; else _cur_version := 0; end if;
  if _has_row and p_expected_version <> _cur_version then
    insert into public.audit_log (user_id, action, detail) values (_uid, 'checkpoint_stale', jsonb_build_object('expected', p_expected_version, 'server', _cur_version));
    return jsonb_build_object('ok', false, 'reason', 'stale', 'server_version', _cur_version);
  end if;

  -- LER VALORES ATUAIS DO SERVIDOR (fontes autoritativas)
  begin
    select coalesce(gold,0), coalesce(crystals,0), coalesce(ruby,0) into _server_gold, _server_cristal, _server_ruby from public.player_balances where user_id = _uid;
  exception when others then _server_gold:=0; _server_cristal:=0; _server_ruby:=0; end;

  begin
    select coalesce(qty,0) into _server_egg from public.egg_ledger where user_id = _uid and egg_item = 'black_mitic_egg';
  exception when others then _server_egg:=0; end;

  -- LER VALORES ENVIADOS PELO CLIENTE NO BLOBO (apenas para comparação / preservação não-autoritativa)
  begin
    _blob_gold := coalesce(nullif(p_data #>> '{idle,bank,gold}','')::bigint, 0);
  exception when others then _blob_gold := 0; end;
  begin
    _blob_cristal := coalesce(nullif(p_data #>> '{idle,bank,crystals}','')::bigint, 0);
  exception when others then _blob_cristal := 0; end;
  begin
    _blob_ruby := coalesce(nullif(p_data #>> '{idle,bank,ruby}','')::bigint, 0);
  exception when others then _blob_ruby := 0; end;

  -- PRESERVAR NÃO-AUTORITATIVO (posição, mapa, config, team, etc.) — NÃO alterado pelo cliente autoritativamente
  -- NÃO falhar se cliente enviar; apenas sobrescrever autoritativos

  -- FORÇAR VALORES AUTORITATIVOS: se há fonte server, usa server. Se NÃO há fonte server (bootstrap/nova conta), usa 0 (não aceita valor do cliente para recurso autoritativo)
  if _server_gold > 0 then
    p_data := jsonb_set(p_data, '{idle,bank,gold}', to_jsonb(_server_gold));
  else
    -- Nenhum registro server: forçar 0 para ouro (não aceita cliente inventar ouro nesse ponto; se quiser bootstrap do blob existente, pode usar _blob_gold apenas se tabela ainda não criada — mas regra é não aceitar livre)
    p_data := jsonb_set(p_data, '{idle,bank,gold}', to_jsonb(0));
  end if;

  if _server_cristal > 0 then
    p_data := jsonb_set(p_data, '{idle,bank,crystals}', to_jsonb(_server_cristal));
  else
    p_data := jsonb_set(p_data, '{idle,bank,crystals}', to_jsonb(0));
  end if;

  if _server_ruby > 0 then
    p_data := jsonb_set(p_data, '{idle,bank,ruby}', to_jsonb(_server_ruby));
  else
    p_data := jsonb_set(p_data, '{idle,bank,ruby}', to_jsonb(0));
  end if;

  -- OVOS: se ledger tem valores, usa; senão zera (não aceita cliente criar ovo arbitrariamente se não há registro server)
  if _server_egg > 0 then
    p_data := jsonb_set(p_data, '{idle,items,black_mitic_egg}', to_jsonb(_server_egg));
  elsif (p_data -> 'idle' -> 'items' ? 'black_mitic_egg') is not null then
    -- Se não há servidor mas já existe no save anterior, preservar para compatibilidade (não inventar do zero)
    null; -- mantém valor do blob existente
  else
    p_data := jsonb_set(p_data, '{idle,items,black_mitic_egg}', to_jsonb(0));
  end if;

  -- Rate-limit gold (preserva proteção existente)
  begin
    _cur_gold := coalesce(nullif((select p_data #>> '{idle,bank,gold}' from public.game_saves where user_id = _uid),'')::bigint, 0);
  exception when others then _cur_gold := 0; end;
  begin
    _new_gold := coalesce(nullif(p_data #>> '{idle,bank,gold}','')::bigint, 0);
  exception when others then _new_gold := 0; end;
  _elapsed_s := greatest(1, extract(epoch from (now() - _cur_updated)));
  if _new_gold > _cur_gold + (_elapsed_s * _max_gold_per_sec) then
    insert into public.audit_log (user_id, action, detail) values (_uid, 'checkpoint_rate_limited', jsonb_build_object('gold_was', _cur_gold, 'gold_now', _new_gold, 'elapsed_s', _elapsed_s, 'server_version', coalesce(_cur_version,0)));
    return jsonb_build_object('ok', false, 'reason', 'rate_limited', 'server_version', coalesce(_cur_version,0));
  end if;

  -- Versão
  if _has_row then _new_version := _cur_version + 1; else _new_version := greatest(1, p_expected_version + 1); end if;

  -- Salva
  insert into public.game_saves (user_id, data, save_version, updated_at) values (_uid, p_data, _new_version, now())
    on conflict (user_id) do update set data = excluded.data, save_version = excluded.save_version, updated_at = excluded.updated_at;

  delete from public.idempotency_keys where created_at < now() - interval '7 days';

  return jsonb_build_object('ok', true, 'server_version', _new_version);
end;
$$;
