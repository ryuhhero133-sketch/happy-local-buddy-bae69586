-- Pré-registro: uma reivindicação e uma eclosão por conta. Não modifica saves existentes.
create table if not exists public.prereg_egg_rewards (
  user_id uuid primary key references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  hatch_at timestamptz not null default (now() + interval '30 minutes'),
  species text not null,
  pokemon_id uuid not null unique default gen_random_uuid(),
  hatched_at timestamptz
);

alter table public.prereg_egg_rewards enable row level security;
revoke all on public.prereg_egg_rewards from anon, authenticated;
grant select on public.prereg_egg_rewards to authenticated;
drop policy if exists prereg_reward_owner_read on public.prereg_egg_rewards;
create policy prereg_reward_owner_read on public.prereg_egg_rewards
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.claim_prereg_egg(p_code text)
returns public.prereg_egg_rewards
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_level integer;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_reward public.prereg_egg_rewards;
  -- Apenas espécies iniciais que possuem dados de batalha no jogo atual.
  v_species text[] := array['charmander','bulbasaur','squirtle','sprigatito'];
begin
  if v_user is null then raise exception 'Entre na sua conta para resgatar.'; end if;
  select * into v_reward from public.prereg_egg_rewards where user_id = v_user;
  if found then raise exception 'Este ovo já foi resgatado nesta conta.'; end if;
  if length(v_code) <> 12 then raise exception 'Código inválido.'; end if;
  select case
    when (data #>> '{idle,trainerLevel}') ~ '^[0-9]{1,6}$'
    then (data #>> '{idle,trainerLevel}')::integer
    else 0 end
  into v_level from public.game_saves where user_id = v_user;
  if coalesce(v_level, 0) < 10 then raise exception 'Alcance o nível 10 para resgatar o ovo.'; end if;
  insert into public.prereg_egg_rewards (user_id, species)
  values (v_user, v_species[1 + floor(random() * array_length(v_species, 1))::integer])
  on conflict (user_id) do nothing returning * into v_reward;
  if not found then raise exception 'Este ovo já foi resgatado nesta conta.'; end if;
  return v_reward;
end;
$$;

create or replace function public.hatch_prereg_egg()
returns public.prereg_egg_rewards
language plpgsql security definer set search_path = ''
as $$
declare v_reward public.prereg_egg_rewards;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  update public.prereg_egg_rewards
  set hatched_at = coalesce(hatched_at, now())
  where user_id = auth.uid() and hatch_at <= now()
  returning * into v_reward;
  if not found then raise exception 'O ovo ainda está incubando ou não foi resgatado.'; end if;
  return v_reward;
end;
$$;

revoke all on function public.claim_prereg_egg(text) from public, anon;
revoke all on function public.hatch_prereg_egg() from public, anon;
grant execute on function public.claim_prereg_egg(text) to authenticated;
grant execute on function public.hatch_prereg_egg() to authenticated;
