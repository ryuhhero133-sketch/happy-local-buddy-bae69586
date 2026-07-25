-- Reseta APENAS a pontuação de craft do ranked.
-- Mantém usuários, níveis, guildas e histórico de temporada.
-- Rode no Supabase SQL Editor.

begin;

-- 1) Zera craft_points no leaderboard da temporada atual
update public.ranked_leaderboard
set craft_points = 0,
    score = (trainer_level::bigint * 100),
    updated_at = now();

-- 2) Zera o "pokedex_count" (campo usado como craft points no ranked_scores)
update public.ranked_scores
set pokedex_count = 0,
    updated_at = now();

commit;

-- Conferência rápida:
-- select user_id, username, trainer_level, craft_points, score
-- from public.ranked_leaderboard
-- order by score desc limit 20;
