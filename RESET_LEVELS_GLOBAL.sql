-- Reset global de níveis para Treinador e Pokémon
-- Mantém itens, moedas, capturas e progresso, zerando apenas a força/nível.
-- O Admin lordryuhhhuyuyghh@gmail.com (UUID 61b4d001-c8c3-424d-862d-0b798782f9d6) é o único que mantém nível se desejar, 
-- mas o comando abaixo reseta TODOS por segurança conforme solicitado.

BEGIN;

-- 1. Resetar trainer_state (Nível 1, XP 0)
UPDATE public.trainer_state
SET trainer_level = 1,
    trainer_xp = 0,
    updated_at = now();

-- 2. Resetar pokemon_collection (Nível 1, XP 0, HP restaurado para o base do Nível 1)
-- Base HP no Nível 1: 20 + 1 * 4 = 24
UPDATE public.pokemon_collection
SET level = 1,
    xp = 0,
    hp_current = 24,
    hp_max = 24;

-- 3. Resetar ranking (ranked_scores) para refletir os novos níveis
UPDATE public.ranked_scores
SET trainer_level = 1,
    updated_at = now();

-- 4. Limpar snapshots nos game_saves (JSONB blob)
-- Isso força o cliente a re-sincronizar a partir das tabelas normalizadas (que já resetamos acima)
-- ou a reconstruir o estado base.
UPDATE public.game_saves
SET data = data || jsonb_build_object(
  'idle', (data->'idle') || jsonb_build_object('trainerLevel', 1, 'trainerXp', 0)
),
updated_at = now();

-- 5. Opcional: Desconectar todos os usuários para forçar recarregamento (exceto o admin)
-- Isso é feito via trigger ou alterando a secret do JWT se necessário, 
-- mas aqui apenas marcamos o tempo de manutenção.
UPDATE public.server_config
SET maintenance_mode = true,
    maintenance_reason = 'Reset global de níveis em andamento. Aguarde.',
    updated_at = now()
WHERE id = 1;

COMMIT;
