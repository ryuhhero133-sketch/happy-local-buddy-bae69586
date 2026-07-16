-- =========================================================
-- CORREÇÃO DEFINITIVA DO SAVE COMPLETO (game_saves)
-- Rode este SQL UMA VEZ no Supabase > SQL Editor.
-- Ele cria/ajusta a tabela que salva TODO o progresso do jogador.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.game_saves (
  user_id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Data API: somente jogador autenticado pode usar essa tabela.
REVOKE ALL ON public.game_saves FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_saves TO authenticated;
GRANT ALL ON public.game_saves TO service_role;

ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas inseguras/erradas.
DROP POLICY IF EXISTS game_saves_public_game_access ON public.game_saves;
DROP POLICY IF EXISTS "own save select" ON public.game_saves;
DROP POLICY IF EXISTS "own save insert" ON public.game_saves;
DROP POLICY IF EXISTS "own save update" ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_select ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_insert ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_update ON public.game_saves;

-- Cada conta só consegue ver/gravar o próprio save.
CREATE POLICY game_saves_own_select ON public.game_saves
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY game_saves_own_insert ON public.game_saves
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY game_saves_own_update ON public.game_saves
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Conferência rápida depois de jogar e apertar Salvar:
-- SELECT user_id, updated_at, jsonb_pretty(data) FROM public.game_saves ORDER BY updated_at DESC;