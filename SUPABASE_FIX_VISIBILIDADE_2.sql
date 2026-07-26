-- PARTE 2/3 — devolve LEITURA do marketplace + players
-- Rode sozinha, depois da parte 1.

do $$
declare t text;
begin
  foreach t in array array[
    'players',
    'pokemon_market',
    'market_listings',
    'marketplace_offers',
    'pokemon_market_listings'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select on public.%I to anon, authenticated', t);
      execute format('drop policy if exists "%s_public_read" on public.%I', t, t);
      execute format(
        'create policy "%s_public_read" on public.%I for select to anon, authenticated using (true)',
        t, t
      );
    end if;
  end loop;
end $$;
