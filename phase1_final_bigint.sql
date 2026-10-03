-- FASE 1 FINAL (corrigido) — checkpoint_save(bigint, jsonb, text), sem zerar economia
-- Idempotente. Nao apaga dados, nao cria tabelas, nao muda assinatura usada pelo cliente.
-- Correcoes vs versao anterior:
--  * _cur_gold declarado (era o ERROR "_cur_gold is not a known variable")
--  * sem ::text em comparacoes uuid (era o ERROR 42883 text = uuid)
--  * NUNCA zera gold/crystal/ruby/ovo: sem linha server-side, preserva o blob (era o bug do gold zerando)

DROP FUNCTION IF EXISTS public.checkpoint_save(int, jsonb, text);

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
  _cur_gold bigint := 0;
  _elapsed_s numeric := 1;
  _max_gold_per_sec numeric := 200;
  _server_gold bigint := 0;
  _server_cristal bigint := 0;
  _server_ruby bigint := 0;
  _server_egg bigint := 0;
  _has_bal boolean := false;
  _has_egg boolean := false;
begin
  if _uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if p_action_id is null or length(p_action_id) = 0 or length(p_action_id) > 200 then return jsonb_build_object('ok', false, 'reason', 'bad_action_id'); end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then return jsonb_build_object('ok', false, 'reason', 'bad_snapshot'); end if;
  if p_data -> 'idle' is null or jsonb_typeof(p_data -> 'idle') <> 'object' then return jsonb_build_object('ok', false, 'reason', 'bad_snapshot'); end if;

  begin
    insert into public.idempotency_keys (action_id, user_id) values (p_action_id, _uid) on conflict (action_id) do nothing;
    if not found then return jsonb_build_object('ok', false, 'reason', 'duplicate', 'server_version', coalesce(_cur_version, 0)); end if;
  exception when others then null;
  end;

  select save_version, updated_at into _cur_version, _cur_updated from public.game_saves where user_id = _uid;
  if found then _has_row := true; else _cur_version := 0; end if;
  if _has_row and p_expected_version <> _cur_version then
    insert into public.audit_log (user_id, action, detail) values (_uid, 'checkpoint_stale', jsonb_build_object('expected', p_expected_version, 'server', _cur_version));
    return jsonb_build_object('ok', false, 'reason', 'stale', 'server_version', _cur_version);
  end if;

  -- Fontes server-side: sobrescreve o blob SOMENTE se existir linha. Sem linha, preserva o blob (nunca zera).
  begin
    select gold, crystals, ruby into _server_gold, _server_cristal, _server_ruby from public.player_balances where user_id = _uid;
    if found then _has_bal := true; end if;
  exception when others then _has_bal := false;
  end;

  begin
    select qty into _server_egg from public.egg_ledger where user_id = _uid and egg_item = 'black_mitic_egg';
    if found then _has_egg := true; end if;
  exception when others then _has_egg := false;
  end;

  if _has_bal then
    p_data := jsonb_set(p_data, '{idle,bank,gold}', to_jsonb(coalesce(_server_gold, 0)));
    p_data := jsonb_set(p_data, '{idle,bank,crystals}', to_jsonb(coalesce(_server_cristal, 0)));
    p_data := jsonb_set(p_data, '{idle,bank,ruby}', to_jsonb(coalesce(_server_ruby, 0)));
  end if;

  if _has_egg then
    p_data := jsonb_set(p_data, '{idle,items,black_mitic_egg}', to_jsonb(coalesce(_server_egg, 0)));
  end if;

  -- Rate-limit de ouro (anti-forja brusca; preserva protecao existente)
  begin
    _cur_gold := coalesce(nullif((select p_data #>> '{idle,bank,gold}' from public.game_saves where user_id = _uid), '')::bigint, 0);
  exception when others then _cur_gold := 0;
  end;
  begin
    _new_gold := coalesce(nullif(p_data #>> '{idle,bank,gold}', '')::bigint, 0);
  exception when others then _new_gold := 0;
  end;
  _elapsed_s := greatest(1, extract(epoch from (now() - coalesce(_cur_updated, now()))));
  if _has_row and _new_gold > _cur_gold + (_elapsed_s * _max_gold_per_sec) then
    insert into public.audit_log (user_id, action, detail) values (_uid, 'checkpoint_rate_limited', jsonb_build_object('gold_was', _cur_gold, 'gold_now', _new_gold, 'elapsed_s', _elapsed_s, 'server_version', _cur_version));
    return jsonb_build_object('ok', false, 'reason', 'rate_limited', 'server_version', _cur_version);
  end if;

  if _has_row then _new_version := _cur_version + 1; else _new_version := greatest(1, p_expected_version + 1); end if;

  insert into public.game_saves (user_id, data, save_version, updated_at) values (_uid, p_data, _new_version, now())
    on conflict (user_id) do update set data = excluded.data, save_version = excluded.save_version, updated_at = excluded.updated_at;

  delete from public.idempotency_keys where created_at < now() - interval '7 days';

  return jsonb_build_object('ok', true, 'server_version', _new_version);
end;
$$;
