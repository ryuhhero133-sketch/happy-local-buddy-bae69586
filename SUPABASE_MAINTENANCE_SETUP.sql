-- Tabela de configuração global (se não existir)
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT ALL ON public.app_config TO service_role;

-- Policy de leitura pública
DROP POLICY IF EXISTS "Public read app_config" ON public.app_config;
CREATE POLICY "Public read app_config" ON public.app_config
    FOR SELECT USING (true);

-- Inserir modo manutenção (false por padrão)
INSERT INTO public.app_config (key, value, description)
VALUES ('maintenance_mode', 'false', 'Trava o acesso ao jogo para não-admins')
ON CONFLICT (key) DO NOTHING;

-- COLOQUE O JOGO EM MANUTENÇÃO AGORA:
-- UPDATE public.app_config SET value = 'true' WHERE key = 'maintenance_mode';

-- Desconectar sessões (Revoke tokens)
-- SELECT auth.sessions_delete_all(); -- Nota: Isso requer privilégios de superuser/admin no Supabase Dashboard
