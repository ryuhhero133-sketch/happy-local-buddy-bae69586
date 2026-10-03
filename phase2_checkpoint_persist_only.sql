-- =====================================================================
-- FASE 2 — checkpoint_save vira PERSISTÊNCIA, NÃO recompensa.
-- Idempotente. Não apaga dados, não cria tabelas, não muda assinatura
-- usada pelo cliente, não altera RLS/policies, não toca em triggers de
-- outros sistemas. Aplica-se com: rodar este arquivo UMA vez no SQL Editor.
--
-- REGRA: ação legítima → servidor valida/calcula → estado oficial
-- (trainer_state/player_balances/egg_ledger) → checkpoint APENAS persiste.
-- Tempo NUNCA gera recurso; é usado só como anti-spam/velocidade.
--
-- O que muda vs FASE 1 (phase1_final_bigint.sql):
--   1) trainer_level/trainer_xp do blob são SOBRESCRITOS pelo
--      trainer_state QUANDO ele tem sinais de jogo (level>1 ou xp/ouro/
--      crystal/ruby>0). Cliente não aumenta level/XP via snapshot.
--      (Ataques 1-3.)
--   2) bank.gold/crystals/ruby: mantém precedência player_balances;
--      sem balances, usa trainer_state com sinais de jogo.
--      (Ataques 4-6.)
--   3) bank.safira sem fonte oficial: teto 1M no caminho real.
--      (Ataque 7. Residual documentado: sem fonte server-side.)
--   4) Sem estado com sinais de jogo: limites de conta recém-criada
--      (level ≤10 etc.). Antes: blob passava cru + trigger permitia
--      level ≤5001 no INSERT.
--   5) Tripwire: level 5000+ acima do oficial gera
--      audit_log('checkpoint_reconciled') antes de reconciliar.
--   6) Mantidos intactos: SECURITY DEFINER, auth.uid(), validação de
--      action_id/shape, idempotency_keys, CAS/version, gold rate-limit
--      200/s, egg_ledger override, upsert, cleanup, contrato de retorno.
--
-- Trigger enforce_game_save_caps (mesmo arquivo, abaixo):
--   100% da lógica anterior preservada + adições no CAMINHO REAL:
--   bank.gold/bank.crystals/bank.ruby/bank.safira, array party
--   (levels + count), counts de team/party, e limites de FIRST SAVE
--   no INSERT (level ≤10, itens ≤99, collection ≤50) — exceto quando
--   trainer_state já tem jogo válido (protege row deletada manualmente).
--   restingBench SEM cap de count (é o baú/PC legítimo de armazenamento).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) checkpoint_save — reconciliação com estado oficial
-- ---------------------------------------------------------------------
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
  -- FASE 2: estado server-authoritative (trainer_state)
  _srv_level bigint := 1;
  _srv_xp bigint := 0;
  _srv_tgold bigint := 0;
  _srv_tcry bigint := 0;
  _srv_truby bigint := 0;
  _has_trainer boolean := false;
  _trainer_has_play boolean := false;
  _in_level bigint := 1;
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

  -- FASE 2: lê o estado oficial acumulado (syncs com clamp alimentam esta tabela).
  begin
    select trainer_level, trainer_xp, gold, crystal, ruby
      into _srv_level, _srv_xp, _srv_tgold, _srv_tcry, _srv_truby
      from public.trainer_state where user_id = _uid;
    if found then
      _has_trainer := true;
      -- "Sinais de jogo": linha existe E tem progresso real. Linha zerada
      -- recém-criada pelo bootstrap NÃO é prova de jogo (evita zerar saves
      -- legítimos) — e sem sinais, valem os limites de conta nova.
      if coalesce(_srv_level, 1) > 1
         or coalesce(_srv_xp, 0) > 0
         or coalesce(_srv_tgold, 0) > 0
         or coalesce(_srv_tcry, 0) > 0
         or coalesce(_srv_truby, 0) > 0 then
        _trainer_has_play := true;
      end if;
    end if;
  exception when others then _has_trainer := false;
  end;

  if _has_trainer and _trainer_has_play then
    -- LEVEL/XP: servidor manda, sempre. Cliente não aumenta via snapshot.
    -- Tripwire: salto 5000+ acima do oficial nunca é legítimo → audita.
    begin
      _in_level := coalesce(
        nullif(p_data #>> '{idle,trainerLevel}', '')::bigint,
        nullif(p_data #>> '{idle,trainer_level}', '')::bigint, 1);
    exception when others then _in_level := 1;
    end;
    if _in_level > coalesce(_srv_level, 1) + 5000 then
      insert into public.audit_log (user_id, action, detail)
        values (_uid, 'checkpoint_reconciled',
                jsonb_build_object('blob_level', _in_level, 'server_level', coalesce(_srv_level, 1),
                                   'server_version', _cur_version));
    end if;
    begin
      _srv_level := greatest(1, least(1000000, coalesce(_srv_level, 1)));
      p_data := jsonb_set(p_data, '{idle,trainerLevel}', to_jsonb(_srv_level), true);
      if (p_data #>> '{idle,trainer_level}') is not null then
        p_data := jsonb_set(p_data, '{idle,trainer_level}', to_jsonb(_srv_level), true);
      end if;
    exception when others then null; end;
    begin
      _srv_xp := greatest(0, coalesce(_srv_xp, 0));
      p_data := jsonb_set(p_data, '{idle,trainerXp}', to_jsonb(_srv_xp), true);
      if (p_data #>> '{idle,trainer_xp}') is not null then
        p_data := jsonb_set(p_data, '{idle,trainer_xp}', to_jsonb(_srv_xp), true);
      end if;
    exception when others then null; end;
    -- Economia: player_balances tem precedência (bloco acima); sem balances, trainer_state manda.
    if not _has_bal then
      begin
        p_data := jsonb_set(p_data, '{idle,bank,gold}', to_jsonb(greatest(0, coalesce(_srv_tgold, 0))), true);
        p_data := jsonb_set(p_data, '{idle,bank,crystals}', to_jsonb(greatest(0, coalesce(_srv_tcry, 0))), true);
        p_data := jsonb_set(p_data, '{idle,bank,ruby}', to_jsonb(greatest(0, coalesce(_srv_truby, 0))), true);
      exception when others then null; end;
    end if;
    -- Safira: sem fonte server-side conhecida → teto no caminho real (residual documentado).
    begin
      if (p_data #>> '{idle,bank,safira}') is not null
         and coalesce(nullif(p_data #>> '{idle,bank,safira}', '')::bigint, 0) > 1000000 then
        p_data := jsonb_set(p_data, '{idle,bank,safira}', to_jsonb(1000000::bigint), true);
      end if;
    exception when others then null; end;
  else
    -- SEM SINAIS DE JOGO no servidor: limites de conta recém-criada.
    -- Fluxo legítimo: onboarding → seed fresh → autosave em segundos.
    begin
      p_data := jsonb_set(p_data, '{idle,bank,gold}',
        to_jsonb(least(50000::bigint, greatest(0, coalesce(nullif(p_data #>> '{idle,bank,gold}', '')::bigint, 0)))), true);
    exception when others then null; end;
    begin
      p_data := jsonb_set(p_data, '{idle,bank,crystals}',
        to_jsonb(least(1000::bigint, greatest(0, coalesce(nullif(p_data #>> '{idle,bank,crystals}', '')::bigint, 0)))), true);
    exception when others then null; end;
    begin
      if (p_data #>> '{idle,bank,ruby}') is not null then
        p_data := jsonb_set(p_data, '{idle,bank,ruby}',
          to_jsonb(least(100::bigint, greatest(0, coalesce(nullif(p_data #>> '{idle,bank,ruby}', '')::bigint, 0)))), true);
      end if;
    exception when others then null; end;
    begin
      if (p_data #>> '{idle,bank,safira}') is not null then
        p_data := jsonb_set(p_data, '{idle,bank,safira}',
          to_jsonb(least(100::bigint, greatest(0, coalesce(nullif(p_data #>> '{idle,bank,safira}', '')::bigint, 0)))), true);
      end if;
    exception when others then null; end;
    begin
      p_data := jsonb_set(p_data, '{idle,trainerLevel}',
        to_jsonb(least(10::bigint, greatest(1, coalesce(nullif(p_data #>> '{idle,trainerLevel}', '')::bigint, nullif(p_data #>> '{idle,trainer_level}', '')::bigint, 1)))), true);
      if (p_data #>> '{idle,trainer_level}') is not null then
        p_data := jsonb_set(p_data, '{idle,trainer_level}',
          to_jsonb(least(10::bigint, greatest(1, coalesce(nullif(p_data #>> '{idle,trainer_level}', '')::bigint, 1)))), true);
      end if;
    exception when others then null; end;
    begin
      p_data := jsonb_set(p_data, '{idle,trainerXp}',
        to_jsonb(least(10000::bigint, greatest(0, coalesce(nullif(p_data #>> '{idle,trainerXp}', '')::bigint, nullif(p_data #>> '{idle,trainer_xp}', '')::bigint, 0)))), true);
    exception when others then null; end;
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

-- ---------------------------------------------------------------------
-- 2) Trigger: mesma lógica anterior + caminhos reais + first-save
-- ---------------------------------------------------------------------
create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _prev_level int := 1;
  _new_level  int;
  _cap_jump   int := 5000;     -- salto maximo de niveis por save (UPDATE)
  _cap_level  int := 1000000;
  _cap_gold   bigint := 50000000;
  _cap_cry    bigint := 1000000;
  _cap_esm    bigint := 1000000;
  _cap_saf    bigint := 1000000;
  _cap_col    int := 500;
  _cap_item   bigint := 999999;
  _srv_play   boolean := false;
  _k          text;
  _v          jsonb;
  _items      jsonb;
  _out        jsonb;
begin
  -- Dono sempre é quem está autenticado (bloqueia gravar no save de outro).
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;

  new.updated_at := now();

  -- FASE 2: primeira persistência (INSERT = sem save) usa limites de conta
  -- recém-criada — EXCETO quando trainer_state já tem jogo válido (protege
  -- row deletada manualmente: não amputa progresso real).
  if tg_op = 'INSERT' then
    begin
      select coalesce(trainer_level, 1) > 1 or coalesce(trainer_xp, 0) > 0
             or coalesce(gold, 0) > 0 or coalesce(crystal, 0) > 0 or coalesce(ruby, 0) > 0
        into _srv_play
        from public.trainer_state where user_id = auth.uid();
    exception when others then _srv_play := false;
    end;
    if coalesce(_srv_play, false) is distinct from true then
      _cap_jump := 9;          -- level máx 10 no primeiro save
      _cap_item := 99;         -- 99 por item no primeiro save
      _cap_col  := 50;         -- 50 na coleção no primeiro save
    end if;
  end if;

  if new.data is null or jsonb_typeof(new.data) <> 'object' then
    return new;
  end if;

  -- ---------------- nível do treinador (teto + anti-jump) -------------
  if tg_op = 'UPDATE' and old.data is not null then
    begin
      _prev_level := greatest(1, coalesce(
        nullif(old.data #>> '{idle,trainerLevel}','')::int,
        nullif(old.data #>> '{idle,trainer_level}','')::int, 1));
    exception when others then _prev_level := 1;
    end;
  end if;

  begin
    _new_level := coalesce(
      nullif(new.data #>> '{idle,trainerLevel}','')::int,
      nullif(new.data #>> '{idle,trainer_level}','')::int, _prev_level);
  exception when others then _new_level := _prev_level;
  end;

  _new_level := least(_cap_level, greatest(1, _new_level));
  if _new_level > _prev_level + _cap_jump then
    _new_level := _prev_level + _cap_jump;
  end if;

  if (new.data #>> '{idle,trainerLevel}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainerLevel}', to_jsonb(_new_level), true);
  end if;
  if (new.data #>> '{idle,trainer_level}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainer_level}', to_jsonb(_new_level), true);
  end if;

  -- ---------------- moedas: teto absoluto (AMBOS os caminhos) ---------
  -- FASE 2: o jogo persiste economia em idle.bank.* (ver IdleState.bank);
  -- as chaves antigas idle.gold/crystal/... são mantidas por compatibilidade.
  begin
    if coalesce(nullif(new.data #>> '{idle,gold}','')::bigint, 0) > _cap_gold then
      new.data := jsonb_set(new.data, '{idle,gold}', to_jsonb(_cap_gold), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,bank,gold}','')::bigint, 0) > _cap_gold then
      new.data := jsonb_set(new.data, '{idle,bank,gold}', to_jsonb(_cap_gold), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,crystal}','')::bigint, 0) > _cap_cry then
      new.data := jsonb_set(new.data, '{idle,crystal}', to_jsonb(_cap_cry), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,bank,crystals}','')::bigint, 0) > _cap_cry then
      new.data := jsonb_set(new.data, '{idle,bank,crystals}', to_jsonb(_cap_cry), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,bank,ruby}','')::bigint, 0) > _cap_cry then
      new.data := jsonb_set(new.data, '{idle,bank,ruby}', to_jsonb(_cap_cry), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,esmeralda}','')::bigint, 0) > _cap_esm then
      new.data := jsonb_set(new.data, '{idle,esmeralda}', to_jsonb(_cap_esm), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,safira}','')::bigint, 0) > _cap_saf then
      new.data := jsonb_set(new.data, '{idle,safira}', to_jsonb(_cap_saf), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,bank,safira}','')::bigint, 0) > _cap_saf then
      new.data := jsonb_set(new.data, '{idle,bank,safira}', to_jsonb(_cap_saf), true);
    end if;
  exception when others then null; end;

  -- ---------------- itens: teto por item ------------------------------
  begin
    _items := new.data #> '{idle,items}';
    if _items is not null and jsonb_typeof(_items) = 'object' then
      _out := '{}'::jsonb;
      for _k, _v in select * from jsonb_each(_items) loop
        if jsonb_typeof(_v) = 'number' then
          _out := _out || jsonb_build_object(
            _k, to_jsonb(least(_cap_item, greatest(0, floor((_v #>> '{}')::numeric)::bigint))));
        end if;
      end loop;
      new.data := jsonb_set(new.data, '{idle,items}', _out, true);
    end if;
  exception when others then null; end;

  -- ---------------- coleção: máximo ----------------------------------
  begin
    if jsonb_typeof(new.data #> '{idle,collection}') = 'array'
       and jsonb_array_length(new.data #> '{idle,collection}') > _cap_col then
      new.data := jsonb_set(
        new.data, '{idle,collection}',
        (select jsonb_agg(e) from (
           select e from jsonb_array_elements(new.data #> '{idle,collection}') e limit _cap_col
         ) s), true);
    end if;
  exception when others then null; end;

  -- ---------------- arrays de time: levels + counts ------------------
  -- FASE 2: party passa pelo mesmo teto de level do time (hidrata no time
  -- do jogador: blob.party.slice(0, 5)); counts de team/party limitados
  -- (cliente só usa 6/5). restingBench SEM cap de count (baú/PC legítimo).
  begin
    if jsonb_typeof(new.data -> 'team') = 'array' then
      new.data := jsonb_set(new.data, '{team}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from (select m from jsonb_array_elements(new.data -> 'team') m limit 51) s
        ), true);
      if jsonb_array_length(new.data -> 'team') > 50 then
        new.data := jsonb_set(new.data, '{team}',
          (select jsonb_agg(e) from (
             select e from jsonb_array_elements(new.data -> 'team') e limit 50
           ) s2), true);
      end if;
    end if;
  exception when others then null; end;

  begin
    if jsonb_typeof(new.data -> 'restingBench') = 'array' then
      new.data := jsonb_set(new.data, '{restingBench}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'restingBench') m), true);
    end if;
  exception when others then null; end;

  begin
    if jsonb_typeof(new.data -> 'party') = 'array' then
      new.data := jsonb_set(new.data, '{party}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from (select m from jsonb_array_elements(new.data -> 'party') m limit 51) s
        ), true);
      if jsonb_array_length(new.data -> 'party') > 50 then
        new.data := jsonb_set(new.data, '{party}',
          (select jsonb_agg(e) from (
             select e from jsonb_array_elements(new.data -> 'party') e limit 50
           ) s2), true);
      end if;
    end if;
  exception when others then null; end;

  return new;
end;
$$;

revoke all on function public.enforce_game_save_caps() from anon, authenticated;

drop trigger if exists enforce_game_save_caps_trg on public.game_saves;
create trigger enforce_game_save_caps_trg
  before insert or update on public.game_saves
  for each row execute function public.enforce_game_save_caps();
