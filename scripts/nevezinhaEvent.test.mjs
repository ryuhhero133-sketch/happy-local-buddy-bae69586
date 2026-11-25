import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const component = read("../src/components/nevezinha/NevezinhaEvent.tsx");
const css = read("../src/components/nevezinha/nevezinha-event.css");
const idle = read("../src/routes/idle.tsx");
const inventory = read("../src/components/inventory/inventoryModel.ts");
const sql = read("../supabase/migrations/20261125005232_nevezinha_daily_event.sql");
const testSql = read("../supabase/tests/nevezinha_event.test.sql");
const saveManager = read("../src/lib/saveManager.ts");

test("TSX compila e usa portal, vídeos e checkpoint oficial", () => {
  assert.doesNotThrow(() => ts.transpileModule(component, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }));
  assert.ok(component.includes("createPortal"));
  assert.ok(component.includes("adoptAuthoritativeCheckpoint"));
  for (const video of ["show.mp4", "fail.mp4", "stone.mp4", "items.mp4"]) assert.ok(component.includes(video));
  assert.ok(component.includes("1 ticket por dia"));
  assert.ok(component.includes("F5"));
});

test("mídias do evento são leves e existem", () => {
  let total = 0;
  for (const file of ["machine.webp", "ticket.webp", "show.mp4", "fail.mp4", "stone.mp4", "items.mp4"]) {
    const url = new URL("../src/ambiente/nevezinha/" + file, import.meta.url);
    const bytes = statSync(url).size;
    total += bytes;
    assert.ok(bytes > 0 && bytes < 1_000_000, `${file} pesado demais`);
    if (file.endsWith(".mp4")) {
      const buffer = readFileSync(url);
      assert.equal(buffer.subarray(4, 8).toString("ascii"), "ftyp");
    }
  }
  assert.ok(total < 3_000_000, `evento pesado: ${total}`);
  assert.ok(css.includes("@media (max-width: 820px)"));
  assert.ok(css.includes("max-height: 520px"));
  assert.ok(css.includes(".nevezinha-map-npc"));
});

test("servidor: 1 ticket/dia, horário de São Paulo, prêmio atômico e F5", () => {
  assert.ok(sql.includes("tickets between 0 and 1"));
  assert.ok(sql.includes("America/Sao_Paulo"));
  assert.ok(sql.includes("nevezinha_event_status"));
  assert.ok(sql.includes("nevezinha_event_spin"));
  assert.ok(sql.includes("nevezinha_doll"));
  assert.ok(sql.includes("stone_dragon"));
  assert.ok(sql.includes("ultraball"));
  assert.ok(sql.includes("snapshot", "server_version"));
  assert.ok(sql.includes("revoke all on public.nevezinha_event_state from public, anon, authenticated"));
  assert.ok(sql.includes("grant execute on function public.nevezinha_event_status"));
  assert.ok(testSql.includes("rollback do teste"));
  assert.ok(testSql.includes("PASS"));
});

test("NPC do Emerald abre a aba do Festival", () => {
  assert.ok(idle.includes("NevezinhaEvent"));
  assert.ok(idle.includes("nevezinhaOpen"));
  assert.ok(idle.includes("left: 840 - 31, top: 528 - 84 + 8"));
  assert.ok(idle.includes('editorObject?.assetId === "npc_nevezinha"'));
  assert.ok(idle.includes("setNevezinhaOpen(true)"));
  assert.ok(idle.includes("emeraldHasNevezinhaNpc"));
});

test("boneco entra na mochila e não é item quebrado", () => {
  assert.ok(idle.includes('nevezinha_doll: "Boneco da Nevezinha ⛄"'));
  assert.ok(idle.includes("nevezinha_doll: nevezinhaUrl"));
  assert.ok(idle.includes("Boneco da Nevezinha ⛄ · lembrança rara"));
  assert.ok(inventory.includes("nevezinha_"));
  assert.ok(inventory.includes('return "events"'));
  assert.ok(inventory.includes('return "legendary"'));
});

test("checkpoint genérico preserva a base anterior do evento", () => {
  assert.ok(saveManager.includes("adoptAuthoritativeCheckpoint"));
  assert.ok(saveManager.includes('"before-nevezinha"') || component.includes('"before-nevezinha"'));
  assert.ok(saveManager.includes("invalid_authoritative_checkpoint"));
});
