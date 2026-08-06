-- =============================================================================
-- SQL DE RESET TOTAL E DESCONEXÃO ABSOLUTA
-- =============================================================================
-- Execute este script no SQL Editor do Supabase.
-- Garante reset de níveis e força o logout de todos os dispositivos.
-- =============================================================================

-- 1. Resetar Treinadores (Nível e XP)
UPDATE public.trainer_state
SET 
    trainer_level = 1,
    trainer_xp = 0;

-- 2. Resetar Pokémons (Nível e XP)
UPDATE public.pokemon_collection
SET 
    level = 1,
    xp = 0;

-- 3. Limpar progresso de bônus (opcional, para evitar que ganhem balls grátis no primeiro kill)
UPDATE public.trainer_state SET kill_count = 0;

-- 4. Registrar auditoria
INSERT INTO public.audit_events (kind, detail)
VALUES ('global_season_reset_final', '{"description": "Níveis zerados e logout global forçado"}');

-- 5. DESCONEXÃO ABSOLUTA (Limpa TODAS as formas de persistência de sessão)
-- A) Deleta sessões ativas
DELETE FROM auth.sessions;

-- B) Deleta tokens de renovação (impede que o app re-logue sozinho)
DELETE FROM auth.refresh_tokens;

-- C) Invalida o cache de instâncias (opcional mas recomendado)
NOTIFY pgrst, 'reload schema';

-- HINT: Após rodar isso, todos os jogadores verão uma mensagem de erro ou serão 
-- redirecionados para o login. Ao voltar, estarão no nível 1.
