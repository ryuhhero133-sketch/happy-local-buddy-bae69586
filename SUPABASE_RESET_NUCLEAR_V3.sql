-- FINAL NUCLEAR RESET V3 (Corrigido para Cloud Save e normalizado)
-- Este script garante o reset total e bloqueio de 20h.

-- 1. RESET DE NÍVEIS E XP (TREINADOR)
UPDATE public.trainer_state SET trainer_level = 1, trainer_xp = 0;

-- 2. RESET DE NÍVEIS E XP (POKÉMONS)
UPDATE public.pokemon_collection SET level = 1, xp = 0;

-- 3. LIMPEZA DOS RANKINGS
UPDATE public.ranked_scores SET trainer_level = 1, score = 0, total_kills = 0, pokedex_count = 0;

-- 4. RESET DO CLOUD SAVE (JSONB)
-- Aqui limpamos o estado consolidado para forçar o reinício do loop de save.
UPDATE public.game_saves SET data = '{"idle": {}, "team": [], "party": [], "restingBench": [], "inventory": {}, "pokeballs": {}, "savedAt": 0}'::jsonb;

-- 5. DESCONECTAR TODOS OS JOGADORES (LOGOUT GLOBAL)
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- 6. BLOQUEIO DE 20 HORAS (EXCETO ADMIN)
-- Substitua lordryuhhhuyuyghh@gmail.com pelo seu email de admin real se for diferente.
UPDATE public.profiles SET lock_until = now() + interval '20 hours'
WHERE id NOT IN (SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com');

-- 7. AUDITORIA
INSERT INTO public.audit_events (user_id, username, kind, detail)
VALUES ('00000000-0000-0000-0000-000000000000', 'SYSTEM', 'global_reset', '{"reason": "Maintenance Reset", "duration": "20h"}');
