-- 1. Create security tracking tables
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    table_name TEXT,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own security events" ON public.security_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.suspected_exploits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    username TEXT,
    reason TEXT NOT NULL,
    value JSONB,
    expected_range JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.suspected_exploits TO authenticated;
GRANT ALL ON public.suspected_exploits TO service_role;
ALTER TABLE public.suspected_exploits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view suspected exploits" ON public.suspected_exploits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Lockdown RLS (Authenticated users can only SELECT)
-- We remove INSERT/UPDATE/DELETE policies that were using simple auth.uid() checks
-- The game must move to Server Functions (service_role) for these updates.

DROP POLICY IF EXISTS "Users can update own trainer state" ON public.trainer_state;
DROP POLICY IF EXISTS "Players can update their own profile" ON public.players;
DROP POLICY IF EXISTS "Users can update their own pokeballs" ON public.pokeballs;
DROP POLICY IF EXISTS "Users can update their own pokemon" ON public.pokemon_collection;
DROP POLICY IF EXISTS "Users can update their own scores" ON public.ranked_scores;
DROP POLICY IF EXISTS "Users can insert their own scores" ON public.ranked_scores;

-- 3. Stricter Save validation trigger
CREATE OR REPLACE FUNCTION public.validate_trainer_progression()
RETURNS TRIGGER AS $$
DECLARE
    max_level_jump INTEGER := 10;
    max_gold_jump BIGINT := 1000000;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Level check
        IF NEW.trainer_level > OLD.trainer_level + max_level_jump THEN
            INSERT INTO public.suspected_exploits (user_id, reason, value, expected_range)
            VALUES (NEW.user_id, 'ILLEGAL_LEVEL_JUMP', jsonb_build_object('old', OLD.trainer_level, 'new', NEW.trainer_level), jsonb_build_object('max_jump', max_level_jump));
            NEW.trainer_level := OLD.trainer_level; -- Revert
        END IF;

        -- Gold check
        IF NEW.gold > OLD.gold + max_gold_jump THEN
             INSERT INTO public.suspected_exploits (user_id, reason, value, expected_range)
             VALUES (NEW.user_id, 'ILLEGAL_GOLD_JUMP', jsonb_build_object('old', OLD.gold, 'new', NEW.gold), jsonb_build_object('max_jump', max_gold_jump));
             NEW.gold := OLD.gold; -- Revert
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_validate_trainer_progression ON public.trainer_state;
CREATE TRIGGER tr_validate_trainer_progression
BEFORE UPDATE ON public.trainer_state
FOR EACH ROW EXECUTE FUNCTION public.validate_trainer_progression();

