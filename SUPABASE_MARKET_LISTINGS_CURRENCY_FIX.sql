-- Garante que market_listings aceita as moedas usadas no jogo (inclui safira).
-- Rode UMA VEZ no Supabase Studio -> SQL Editor.

ALTER TABLE public.market_listings
  DROP CONSTRAINT IF EXISTS market_listings_currency_check;

ALTER TABLE public.market_listings
  ADD CONSTRAINT market_listings_currency_check
  CHECK (currency IN ('gold','crystal','safira','esmerald'));
