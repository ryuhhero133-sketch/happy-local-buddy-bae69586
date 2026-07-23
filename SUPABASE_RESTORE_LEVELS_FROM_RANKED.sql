-- =====================================================================
--  RESTAURA NÍVEIS A PARTIR DO RANKED (snapshot de >= 1h atrás)
--  Rodar no Supabase → SQL Editor
-- =====================================================================
BEGIN;

-- 0) Desativa o trigger SE existir (não falha se não existir)
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

-- 1) Pega o maior nível registrado no ranked ANTES do incidente (>= 1h atrás)
--    Ajuste 'interval 1 hour' se o incidente foi há mais tempo (ex.: '3 hours').
WITH pre_incident AS (
  SELECT
    user_id,
    MAX( COALESCE((score->>'trainerLevel')::int,
                  (score->>'level')::int,
                  0) ) AS best_level
  FROM public.ranked_scores
  WHERE created_at <= now() - interval '1 hour'
    AND created_at >= now() - interval '24 hours'
  GROUP BY user_id
),
current_saves AS (
  SELECT
    user_id,
    COALESCE((save_data->>'trainerLevel')::int, 1) AS current_level,
    save_data
  FROM public.game_saves
),
to_restore AS (
  SELECT
    c.user_id,
    c.current_level,
    p.best_level,
    c.save_data
  FROM current_saves c
  JOIN pre_incident p ON p.user_id = c.user_id
  WHERE p.best_level > c.current_level
    AND p.best_level <= 10000
    AND p.best_level - c.current_level >= 5   -- só quem caiu de verdade
)
UPDATE public.game_saves g
SET save_data = jsonb_set(g.save_data, '{trainerLevel}', to_jsonb(r.best_level)),
    updated_at = now()
FROM to_restore r
WHERE g.user_id = r.user_id;

-- 2) Relatório: quem foi restaurado
SELECT
  g.user_id,
  u.email,
  (g.save_data->>'trainerLevel')::int AS novo_nivel
FROM public.game_saves g
LEFT JOIN auth.users u ON u.id = g.user_id
WHERE g.updated_at >= now() - interval '1 minute'
ORDER BY novo_nivel DESC;

-- 3) (Re)cria o trigger tolerante (+500/save, cap 10.000)
CREATE OR REPLACE FUNCTION public.enforce_game_save_caps()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_lvl int;
  new_lvl int;
BEGIN
  new_lvl := COALESCE((NEW.save_data->>'trainerLevel')::int, 1);
  old_lvl := COALESCE((OLD.save_data->>'trainerLevel')::int, new_lvl);

  IF new_lvl > 10000 THEN
    NEW.save_data := jsonb_set(NEW.save_data, '{trainerLevel}', to_jsonb(10000));
    new_lvl := 10000;
  END IF;

  IF (new_lvl - old_lvl) > 500 THEN
    NEW.save_data := jsonb_set(NEW.save_data, '{trainerLevel}', to_jsonb(old_lvl + 500));
  END IF;

  -- caps auxiliares
  IF COALESCE((NEW.save_data->>'gold')::bigint, 0) > 50000000 THEN
    NEW.save_data := jsonb_set(NEW.save_data, '{gold}', to_jsonb(50000000));
  END IF;
  IF COALESCE((NEW.save_data->>'crystals')::bigint, 0) > 1000000 THEN
    NEW.save_data := jsonb_set(NEW.save_data, '{crystals}', to_jsonb(1000000));
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_game_save_caps ON public.game_saves;
CREATE TRIGGER enforce_game_save_caps
BEFORE UPDATE ON public.game_saves
FOR EACH ROW EXECUTE FUNCTION public.enforce_game_save_caps();

COMMIT;
