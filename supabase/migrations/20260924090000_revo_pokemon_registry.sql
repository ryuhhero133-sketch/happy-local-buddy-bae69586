-- =====================================================================
-- IDLE MON REVO — registro de Pokémon + mint + enforcement (ETAPA 1)
-- Rodar UMA vez no SQL Editor. Idempotente. NADA destrutivo:
-- sem DELETE/UPDATE em dados existentes, sem DROP de tabelas, sem
-- alteração em RLS/policies/RPCs existentes.
--
-- O que faz:
--  1) species_rules + trait_rules (allowlists estáticas geradas do código)
--  2) player_pokemon_registry (dono+uid -> atributos imutáveis)
--  3) RPC mint_pokemon_batch (registra criações legítimas, idempotente)
--  4) trigger enforce_pokemon_registry em game_saves:
--     - 1º save (registro vazio) = SEED: ancora tudo que é válido
--     - depois: REMOVE entradas sem registro/divergentes (nunca rejeita o save)
--     - level: crescimento máx +500/save (clamp, não strip)
--     - transferências bought-* validadas pela linha do mercado
--     - 1 linha de auditoria por save com remoções (só se houver)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) allowlists estáticas
-- ---------------------------------------------------------------------
create table if not exists public.species_rules (
  species text primary key,
  rarity text not null
);

create table if not exists public.trait_rules (
  trait text primary key
);

alter table public.species_rules enable row level security;
alter table public.trait_rules enable row level security;
drop policy if exists species_rules_public_read on public.species_rules;
drop policy if exists trait_rules_public_read on public.trait_rules;
create policy species_rules_public_read on public.species_rules
  for select to anon, authenticated using (true);
create policy trait_rules_public_read on public.trait_rules
  for select to anon, authenticated using (true);
revoke all on public.species_rules from anon, authenticated;
revoke all on public.trait_rules from anon, authenticated;
grant select on public.species_rules to anon, authenticated;
grant select on public.trait_rules to anon, authenticated;
grant all on public.species_rules to service_role;
grant all on public.trait_rules to service_role;

--__ALLOWLIST_SEED__

