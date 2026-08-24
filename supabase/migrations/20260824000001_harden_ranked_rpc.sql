-- Hardening record_ranked_score to be server-authoritative
-- It ignores input parameters and reads directly from trainer_state

CREATE OR REPLACE FUNCTION public.record_ranked_score(_level int, _craft_points int, _guild_name text DEFAULT null)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sid uuid;
  _uid text;
  _uname text;
  _real_level int;
  _real_kills int;
BEGIN
  _uid := auth.uid()::text;
  
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Fetch authoritative values
  SELECT trainer_level, kill_count INTO _real_level, _real_kills 
  FROM public.trainer_state 
  WHERE user_id::text = _uid;

  IF _real_level IS NULL THEN
     _real_level := 1;
     _real_kills := 0;
  END IF;

  -- 2. Season handling
  SELECT id INTO _sid FROM public.ranked_seasons WHERE is_current = true LIMIT 1;
  IF _sid IS NULL THEN
    INSERT INTO public.ranked_seasons (started_at, ends_at, is_current)
    VALUES (now(), now() + interval '20 hours', true)
    RETURNING id INTO _sid;
  END IF;

  -- 3. Username handling
  SELECT coalesce(username, 'Treinador') INTO _uname FROM public.profiles WHERE id::text = _uid;

  -- 4. Upsert with AUTHORITATIVE values, ignoring parameters
  INSERT INTO public.ranked_leaderboard (season_id, user_id, username, trainer_level, craft_points, guild_name, updated_at)
  VALUES (_sid, _uid, coalesce(_uname, 'Treinador'), _real_level, _real_kills, _guild_name, now())
  ON CONFLICT (season_id, user_id) DO UPDATE
    SET trainer_level = excluded.trainer_level,
        craft_points = excluded.craft_points,
        guild_name = excluded.guild_name,
        username = excluded.username,
        updated_at = now();
END;
$$;
