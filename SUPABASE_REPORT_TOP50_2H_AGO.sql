-- =====================================================================
-- RELATÓRIO: Top 50 jogadores conforme o ranked de ~2 horas atrás
-- Rodar no Supabase → SQL Editor
--
-- Usa ranked_scores como snapshot (o updated_at é atualizado a cada
-- save de ranked). Pegamos, por jogador, o registro mais recente
-- que seja <= now() - interval '2 hours' (ou seja, o "último visto"
-- antes de 2h atrás). Depois ordenamos por nível desc.
-- =====================================================================

WITH ranked_columns AS (
  SELECT
    EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='ranked_scores' AND column_name='trainer_level') AS has_trainer_level,
    EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='ranked_scores' AND column_name='level') AS has_level,
    EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='ranked_scores' AND column_name='score') AS has_score,
    EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='ranked_scores' AND column_name='username') AS has_username,
    EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='ranked_scores' AND column_name='updated_at') AS has_updated_at,
    EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='ranked_scores' AND column_name='created_at') AS has_created_at
),
ranked_raw AS (
  SELECT
    rs.user_id,
    CASE
      WHEN rc.has_username THEN to_jsonb(rs)->>'username'
      ELSE NULL
    END AS username,
    CASE
      WHEN rc.has_trainer_level THEN to_jsonb(rs)->>'trainer_level'
      WHEN rc.has_level THEN to_jsonb(rs)->>'level'
      WHEN rc.has_score THEN to_jsonb(rs)->>'score'
      ELSE '0'
    END AS level_text,
    CASE
      WHEN rc.has_updated_at THEN (to_jsonb(rs)->>'updated_at')::timestamptz
      WHEN rc.has_created_at THEN (to_jsonb(rs)->>'created_at')::timestamptz
      ELSE now()
    END AS ranked_time
  FROM public.ranked_scores rs
  CROSS JOIN ranked_columns rc
),
snapshot AS (
  -- Último registro de cada jogador que existia antes de 2h atrás
  SELECT DISTINCT ON (user_id)
    user_id,
    username,
    GREATEST(1, LEAST(
      CASE WHEN level_text ~ '^[0-9]+$' THEN level_text::int ELSE 1 END,
      10000
    )) AS trainer_level,
    ranked_time
  FROM ranked_raw
  WHERE ranked_time <= now() - interval '2 hours'
  ORDER BY user_id, ranked_time DESC
)
SELECT
  ROW_NUMBER() OVER (ORDER BY s.trainer_level DESC, s.ranked_time ASC) AS pos,
  s.user_id,
  COALESCE(NULLIF(s.username, ''), u.email, 'Treinador') AS jogador,
  u.email,
  s.trainer_level AS nivel_2h_atras,
  s.ranked_time    AS registrado_em
FROM snapshot s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.trainer_level DESC, s.ranked_time ASC
LIMIT 50;