-- allowlist gerada (SPECIES_BASE + TRAITS do código-fonte)
-- Allowlist GERADA do código-fonte (SPECIES_BASE + TRAITS). Regenerar se adicionar espécies/traits.
-- species: 212 · traits: 21
insert into public.species_rules (species, rarity) values ('charmeleon', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('bulbasaur', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('vulpix', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('jigglypuff', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('caterpie', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('caterpie_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('charmander', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('squirtle', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('charizard', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('ivysaur', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('venusaur', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('butterfree', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('butterfree_shiny_plus', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('bulbasaur_hat', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('bulbasaur_flower', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('bulbasaur_orange', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('pikachu', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('sandslash', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('mewtwo', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('onix', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('pinsir', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('magmar', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('hitmonchan', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('golem', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('golem_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('golem_plus', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('geodude', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('geodude_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('graveler', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('graveler_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('graveler_alola', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('aerodactyl', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('arbok', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('arbok_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('charizard_shiny', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('charizard_alt', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('moltres', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('zapdos', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('articuno', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('mew', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('lucario', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('virizion', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('raikou', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('suicune', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('suicune_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('luxray_f', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('dragonite', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('metapod', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('beedrill', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('pidgey', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('pidgey_shiny', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('pidgeot', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('pidgeot_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('spearow', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('spearow_shiny', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('vileplume', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('vileplume_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('tangela', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('kabutops', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('lapras', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('vaporeon', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('dragonair', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('gyarados', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('jolteon', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('jolteon_shiny', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('vaporeon_shiny', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('flareon', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('flareon_shiny', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('snorlax', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('dragonite_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('mew_alt', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('raichu', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('weedle', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('weedle_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('kakuna', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('kakuna_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('metapod_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('rattata_f', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('raticate_f', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('sandshrew', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('sandshrew_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('sandslash_shiny', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('ekans', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('ekans_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('fearow', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('fearow_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('pidgeotto', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('pidgeotto_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('wartortle', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('wartortle_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('blastoise', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('blastoise_shiny', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('abra', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('kadabra', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('arcanine', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('arcanine_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('arcanine_shiny_plus', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('growlithe', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('growlithe_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('bellsprout', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('bellsprout_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('weepinbell', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('weepinbell_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('victreebel', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('victreebel_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('voltorb', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('voltorb_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('electrode', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('electrode_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('exeggcute', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('exeggcute_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('gloom', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('gloom_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('eevee', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('oddish', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('clefable', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('clefairy', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('cubone', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('cubone_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('marowak', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('marowak_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('marowak_plus', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('rhyhorn', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('rhyhorn_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('diglett', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('magnemite', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('machamp', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('machoke', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('machop', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('mankey', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('primeape', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('meowth', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('persian', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('nidoking', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('nidoran_f', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('nidorina', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('ninetales', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('paras', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('paras_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('parasect', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('parasect_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('poliwag', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('poliwhirl', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('poliwrath', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('psyduck', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('venonat', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('venomoth', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('zubat', 'common') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('zubat_shiny', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('golbat', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('golbat_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('blaziken', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('deoxys', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('groudon', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('lapras_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('snorlax_mythic', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('darkrai', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('ho_oh', 'legendary') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('magmortar', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('lugia', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('hariyama', 'legendary') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('ursaring', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('ditto', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('electabuzz', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('gengar', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('gastly', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('gastly_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('haunter', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('haunter_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('grimer', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('grimer_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('muk', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('muk_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('swalot', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('swalot_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('hitmontop', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('magneton', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('ditto_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('scizor', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('umbreon', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('infernape', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('krookodile', 'legendary') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('tyranitar', 'mythic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('nidoking_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('rapidash', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('rapidash_shiny', 'legendary') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('skarmory', 'legendary') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('dialga', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('abomasnow', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('cloyster', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('cloyster_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('exeggutor', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('exeggutor_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('exeggutor_alola', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('exeggutor_alola_shiny', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('snolax', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('sprigatito', 'uncommon') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('sprigatito_shiny', 'rare') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('feraligatr', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('heracross', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('heracross_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('kangaskhan', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('meganium', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('meganium_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('moltres_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('onix_shiny', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('lickitung', 'epic') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('lickitung_shiny', 'legendary') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('mewtwo_event', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('oddish_shiny', 'legendary') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('riolu', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.species_rules (species, rarity) values ('rayquaza', 'mythic_shiny') on conflict (species) do update set rarity = excluded.rarity;
insert into public.trait_rules (trait) values ('feroz') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('resistente') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('agil') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('sortudo') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('sabio') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('curador') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('venenoso') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('brutal') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('guardiao') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('eletrizado') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('precioso') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('prodigio') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('mistico') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('esquivo') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('vampirico') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('colosso') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('alpha') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('prismatico') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('ceifador') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('eterno') on conflict (trait) do nothing;
insert into public.trait_rules (trait) values ('dourado') on conflict (trait) do nothing;

-- ---------------------------------------------------------------------
-- 2) registro de propriedade
-- ---------------------------------------------------------------------
create table if not exists public.player_pokemon_registry (
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_uid text not null,
  species text not null,
  rarity text not null,
  traits jsonb not null default '[]'::jsonb,
  level int not null default 1,
  xp numeric not null default 0,
  origin text not null default 'unknown',
  created_at timestamptz default now(),
  primary key (user_id, pet_uid)
);
create index if not exists ppr_user_idx on public.player_pokemon_registry (user_id);

alter table public.player_pokemon_registry enable row level security;
drop policy if exists ppr_owner_select on public.player_pokemon_registry;
create policy ppr_owner_select on public.player_pokemon_registry
  for select to authenticated using (user_id = auth.uid());
revoke all on public.player_pokemon_registry from anon, authenticated;
grant select on public.player_pokemon_registry to authenticated;
grant all on public.player_pokemon_registry to service_role;

-- ---------------------------------------------------------------------
-- 3) RPC mint_pokemon_batch — registra criações legítimas (idempotente)
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
    if jsonb_typeof(_tr) <> 'array' or jsonb_array_length(_tr) > 7 then
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

revoke all on function public.mint_pokemon_batch(jsonb) from public, anon;
grant execute on function public.mint_pokemon_batch(jsonb) to authenticated;
grant all on all functions in schema public to service_role;

-- ---------------------------------------------------------------------
-- 4) trigger: remove do snapshot o que não é oficial (nunca rejeita o save)
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
              and jsonb_typeof(_tr) = 'array' and jsonb_array_length(_tr) <= 7
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

revoke all on function public.enforce_pokemon_registry() from anon, authenticated;

drop trigger if exists enforce_pokemon_registry_trg on public.game_saves;
create trigger enforce_pokemon_registry_trg
  before insert or update on public.game_saves
  for each row execute function public.enforce_pokemon_registry();

revoke all on function public.mint_pokemon_batch(jsonb) from public, anon;
grant execute on function public.mint_pokemon_batch(jsonb) to authenticated;
grant all on all functions in schema public to service_role;

-- =====================================================================
-- VERIFICAÇÃO (após rodar):
--   select count(*) from species_rules;   -- ~212
--   select count(*) from trait_rules;     -- ~21
--   select * from pg_policies where tablename = 'player_pokemon_registry';
-- =====================================================================
