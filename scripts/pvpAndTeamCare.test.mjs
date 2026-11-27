import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const idle = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");
const petCard = readFileSync(new URL("../src/components/PetCard.tsx", import.meta.url), "utf8");
const petCardCss = readFileSync(new URL("../src/components/pet-card.css", import.meta.url), "utf8");

test("PvP mostra o líder avançando, skill elemental e impacto no alvo", () => {
  assert.match(idle, /lunge\?: number/);
  assert.match(idle, /attackAnim\.lunge \?\? 0\.45/);
  assert.match(idle, /lunge: 0\.92/);
  assert.match(idle, /pvpAttackingRef/);
  assert.match(idle, /const toX = target\.x \+ 25/);
  assert.match(idle, /fireSkillFx\("offensive", element, ELEMENT_SKILL\[element\] \?\? null, fromX, fromY, toX, toY\)/);
  assert.match(idle, /setPvpHitTarget\(\{ userId: targetUserId, ts: Date\.now\(\) \}\)/);
  assert.match(idle, /pvpHitTarget\?\.userId === rp\.userId/);
  assert.match(idle, /pushFxAt\(toX, toY - 34/);
});

test("vítima vê o Pokémon do atacante avançando e usando a skill", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261127080849_pvp_attacker_id.sql", import.meta.url), "utf8");
  assert.match(sql, /add column if not exists last_attacker_user_id uuid/);
  assert.match(sql, /new\.last_attacker_user_id := auth\.uid\(\)/);
  assert.match(idle, /last_attacker_user_id\?: string \| null/);
  assert.match(idle, /last_attacker_user_id,last_death_at/);
  assert.match(idle, /const \[pvpRemoteAttack, setPvpRemoteAttack\]/);
  assert.match(idle, /const fromX = attacker\.x \+ 25/);
  assert.match(idle, /setPvpRemoteAttack\(\{ id: attackId, userId: attacker\.user_id, species, fromX, fromY, toX, toY/);
  assert.match(idle, /pvpRemoteAttack && \(\(\) => \{/);
  assert.match(idle, /facingRight \? 2 : 1/);
  assert.match(idle, /pushFxAt\(toX, toY - 34, damage > 0 \? `-\$\{damage\}` : "HIT!"/);
});

test("fome crítica mantém o Pokémon no time em vez de mandar para a Casa Azul", () => {
  assert.doesNotMatch(idle, /setTeam\(kept\)/);
  assert.doesNotMatch(idle, /\[\.\.\.b\.filter\(\(x\) => !lockedUids\.has\(x\.uid\)\), \.\.\.locked\]/);
  assert.match(idle, /CONTINUA no time, mas não pode batalhar até ser alimentado/);
  assert.match(idle, /setTeam\(next\);[\s\S]{0,220}for \(const l of locked\)/);
});

test("Ver Ficha Completa usa o card branco e não a variável gifMap fora do TabOverlay", () => {
  const tabOverlay = idle.indexOf("function TabOverlay");
  assert.ok(tabOverlay > 0);
  assert.doesNotMatch(idle.slice(0, tabOverlay), /gifMap\[/);
  assert.match(idle, /image=\{GIF\[shown\.species\]\}/);
  assert.match(idle, /sheet=\{SPRITE_SHEET\[shown\.species\] \?\? zoneSheet\(shown\.species\)\}/);
  assert.match(petCard, /sheet\?: string/);
  assert.match(petCard, /pc-portrait__sheet/);
  assert.match(petCardCss, /\.pc-portrait__sheet\s*\{/);
});
