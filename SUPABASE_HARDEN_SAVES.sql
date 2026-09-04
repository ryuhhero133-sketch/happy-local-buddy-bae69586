-- =====================================================================
-- BLINDAGEM DOS SAVES (anti-cheat)  —  rodar no SQL Editor do Supabase
-- =====================================================================
-- Problema atual: as policies de public.game_saves eram "USING (true)",
-- ou seja, QUALQUER pessoa (inclusive anon) podia ler e sobrescrever o
-- save de QUALQUER treinador direto pela API REST. Isso é o que permitia
-- alterar ouro/cristal/nível pelo front e gravar no banco.
--
-- Este script:
--   1) tranca game_saves por auth.uid()  (dono só mexe no próprio save)
--   2) remove acesso do papel anon
--   3) força user_id = auth.uid() em INSERT/UPDATE
--   4) trigger com tetos + anti-jump (nível, ouro, cristal, esmeralda,
--      safira, itens, coleção, nível de pokémon) e proteção de rollback
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) RLS: só o dono
-- ---------------------------------------------------------------------
alter table public.game_saves enable row level security;

drop policy if exists game_saves_public_game_access on public.game_saves;
drop policy if exists saves_public_read   on public.game_saves;
drop policy if exists saves_public_insert on public.game_saves;
drop policy if exists saves_public_update on public.game_saves;
drop policy if exists saves_public_delete on public.game_saves;

create policy game_saves_owner_select on public.game_saves
  for select to authenticated using (user_id = auth.uid());

create policy game_saves_owner_insert on public.game_saves
  for insert to authenticated with check (user_id = auth.uid());

create policy game_saves_owner_update on public.game_saves
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Delete só via service_role (nenhuma policy para authenticated).

revoke all on public.game_saves from anon;
grant select, insert, update on public.game_saves to authenticated;
grant all on public.game_saves to service_role;

-- ---------------------------------------------------------------------
-- 2) Trigger de validação server-side
-- ---------------------------------------------------------------------
create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _prev_level int := 1;
  _new_level  int;
  _cap_jump   int := 5000;     -- salto maximo de niveis por save
  _cap_level  int := 1000000;
  _cap_gold   bigint := 50000000;
  _cap_cry    bigint := 1000000;
  _cap_esm    bigint := 1000000;
  _cap_saf    bigint := 1000000;
  _cap_col    int := 500;
  _cap_item   bigint := 999999;
  _k          text;
  _v          jsonb;
  _items      jsonb;
  _out        jsonb;
begin
  -- Dono sempre é quem está autenticado (bloqueia gravar no save de outro).
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;

  new.updated_at := now();

  if new.data is null or jsonb_typeof(new.data) <> 'object' then
    return new;
  end if;

  -- ---------------- nível do treinador (teto + anti-jump) -------------
  if tg_op = 'UPDATE' and old.data is not null then
    begin
      _prev_level := greatest(1, coalesce(
        nullif(old.data #>> '{idle,trainerLevel}','')::int,
        nullif(old.data #>> '{idle,trainer_level}','')::int, 1));
    exception when others then _prev_level := 1;
    end;
  end if;

  begin
    _new_level := coalesce(
      nullif(new.data #>> '{idle,trainerLevel}','')::int,
      nullif(new.data #>> '{idle,trainer_level}','')::int, _prev_level);
  exception when others then _new_level := _prev_level;
  end;

  _new_level := least(_cap_level, greatest(1, _new_level));
  if _new_level > _prev_level + _cap_jump then
    _new_level := _prev_level + _cap_jump;
  end if;

  if (new.data #>> '{idle,trainerLevel}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainerLevel}', to_jsonb(_new_level), true);
  end if;
  if (new.data #>> '{idle,trainer_level}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainer_level}', to_jsonb(_new_level), true);
  end if;

  -- ---------------- moedas: teto absoluto ----------------------------
  begin
    if coalesce(nullif(new.data #>> '{idle,gold}','')::bigint, 0) > _cap_gold then
      new.data := jsonb_set(new.data, '{idle,gold}', to_jsonb(_cap_gold), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,crystal}','')::bigint, 0) > _cap_cry then
      new.data := jsonb_set(new.data, '{idle,crystal}', to_jsonb(_cap_cry), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,esmeralda}','')::bigint, 0) > _cap_esm then
      new.data := jsonb_set(new.data, '{idle,esmeralda}', to_jsonb(_cap_esm), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,safira}','')::bigint, 0) > _cap_saf then
      new.data := jsonb_set(new.data, '{idle,safira}', to_jsonb(_cap_saf), true);
    end if;
  exception when others then null; end;

  -- ---------------- itens: teto por item ------------------------------
  begin
    _items := new.data #> '{idle,items}';
    if _items is not null and jsonb_typeof(_items) = 'object' then
      _out := '{}'::jsonb;
      for _k, _v in select * from jsonb_each(_items) loop
        if jsonb_typeof(_v) = 'number' then
          _out := _out || jsonb_build_object(
            _k, to_jsonb(least(_cap_item, greatest(0, floor((_v #>> '{}')::numeric)::bigint))));
        end if;
      end loop;
      new.data := jsonb_set(new.data, '{idle,items}', _out, true);
    end if;
  exception when others then null; end;

  -- ---------------- coleção: máximo de 500 ---------------------------
  begin
    if jsonb_typeof(new.data #> '{idle,collection}') = 'array'
       and jsonb_array_length(new.data #> '{idle,collection}') > _cap_col then
      new.data := jsonb_set(
        new.data, '{idle,collection}',
        (select jsonb_agg(e) from (
           select e from jsonb_array_elements(new.data #> '{idle,collection}') e limit _cap_col
         ) s), true);
    end if;
  exception when others then null; end;

  -- ---------------- nível dos pokémon (teto 10000) --------------------
  begin
    if jsonb_typeof(new.data -> 'team') = 'array' then
      new.data := jsonb_set(new.data, '{team}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'team') m), true);
    end if;
  exception when others then null; end;

  begin
    if jsonb_typeof(new.data -> 'restingBench') = 'array' then
      new.data := jsonb_set(new.data, '{restingBench}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'restingBench') m), true);
    end if;
  exception when others then null; end;

  return new;
end;
$$;

revoke all on function public.enforce_game_save_caps() from anon, authenticated;

drop trigger if exists enforce_game_save_caps_trg on public.game_saves;
create trigger enforce_game_save_caps_trg
  before insert or update on public.game_saves
  for each row execute function public.enforce_game_save_caps();

-- ---------------------------------------------------------------------
-- 3) Correção retroativa de saves já estourados
-- ---------------------------------------------------------------------
update public.game_saves
   set data = jsonb_set(data, '{idle,gold}', to_jsonb(50000000::bigint), true)
 where (data #>> '{idle,gold}') ~ '^[0-9]+$'
   and (data #>> '{idle,gold}')::bigint > 50000000;

update public.game_saves
   set data = jsonb_set(data, '{idle,crystal}', to_jsonb(1000000::bigint), true)
 where (data #>> '{idle,crystal}') ~ '^[0-9]+$'
   and (data #>> '{idle,crystal}')::bigint > 1000000;
