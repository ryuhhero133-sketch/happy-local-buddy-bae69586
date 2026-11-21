-- O dono também lê sua ponte expirada para que o cliente mostre o cooldown
-- restante; os demais jogadores só recebem pontes ainda ativas.
drop policy if exists arv_epic_plants_read_active on public.arv_epic_plants;
create policy arv_epic_plants_read_active
  on public.arv_epic_plants
  for select to authenticated
  using (expires_at > now() or owner_id = (select auth.uid()));
