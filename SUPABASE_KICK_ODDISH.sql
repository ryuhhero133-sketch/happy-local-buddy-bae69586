-- Remove todos os jogadores presentes nos mapas do evento Odisséia Oddish.
-- A presença ao vivo é via Realtime (não há tabela public.players).
-- Basta atualizar o save persistente — no próximo login o jogador cai em verdejante.

-- 1) Atualiza o save persistente (game_saves.data.currentMap / px / py)
UPDATE public.game_saves
SET data = jsonb_set(
             jsonb_set(
               jsonb_set(data, '{currentMap}', '"verdejante"', false),
               '{px}', '400', false),
             '{py}', '300', false),
    updated_at = now()
WHERE data->>'currentMap' IN ('oddish_o1', 'oddish_o2');

-- 2) Conferir se sobrou alguém salvo no evento
SELECT count(*) AS ainda_no_evento
FROM public.game_saves
WHERE data->>'currentMap' IN ('oddish_o1', 'oddish_o2');
