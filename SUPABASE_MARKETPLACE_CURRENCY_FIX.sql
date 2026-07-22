-- SUPABASE_MARKETPLACE_CURRENCY_FIX.sql
-- Relaxa o CHECK de currency no pokemon_market e pokemon_market_offers
-- para aceitar as novas moedas: gold, crystal, safira, esmerald.
-- Rode este SQL uma vez no SQL Editor do Supabase.

ALTER TABLE public.pokemon_market
  DROP CONSTRAINT IF EXISTS pokemon_market_currency_check;
ALTER TABLE public.pokemon_market
  ADD CONSTRAINT pokemon_market_currency_check
  CHECK (currency IN ('gold','crystal','safira','esmerald'));

ALTER TABLE public.pokemon_market_offers
  DROP CONSTRAINT IF EXISTS pokemon_market_offers_currency_check;
ALTER TABLE public.pokemon_market_offers
  ADD CONSTRAINT pokemon_market_offers_currency_check
  CHECK (currency IN ('gold','crystal','safira','esmerald'));
