-- 1. Resetar níveis e XP de Treinadores e Pokémons nas tabelas principais
UPDATE public.trainer_state
SET 
    trainer_level = 1,
    trainer_xp = 0,
    kill_count = 0,
    updated_at = now();

UPDATE public.pokemon_collection
SET 
    level = 1,
    xp = 0,
    hp_current = 24,
    hp_max = 24;

-- 2. LIMPAR O CLOUD SAVE (JSONB)
-- O progresso de missões e itens (party) fica aqui. Se não limpar,
-- o cliente vai reidratar os níveis antigos a partir do blob JSON.
UPDATE public.game_saves
SET data = data || '{"party": [], "team": [], "restingBench": []}'::jsonb,
    updated_at = now();

-- 3. Resetar Ranked Scores
UPDATE public.ranked_scores
SET trainer_level = 1,
    total_kills = 0,
    pokedex_count = 0,
    updated_at = now();

-- 4. FORÇAR LOGOUT GLOBAL
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- 5. Bloqueio de 20h para todos EXCETO lordryuhhhuyuyghh@gmail.com
UPDATE public.profiles
SET lock_until = CASE 
    WHEN id IN (SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com') THEN NULL
    ELSE now() + interval '20 hours'
    END,
    account_status = CASE 
    WHEN id IN (SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com') THEN 'active'
    ELSE 'analysis'
    END;

-- 6. Garantir permissões
GRANT SELECT, UPDATE ON public.game_saves TO authenticated;
GRANT ALL ON public.game_saves TO service_role;
