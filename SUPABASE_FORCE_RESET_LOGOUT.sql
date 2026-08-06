-- =============================================================================
-- SQL PARA RESET DE NÍVEIS E DESCONEXÃO GLOBAL (FORÇA BRUTA)
-- =============================================================================
-- Execute este script no SQL Editor do Supabase.
-- Ele reseta TUDO relacionado a nível e XP e derruba todos os logins.
-- =============================================================================

-- 1. Resetar Treinadores (Nível e XP)
UPDATE public.trainer_state
SET 
    trainer_level = 1,
    trainer_xp = 0;

-- 2. Resetar TODOS os Pokémons (Time e Coleção)
UPDATE public.pokemon_collection
SET 
    level = 1,
    xp = 0;

-- 3. Registrar auditoria
INSERT INTO public.audit_events (kind, detail)
VALUES ('global_season_reset_forced', '{"description": "Níveis resetados e jogadores expulsos"}');

-- 4. DESCONECTAR JOGADORES (Três métodos para garantir)
-- Método A: Deletar sessões (Supabase Auth)
DELETE FROM auth.sessions;

-- Método B: Revogar Refresh Tokens
DELETE FROM auth.refresh_tokens;

-- Método C: Logout forçado via logout_user (se disponível no seu projeto)
-- SELECT auth.logout_user(id) FROM auth.users;

-- HINT: Após rodar este SQL, todos os jogadores serão desconectados imediatamente.
-- Ao logarem de novo, o nível estará 1.
