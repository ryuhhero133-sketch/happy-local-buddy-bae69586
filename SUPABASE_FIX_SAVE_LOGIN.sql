-- =====================================================================
-- CORREÇÃO: "jogo fica carregando" + "não salva o progresso"
-- Rode UMA VEZ no Supabase > SQL Editor. É curto (não estoura timeout).
--
-- Causa: a blindagem ligou RLS em public.game_saves, mas em alguns projetos
-- as POLICIES do dono não existiam mais (ou tinham nome antigo). Sem policy,
-- o jogador não consegue LER nem GRAVAR o próprio save -> o jogo trava a
-- gravação por segurança e fica "carregando".
--
-- NADA de progresso é apagado ou alterado aqui: só permissões e policies.
-- =====================================================================

-- 1) Permissões da Data API
REVOKE ALL ON public.game_saves FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_saves TO authenticated;
GRANT ALL ON public.game_saves TO service_role;

ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

-- 2) Policies do dono (recria com nomes canônicos)
DROP POLICY IF EXISTS game_saves_own_select ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_insert ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_update ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_delete ON public.game_saves;

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

-- 3) O trigger de caps grava em progress_guard / security_audit_log.
--    Ele é SECURITY DEFINER, mas o dono da função precisa poder escrever.
GRANT ALL ON public.progress_guard TO service_role;
GRANT ALL ON public.security_audit_log TO service_role;

-- 4) Perfis: o login trava se o jogador não conseguir ler/gravar o próprio profile.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated';
    EXECUTE 'GRANT ALL ON public.profiles TO service_role';
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS profiles_self_select ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS profiles_self_insert ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS profiles_self_update ON public.profiles';

    EXECUTE 'CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)';
    EXECUTE 'CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

-- 5) Conferência (deve listar 3 policies em game_saves):
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'game_saves';
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
--  WHERE table_name = 'game_saves';
