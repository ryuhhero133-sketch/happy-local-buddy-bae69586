-- PARTE 1/3 — devolve LEITURA do ranked (nao altera progresso)
-- Rode sozinha. Leva <1s.

grant usage on schema public to anon, authenticated;

grant select on public.ranked_scores      to anon, authenticated;
grant select on public.ranked_leaderboard to anon, authenticated;
grant select on public.ranked_seasons     to anon, authenticated;

drop policy if exists "ranked_scores_public_read" on public.ranked_scores;
create policy "ranked_scores_public_read" on public.ranked_scores
  for select to anon, authenticated using (true);

drop policy if exists "ranked_leaderboard_public_read" on public.ranked_leaderboard;
create policy "ranked_leaderboard_public_read" on public.ranked_leaderboard
  for select to anon, authenticated using (true);

drop policy if exists "ranked_seasons_public_read" on public.ranked_seasons;
create policy "ranked_seasons_public_read" on public.ranked_seasons
  for select to anon, authenticated using (true);
