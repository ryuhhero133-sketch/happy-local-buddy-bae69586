-- Adiciona coluna payout_claimed em market_listings para o vendedor
-- coletar (ouro / cristal / safira) DEPOIS que alguém comprou o anúncio.
-- Antes desse patch, quando o comprador clicava em "Comprar" o item ia pra
-- ele mas o vendedor nunca recebia a moeda -> "cristal não ia pro jogador".
-- Rode UMA vez no Supabase Studio -> SQL Editor.

ALTER TABLE public.market_listings
  ADD COLUMN IF NOT EXISTS payout_claimed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_market_listings_payout_pending
  ON public.market_listings (seller_id)
  WHERE sold_at IS NOT NULL AND payout_claimed = false;

NOTIFY pgrst, 'reload schema';
