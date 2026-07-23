-- =====================================================================
-- RESTAURA NÍVEIS A PARTIR DO RANKED (snapshot de >= 1h atrás)
-- Rodar no Supabase → SQL Editor
--
-- Corrigido para funcionar quando public.ranked_scores.score é INTEGER
-- e também quando existem colunas trainer_level / level.
-- =====================================================================

BEGIN;

-- 0) Desativa o trigger SE existir (não falha se não existir)
DO $$
BEGIN
  IF to_regclass('public.game_saves') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_trigger
       WHERE tgname = 'enforce_game_save_caps'
         AND tgrelid = 'public.game_saves'::regclass
     ) THEN
    EXECUTE 'ALTER TABLE public.game_saves DISABLE TRIGGER enforce_game_save_caps';
  END IF;
END $$;

-- 1) Garante um backup rápido antes de mexer
CREATE TABLE IF NOT EXISTS public.game_saves_backup_before_level_restore AS
SELECT *, now() AS backup_created_at
FROM public.game_saves
WHERE false;

INSERT INTO public.game_saves_backup_before_level_restore
SELECT *, now() AS backup_created_at
FROM public.game_saves;

-- 2) Descobre automaticamente o melhor nível no ranked ANTES do incidente.
--    Ajuste '1 hour' se o incidente foi há mais tempo, ex.: '3 hours'.
CREATE TEMP TABLE tmp_level_restore AS
WITH ranked_columns AS (
  SELECT
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ranked_scores'
        AND column_name = 'trainer_level'
    ) AS has_trainer_level,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ranked_scores'
        AND column_name = 'level'
    ) AS has_level,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ranked_scores'
        AND column_name = 'score'
    ) AS has_score,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ranked_scores'
        AND column_name = 'updated_at'
    ) AS has_updated_at,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ranked_scores'
        AND column_name = 'created_at'
    ) AS has_created_at
), ranked_raw AS (
  SELECT
    rs.user_id,
    CASE
      WHEN rc.has_trainer_level THEN to_jsonb(rs)->>'trainer_level'
      WHEN rc.has_level THEN to_jsonb(rs)->>'level'
      WHEN rc.has_score THEN to_jsonb(rs)->>'score'
      ELSE '0'
    END AS level_text,
    CASE
      WHEN rc.has_updated_at THEN (to_jsonb(rs)->>'updated_at')::timestamptz
      WHEN rc.has_created_at THEN (to_jsonb(rs)->>'created_at')::timestamptz
      ELSE now() - interval '2 hours'
    END AS ranked_time
  FROM public.ranked_scores rs
  CROSS JOIN ranked_columns rc
), pre_incident AS (
  SELECT
    user_id,
    MAX(
      GREATEST(
        1,
        LEAST(
          CASE WHEN level_text ~ '^[0-9]+$' THEN level_text::int ELSE 1 END,
          10000
        )
      )
    ) AS best_level
  FROM ranked_raw
  WHERE ranked_time <= now() - interval '1 hour'
    AND ranked_time >= now() - interval '24 hours'
  GROUP BY user_id
), current_saves AS (
  SELECT
    user_id,
    COALESCE(
      CASE WHEN (data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' THEN (data #>> '{idle,trainerLevel}')::int END,
      CASE WHEN (data #>> '{idle,trainer_level}') ~ '^[0-9]+$' THEN (data #>> '{idle,trainer_level}')::int END,
      CASE WHEN (data #>> '{trainerLevel}') ~ '^[0-9]+$' THEN (data #>> '{trainerLevel}')::int END,
      CASE WHEN (data #>> '{trainer,level}') ~ '^[0-9]+$' THEN (data #>> '{trainer,level}')::int END,
      1
    ) AS current_level
  FROM public.game_saves
)
SELECT
  c.user_id,
  c.current_level,
  p.best_level
FROM current_saves c
JOIN pre_incident p ON p.user_id = c.user_id
WHERE p.best_level > c.current_level
  AND p.best_level <= 10000
  AND p.best_level - c.current_level >= 5;

-- 3) Restaura o nível no JSON do save, cobrindo os formatos usados pelo projeto
UPDATE public.game_saves gs
SET data = CASE
    WHEN gs.data ? 'idle' THEN jsonb_set(gs.data, '{idle,trainerLevel}', to_jsonb(r.best_level), true)
    WHEN gs.data ? 'trainerLevel' THEN jsonb_set(gs.data, '{trainerLevel}', to_jsonb(r.best_level), true)
    WHEN gs.data ? 'trainer' THEN jsonb_set(gs.data, '{trainer,level}', to_jsonb(r.best_level), true)
    ELSE jsonb_set(gs.data, '{idle,trainerLevel}', to_jsonb(r.best_level), true)
  END,
  updated_at = now()
FROM tmp_level_restore r
WHERE gs.user_id = r.user_id;

-- 4) Atualiza ranked_scores e ranked_leaderboard para refletir o nível restaurado
DO $$
BEGIN
  IF to_regclass('public.ranked_scores') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'ranked_scores'
         AND column_name = 'trainer_level'
     ) THEN
    EXECUTE '
      UPDATE public.ranked_scores rs
      SET trainer_level = r.best_level,
          updated_at = now()
      FROM tmp_level_restore r
      WHERE rs.user_id = r.user_id
        AND rs.trainer_level < r.best_level
    ';
  END IF;

  IF to_regclass('public.ranked_leaderboard') IS NOT NULL THEN
    EXECUTE '
      UPDATE public.ranked_leaderboard rl
      SET trainer_level = r.best_level,
          score = (r.best_level::bigint * 100) + COALESCE(rl.craft_points, 0),
          updated_at = now()
      FROM tmp_level_restore r
      WHERE rl.user_id = r.user_id
        AND rl.trainer_level < r.best_level
    ';
  END IF;
END $$;

-- 5) Relatório final: quem foi restaurado
SELECT
  r.user_id,
  u.email,
  r.current_level AS nivel_antes,
  r.best_level AS nivel_restaurado
