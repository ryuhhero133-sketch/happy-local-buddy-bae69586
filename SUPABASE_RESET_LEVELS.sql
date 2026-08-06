-- =============================================================================
-- SQL PARA RESET DE NÍVEIS (SEASON RESET)
-- =============================================================================
-- Este script reseta o nível de todos os jogadores para 1 e de todos os
-- pokémons capturados para 1, mantendo todos os outros itens e progresso.
-- =============================================================================

-- 1. Resetar o nível de todos os treinadores para 1 e XP para 0
UPDATE public.trainer_state
SET 
    level = 1,
    experience = 0;

-- 2. Resetar o nível de todos os pokémons na coleção para 1 e XP para 0
UPDATE public.pokemon_collection
SET 
    level = 1,
    experience = 0;

-- 3. Opcional: Registrar o reset na tabela de auditoria se o GM que executou for conhecido
-- (Substitua o UUID do GM se necessário ao rodar manualmente)
-- INSERT INTO public.audit_events (kind, detail)
-- VALUES ('season_reset', '{"description": "Níveis de todos os jogadores e pokémons resetados para 1"}');

-- HINT: Após rodar este SQL, os jogadores verão o nível 1 ao logar ou atualizar a página.
