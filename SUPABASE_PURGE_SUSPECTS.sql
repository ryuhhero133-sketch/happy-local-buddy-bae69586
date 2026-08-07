-- BAN AND WIPE SUSPICIOUS USER
-- Target: lordryuhhhuyuyghh@gmail.com (Admin, but we check if anyone else is Lv 10000)
-- This script finds anyone with Lv 10000 who is NOT the admin and applies the ban.

DO $$
DECLARE
    admin_email TEXT := 'lordryuhhhuyuyghh@gmail.com';
    target_id UUID;
    target_email TEXT;
BEGIN
    -- 1) Find the user(s) to ban (Level 10000+ and not admin)
    FOR target_id, target_email IN 
        SELECT p.id, p.email 
        FROM auth.users p
        JOIN public.ranked_scores rs ON rs.user_id = p.id
        WHERE rs.trainer_level >= 10000 
        AND p.email != admin_email
    LOOP
        -- Log the action
        INSERT INTO public.audit_events (event_type, user_id, metadata)
        VALUES ('security_ban_lv10k', target_id, jsonb_build_object('email', target_email, 'reason', 'Automated level 10000 check failure'));

        -- Set status to banned
        UPDATE public.profiles SET account_status = 'banned' WHERE id = target_id;
        
        -- Wipe game data to prevent any persistence
        DELETE FROM public.game_saves WHERE user_id = target_id;
        DELETE FROM public.ranked_scores WHERE user_id = target_id;
        DELETE FROM public.ranked_leaderboard WHERE user_id = target_id;
        
        RAISE NOTICE 'Banned and wiped user: % (%)', target_email, target_id;
    END LOOP;
END $$;
