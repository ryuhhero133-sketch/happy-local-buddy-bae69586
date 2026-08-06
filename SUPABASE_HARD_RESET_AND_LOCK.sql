-- 1. Resetar níveis e XP de Treinadores e Pokémons
UPDATE public.trainer_state
SET 
    trainer_level = 1,
    trainer_xp = 0,
    kill_count = 0,
    gold = LEAST(gold, 50000000),
    crystal = LEAST(crystal, 1000000),
    updated_at = now();

UPDATE public.pokemon_collection
SET 
    level = 1,
    xp = 0,
    hp_current = 24, -- Base para nível 1 (20 + 1*4)
    hp_max = 24;

-- 2. Registrar Auditoria
INSERT INTO public.audit_events (user_id, event_type, details)
SELECT id, 'system_reset', 'Níveis resetados para 1 e limites financeiros aplicados.'
FROM auth.users;

-- 3. FORÇAR LOGOUT GLOBAL (Supabase Auth)
-- Deleta todas as sessões e tokens de atualização
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- 4. Notificar mudança de esquema/sessão (opcional, ajuda em alguns contextos)
NOTIFY pgrst, 'reload schema';

-- 5. Adicionar coluna de bloqueio temporário se não existir (para a regra de 20h)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='lock_until') THEN
        ALTER TABLE public.profiles ADD COLUMN lock_until TIMESTAMPTZ;
    END IF;
END $$;

-- 6. Bloquear todos os usuários por 20 horas
UPDATE public.profiles
SET lock_until = now() + interval '20 hours',
    account_status = 'analysis';

-- 7. Grant permissions (garantir acesso)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.trainer_state TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.trainer_state TO service_role;
