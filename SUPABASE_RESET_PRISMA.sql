-- ============================================================
-- RESET GLOBAL DO CRISTAL PRISMA 🔷
-- Cristal Prisma agora é um token independente.
-- NÃO conta como pontos de craft nem pontos de captura.
-- Todos os jogadores voltam a 0 e passam a acumular do zero.
-- ============================================================

-- 1) Zera a coluna craft_points no ranked_scores (usada pelo leaderboard de Prisma)
UPDATE public.ranked_scores
SET craft_points = 0,
    updated_at = NOW();

-- 2) Zera craft_points em players (fallback do ranking)
UPDATE public.players
SET craft_points = 0;

-- 3) Zera o token Cristal Prisma dentro do JSON items em game_saves
UPDATE public.game_saves
SET items = COALESCE(items, '{}'::jsonb) || jsonb_build_object('cristal_fragmentado', 0),
    updated_at = NOW();

-- 4) Zera craftPoints legado em game_saves (não é mais usado)
UPDATE public.game_saves
SET craft_points = 0
WHERE craft_points IS NOT NULL;

-- Pronto. Todos os jogadores começam com 0 🔷 Cristal Prisma.
