-- =========================================================
-- BLACK MITIC PLUS EGG — persistência de progresso na nuvem
-- Rode este SQL UMA VEZ no Supabase > SQL Editor.
-- Garante que nenhum jogador perca progresso do ovo
-- (afinidade, alimentações, diário, incubação) até chocar.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.black_egg_saves (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Data API: só jogador autenticado acessa a sua própria linha.
REVOKE ALL ON public.black_egg_saves FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.black_egg_saves TO authenticated;
GRANT ALL ON public.black_egg_saves TO service_role;

ALTER TABLE public.black_egg_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS black_egg_saves_own_select ON public.black_egg_saves;
DROP POLICY IF EXISTS black_egg_saves_own_insert ON public.black_egg_saves;
DROP POLICY IF EXISTS black_egg_saves_own_update ON public.black_egg_saves;

CREATE POLICY black_egg_saves_own_select ON public.black_egg_saves
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY black_egg_saves_own_insert ON public.black_egg_saves
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY black_egg_saves_own_update ON public.black_egg_saves
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Conferência:
-- SELECT user_id, updated_at, jsonb_pretty(data) FROM public.black_egg_saves ORDER BY updated_at DESC;
