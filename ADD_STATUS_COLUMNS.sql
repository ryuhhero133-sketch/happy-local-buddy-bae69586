-- Adiciona colunas de status e bloqueio na tabela de perfis
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lock_until TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.account_status IS 'Status da conta: active, banned, warning';
COMMENT ON COLUMN public.profiles.lock_until IS 'Data/hora até quando a conta está bloqueada (manutenção ou punição)';

-- Garante que o Admin possa editar essas colunas
GRANT UPDATE(account_status, lock_until) ON public.profiles TO authenticated;
GRANT UPDATE(account_status, lock_until) ON public.profiles TO service_role;
