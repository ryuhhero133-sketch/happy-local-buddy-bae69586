import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const asUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

test("Mewtwo e Dragonite selam e chocam com 13 traits dourados", async () => {
  const traitsUrl = asUrl(compile(read("src/game/traits.ts")));
  const eggsUrl = asUrl(compile(read("src/game/ancestralEggs.ts"))
    .replace('from "./traits"', `from "${traitsUrl}"`));
  const traits = await import(traitsUrl);
  const eggs = await import(eggsUrl);
  for (const [id, species] of [["mewtwo-ancestral", "mewtwo_ancestral"], ["dragonite-ancestral", "dragonite_ancestral"]]) {
    for (const kind of ["selado", "plus", "luck"]) {
      const egg = eggs.seal(kind, id, 100);
      assert.equal(egg?.species, species);
      const result = eggs.hatchTraits(egg);
      assert.equal(result.length, 13);
      assert.ok(result.every((id) => traits.TRAITS[id]?.tier === "gold"));
    }
  }
});

test("artes e sprites dos ancestrais estão cadastradas", () => {
  const entries = read("src/components/ancestralEncyclopedia.ts");
  const systems = read("src/game/systems.tsx");
  const idle = read("src/routes/idle.tsx");
  for (const name of ["mewtwo", "dragonite"]) {
    assert.ok(entries.includes(`id: "${name}-ancestral"`));
    assert.ok(systems.includes(`${name}_ancestral:`));
    assert.ok(idle.includes(`${name}_ancestral: ${name}AncestralSheet`));
    assert.ok(idle.includes(`${name}_ancestral: ${name}AncestralFrame`));
  }
  for (const file of [
    "MEWTWO.png", "MEWTWO ANCESTRAL.png", "MEWTWO ANCESTRAL FRAME.png",
    "DRAGONITE ANCESTRAL.png", "DRAGONITE ANCESTRAL X.png", "DRAGONITE ANCESTRAL FRAME.png",
  ]) assert.ok(existsSync(new URL(`src/ambiente/${file}`, root)), file);
});
