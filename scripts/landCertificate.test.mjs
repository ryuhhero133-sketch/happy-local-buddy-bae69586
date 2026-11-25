import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = file => readFileSync(new URL(file, import.meta.url), "utf8");
const idle = read("../src/routes/idle.tsx");
const migration = read("../supabase/migrations/20261125225747_land_certificate_code.sql");
const lands = read("../src/game/lands.ts");

test("Land Revo tem botão visível e colocação consome certificado", () => {
  assert.ok(idle.includes('idle.currentMap === "land_revo" && !landPanel && !placingLand'));
  assert.ok(idle.includes("Minha Land"));
  assert.ok(idle.includes("setLandPanel({ mode: \"build\" })"));
  assert.ok(idle.includes("certificado: s.items.certificado - 1"));
  assert.ok(lands.includes("LAND_MAX = 3"));
  assert.ok(lands.includes("LAND_MIN_SPACING = 250"));
});

test("código de certificado entrega 3 e tem um uso global", () => {
  assert.ok(idle.includes("/^LANDCERT[A-Z2-9]{20}$/"));
  assert.ok(idle.includes('rpc("redeem_land_certificate_code"'));
  assert.ok(migration.includes("max_uses integer not null default 1"));
  assert.ok(migration.includes("v_qty := v_qty + 3"));
  assert.ok(migration.includes("'certificado'"));
  assert.ok(migration.includes("'86cac20e5def551d4d81d8e52ca85f8c141968dba6da8d163e77f644f36fa94b'"));
  assert.ok(!idle.includes("LANDCERTR3CYVS7RTX3QSTQ8FSBG"));
  assert.ok(!migration.includes("LANDCERTR3CYVS7RTX3QSTQ8FSBG"));
});
