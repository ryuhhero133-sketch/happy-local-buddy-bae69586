-- =========================================================
-- IDLEMON REVO — RESET DE 1 CARTEIRA P/ TESTE DE ONBOARDING
-- Apaga SÓ os dados do UID abaixo p/ testar do zero:
-- entrar → nome → skin → pokémon → CONFIRMAR.
--
-- NÃO apaga: tabelas, RPCs, RLS, auth.users, seeds,
-- nem dados de outras carteiras.
--
-- COMO USAR:
-- 1) Descubra seu UID: no jogo, F12 → Console → digite
--    localStorage.getItem("rubym.currentUid")
--    (ou pegue o "sub" do JWT em Application → Cookies)
-- 2) Cole o UID na linha marcada abaixo (entre aspas simples).
-- 3) Cole TUDO no SQL Editor do Supabase e clique Run.
-- 4) No navegador: F12 → Application → Clear site data
--    (localhost:8080) — limpa o cache local.
-- 5) Entre com a carteira e teste o onboarding.
--
-- Tabelas que não existirem são puladas com aviso (não quebra).
-- =========================================================

DO $$
DECLARE
  uid_text text := '<COLA_SEU_UID_AQUI>';  -- ←←← TROQUE ISSO
  r record;
  n integer;
BEGIN
  IF uid_text = '<COLA_SEU_UID_AQUI>' OR uid_text IS NULL OR uid_text = '' THEN
    RAISE EXCEPTION 'Troque <COLA_SEU_UID_AQUI> pelo seu UID antes de rodar.';
  END IF;

  FOR r IN SELECT * FROM (VALUES
    -- coleção / save / progresso
    ('pokemon_collection', 'user_id'),
    ('player_pokemon_registry', 'user_id'),
    ('game_saves', 'user_id'),
    ('trainer_state', 'user_id'),
    ('pokeballs', 'user_id'),
    -- economia do jogador
    ('player_balances', 'user_id'),
    ('player_stocks', 'user_id'),
    ('buff_windows', 'user_id'),
    ('action_receipts', 'user_id'),
    ('egg_ledger', 'user_id'),
    -- identidade (sem username/avatar o onboarding volta a exigir)
    ('profiles', 'id'),
    -- party
    ('party_members', 'player_id'),
    ('party_invites', 'from_id'),
    ('party_invites', 'to_user_id'),
    ('parties', 'leader_id'),
    -- guilda (sua filiação + convites; guilda de outro fundador fica intacta)
    ('guild_members', 'user_id'),
    ('guild_invites', 'from_user_id'),
    ('guild_invites', 'to_user_id'),
    ('guilds', 'founder_id'),
    -- mercado / loja
    ('market_listings', 'seller_id'),
    ('cashshop_tickets', 'user_id'),
    ('pending_purchases', 'user_id'),
    -- ranked / eventos / misc
    ('ranked_leaderboard', 'user_id'),
    ('ranked_scores', 'user_id'),
    ('ranked_history', 'user_id'),
    ('challenges', 'user_id'),
    ('admin_gifts', 'user_id'),
    ('group_legendary_state', 'user_id'),
    ('active_sessions', 'user_id'),
    ('idempotency_keys', 'user_id'),
    ('audit_log', 'user_id')
  ) AS v(t, c) LOOP
    BEGIN
      -- col::text = texto funciona p/ coluna uuid OU text
      EXECUTE format('DELETE FROM public.%I WHERE %I::text = $1', r.t, r.c)
      USING uid_text;
      GET DIAGNOSTICS n = ROW_COUNT;
      RAISE NOTICE '% linha(s) apagada(s) em %', n, r.t;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'skip % (tabela não existe)', r.t;
      WHEN undefined_column THEN
        RAISE NOTICE 'skip %.% (coluna não existe)', r.t, r.c;
      WHEN OTHERS THEN
        RAISE NOTICE 'skip %.% (%)', r.t, r.c, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'RESET CONCLUÍDO p/ %', uid_text;
END $$;
