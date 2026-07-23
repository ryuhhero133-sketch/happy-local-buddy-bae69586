-- ============================================================
-- FIX: compras no Mercado VIP falhando silenciosamente
-- Causa: a policy de UPDATE exigia auth.uid() = buyer_id no USING,
-- mas o comprador ainda NÃO é buyer_id quando clica em "Comprar"
-- (buyer_id está NULL). Resultado: 0 linhas atualizadas → "anúncio
-- indisponível", mesmo com stones/itens listados.
--
-- Este script separa em duas policies:
--   1) vendedor pode editar/atualizar seu próprio anúncio
--   2) qualquer autenticado pode "reivindicar" um anúncio aberto
--      (sold_at IS NULL AND buyer_id IS NULL), gravando-se como buyer_id
-- Rode no SQL Editor do Supabase.
-- ============================================================

alter table public.market_listings enable row level security;

drop policy if exists "market_listings_update_participants" on public.market_listings;
drop policy if exists "market_listings_update_seller"       on public.market_listings;
drop policy if exists "market_listings_update_buy"          on public.market_listings;

-- Vendedor pode atualizar seu próprio anúncio (ex.: editar preço/cancelar via update)
create policy "market_listings_update_seller"
  on public.market_listings for update
  to authenticated
  using  (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Comprador pode reivindicar um anúncio aberto, gravando buyer_id = auth.uid()
create policy "market_listings_update_buy"
  on public.market_listings for update
  to authenticated
  using  (sold_at is null and buyer_id is null and auth.uid() <> seller_id)
  with check (auth.uid() = buyer_id and sold_at is not null);

-- Força PostgREST a recarregar o schema/policies
notify pgrst, 'reload schema';

-- Conferência
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'market_listings'
order by policyname;
