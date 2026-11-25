import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const source = read("../src/game/captureQuests.ts");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const quests = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);
const { CAPTURE_QUESTS, CAPTURE_QUEST_MILESTONES, applyCaptureQuest, captureQuestCount } = quests;
const idle = read("../src/routes/idle.tsx");
const hud = read("../src/components/hud/GameHud.tsx");

test("20 missões de captura com os dados pedidos", () => {
  assert.equal(CAPTURE_QUESTS.length, 20);
  assert.deepEqual(
    CAPTURE_QUESTS.map((quest) => quest.species),
    ["bulbasaur", "pikachu", "charmander", "eevee", "squirtle", "abra", "growlithe",
      "scyther", "pinsir", "kangaskhan", "gengar", "alakazam", "ditto", "snorlax",
      "arcanine", "dratini", "dragonair", "lapras", "gyarados", "dragonite"],
  );
  assert.deepEqual(CAPTURE_QUEST_MILESTONES.map((reward) => reward.at), [5, 10, 15, 20]);
});

test("conclusão individual e prêmio a cada 5 sem duplicar", () => {
  let progress = { completed: [], milestones: [] };
  for (let i = 0; i < 5; i++) {
    const update = applyCaptureQuest(progress, CAPTURE_QUESTS[i].species);
    progress = update.progress;
  }
  assert.equal(captureQuestCount(progress), 5);
  assert.deepEqual(progress.milestones, [5]);
  const duplicate = applyCaptureQuest(progress, CAPTURE_QUESTS[0].species);
  assert.equal(duplicate.completedNow.length, 0);
  assert.equal(duplicate.rewards.length, 0);
  assert.equal(captureQuestCount(progress), 5);

  let ticketProgress = { completed: [], milestones: [], ticketGroups: 0 };
  for (let i = 0; i < 3; i++) {
    const update = applyCaptureQuest(ticketProgress, CAPTURE_QUESTS[i].species);
    ticketProgress = update.progress;
    if (i === 2) assert.equal(update.tickets, 1);
  }
  assert.equal(ticketProgress.ticketGroups, 1);
});

test("HUD direita mostra as missões e o progresso", () => {
  assert.ok(hud.includes("CaptureQuestHud"));
  assert.ok(hud.includes("captureQuests"));
  assert.ok(idle.includes("CAPTURE_QUESTS.map"));
  assert.ok(idle.includes("captureQuests={"));
  assert.ok(idle.includes("applyCaptureQuestProgress"));
  assert.ok(idle.includes("prêmio ${labels}"));
});
