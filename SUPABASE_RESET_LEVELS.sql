-- =============================================================================
-- SQL PARA RESET DE NÍVEIS (SEASON RESET)
-- =============================================================================
-- Este script reseta o nível de todos os jogadores para 1 e de todos os
-- pokémons capturados para 1, mantendo todos os outros itens e progresso.
-- =============================================================================

-- 1. Resetar o nível de todos os treinadores para 1 e XP para 0
-- A coluna correta na tabela trainer_state é 'trainer_level'
UPDATE public.trainer_state
SET 
    trainer_level = 1,
    trainer_xp = 0;

-- 2. Resetar o nível de todos os pokémons na coleção para 1 e XP para 0
-- A coluna correta na tabela pokemon_collection é 'xp'
UPDATE public.pokemon_collection
SET 
    level = 1,
    xp = 0;

-- 3. Opcional: Registrar o reset na tabela de auditoria se o GM que executou for conhecido
-- (Substitua o UUID do GM se necessário ao rodar manualmente)
-- INSERT INTO public.audit_events (kind, detail)
-- VALUES ('season_reset', '{"description": "Níveis de todos os jogadores e pokémons resetados para 1"}');

-- 4. Desconectar todos os jogadores ativos (limpa as sessões no Auth do Supabase)
-- Isso forçará todos a logarem novamente e verem os novos dados.
DELETE FROM auth.sessions;

-- HINT: Após rodar este SQL, todos os jogadores serão desconectados e verão o nível 1 ao logar novamente.