FROM tmp_level_restore r
LEFT JOIN auth.users u ON u.id = r.user_id
ORDER BY r.best_level DESC;

-- 6) Recria trigger tolerante (+500/save, cap 10.000) usando coluna data
CREATE OR REPLACE FUNCTION public.enforce_game_save_caps()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_lvl int;
  new_lvl int;
BEGIN
  new_lvl := COALESCE(
    CASE WHEN (NEW.data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' THEN (NEW.data #>> '{idle,trainerLevel}')::int END,
    CASE WHEN (NEW.data #>> '{idle,trainer_level}') ~ '^[0-9]+$' THEN (NEW.data #>> '{idle,trainer_level}')::int END,
    CASE WHEN (NEW.data #>> '{trainerLevel}') ~ '^[0-9]+$' THEN (NEW.data #>> '{trainerLevel}')::int END,
    CASE WHEN (NEW.data #>> '{trainer,level}') ~ '^[0-9]+$' THEN (NEW.data #>> '{trainer,level}')::int END,
    1
  );

  old_lvl := COALESCE(
    CASE WHEN (OLD.data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' THEN (OLD.data #>> '{idle,trainerLevel}')::int END,
    CASE WHEN (OLD.data #>> '{idle,trainer_level}') ~ '^[0-9]+$' THEN (OLD.data #>> '{idle,trainer_level}')::int END,
    CASE WHEN (OLD.data #>> '{trainerLevel}') ~ '^[0-9]+$' THEN (OLD.data #>> '{trainerLevel}')::int END,
    CASE WHEN (OLD.data #>> '{trainer,level}') ~ '^[0-9]+$' THEN (OLD.data #>> '{trainer,level}')::int END,
    new_lvl
  );

  IF new_lvl > 10000 THEN
    IF NEW.data ? 'idle' THEN
      NEW.data := jsonb_set(NEW.data, '{idle,trainerLevel}', to_jsonb(10000), true);
    ELSIF NEW.data ? 'trainerLevel' THEN
      NEW.data := jsonb_set(NEW.data, '{trainerLevel}', to_jsonb(10000), true);
    ELSIF NEW.data ? 'trainer' THEN
      NEW.data := jsonb_set(NEW.data, '{trainer,level}', to_jsonb(10000), true);
    ELSE
      NEW.data := jsonb_set(NEW.data, '{idle,trainerLevel}', to_jsonb(10000), true);
    END IF;
    new_lvl := 10000;
  END IF;

  IF (new_lvl - old_lvl) > 500 THEN
    IF NEW.data ? 'idle' THEN
      NEW.data := jsonb_set(NEW.data, '{idle,trainerLevel}', to_jsonb(old_lvl + 500), true);
    ELSIF NEW.data ? 'trainerLevel' THEN
      NEW.data := jsonb_set(NEW.data, '{trainerLevel}', to_jsonb(old_lvl + 500), true);
    ELSIF NEW.data ? 'trainer' THEN
      NEW.data := jsonb_set(NEW.data, '{trainer,level}', to_jsonb(old_lvl + 500), true);
    ELSE
      NEW.data := jsonb_set(NEW.data, '{idle,trainerLevel}', to_jsonb(old_lvl + 500), true);
    END IF;
  END IF;

  IF COALESCE(
    CASE WHEN (NEW.data #>> '{idle,gold}') ~ '^[0-9]+$' THEN (NEW.data #>> '{idle,gold}')::bigint END,
    CASE WHEN (NEW.data #>> '{gold}') ~ '^[0-9]+$' THEN (NEW.data #>> '{gold}')::bigint END,
    0
  ) > 50000000 THEN
    IF NEW.data ? 'idle' THEN
      NEW.data := jsonb_set(NEW.data, '{idle,gold}', to_jsonb(50000000), true);
    ELSE
      NEW.data := jsonb_set(NEW.data, '{gold}', to_jsonb(50000000), true);
    END IF;
  END IF;

  IF COALESCE(
    CASE WHEN (NEW.data #>> '{idle,crystals}') ~ '^[0-9]+$' THEN (NEW.data #>> '{idle,crystals}')::bigint END,
    CASE WHEN (NEW.data #>> '{crystals}') ~ '^[0-9]+$' THEN (NEW.data #>> '{crystals}')::bigint END,
    0
  ) > 1000000 THEN
    IF NEW.data ? 'idle' THEN
      NEW.data := jsonb_set(NEW.data, '{idle,crystals}', to_jsonb(1000000), true);
    ELSE
      NEW.data := jsonb_set(NEW.data, '{crystals}', to_jsonb(1000000), true);
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_game_save_caps ON public.game_saves;
CREATE TRIGGER enforce_game_save_caps
BEFORE UPDATE ON public.game_saves
FOR EACH ROW EXECUTE FUNCTION public.enforce_game_save_caps();

COMMIT;