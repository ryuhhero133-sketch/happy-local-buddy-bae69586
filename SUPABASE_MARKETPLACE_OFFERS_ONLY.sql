-- =====================================================
-- Marketplace: modo "somente ofertas"
-- Rode UMA vez no Supabase Studio → SQL Editor. Idempotente.
-- Requer SUPABASE_MARKETPLACE_POKEMON.sql e SUPABASE_MARKETPLACE_OFFERS.sql.
-- =====================================================

alter table public.pokemon_market
  add column if not exists offers_only boolean not null default false;
