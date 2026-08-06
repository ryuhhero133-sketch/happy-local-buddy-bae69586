-- 1. Remover trava de 20 horas apenas para o administrador
UPDATE public.profiles
SET lock_until = NULL,
    account_status = 'active'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com'
);

-- 2. Garantir que todos os outros continuem bloqueados por 20 horas
UPDATE public.profiles
SET lock_until = now() + interval '20 hours'
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com'
);

-- 3. Desconectar todos exceto o admin (opcional, mas recomendado)
DELETE FROM auth.sessions 
WHERE NOT user_id IN (
    SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com'
);
