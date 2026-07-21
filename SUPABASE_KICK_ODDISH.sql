-- Remove todos os jogadores presentes nos mapas do evento Odisséia Oddish.
-- Executar no SQL Editor do Supabase.

-- 1) Atualiza a tabela de presença (players) — envia todos pra Terra Verdejante (mapa inicial).
UPDATE public.players
SET map = 'verdejante',
    x = 400,
    y = 300,
    updated_at = now()
WHERE map IN ('oddish_o1', 'oddish_o2');

-- 2) Atualiza o save persistente (game_saves.data.currentMap) para quem estava no evento.
UPDATE public.game_saves
SET data = jsonb_set(
             jsonb_set(
               jsonb_set(data, '{currentMap}', '"verdejante"', false),
               '{px}', '400', false),
             '{py}', '300', false),
    updated_at = now()
WHERE data->>'currentMap' IN ('oddish_o1', 'oddish_o2');

-- 3) (opcional) Verificar quantos foram afetados
SELECT count(*) AS ainda_no_evento
FROM public.players
WHERE map IN ('oddish_o1', 'oddish_o2');
