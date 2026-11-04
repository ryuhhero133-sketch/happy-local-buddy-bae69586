import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const idle = readFileSync(new URL("../src/routes/idle.tsx", import.meta.url), "utf8");
const egg = readFileSync(new URL("../src/components/BlackMiticEggPet.tsx", import.meta.url), "utf8");
const auth = readFileSync(new URL("../src/components/AuthGate.tsx", import.meta.url), "utf8");
const sm = readFileSync(new URL("../src/lib/saveManager.ts", import.meta.url), "utf8");

test("save guarda savedAt para nunca regredir save antigo", () => {
  assert.match(idle, /function saveIdleStamped\(/);
  assert.match(idle, /JSON\.stringify\(\{ \.\.\.s, savedAt: Date\.now\(\) \}\)\)/);
  assert.match(idle, /saveIdleStamped\(nextIdle\)/);
  assert.match(sm, /export function stampSnapshot\(/);
});

test("nuvem não apaga progresso local mais novo nem safiras antigas", () => {
  assert.ok(auth.includes('(cloud as { savedAt?: unknown }).savedAt ?? cloudIdle?.savedAt'));
  assert.match(auth, /if \(cloudHasTimestamp \|\| !localIdle\)/);
  assert.match(auth, /const localIsNewer = !!localIdle/);
  assert.ok(!auth.includes('...cloudIdle, ...localIdle, items'), "não mescla inventários de épocas diferentes");
});

test("incubadora nunca apaga ovos ativados/prontos", () => {
  assert.match(egg, /const removable = \[\.\.\.eggs\]\.map\(\(e, i\) => \(\{ e, i \}\)\)\.filter\(x => !x\.e\.activated\)/);
  assert.ok(!/while \(eggs\.length > itemCount\) eggs\.pop\(\);/.test(egg), "pop ainda pode apagar ovos ativados");
  assert.match(egg, /export function hatchedEggSync\(/);
  assert.match(egg, /hatchedEggSync\(uid, itemCount\)/);
});
