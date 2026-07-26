-- PARTE 3/3 — confere. Nao altera nada, so lista.

select 'ranked_scores'      as tabela, count(*) from public.ranked_scores
union all
select 'ranked_leaderboard', count(*) from public.ranked_leaderboard
union all
select 'ranked_seasons',     count(*) from public.ranked_seasons;

-- Top 30 treinadores atual:
select username, trainer_level
from public.ranked_scores
order by trainer_level desc
limit 30;
