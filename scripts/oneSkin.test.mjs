import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = file => readFileSync(new URL(file, import.meta.url));
const idle = read("../src/routes/idle.tsx").toString("utf8");
const migration = read("../supabase/migrations/20261125153135_one_skin_vouchers.sql").toString("utf8");
const sheet = read("../src/ambiente/ANCESTRAIS/one.png");
const portrait = read("../src/assets/skins/one-portrait.png");

const pngSize = (buffer) => ({
  width: buffer.readUInt32BE(16),
  height: buffer.readUInt32BE(20),
});

test("skin One cadastrada com sheet 4x4 e retrato próprio", () => {
  assert.ok(idle.includes('id: "one", label: "One"'));
  assert.ok(idle.includes("charOnePng"));
  assert.ok(idle.includes("perfilOnePng"));
  assert.deepEqual(pngSize(sheet), { width: 256, height: 256 });
  assert.deepEqual(pngSize(portrait), { width: 64, height: 64 });
});

test("dois vouchers globais ONP222 e resgate ligado ao RPC", () => {
  assert.ok(idle.includes('raw.startsWith("ONP222")'));
  assert.ok(idle.includes('"redeem_one_voucher"'));
  assert.ok(migration.includes("^ONP222[A-Z2-9]{20}$"));
  assert.ok(migration.includes("public.one_skin_vouchers"));
  assert.ok(migration.includes("preserve_one_skin_unlock"));
  assert.ok(migration.includes("'d6f83d3dda39e9939182ed60158b1351cb525161412f845064d51dd5878e64f8'"));
  assert.ok(migration.includes("'46261976f287ac43388eb20a446fce63aae2cab1dadf25584c071656c3bdee28'"));
  assert.ok(!idle.includes("ONP222XWXMHZ8TVVL7L34CG9H7"));
  assert.ok(!migration.includes("ONP222XWXMHZ8TVVL7L34CG9H7"));
  assert.ok(!idle.includes("ONP222DQKFSAM47N9LVAFRATBJ"));
  assert.ok(!migration.includes("ONP222DQKFSAM47N9LVAFRATBJ"));
});
