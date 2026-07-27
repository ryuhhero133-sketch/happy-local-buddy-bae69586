-- =====================================================================
-- SAVE 100% FUNCIONAL + PROTEGIDO (rode UMA VEZ no Supabase > SQL Editor)
--
-- O que faz:
--   1) Garante a tabela game_saves e as PERMISSÕES da Data API.
--   2) Recria as POLICIES do dono de forma INDEPENDENTE DO TIPO da coluna
--      user_id (funciona com text OU uuid) — o erro de tipo era um dos
--      motivos das policies não existirem e o save falhar.
--   3) Deixa o trigger anti-cheat À PROVA DE FALHA: se qualquer parte dele
--      der erro, o SAVE DO JOGADOR PASSA MESMO ASSIM (nunca perder progresso).
--   4) Diagnóstico no final.
--
-- Nada de progresso é apagado, resetado ou alterado.
-- =====================================================================

create table if not exists public.game_saves (
  user_id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 1) Data API
revoke all on public.game_saves from anon;
grant select, insert, update, delete on public.game_saves to authenticated;
grant all on public.game_saves to service_role;
alter table public.game_saves enable row level security;

-- 2) Policies do dono (comparação sempre em texto -> serve p/ text e uuid)
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'game_saves'
  loop
    execute format('drop policy if exists %I on public.game_saves', p.policyname);
  end loop;
end $$;

create policy game_saves_own_select on public.game_saves
  for select to authenticated
  using (user_id::text = auth.uid()::text);

create policy game_saves_own_insert on public.game_saves
  for insert to authenticated
  with check (user_id::text = auth.uid()::text);

create policy game_saves_own_update on public.game_saves
  for update to authenticated
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy game_saves_own_delete on public.game_saves
  for delete to authenticated
  using (user_id::text = auth.uid()::text);

-- 3) Trigger anti-cheat à prova de falha -------------------------------
create table if not exists public.progress_guard (
  user_id uuid primary key,
  max_trainer_level integer not null default 1,
  updated_at timestamptz not null default now()
);
revoke all on public.progress_guard from anon, authenticated;
grant all on public.progress_guard to service_role;
alter table public.progress_guard enable row level security;

create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  kind text not null,
  detail jsonb not null default '{}'::jsonb
);
revoke all on public.security_audit_log from anon, authenticated;
grant all on public.security_audit_log to service_role;
alter table public.security_audit_log enable row level security;

create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
  _lvl_text text;
  _lvl integer;
  _prev integer;
  _prev_at timestamptz;
  _allowed integer;
begin
  -- TUDO dentro de um bloco protegido: nenhum erro do anti-cheat
  -- pode impedir o jogador de salvar.
  begin
    begin
      _uid := new.user_id::uuid;
    exception when others then
      _uid := null;
    end;

    if jsonb_typeof(new.data) = 'object' then
      if (new.data #>> '{idle,gold}') ~ '^[0-9]+$'
         and (new.data #>> '{idle,gold}')::numeric > 50000000 then
        new.data := jsonb_set(new.data, '{idle,gold}', to_jsonb(50000000));
      end if;

      if (new.data #>> '{idle,crystals}') ~ '^[0-9]+$'
         and (new.data #>> '{idle,crystals}')::numeric > 1000000 then
        new.data := jsonb_set(new.data, '{idle,crystals}', to_jsonb(1000000));
      end if;

      _lvl_text := coalesce(new.data #>> '{idle,trainerLevel}', new.data #>> '{idle,trainer_level}');

      if _lvl_text ~ '^[0-9]+$' then
        _lvl := least(_lvl_text::integer, 10000);

        select max_trainer_level, updated_at into _prev, _prev_at
        from public.progress_guard where user_id = _uid;

        if _uid is not null and _prev is not null then
          -- tolerância: 200 níveis + 60 níveis por minuto decorrido
          _allowed := _prev + 200
            + greatest(0, floor(extract(epoch from (now() - _prev_at)) / 60) * 60)::integer;
          if _lvl > _allowed then
            insert into public.security_audit_log (user_id, kind, detail)
            values (_uid, 'suspicious_level_jump',
                    jsonb_build_object('from', _prev, 'to', _lvl, 'allowed', _allowed, 'op', tg_op));
            _lvl := _allowed;
          end if;
        end if;

        if _uid is not null then
          insert into public.progress_guard (user_id, max_trainer_level, updated_at)
          values (_uid, greatest(1, _lvl), now())
          on conflict (user_id) do update
            set max_trainer_level = greatest(public.progress_guard.max_trainer_level, excluded.max_trainer_level),
                updated_at = now();
        end if;

        if _lvl::text <> _lvl_text then
          if new.data #>> '{idle,trainerLevel}' is not null then
            new.data := jsonb_set(new.data, '{idle,trainerLevel}', to_jsonb(_lvl));
          end if;
          if new.data #>> '{idle,trainer_level}' is not null then
            new.data := jsonb_set(new.data, '{idle,trainer_level}', to_jsonb(_lvl));
          end if;
        end if;
      end if;
    end if;
  exception when others then
    -- nunca derrubar o save por causa do anti-cheat
    null;
  end;

  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t record;
begin
  for t in select tgname from pg_trigger
           where tgrelid = 'public.game_saves'::regclass and not tgisinternal
  loop
    execute format('drop trigger if exists %I on public.game_saves', t.tgname);
  end loop;
end $$;

create trigger trg_game_saves_caps
before insert or update on public.game_saves
for each row execute function public.enforce_game_save_caps();

-- 4) DIAGNÓSTICO — o resultado deve mostrar 4 policies e os grants
select policyname, cmd from pg_policies
 where schemaname = 'public' and tablename = 'game_saves' order by policyname;

select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'game_saves'
 order by grantee, privilege_type;
