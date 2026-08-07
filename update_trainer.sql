-- Function to update trainer level and XP securely
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
