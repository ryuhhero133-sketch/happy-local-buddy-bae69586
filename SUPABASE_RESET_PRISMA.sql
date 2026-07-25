-- ============================================================
-- RESET GLOBAL DO CRISTAL PRISMA 🔷
-- Cristal Prisma agora é um token independente.
-- NÃO conta como pontos de craft nem pontos de captura.
-- Todos os jogadores voltam a 0 e passam a acumular do zero.
-- ============================================================

-- 1) Zera o Cristal Prisma no ranked_scores.
-- A coluna correta é pokedex_count; NÃO existe craft_points nessa tabela em alguns setups.
UPDATE public.ranked_scores
SET pokedex_count = 0,
    updated_at = NOW();

-- 2) Zera craft_points em players para limpar fallback/legado visual.
UPDATE public.players
SET craft_points = 0,
    updated_at = NOW();

-- 3) Zera o token Cristal Prisma dentro do JSON data.items em game_saves.
UPDATE public.game_saves
SET data = jsonb_set(
      COALESCE(data, '{}'::jsonb),
      '{idle,items,cristal_fragmentado}',
      '0'::jsonb,
      true
    ),
    updated_at = NOW();

-- 4) Zera o ranked_leaderboard legado para ele não reaparecer como craft antigo.
UPDATE public.ranked_leaderboard
SET craft_points = 0,
    score = (trainer_level::bigint * 100),
    updated_at = NOW();

-- 5) Zera craftPoints legado em game_saves.data.idle (não é mais usado).
UPDATE public.game_saves
SET data = jsonb_set(
      COALESCE(data, '{}'::jsonb),
      '{idle,craftPoints}',
      '0'::jsonb,
      true
    ),
    updated_at = NOW();

-- Pronto. Todos os jogadores começam com 0 🔷 Cristal Prisma.
