-- ============================================================
-- ENCERRAMENTO DO EVENTO GRASS ODDISH / ODISSÉIA ODDISH
-- Rode no Supabase → SQL Editor.
--   1) Move todos os jogadores que estão nos mapas do evento
--      (grass_oddish, oddish_o1, oddish_o2, oddish_o3) para o
--      mapa inicial "arena" no save persistente.
--   2) Zera o campo grassOddishReturnMap para não voltar sozinho.
--   3) Confere se sobrou alguém dentro.
-- Obs.: a presença ao vivo é via Realtime; ao próximo login/refresh
--       o cliente já respeita o `ODDISH_EVENT.enabled = false` e
--       expulsa quem estiver no mapa. Este SQL garante o save.
-- ============================================================

-- 1) Reposiciona no save persistente.
UPDATE public.game_saves
SET data = jsonb_set(
             jsonb_set(
               jsonb_set(
                 (data - 'grassOddishReturnMap'),
                 '{currentMap}', '"arena"', false),
               '{px}', '400', false),
             '{py}', '300', false),
    updated_at = now()
WHERE data->>'currentMap' IN ('grass_oddish', 'oddish_o1', 'oddish_o2', 'oddish_o3');

-- 2) Confere se sobrou alguém salvo no evento.
SELECT count(*) AS ainda_no_evento
FROM public.game_saves
WHERE data->>'currentMap' IN ('grass_oddish', 'oddish_o1', 'oddish_o2', 'oddish_o3');

-- 3) (Opcional) Preservar o ranking do evento — NÃO apagar.
--    O ranking global fica visível mesmo após o encerramento.
--    Se quiser resetar depois:
-- TRUNCATE public.oddish_event_leaderboard;
