-- Function to update pokemon level securely
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
