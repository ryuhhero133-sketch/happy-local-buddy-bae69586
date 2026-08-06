-- 1. RESET DE NÍVEIS E XP (TREINADOR)
UPDATE public.trainer_state SET trainer_level = 1, trainer_xp = 0;

-- 2. RESET DE NÍVEIS E XP (POKÉMONS)
UPDATE public.pokemon_collection SET level = 1, xp = 0;

-- 3. LIMPEZA DOS RANKINGS
UPDATE public.ranked_scores SET trainer_level = 1, score = 0, total_kills = 0, pokedex_count = 0;

-- 4. RESET DO CLOUD SAVE (JSONB) - CRÍTICO PARA EVITAR RESTAURAÇÃO DE NÍVEL ALTO
UPDATE public.game_saves SET data = '{"idle": {}, "team": [], "party": [], "restingBench": [], "inventory": {}, "pokeballs": {}, "savedAt": 0}'::jsonb;

-- 5. DESCONECTAR TODOS OS JOGADORES (LOGOUT GLOBAL)
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- 6. BLOQUEIO DE 20 HORAS (EXCETO ADMIN)
UPDATE public.profiles SET lock_until = now() + interval '20 hours'
WHERE id NOT IN (SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com');

-- 7. AUDITORIA
INSERT INTO public.audit_events (actor_id, action, details)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com' LIMIT 1),
  'global_nuclear_reset',
  '{"reason": "Maintenance Reset", "timestamp": "' || now() || '"}'
);
