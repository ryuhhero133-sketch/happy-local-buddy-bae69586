-- Installed on the live project as black_egg_owner_writes_20261117.
-- No player row is modified. Allow the signed-in owner to upsert their save.
grant select, insert, update on public.black_egg_saves to authenticated;
create policy black_egg_owner_insert on public.black_egg_saves
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy black_egg_owner_update on public.black_egg_saves
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
