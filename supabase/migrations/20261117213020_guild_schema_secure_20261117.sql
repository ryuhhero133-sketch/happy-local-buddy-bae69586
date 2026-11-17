-- Guildas permanentes; criação transacional. Não altera saves existentes.
create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  element text not null check (element in ('fire','water','grass','psychic','poison','fairy','flying')),
  level integer not null default 1,
  xp integer not null default 0,
  total_donated integer not null default 0,
  treasury_gold integer not null default 0,
  treasury_crystal integer not null default 0,
  treasury_ruby integer not null default 0,
  founder_id uuid not null references auth.users(id),
  vice_leader_id uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.guild_members (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  username text not null,
  role text not null default 'member' check (role in ('leader','vice','member')),
  leader_species text,
  level integer not null default 1,
  joined_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);
create index if not exists guild_members_guild_idx on public.guild_members(guild_id);
create table if not exists public.guild_invites (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  guild_name text not null,
  from_user_id uuid not null references auth.users(id),
  from_username text not null,
  to_user_id uuid references auth.users(id),
  to_username text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now()
);
create index if not exists guild_invites_pending_user_idx on public.guild_invites(to_user_id) where status = 'pending';
create index if not exists guild_invites_pending_name_idx on public.guild_invites(lower(to_username)) where status = 'pending';
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_invites enable row level security;
grant select on public.guilds, public.guild_members to authenticated;
grant select on public.guild_invites to authenticated;
create policy guild_read on public.guilds for select to authenticated using (true);
create policy guild_members_read on public.guild_members for select to authenticated using (true);
create policy guild_invites_read on public.guild_invites for select to authenticated
  using (from_user_id = (select auth.uid()) or to_user_id = (select auth.uid())
    or (to_user_id is null and lower(to_username) =
      (select lower(username) from public.profiles where id = (select auth.uid()))));

create table if not exists public.guild_mission_claims (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null,
  claimed_at timestamptz not null default now(),
  primary key (guild_id, user_id, mission_id)
);
alter table public.guild_mission_claims enable row level security;
grant select on public.guild_mission_claims to authenticated;
create policy guild_mission_claims_read on public.guild_mission_claims
  for select to authenticated using (user_id = (select auth.uid()));
