import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const maxAssetBytes = 25 * 1024 * 1024;

function checkAssets(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) checkAssets(path);
    else assert.ok(statSync(path).size <= maxAssetBytes, `Asset acima de 25 MiB: ${path.pathname}`);
  }
}

test("assets de origem respeitam o limite de 25 MiB do Workers", () => {
  checkAssets(new URL("src/", root));
  checkAssets(new URL("public/", root));
});

test("Worker usa o nome do destino de produção", () => {
  const config = JSON.parse(readFileSync(new URL("wrangler.jsonc", root), "utf8"));
  assert.equal(config.name, "revo-emerald");
});
