-- Reinício remoto acionado apenas pelo dono.
-- Nenhum cliente consulta versão periodicamente: quem está online escuta
-- somente esta linha via Realtime e só reage quando o dono pedir.
create table if not exists public.game_client_refresh (
  id smallint primary key default 1 check (id = 1),
  version bigint not null default 1,
  message text,
  requested_by uuid,
  requested_at timestamptz not null default now()
);

insert into public.game_client_refresh (id, version)
values (1, 1)
on conflict (id) do nothing;

alter table public.game_client_refresh enable row level security;

drop policy if exists "game_client_refresh_select_authenticated" on public.game_client_refresh;
create policy "game_client_refresh_select_authenticated"
  on public.game_client_refresh for select
  to authenticated
  using (true);

-- Clientes só leem. A escrita ocorre exclusivamente pela função abaixo.
revoke all on table public.game_client_refresh from anon, authenticated;
grant select on table public.game_client_refresh to authenticated;

create or replace function public.request_game_client_refresh(p_message text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _version bigint;
begin
  if auth.uid() is distinct from '16d47359-8fbb-4a81-9596-918b2d53b75b'::uuid then
    raise exception 'not_owner';
  end if;

  update public.game_client_refresh
     set version = version + 1,
         message = left(coalesce(p_message, ''), 160),
         requested_by = auth.uid(),
         requested_at = now()
   where id = 1
  returning version into _version;

  if _version is null then
    insert into public.game_client_refresh (id, version, message, requested_by)
    values (1, 2, left(coalesce(p_message, ''), 160), auth.uid())
    returning version into _version;
  end if;

  return jsonb_build_object('ok', true, 'version', _version);
end;
$$;

revoke all on function public.request_game_client_refresh(text) from public, anon;
grant execute on function public.request_game_client_refresh(text) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.game_client_refresh;
exception
  when duplicate_object then null;
end $$;
