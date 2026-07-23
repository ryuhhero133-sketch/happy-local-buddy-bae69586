-- =====================================================================
-- Restaura o Top 2–8 (usernames do print) em TODAS as tabelas.
-- Fonte de verdade que o cliente lê no login: public.trainer_state
-- Também atualiza ranked_scores, ranked_leaderboard e game_saves.data
-- (trainerLevel + trainerXp calculado por xpNeeded(L) = 40*(L-1)*L).
-- =====================================================================

BEGIN;

-- Desliga o trigger de caps se existir (evita reverter os UPDATEs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_game_save_caps'
      AND tgrelid = 'public.game_saves'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.game_saves DISABLE TRIGGER enforce_game_save_caps';
  END IF;
END $$;

-- Alvos (username -> nível desejado). Ajuste se algum username no banco
-- estiver com capitalização/espaço diferente do print.
WITH targets(username, lv) AS (
  VALUES
    ('GM',                    4899),
    ('nannonerd',             4628),
    ('hellsgaming',           4499),
    ('lucasgreffy',           2660),
    ('tombitos',              2597),
    ('carloscosta2016pok',    2287),
    ('elton17',               1981)
),
resolved AS (
  -- Match case-insensitive + com/sem espaço
  SELECT DISTINCT ON (rs.user_id)
    rs.user_id,
    t.username AS wanted_username,
    t.lv       AS wanted_level,
    (40 * (t.lv - 1) * t.lv)::bigint AS wanted_xp_at_level
  FROM targets t
  JOIN public.ranked_scores rs
    ON lower(regexp_replace(rs.username, '\s+', '', 'g'))
     = lower(regexp_replace(t.username, '\s+', '', 'g'))
),
-- 1) trainer_state (o que o cliente lê no login → o "conserto" real)
upd_ts AS (
  UPDATE public.trainer_state ts
     SET trainer_level = r.wanted_level,
         trainer_xp    = 0,
         updated_at    = now()
    FROM resolved r
   WHERE ts.user_id = r.user_id
  RETURNING ts.user_id
),
-- 2) ranked_scores (o que aparece no ranking global)
upd_rs AS (
  UPDATE public.ranked_scores rs
     SET trainer_level = r.wanted_level,
         updated_at    = now()
    FROM resolved r
   WHERE rs.user_id = r.user_id
  RETURNING rs.user_id
),
-- 3) ranked_leaderboard (histórico da season)
upd_rl AS (
  UPDATE public.ranked_leaderboard rl
     SET trainer_level = r.wanted_level
    FROM resolved r
   WHERE rl.user_id = r.user_id
  RETURNING rl.user_id
),
-- 4) game_saves.data (blob completo — evita rollback no próximo autosave)
upd_gs AS (
  UPDATE public.game_saves gs
     SET data = jsonb_set(
                  jsonb_set(
                    COALESCE(gs.data, '{}'::jsonb),
                    '{idle,trainerLevel}', to_jsonb(r.wanted_level), true
                  ),
                  '{idle,trainerXp}', to_jsonb(0), true
                ),
         updated_at = now()
    FROM resolved r
   WHERE gs.user_id = r.user_id
  RETURNING gs.user_id
)
SELECT r.wanted_username, r.wanted_level,
       (r.user_id IN (SELECT user_id FROM upd_ts)) AS trainer_state_ok,
       (r.user_id IN (SELECT user_id FROM upd_rs)) AS ranked_scores_ok,
       (r.user_id IN (SELECT user_id FROM upd_rl)) AS ranked_leaderboard_ok,
       (r.user_id IN (SELECT user_id FROM upd_gs)) AS game_saves_ok
  FROM resolved r
 ORDER BY r.wanted_level DESC;

-- Religa o trigger de caps se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_game_save_caps'
      AND tgrelid = 'public.game_saves'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.game_saves ENABLE TRIGGER enforce_game_save_caps';
  END IF;
END $$;

COMMIT;

-- Conferência final
SELECT ts.trainer_level, rs.username, rs.trainer_level AS ranked_lv
  FROM public.trainer_state ts
  JOIN public.ranked_scores rs ON rs.user_id = ts.user_id
 WHERE lower(regexp_replace(rs.username, '\s+', '', 'g')) IN
       ('gm','nannonerd','hellsgaming','lucasgreffy','tombitos','carloscosta2016pok','elton17')
 ORDER BY ts.trainer_level DESC;
