import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("VIP GOLD 60d code is a single global use and only its hash is versioned", () => {
  const sql = read("supabase/migrations/20261126140000_vipgold60_single_code.sql");
  assert.match(sql, /create table if not exists private\.vipgold60_reward_codes/);
  assert.match(sql, /code_hash text primary key check \(code_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/);
  assert.match(sql, /claimed_at timestamptz/);
  assert.match(sql, /vipgold60_reward_codes \(code_hash\) values\s*\n\s*\('665f6f46d84e15cc78578acdff981ea8eefa247da38bf8892559294d279fd75a'\)/);
  assert.doesNotMatch(sql, /VIPGOLD60[A-Z2-9]{20}/);
  assert.match(sql, /where code_hash = v_hash and claimed_at is null/);
  assert.match(sql, /if not found then\s+return jsonb_build_object\('ok', false, 'reason', 'invalid_or_used'\)/);
});

test("VIP GOLD 60d grants 60 days of +40% and does not hand out a 1-year book", () => {
  const sql = read("supabase/migrations/20261126140000_vipgold60_single_code.sql");
  assert.match(sql, /60::bigint \* 24 \* 60 \* 60 \* 1000/);
  assert.match(sql, /greatest\(v_old_gold_mult, v_old_exp_mult, 0\.40::numeric\)/);
  assert.match(sql, /jsonb_set\(v_buffs, '\{goldMult\}'/);
  assert.match(sql, /jsonb_set\(v_buffs, '\{goldMultUntil\}'/);
  assert.match(sql, /'days', 60/);
  assert.doesNotMatch(sql, /book_vip_60/);
  assert.doesNotMatch(sql, /book_vip_gold_30/);
});

test("client validates the server result and activates the buff locally", () => {
  const idle = read("src/routes/idle.tsx");
  assert.match(idle, /\^VIPGOLD60\[A-Z2-9\]\{20\}\$/);
  assert.match(idle, /redeem_vipgold60_code/);
  assert.match(idle, /Number\(response\.days\) !== 60/);
  assert.match(idle, /mult < 0\.4/);
  assert.match(idle, /goldMult: mult/);
  assert.match(idle, /goldMultUntil: until/);
  assert.match(idle, /VIP GOLD ativado por 60 dias/);
  assert.match(idle, /vipGold60CodeBusyRef/);
});
