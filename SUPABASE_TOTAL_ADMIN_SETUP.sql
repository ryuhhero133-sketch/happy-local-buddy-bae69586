-- =============================================================================
-- SQL DE GESTÃO TOTAL DO PAINEL ADMIN
-- =============================================================================
-- Execute este script no SQL Editor do Supabase.
-- Garante: Colunas de status, Tabelas de IP, Tabelas de Auditoria e Permissões.
-- =============================================================================

-- 1. Coluna de Status da Conta (para Banimentos/Análises)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
        ALTER TABLE public.profiles ADD COLUMN account_status text DEFAULT 'active';
    END IF;
END $$;

-- 2. Tabela de Logs de IP (para monitorar multi-contas e segurança)
CREATE TABLE IF NOT EXISTS public.ip_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    username text,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Permissões para ip_logs
GRANT SELECT ON public.ip_logs TO authenticated;
GRANT ALL ON public.ip_logs TO service_role;
ALTER TABLE public.ip_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os logs de IP"
ON public.ip_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- 3. Tabela de Auditoria (para registrar ações do GM)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES auth.users(id),
    target_user_id uuid REFERENCES auth.users(id),
    username text,
    kind text NOT NULL, -- 'ban', 'unban', 'grant_item', 'teleport'
    detail jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Permissões para audit_events
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver e criar auditoria"
ON public.audit_events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Função de Segurança para bloquear Logins de banidos
CREATE OR REPLACE FUNCTION public.check_account_status()
RETURNS trigger AS $$
BEGIN
    IF (SELECT account_status FROM public.profiles WHERE id = auth.uid()) = 'banned' THEN
        RAISE EXCEPTION 'Acesso negado: Esta conta está permanentemente banida.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Banimento Definitivo de Invasores (Exemplo: swampidle@gmail.com)
-- Deleta primeiro de todas as tabelas relacionadas para limpar o rastro
DO $$
DECLARE
    target_id uuid;
BEGIN
    SELECT id INTO target_id FROM auth.users WHERE email = 'swampidle@gmail.com';
    
    IF target_id IS NOT NULL THEN
        -- Limpeza de dados de jogo
        DELETE FROM public.pokemon_collection WHERE user_id = target_id;
        DELETE FROM public.trainer_state WHERE user_id = target_id;
        DELETE FROM public.inventory WHERE user_id = target_id;
        DELETE FROM public.pokeballs WHERE user_id = target_id;
        DELETE FROM public.ranked_scores WHERE user_id = target_id;
        
        -- Marca como banido no profile
        UPDATE public.profiles SET account_status = 'banned' WHERE id = target_id;
        
        -- Registro na auditoria
        INSERT INTO public.audit_events (kind, target_user_id, username, detail)
        VALUES ('ban_permanent', target_id, 'swampidle', '{"reason": "Invasão e alteração de nível detectada"}');
    END IF;
END $$;

-- 6. Garantir permissões de leitura no user_roles para o painel
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 7. Grant final para service_role (usado por server functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 8. Adicionar lordryuhhhuyuyghh@gmail.com como ADMIN no banco (se ainda não for)
DO $$
DECLARE
    admin_id uuid;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com';
    IF admin_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
