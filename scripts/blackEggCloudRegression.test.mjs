import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/components/BlackMiticEggPet.tsx", import.meta.url), "utf8");
const start = source.indexOf("// Flush final ao fechar o painel");
const end = source.indexOf("// Sincroniza número de ovos", start);

test("flush da incubadora não é reinstalado a cada mudança de estado", () => {
  assert.ok(start >= 0 && end > start);
  const effect = source.slice(start, end);
  assert.match(effect, /latestEggStateRef\.current/);
  assert.match(effect, /cloudUidRef\.current !== uid/);
  assert.match(effect, /\}, \[uid\]\);/);
  assert.doesNotMatch(effect, /\[state,\s*uid/);
});

test("envio pendente usa o estado mais recente", () => {
  const pendingStart = source.indexOf("if (pushPendingRef.current)");
  assert.ok(pendingStart >= 0);
  assert.match(source.slice(pendingStart, pendingStart + 650), /latestEggStateRef\.current/);
});
