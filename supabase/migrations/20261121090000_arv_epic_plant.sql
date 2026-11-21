-- Epic Plant: ponte temporária compartilhada no ARV.
-- Só o RPC escreve. A posição do caster é conferida no heartbeat de presença
-- e o time ativo é lido do checkpoint salvo no servidor.

create table if not exists public.arv_epic_plants (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  map_id text not null default 'arv' check (map_id = 'arv'),
  x1 integer not null check (x1 between 0 and 10000),
  y1 integer not null check (y1 between 0 and 10000),
  x2 integer not null check (x2 between 0 and 10000),
  y2 integer not null check (y2 between 0 and 10000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  cooldown_until timestamptz not null,
  check (expires_at > created_at),
  check (cooldown_until >= expires_at)
);

create index if not exists arv_epic_plants_expires_at_idx
  on public.arv_epic_plants (expires_at);

alter table public.arv_epic_plants enable row level security;

drop policy if exists arv_epic_plants_read_active on public.arv_epic_plants;
create policy arv_epic_plants_read_active
  on public.arv_epic_plants
  for select to authenticated
  using (expires_at > now());

revoke all on public.arv_epic_plants from anon;
revoke insert, update, delete on public.arv_epic_plants from authenticated;
grant select on public.arv_epic_plants to authenticated;

create or replace function public.cast_arv_epic_plant(
  p_x integer,
  p_y integer,
  p_dx integer,
  p_dy integer
)
returns public.arv_epic_plants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_leader_species text;
  v_presence public.pvp_presence%rowtype;
  v_existing public.arv_epic_plants%rowtype;
  v_result public.arv_epic_plants%rowtype;
  v_length integer := 520;
begin
  if v_user is null then
    raise exception 'Entre em uma conta para usar Epic Plant.';
  end if;
  if p_x not between 0 and 10000 or p_y not between 0 and 10000 then
    raise exception 'Posição inválida.';
  end if;
  if not ((abs(p_dx) = 1 and p_dy = 0) or (abs(p_dy) = 1 and p_dx = 0)) then
    raise exception 'Direção inválida.';
  end if;

  select data into v_save
  from public.game_saves
  where user_id = v_user;

  if not found or v_save #>> '{idle,currentMap}' <> 'arv' then
    raise exception 'Epic Plant só pode ser usada no ARV.';
  end if;

  v_leader_species := v_save #>> '{team,0,species}';
  if coalesce(v_leader_species, '') not in ('bulbasaur_shiny', 'venusaur_shiny') then
    raise exception 'Epic Plant requer Venusaur Shiny ou Bulbasaur Shiny como líder.';
  end if;

  select * into v_presence
  from public.pvp_presence
  where user_id = v_user
    and map_id = 'arv'
    and updated_at > now() - interval '15 seconds';
  if not found
    or abs(v_presence.x - p_x) > 180
    or abs(v_presence.y - p_y) > 180 then
    raise exception 'Posição do ARV não confirmada. Aguarde o jogo sincronizar.';
  end if;

  select * into v_existing
  from public.arv_epic_plants
  where owner_id = v_user
  for update;
  if found and v_existing.cooldown_until > now() then
    raise exception 'Epic Plant ainda está em recarga.';
  end if;

  insert into public.arv_epic_plants (
    owner_id, map_id, x1, y1, x2, y2, created_at, expires_at, cooldown_until
  ) values (
    v_user, 'arv',
    p_x + p_dx * 20, p_y + p_dy * 20,
    p_x + p_dx * v_length, p_y + p_dy * v_length,
    now(), now() + interval '1 minute', now() + interval '4 minutes'
  )
  on conflict (owner_id) do update set
    map_id = excluded.map_id,
    x1 = excluded.x1, y1 = excluded.y1,
    x2 = excluded.x2, y2 = excluded.y2,
    created_at = excluded.created_at,
    expires_at = excluded.expires_at,
    cooldown_until = excluded.cooldown_until
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.cast_arv_epic_plant(integer, integer, integer, integer) from public, anon;
grant execute on function public.cast_arv_epic_plant(integer, integer, integer, integer) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.arv_epic_plants;
exception
  when duplicate_object then null;
end;
$$;
