-- 1. DESCONECTAR TODO MUNDO (inclusive admin, por precaução durante o reset)
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- 2. RESETAR NÍVEIS NAS TABELAS NORMALIZADAS (Tudo para 1 e XP para 0)
UPDATE public.trainer_state 
SET trainer_level = 1, 
    trainer_xp = 0;

UPDATE public.pokemon_collection 
SET level = 1, 
    xp = 0;

-- 3. RESETAR RANKING
UPDATE public.ranked_scores 
SET trainer_level = 1, 
    total_kills = 0;

-- 4. LIMPAR BLOBS DE SAVE (O MAIS IMPORTANTE)
-- Zera party, bench, equipe e inventários dentro do JSONB para evitar restauração de níveis
UPDATE public.game_saves
SET data = data || '{
  "team": [],
  "restingBench": [],
  "party": [],
  "inventory": [],
  "pokeballs": {},
  "savedAt": 0
}'::jsonb;

-- 5. BLOQUEIO DE 20 HORAS (EXCETO ADMIN)
-- Substitua pelo UUID do seu admin lordryuhhhuyuyghh@gmail.com
UPDATE public.profiles
SET lock_until = now() + interval '20 hours'
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email = 'lordryuhhhuyuyghh@gmail.com'
);

-- 6. AUDITORIA DO RESET
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_events' AND column_name = 'event_type') THEN
        INSERT INTO public.audit_events (user_id, event_type, details)
        SELECT id, 'SYSTEM_RESET', 'Global level reset and session wipe executed'
        FROM auth.users
        WHERE email = 'lordryuhhhuyuyghh@gmail.com'
        LIMIT 1;
    END IF;
END $$;
