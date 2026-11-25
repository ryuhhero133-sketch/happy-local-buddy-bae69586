import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = file => readFileSync(new URL(file, import.meta.url), "utf8");
const idle = read("../src/routes/idle.tsx");
const migration = read("../supabase/migrations/20261125215522_goldvip_code.sql");
const icons = read("../src/components/ItemPixelIcon.tsx");

test("GOLDVIP entrega VIP Gold 30 dias, bolas e tiros na mesma transação", () => {
  assert.ok(idle.includes("book_vip_gold_30"));
  assert.ok(idle.includes('id === "book_vip_gold_30"'));
  assert.ok(idle.includes("add: 0.40, ms: 30 * 24 * 3600_000"));
  assert.ok(idle.includes('rpc("redeem_goldvip_code"'));
  assert.ok(idle.includes("GOLDVIP resgatado: Livro VIP GOLD 30 dias"));
  assert.ok(icons.includes("book_vip_gold_30"));
});

test("código GOLDVIP tem exatamente 2 usos globais e só hash no Git", () => {
  assert.ok(migration.includes("max_uses integer not null default 2"));
  assert.ok(migration.includes("used_count < max_uses"));
  assert.ok(migration.includes("^GOLDVIP[A-Z2-9]{20}$"));
  assert.ok(migration.includes("perform public.nevezinha_grant_tickets(3)"));
  assert.ok(migration.includes("'8f2c5480d4effc0f78adb546b36ac73f5deb3623fbd5e3508642bf50dd049c80'"));
  assert.ok(!migration.includes("GOLDVIPG5WAB5DQ6XD4249PUBK9"));
  assert.ok(!idle.includes("GOLDVIPG5WAB5DQ6XD4249PUBK9"));
});
