-- PvP: registra quem foi o atacante de cada hit para o cliente da vítima
-- conseguir animar o Pokémon do outro jogador avançando e usando a skill.
alter table public.pvp_presence
  add column if not exists last_attacker_user_id uuid;

create or replace function private.pvp_presence_track_attacker()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.last_hit_at is distinct from old.last_hit_at and auth.uid() is not null then
    new.last_attacker_user_id := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function private.pvp_presence_track_attacker() from public, anon, authenticated;

drop trigger if exists pvp_presence_track_attacker on public.pvp_presence;
create trigger pvp_presence_track_attacker
before update on public.pvp_presence
for each row execute function private.pvp_presence_track_attacker();
