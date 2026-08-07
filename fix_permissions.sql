-- Garante que todos os usuários autenticados possam ver os perfis (necessário para o Admin carregar a lista)
-- Nota: O Admin é um usuário autenticado comum no Supabase, mas com RLS restritivo ele não veria os outros.
-- Como você quer controle total, precisamos garantir que a tabela profiles seja legível.

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO service_role;

-- Se o RLS estiver ativado na profiles, precisamos de uma política para o Admin ver tudo.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Remove política antiga se existir
        DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;
        
        -- Cria política para o Admin ver todos os perfis
        CREATE POLICY "Admins can see all profiles" ON public.profiles
        FOR SELECT TO authenticated
        USING (
            auth.uid() = '61b4d001-c8c3-424d-862d-0b798782f9d6' OR 
            (SELECT email FROM auth.users WHERE id = auth.uid()) = 'lordryuhhhuyuyghh@gmail.com'
        );
        
        -- Permite que o próprio usuário veja seu perfil (padrão)
        DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
        CREATE POLICY "Users can see own profile" ON public.profiles
        FOR SELECT TO authenticated
        USING (auth.uid() = id);
    END IF;
END $$;

-- Garante acesso às outras tabelas administrativas
GRANT SELECT ON public.trainer_state TO authenticated;
GRANT SELECT ON public.pokemon_collection TO authenticated;
GRANT SELECT ON public.inventory TO authenticated;
GRANT SELECT ON public.pokeballs TO authenticated;

-- Políticas de RLS para Admin nessas tabelas
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['trainer_state', 'pokemon_collection', 'inventory', 'pokeballs']) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Admins can see all rows" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Admins can see all rows" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = ''61b4d001-c8c3-424d-862d-0b798782f9d6'' OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ''lordryuhhhuyuyghh@gmail.com'')', t, t);
    END LOOP;
END $$;
