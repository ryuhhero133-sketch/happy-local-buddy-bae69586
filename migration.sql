-- Adicionar coluna de reset_used na tabela profiles (ou trainer_state)
-- Usaremos trainer_state para manter a lógica de estado do jogo concentrada.
ALTER TABLE public.trainer_state ADD COLUMN IF NOT EXISTS season_reset_used BOOLEAN DEFAULT FALSE;

-- Garantir privilégios
GRANT UPDATE(season_reset_used) ON public.trainer_state TO authenticated;
