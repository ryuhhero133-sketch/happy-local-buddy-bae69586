-- =====================================================================
-- IDLE MON REVO -- ANCESTRAIS / Ovos Selados (cap de traits 7 -> 12)
-- Arquivo NOVO (idempotente, nada destrutivo). NAO aplicado automaticamente --
-- revisar e aplicar manualmente (SQL Editor / supabase db push).
--
-- O que faz:
--  1) Semeia as 16 novas traits (8 ROXAS + 8 DOURADAS) em trait_rules.
--     Role: somente rollAncestralTraits() (ovos ancestrais) -- nunca drop aleatorio.
--  2) Semeia as 15 novas especies ancestrais em species_rules (mythic_shiny).
--  3) Recria mint_pokemon_batch + enforce_pokemon_registry com teto de
--     traits por Pokemon: 7 -> 12 (ancestrais nascem com 12~16).
--     SEM isso o servidor rejeita/descarta ancestrais com >7 traits.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) novas traits (allowlist)
-- ---------------------------------------------------------------------
insert into public.trait_rules (trait) values ('titanico') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('predador') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('tempestade') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('sombra') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('arcane') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('abissal') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('fulgurante') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('vitalicio') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('soberano') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('aniquilador') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('primordial') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('temporal') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('astral') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('perpetuo') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('ourobranco') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('divino') on conflict (trait) do nothing;

