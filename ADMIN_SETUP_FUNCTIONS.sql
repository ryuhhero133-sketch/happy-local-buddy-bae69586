-- admin_update_trainer_stats: Atualiza nível e XP do treinador com segurança
CREATE OR REPLACE FUNCTION public.admin_update_trainer_stats(
    target_user_id UUID,
    new_level INT,
    new_xp INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.trainer_state
    SET 
        trainer_level = LEAST(GREATEST(new_level, 1), 10000),
        trainer_xp = GREATEST(new_xp, 0),
        updated_at = NOW()
    WHERE user_id = target_user_id;

    UPDATE public.ranked_scores
    SET 
        trainer_level = LEAST(GREATEST(new_level, 1), 10000),
        updated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_trainer_stats(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_trainer_stats(UUID, INT, INT) TO service_role;

-- admin_update_pokemon_level: Atualiza nível de um Pokémon específico
CREATE OR REPLACE FUNCTION public.admin_update_pokemon_level(
    target_pokemon_id UUID,
    new_level INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.pokemon_collection
    SET 
        level = LEAST(GREATEST(new_level, 1), 10000),
        hp_max = 20 + LEAST(GREATEST(new_level, 1), 10000) * 4,
        hp_current = 20 + LEAST(GREATEST(new_level, 1), 10000) * 4
    WHERE id = target_pokemon_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_pokemon_level(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_pokemon_level(UUID, INT) TO service_role;

-- ADD_STATUS_COLUMNS: Adiciona colunas de status necessárias para banimento se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
        ALTER TABLE public.profiles ADD COLUMN account_status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lock_until') THEN
        ALTER TABLE public.profiles ADD COLUMN lock_until TIMESTAMPTZ;
    END IF;
END $$;
