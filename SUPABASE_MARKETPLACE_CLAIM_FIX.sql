-- =====================================================
-- FIX: comprador não conseguia marcar buyer_claimed=true
-- após a venda (RLS bloqueava porque exigia status='active').
-- Sintoma: F5 fazia o cliente re-processar a compra, descontando
-- cristais/ouro várias vezes.
-- Rode UMA VEZ no Supabase Studio → SQL Editor.
-- =====================================================

drop policy if exists "pkm_market_update_buyer"       on public.pokemon_market;
drop policy if exists "pkm_market_update_buyer_claim" on public.pokemon_market;

-- Compra atômica: só quando ainda está ativo e sem comprador.
create policy "pkm_market_update_buyer" on public.pokemon_market
  for update to authenticated
  using (
    status = 'active'
    and activate_at <= now()
    and seller_id <> auth.uid()
    and buyer_id is null
  )
  with check (
    buyer_id = auth.uid()
    and status = 'sold'
  );

-- Reclamar entrega: o próprio comprador marca buyer_claimed=true
-- depois que a venda foi concluída (status='sold', buyer_id = eu).
create policy "pkm_market_update_buyer_claim" on public.pokemon_market
  for update to authenticated
  using (
    status = 'sold'
    and buyer_id = auth.uid()
  )
  with check (
    status = 'sold'
    and buyer_id = auth.uid()
  );