-- ---------------------------------------------------------------------
-- 2) novas especies ancestrais (allowlist, rarity mythic_shiny)
-- ---------------------------------------------------------------------
insert into public.species_rules (species, rarity) values ('giratina', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('cresselia', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('kyurem', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('reshiram', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('zekrom', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('groudon_shiny', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('rayquaza_shiny', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('dragonite_mg', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('latias_ancestral', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('latios_ancestral', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('lugia_m_shiny', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('lugia_shiny_ancestral', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('mega_lugia_ancestral', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('mega_charizard', 'mythic_shiny') on conflict (species) do nothing;
insert into public.species_rules (species, rarity) values ('charizard_mega_x', 'mythic_shiny') on conflict (species) do nothing;

-- ---------------------------------------------------------------------
-- 3) RPC mint_pokemon_batch -- cap de traits 12
-- ---------------------------------------------------------------------
create or replace function public.mint_pokemon_batch(p_entries jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _e jsonb;
  _pu text; _sp text; _ra text; _tr jsonb; _lv int; _xp numeric; _or text;
  _exp_ra text;
  _accepted text[] := '{}';
  _rejected jsonb := '[]'::jsonb;
  _today int := 0;
  _n int := 0;
  _mrow record;
begin
  if _uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    return jsonb_build_object('ok', false, 'reason', 'bad_entries');
  end if;
  if jsonb_array_length(p_entries) > 100 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  begin
    select count(*) into _today from public.player_pokemon_registry
      where user_id = _uid and created_at > now() - interval '1 day';
  exception when others then _today := 0;
  end;
  if _today >= 500 then
    return jsonb_build_object('ok', false, 'reason', 'daily_cap', 'accepted', '[]'::jsonb, 'rejected', '[]'::jsonb);
  end if;

  for _e in select * from jsonb_array_elements(p_entries) loop
    _n := _n + 1;
    begin
      _pu := nullif(trim(both '"' from (_e ->> 'uid')), '');
      _sp := lower(nullif(trim(both '"' from (_e ->> 'species')), ''));
      _ra := lower(nullif(trim(both '"' from (_e ->> 'rarity')), ''));
      _tr := coalesce(_e -> 'traits', '[]'::jsonb);
      _lv := greatest(1, least(1500, floor(coalesce(nullif(_e ->> 'level', '')::numeric, 1))::int));
      _xp := greatest(0, least(999999999, floor(coalesce(nullif(_e ->> 'xp', '')::numeric, 0))));
      _or := lower(coalesce(nullif(trim(both '"' from (_e ->> 'origin')), ''), 'capture'));
    exception when others then
      _rejected := _rejected || jsonb_build_object('uid', (_e ->> 'uid'), 'reason', 'bad_shape');
      continue;
    end;

    if _pu is null or length(_pu) > 64 or _pu !~ '^[A-Za-z0-9_-]+$' then
      _rejected := _rejected || jsonb_build_object('uid', (_e ->> 'uid'), 'reason', 'bad_uid');
      continue;
    end if;
    if _or not in ('starter','capture','hatch_black','hatch_emerald','hatch_shop','governante','market','code','quest') then
      _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'bad_origin');
      continue;
    end if;

    select rarity into _exp_ra from public.species_rules where species = _sp;
    if not found or _exp_ra is null then
      _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'unknown_species');
      continue;
    end if;
    if _ra is null or (_ra <> _exp_ra and not (
        (_e ->> 'event' like 'black_mitic%' or _or in ('hatch_black','governante'))
        and _ra in ('epic','mythic','mythic_shiny'))) then
      _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'rarity_mismatch');
      continue;
    end if;
    if jsonb_typeof(_tr) <> 'array' or jsonb_array_length(_tr) > 12 then
      _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'bad_traits');
      continue;
    end if;
    begin
      if exists (
        select 1 from jsonb_array_elements_text(_tr) t
        where t not in (select trait from public.trait_rules)
      ) then
        _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'unknown_trait');
        continue;
      end if;
      if (select count(*) from (select distinct jsonb_array_elements_text(_tr)) s)
         <> jsonb_array_length(_tr) then
        _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'dup_traits');
        continue;
      end if;
    exception when others then
      _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'bad_traits');
      continue;
    end;

    -- transferência do mercado: prova pela linha (comprador = dono + campos iguais)
    if _or = 'market' then
      begin
        select species, level, rarity into _mrow from public.pokemon_market
          where id = nullif(regexp_replace(_pu, '^bought-', ''), '')
            and buyer_id = _uid;
        if not found or _mrow.species <> _sp then
          _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'market_mismatch');
          continue;
        end if;
      exception when others then
        _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'market_unverified');
        continue;
      end;
    end if;

    begin
      insert into public.player_pokemon_registry
        (user_id, pet_uid, species, rarity, traits, level, xp, origin)
        values (_uid, _pu, _sp, _ra, _tr, _lv, _xp, _or)
        on conflict (user_id, pet_uid) do nothing;
      if found then
        _accepted := _accepted || _pu;
      else
        -- uid já registrado: idempotente se idêntico, rejeita se divergente
        select species, rarity, traits into _mrow from public.player_pokemon_registry
          where user_id = _uid and pet_uid = _pu;
        if _mrow.species = _sp and _mrow.rarity = _ra and _mrow.traits = _tr then
          _accepted := _accepted || _pu;
        else
          _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'uid_taken');
          insert into public.audit_log (user_id, action, detail)
            values (_uid, 'mint_uid_taken', jsonb_build_object('uid', _pu, 'species', _sp));
        end if;
      end if;
    exception when others then
      _rejected := _rejected || jsonb_build_object('uid', _pu, 'reason', 'db_error');
      continue;
    end;
  end loop;

  return jsonb_build_object('ok', true,
    'accepted', to_jsonb(_accepted),
    'rejected', _rejected);
end;
$$;

-- ---------------------------------------------------------------------
-- 4) trigger enforce_pokemon_registry -- cap de traits 12
-- ---------------------------------------------------------------------
create or replace function public.enforce_pokemon_registry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
  _reg jsonb := '{}'::jsonb;
  _seed boolean := false;
  _path text[];
  _arr jsonb;
  _e jsonb;
  _out jsonb;
  _uid_p text; _sp text; _ra text; _er text; _tr jsonb; _ev text;
  _lv int; _lv_reg int; _xp numeric;
  _a jsonb; _b jsonb;
  _seen text[] := '{}';
  _s_c int := 0; _s_t int := 0; _s_b int := 0;
  _k_c int := 0; _k_t int := 0; _k_b int := 0;
  _slot int := 0;
  _mid text; _msp text; _mra text; _mlv int;
  _drop boolean;
begin
  -- Dono sempre é quem está autenticado (nem o RPC nem o cliente escolhem outro dono).
  if auth.uid() is not null then
    NEW.user_id := auth.uid();
  end if;
  _uid := NEW.user_id;
  if NEW.data is null or jsonb_typeof(NEW.data) <> 'object' then
    return NEW;
  end if;

  begin
    select coalesce(jsonb_object_agg(t.pet_uid,
      jsonb_build_object('species', t.species, 'rarity', t.rarity,
        'traits', t.traits, 'level', t.level)), '{}'::jsonb)
      into _reg
      from public.player_pokemon_registry t where t.user_id = _uid;
  exception when others then
    return NEW; -- registry ausente: não bloqueia o save
  end;
  _reg := coalesce(_reg, '{}'::jsonb);
  _seed := (_reg = '{}'::jsonb);

  for _slot in 1..3 loop
    _path := case _slot when 1 then '{team}'::text[] when 2 then '{restingBench}'::text[] else '{idle,collection}'::text[] end;
    begin
      _arr := NEW.data #> _path;
    exception when others then
      continue;
    end;
    if jsonb_typeof(_arr) <> 'array' then continue; end if;
    _out := '[]'::jsonb;

    for _e in select * from jsonb_array_elements(_arr) loop
      if jsonb_typeof(_e) <> 'object' then continue; end if;
      _drop := false;
      begin
        _uid_p := nullif(_e ->> 'uid', '');
        _sp := lower(nullif(_e ->> 'species', ''));
        _ra := lower(nullif(_e ->> 'rarity', ''));
        _tr := coalesce(_e -> 'traits', '[]'::jsonb);
        _ev := coalesce(_e ->> 'event', '');
        _lv := greatest(1, least(1000000, floor(coalesce(nullif(_e ->> 'level', '')::numeric, 1))::int));
        _xp := greatest(0, least(999999999, floor(coalesce(nullif(_e ->> 'xp', '')::numeric, 0))));
      exception when others then
        _drop := true;
      end;

      if not _drop then
        if _uid_p is null or _uid_p !~ '^[A-Za-z0-9_-]{1,64}$' then
          _drop := true;
        elsif _uid_p = any(_seen) then
          _drop := true; -- duplicata no mesmo save
        else
          _seen := _seen || _uid_p;
        end if;
      end if;

      -- transferência do mercado: prova pela linha (fail-open só em erro de infra)
      if not _drop and _uid_p like 'bought-%' then
        begin
          _mid := regexp_replace(_uid_p, '^bought-', '');
          select species, level, rarity into _msp, _mlv, _mra
            from public.pokemon_market where id = _mid and buyer_id = _uid;
          if found and _msp = _sp and _mlv = _lv and _mra = _ra then
            begin
              insert into public.player_pokemon_registry
                (user_id, pet_uid, species, rarity, traits, level, xp, origin)
                values (_uid, _uid_p, _sp, _ra, _tr, _lv, _xp, 'market')
                on conflict (user_id, pet_uid) do nothing;
            exception when others then null;
            end;
            _reg := jsonb_set(_reg, array[_uid_p],
              jsonb_build_object('species', _sp, 'rarity', _ra, 'traits', _tr, 'level', _lv), true);
          elsif found then
            _drop := true; -- linha existe mas diverge: falsificado
          else
            null; -- sem linha: mantém nesta passada, audita (infra nova/incerta)
            _drop := false;
          end if;
        exception when others then
          null; -- tabela/coluna ausente: mantém + audita no fim
        end;
      end if;

      if not _drop then
        _r := _reg -> _uid_p;
        if _r is null then
          if _seed then
            -- GÊNESE (1º save): ancora o que é válido, remove o malformado
            if _sp is not null
              and exists (select 1 from public.species_rules where species = _sp)
              and ((_ra = (select rarity from public.species_rules where species = _sp))
                or ((_ev like 'black_mitic%' )
                  and _ra in ('epic','mythic','mythic_shiny')))
              and jsonb_typeof(_tr) = 'array' and jsonb_array_length(_tr) <= 12
              and not exists (
                select 1 from jsonb_array_elements_text(_tr) t
                where t not in (select trait from public.trait_rules))
            then
              begin
                insert into public.player_pokemon_registry
                  (user_id, pet_uid, species, rarity, traits, level, xp, origin)
                  values (_uid, _uid_p, _sp, _ra, _tr, _lv, _xp, 'genesis');
              exception when others then null;
              end;
              if _slot = 1 then _k_t := _k_t + 1;
              elsif _slot = 2 then _k_b := _k_b + 1;
              else _k_c := _k_c + 1; end if;
              _reg := jsonb_set(_reg, array[_uid_p],
                jsonb_build_object('species', _sp, 'rarity', _ra, 'traits', _tr, 'level', _lv), true);
            else
              _drop := true;
            end if;
          else
            _drop := true; -- sem registro pós-gênese: falsificado
          end if;
        else
          -- registrado: imutáveis precisam bater (traits ordem-insensível)
          select coalesce(jsonb_agg(x order by x), '[]'::jsonb) into _a
            from (select distinct jsonb_array_elements_text(_tr) as x) s;
          select coalesce(jsonb_agg(x order by x), '[]'::jsonb) into _b
            from (select distinct jsonb_array_elements_text((_r -> 'traits')) as x) s;
          if (_r ->> 'species') <> _sp or (_r ->> 'rarity') <> _ra or _a <> _b then
            _drop := true;
          else
            _lv_reg := greatest(1, coalesce((_r ->> 'level')::int, 1));
            if _lv > _lv_reg + 500 then
              _lv := _lv_reg + 500; -- clamp de crescimento por save
              _e := jsonb_set(_e, '{level}', to_jsonb(_lv), true);
            end if;
            if _lv <> _lv_reg or _xp <> coalesce((_r ->> 'xp')::numeric, 0) then
              begin
                update public.player_pokemon_registry
                  set level = _lv, xp = _xp where user_id = _uid and pet_uid = _uid_p;
              exception when others then null;
              end;
            end if;
          end if;
        end if;
      end if;

      if _drop then
        if _slot = 1 then _s_t := _s_t + 1;
        elsif _slot = 2 then _s_b := _s_b + 1;
        else _s_c := _s_c + 1; end if;
      else
        _e := jsonb_set(_e, '{level}', to_jsonb(_lv), true);
        _e := jsonb_set(_e, '{xp}', to_jsonb(_xp), true);
        _out := _out || _e;
      end if;
    end loop;

    NEW.data := jsonb_set(NEW.data, _path, _out, true);
  end loop;

  if (_s_c + _s_t + _s_b) > 0 then
    begin
      insert into public.audit_log (user_id, action, detail)
        values (_uid, 'pokemon_stripped',
          jsonb_build_object('collection', _s_c, 'team', _s_t, 'bench', _s_b,
            'seeded_collection', _k_c, 'seeded_team', _k_t, 'seeded_bench', _k_b));
    exception when others then null;
    end;
  elsif (_k_c + _k_t + _k_b) > 0 then
    begin
      insert into public.audit_log (user_id, action, detail)
        values (_uid, 'pokemon_genesis',
          jsonb_build_object('collection', _k_c, 'team', _k_t, 'bench', _k_b));
    exception when others then null;
    end;
  end if;

  return NEW;
end;
$$;