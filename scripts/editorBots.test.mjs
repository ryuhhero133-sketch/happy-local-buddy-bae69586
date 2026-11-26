import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const model = read("src/game/editorBots.ts");
const component = read("src/components/EditorBots.tsx");
const idle = read("src/routes/idle.tsx");
const migration = read("supabase/migrations/20261126010000_map_editor_bots_live.sql");

test("modelo do bot do editor tem nome, avatar, pokémon, VIP, seguidor e movimento", () => {
  for (const field of ["name", "avatarId", "leaderSpecies", "vipTier", "follower", "moving", "dir"]) {
    assert.ok(model.includes(field), field);
  }
  assert.ok(model.includes('"nevezinha"'));
  assert.ok(model.includes('"slime"'));
  assert.ok(model.includes("normalizeEditorBots"));
});

test("bot renderiza avatar, Pokémon, VIP, Nevezinha/Slime e menu de treinador", () => {
  assert.ok(component.includes("skinUrls[bot.avatarId]"));
  assert.ok(component.includes("gifMap[bot.leaderSpecies]"));
  assert.ok(component.includes("zoneSheet(bot.leaderSpecies)"));
  assert.ok(component.includes("PROFILE_SPRITES.books[VIP_BOOK_BY_TIER[bot.vipTier]]"));
  assert.ok(component.includes("nevezinhaUrl"));
  assert.ok(component.includes("slimeSheetUrl"));
  assert.ok(component.includes("<TrainerActionMenu"));
  assert.ok(component.includes("bot.moving && !editorMode"));
});

test("editor de mapa ganhou a aba de bots e o formulário completo", () => {
  assert.ok(idle.includes('"sprites" | "pokemon" | "teleport" | "bots"'));
  assert.ok(idle.includes("🤖 BOT"));
  assert.ok(idle.includes("mapEditorBots"));
  assert.ok(idle.includes("createEditorBotAt"));
  assert.ok(idle.includes("const setBotField"));
  assert.ok(idle.includes("Treinador padrão"));
  assert.ok(idle.includes("VIP GOLD"));
  assert.ok(idle.includes("Nevezinha ⛄"));
  assert.ok(idle.includes("Slime 🔵"));
  assert.ok(idle.includes("Em movimento"));
  assert.ok(idle.includes("Direção (parado)"));
  assert.ok(idle.includes("mapEditorTab === \"bots\""));
});

test("bots entram no save, na publicação, no export e na sincronização ao vivo", () => {
  assert.ok(idle.includes("bots: mapEditorBots"));
  assert.ok(idle.includes("bots: mapEditorBotsRef.current"));
  assert.ok(idle.includes("map-editor-live-v1"));
  assert.ok(idle.includes("broadcastMapEditorPublished"));
  assert.ok(idle.includes("publish_map_editor_defaults"));
  assert.ok(idle.includes("bots: mapEditorBots[idle.currentMap]"));
  assert.ok(idle.includes("version: 6"));
  assert.ok(migration.includes("'bots'"));
  assert.ok(migration.includes("data -> 'bots'"));
});

test("bots antigos foram removidos", () => {
  assert.ok(!idle.includes("AmbientTrainers"));
  assert.equal(existsSync(new URL("../src/components/AmbientTrainers.tsx", import.meta.url)), false);
});
