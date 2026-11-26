import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = file => readFileSync(new URL(file, import.meta.url), "utf8");
const idle = read("../src/routes/idle.tsx");
const migration = read("../supabase/migrations/20261125233000_gengar_gold_code.sql");
const icons = read("../src/components/ItemPixelIcon.tsx");
const inventory = read("../src/components/inventory/inventoryModel.ts");

test("GENGOLD entrega Livro VIP GOLD 30 dias + Ovo de Gengar Épico", () => {
  assert.ok(idle.includes('rpc("redeem_gengar_gold_code"'));
  assert.ok(idle.includes('"book_vip_gold_30", "egg_gengar_epic"'));
  assert.ok(idle.includes("GENGOLD resgatado"));
  assert.ok(migration.includes("'book_vip_gold_30', v_book"));
  assert.ok(migration.includes("'egg_gengar_epic', v_egg"));
  assert.ok(migration.includes("v_book := v_book + 1"));
  assert.ok(migration.includes("v_egg := v_egg + 1"));
});

test("ovo de Gengar é épico fixo, nível 1, e vai para a Coleção", () => {
  assert.ok(idle.includes('"egg_gengar_epic"'));
  assert.ok(idle.includes('eggId === "egg_gengar_epic"'));
  assert.ok(idle.includes('sp = "gengar" as Species'));
  assert.ok(idle.includes('makePet("gengar", 1, "epic")'));
  assert.ok(!idle.includes('makePet("gengar", 50, "epic")'));
  assert.ok(idle.includes('event: "hatch_code:gengar_epic"'));
  assert.ok(idle.includes("O ovo de Gengar continua na Mochila"));
  assert.ok(idle.includes("GENGAR ÉPICO Nv 1"));
  assert.ok(!idle.includes("GENGAR ÉPICO Lv. 50"));
  assert.ok(idle.includes("egg_gengar_epic: { weights: { epic: 100 } }"));
  assert.ok(idle.includes('eggId === "egg_gengar_epic" ? 1'));
  assert.ok(idle.includes("Ovo de Gengar Épico"));
  assert.ok(icons.includes("egg_gengar_epic"));
  assert.ok(inventory.includes("egg_gengar_epic"));
  assert.ok(idle.includes("envia para a Coleção"));
});

test("código GENGOLD tem um uso global e só hash no Git", () => {
  assert.ok(migration.includes("max_uses integer not null default 1 check (max_uses = 1)"));
  assert.ok(migration.includes("used_count < max_uses"));
  assert.ok(migration.includes("^GENGOLD[A-Z2-9]{20}$"));
  assert.ok(migration.includes("'a4fb983a4f207c31cd95290ee33d881897a94f33a6b77c6bd39d64dfaf31c902'"));
  assert.ok(!/GENGOLD[A-Z2-9]{20}/.test(migration));
  assert.ok(!/GENGOLD[A-Z2-9]{20}/.test(idle));
  assert.ok(!/GENGOLD[A-Z2-9]{20}/.test(icons));
});
