import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const component = read("../src/components/nevezinha/NevezinhaEvent.tsx");
const css = read("../src/components/nevezinha/nevezinha-event.css");
const idle = read("../src/routes/idle.tsx");
const inventory = read("../src/components/inventory/inventoryModel.ts");
const sql = read("../supabase/migrations/20261125005232_nevezinha_daily_event.sql")
  + "\n" + read("../supabase/migrations/20261125013004_nevezinha_three_shots.sql")
  + "\n" + read("../supabase/migrations/20261125014935_nevezinha_fail_consolation.sql")
  + "\n" + read("../supabase/migrations/20261125024027_nevezinha_more_fail_potions.sql");
const testSql = read("../supabase/tests/nevezinha_event.test.sql");
const saveManager = read("../src/lib/saveManager.ts");

test("TSX compila e usa portal, vídeos e checkpoint oficial", () => {
  assert.doesNotThrow(() => ts.transpileModule(component, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }));
  assert.ok(component.includes("createPortal"));
  assert.ok(component.includes("adoptAuthoritativeCheckpoint"));
  for (const video of ["show.mp4", "fail.mp4", "stone.mp4", "items.mp4"]) assert.ok(component.includes(video));
  assert.ok(component.includes("3 tiros por dia"));
  assert.ok(component.includes("Tiros 1 e 2 podem falhar"));
  assert.ok(component.includes("100–200 Poções + 1 Baga"));
  assert.ok(component.includes("icon-potion.webp"));
  assert.ok(component.includes("F5"));
  assert.ok(component.includes("icon-pokeball.webp"));
  assert.ok(component.includes("chest-grass.webp"));
});

test("vídeos em 720p continuam leves e são carregados só no tiro", () => {
  let total = 0;
  for (const file of ["machine.webp", "ticket.webp", "show.mp4", "fail.mp4", "stone.mp4", "items.mp4"]) {
    const url = new URL("../src/ambiente/nevezinha/" + file, import.meta.url);
    const bytes = statSync(url).size;
    total += bytes;
    assert.ok(bytes > 0 && bytes < 5_000_000, `${file} pesado demais`);
    if (file.endsWith(".mp4")) {
      const buffer = readFileSync(url);
      assert.equal(buffer.subarray(4, 8).toString("ascii"), "ftyp");
    }
  }
  assert.ok(total < 13_000_000, `evento pesado: ${total}`);
  assert.ok(css.includes("width: 100vw"));
  assert.ok(css.includes("height: 100dvh"));
  assert.ok(css.includes("object-fit: cover"));
  assert.ok(css.includes("@media (max-width: 820px)"));
  assert.ok(css.includes("max-height: 520px"));
  assert.ok(css.includes(".nevezinha-map-npc"));
});

test("servidor: 3 tiros/dia, 70% falha nos dois primeiros, 3º garantido", () => {
  assert.ok(sql.includes("tickets between 0 and 3"));
  assert.ok(sql.includes("set tickets = 3"));
  assert.ok(sql.includes("_shots_left > 1 and random() < 0.70"));
  assert.ok(sql.includes("_roll < 0.05"));
  assert.ok(sql.includes("jsonb_build_object('pokeball', 1, 'potion', 100 + floor(random() * 101)::int, 'berry', 1)"));
  assert.ok(sql.includes("America/Sao_Paulo"));
  assert.ok(sql.includes("nevezinha_doll"));
  assert.ok(sql.includes("snapshot", "server_version"));
  assert.ok(sql.includes("revoke all on public.nevezinha_event_state from public, anon, authenticated"));
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
  assert.ok(idle.includes("partyMemberIds"));
  assert.ok(idle.includes("Na sua party"));
  assert.ok(!idle.includes("SnowCanvas"));
  assert.ok(!idle.includes("rainDropEls"));
  assert.ok(!idle.includes("blackSnowEls"));
  assert.ok(!idle.includes("Weather cycle:"));
});

test("boneco lendário entra na mochila e dá +5% de XP", () => {
  assert.ok(idle.includes('nevezinha_doll: "Boneco da Nevezinha ⛄"'));
  assert.ok(idle.includes("nevezinha_doll: nevezinhaUrl"));
  assert.ok(idle.includes("LENDÁRIO do Festival de Inverno"));
  assert.ok(idle.includes("nevezinhaDollXpMult"));
  assert.ok(idle.includes("* nevezinhaDollXpMult"));
  assert.ok(inventory.includes("nevezinha_"));
  assert.ok(inventory.includes('return "events"'));
  assert.ok(inventory.includes('return "legendary"'));
});

test("boneco da Nevezinha pode ser usado para seguir o treinador", () => {
  assert.ok(idle.includes('"nevezinha_doll",'));
  assert.ok(idle.includes('if (id === "nevezinha_doll")'));
  assert.ok(idle.includes('if (item.id === "nevezinha_doll")'));
  assert.ok(idle.includes("toggleSnowmanFollow()"));
  assert.ok(idle.includes("Nevezinha agora está seguindo você"));
  assert.ok(idle.includes('id === "nevezinha_doll" ? (snowmanFollow ? "PARAR" : "SEGUIR")'));
  assert.ok(idle.includes("Use na mochila para ele seguir você"));
});

test("checkpoint genérico preserva a base anterior do evento", () => {
  assert.ok(saveManager.includes("adoptAuthoritativeCheckpoint"));
  assert.ok(saveManager.includes('"before-nevezinha"') || component.includes('"before-nevezinha"'));
  assert.ok(saveManager.includes("invalid_authoritative_checkpoint"));
});
