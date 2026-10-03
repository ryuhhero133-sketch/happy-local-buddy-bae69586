-- =========================================================
-- IDLEMON REVO — WIPE DE DADOS DE TESTE (FASE DE TESTE)
-- Apaga TODOS os dados de jogadores p/ testar o onboarding do zero:
-- entrar → nome → skin → pokémon → CONFIRMAR.
--
-- NÃO apaga: tabelas, RPCs, RLS, policies, auth.users,
-- seeds/config (hatch_pools, quest_rewards, shop_offers,
-- map_rates, species_rules, trait_rules, redeem_codes,
-- ranked_seasons).
--
-- COMO USAR: cole TUDO no SQL Editor do Supabase e clique Run.
-- Depois limpe o navegador: F12 → Application → Clear site data
-- (ou use RESETAR MINHA CONTA na engrenagem p/ 1 conta só).
-- =========================================================

DO $$
DECLARE
  t text;
  wiped text[] := ARRAY[
    -- identidade / save principal
    'profiles',
    'game_saves',
    'players',
    'trainer_state',
    'pokeballs',
    -- coleção / registro
    'pokemon_collection',
    'player_pokemon_registry',
    -- economia do jogador
    'player_balances',
    'player_stocks',
    'buff_windows',
    'action_receipts',
    'egg_ledger',
    -- party
    'parties',
    'party_members',
    'party_invites',
    -- guilda
    'guilds',
    'guild_members',
    'guild_invites',
    -- mercado / loja
    'market_listings',
    'cashshop_tickets',
    'pending_purchases',
    -- ranked (dados; seasons = config, mantém)
    'ranked_leaderboard',
    'ranked_scores',
    'ranked_history',
    -- eventos / misc
    'challenges',
    'admin_gifts',
    'group_legendary_state',
    'active_sessions',
    'idempotency_keys',
    'audit_log'
  ];
BEGIN
  FOREACH t IN ARRAY wiped LOOP
    BEGIN
      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', t);
      RAISE NOTICE 'wiped %', t;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'skip % (tabela não existe)', t;
      WHEN OTHERS THEN
        RAISE NOTICE 'skip % (%)', t, SQLERRM;
    END;
  END LOOP;
END $$;

-- ===== VERIFICAÇÃO (tudo deve voltar 0) =====
SELECT 'profiles' AS tabela, count(*) FROM public.profiles
UNION ALL SELECT 'game_saves', count(*) FROM public.game_saves
UNION ALL SELECT 'pokemon_collection', count(*) FROM public.pokemon_collection
UNION ALL SELECT 'player_balances', count(*) FROM public.player_balances
UNION ALL SELECT 'guilds', count(*) FROM public.guilds
UNION ALL SELECT 'guild_members', count(*) FROM public.guild_members
UNION ALL SELECT 'parties', count(*) FROM public.parties
UNION ALL SELECT 'ranked_leaderboard', count(*) FROM public.ranked_leaderboard;

-- ===== CONFIG PRESERVADA (devem continuar com linhas) =====
SELECT 'hatch_pools' AS seed, count(*) FROM public.hatch_pools
UNION ALL SELECT 'quest_rewards', count(*) FROM public.quest_rewards
UNION ALL SELECT 'shop_offers', count(*) FROM public.shop_offers
UNION ALL SELECT 'map_rates', count(*) FROM public.map_rates;
