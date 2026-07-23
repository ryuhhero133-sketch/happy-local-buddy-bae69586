-- =====================================================================
--  RESTAURA NÍVEIS DERRUBADOS PELO TRIGGER (incidente do swampidle)
--  Rodar no Supabase → SQL Editor
-- =====================================================================
--  Estratégia:
--   1. Desliga o trigger anti-jump temporariamente.
--   2. Pega, pra cada usuário, o MAIOR nível registrado no ranked
--      ANTES do horário do incidente (ajuste :incident_at se precisar).
--   3. Compara com o trainerLevel atual em game_saves.
--   4. Se o save atual < histórico  →  restaura pro valor histórico.
--   5. Religa o trigger na versão tolerante (+500/save, cap 10.000).
-- =====================================================================

BEGIN;

-- 0) Ajuste esta janela se o horário do incidente for outro.
--    "1 hora atrás" a partir de agora:
--    (tudo que foi registrado ANTES desse instante conta como legítimo)
DO $$
DECLARE
  incident_at timestamptz := now() - interval '1 hour';
BEGIN
  PERFORM set_config('app.incident_at', incident_at::text, true);
END $$;

-- 1) DESLIGA o trigger pra poder gravar os níveis grandes de volta
ALTER TABLE public.game_saves DISABLE TRIGGER enforce_game_save_caps;

-- 2) Snapshot: maior nível legítimo de cada user antes do incidente
WITH pre_incident AS (
  SELECT user_id, MAX(trainer_level) AS best_level
  FROM (
    SELECT user_id, trainer_level, created_at
      FROM public.ranked_leaderboard
     WHERE created_at < (current_setting('app.incident_at'))::timestamptz
    UNION ALL
    SELECT user_id, trainer_level, created_at
      FROM public.ranked_scores
     WHERE created_at < (current_setting('app.incident_at'))::timestamptz
  ) h
  GROUP BY user_id
),
current_saves AS (
  SELECT user_id,
         COALESCE( (save_data->>'trainerLevel')::int, 1 ) AS cur_level,
         save_data
    FROM public.game_saves
),
to_fix AS (
  SELECT c.user_id,
         c.cur_level,
         LEAST(p.best_level, 10000) AS restore_to,
         c.save_data
    FROM current_saves c
    JOIN pre_incident p ON p.user_id = c.user_id
   WHERE p.best_level > c.cur_level         -- caiu
     AND p.best_level >= 10                 -- ignora ruído
)
UPDATE public.game_saves g
   SET save_data = jsonb_set(g.save_data,
                             '{trainerLevel}',
                             to_jsonb(t.restore_to),
                             true),
       updated_at = now()
  FROM to_fix t
 WHERE g.user_id = t.user_id;

-- 3) Log do que foi restaurado (aparece no output do SQL Editor)
SELECT g.user_id,
       (g.save_data->>'trainerLevel')::int AS novo_nivel
  FROM public.game_saves g
 WHERE g.updated_at > now() - interval '30 seconds'
 ORDER BY novo_nivel DESC;

-- 4) Religa o trigger (versão tolerante)
CREATE OR REPLACE FUNCTION public.enforce_game_save_caps()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_lvl int := COALESCE((OLD.save_data->>'trainerLevel')::int, 1);
  new_lvl int := COALESCE((NEW.save_data->>'trainerLevel')::int, 1);
BEGIN
  -- Cap absoluto
  IF new_lvl > 10000 THEN
    NEW.save_data := jsonb_set(NEW.save_data,'{trainerLevel}', to_jsonb(10000));
    new_lvl := 10000;
  END IF;
  -- Anti-jump: no máx +500 por save
  IF (new_lvl - old_lvl) > 500 THEN
    NEW.save_data := jsonb_set(NEW.save_data,'{trainerLevel}', to_jsonb(old_lvl + 500));
  END IF;
  RETURN NEW;
END $$;

ALTER TABLE public.game_saves ENABLE TRIGGER enforce_game_save_caps;

COMMIT;
