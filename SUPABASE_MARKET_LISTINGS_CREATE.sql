-- Cria a tabela market_listings usada pelo Mercado VIP (itens/stones/etc).
-- Rode UMA VEZ no Supabase Studio -> SQL Editor.

CREATE TABLE IF NOT EXISTS public.market_listings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    uuid NOT NULL,
  seller_name  text NOT NULL,
  buyer_id     uuid,
  kind         text NOT NULL,               -- 'item' | 'stone' | etc.
  item_id      text,
  qty          integer DEFAULT 1,
  pet_data     jsonb,
  price        numeric NOT NULL DEFAULT 0,
  currency     text NOT NULL DEFAULT 'gold',
  sold_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT market_listings_currency_check
    CHECK (currency IN ('gold','crystal','safira','esmerald'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_listings TO authenticated;
GRANT SELECT ON public.market_listings TO anon;
GRANT ALL    ON public.market_listings TO service_role;

ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_listings_select_all" ON public.market_listings;
CREATE POLICY "market_listings_select_all"
  ON public.market_listings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "market_listings_insert_own" ON public.market_listings;
CREATE POLICY "market_listings_insert_own"
  ON public.market_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "market_listings_update_participants" ON public.market_listings;
CREATE POLICY "market_listings_update_participants"
  ON public.market_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = buyer_id);

DROP POLICY IF EXISTS "market_listings_delete_own" ON public.market_listings;
CREATE POLICY "market_listings_delete_own"
  ON public.market_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE INDEX IF NOT EXISTS idx_market_listings_open
  ON public.market_listings (created_at DESC)
  WHERE sold_at IS NULL;
