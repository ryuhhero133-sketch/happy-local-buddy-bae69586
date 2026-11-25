import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const model = { exports: {} };
runInNewContext(transpile(read("../src/game/journey.ts")), { module: model, exports: model.exports });
const { JOURNEY_LINES, JOURNEY_VERSION, journeyAwardStars, dialoguePages } = model.exports;
const migration = read("../supabase/migrations/20261124234346_mandatory_emerald_journey.sql");
const idle = read("../src/routes/idle.tsx");

test("faixas confirmadas, incluindo 190, 200, 300 e 400", () => {
  for (const [level, stars] of [[1,0],[28,0],[99,0],[100,1],[149,1],[150,2],[190,2],[200,2],[299,2],[300,4],[400,4]]) {
    assert.equal(journeyAwardStars(level), stars);
  }
});
test("todas as sete cenas, na ordem, com páginas que cabem na moldura", () => {
  assert.equal(JOURNEY_VERSION, "emerald_journey_v1");
  assert.equal(JOURNEY_LINES.length, 53); // mesma versão/cursor do servidor
  assert.deepEqual([...new Set(JOURNEY_LINES.map((line) => line.scene))], [1,2,3,4,5,6,7]);
  assert.ok(JOURNEY_LINES.every((line) => line.text.length <= 135 && !line.text.includes("�") && line.speaker));
  assert.match(JOURNEY_LINES[0].text, /Finalmente chegou/);
  assert.match(JOURNEY_LINES.at(-1).text, /conhecerá o meu nome/);
  assert.ok(JOURNEY_LINES.some((line) => line.silence && line.text.includes("música para")));
  assert.ok(migration.includes("page_count = 53"));
});
test("paginação não apaga nem duplica palavras", () => {
  const text = "Uma história com várias palavras e acentuação para testar a moldura no celular.";
  assert.equal(dialoguePages(text, 20).join(" "), text);
});
test("migration não faz reset em massa; liberação pública é feita na config", () => {
  assert.match(migration, /enabled boolean not null default false/);
  assert.ok(!migration.includes("set enabled=true"));
  assert.ok(!migration.includes("set enabled = true"));
  assert.ok(!idle.includes("newHud={identity?.id === MAP_EDITOR_OWNER_ID}"));
  assert.ok(read("../src/components/AuthGate.tsx").includes("LOCKDOWN_ONLY_OWNER = false"));
  assert.ok(read("../src/lib/maintenance.functions.ts").includes("return { enabled: false }"));
});
test("antes do fim, o jogo não monta; sem pular/fechar e com cursor confirmado", () => {
  const gate = read("../src/components/journey/JourneyGate.tsx");
  assert.ok(gate.includes("if (ready) return <>{children}</>"));
  assert.ok(gate.includes("advanceJourney(status.version, status.cursor ?? 0)"));
  assert.ok(gate.includes("busyRef.current"));
  assert.ok(gate.includes("hydrateJourneyArrival(userId, response)"));
  assert.ok(!gate.includes("Pular"));
  assert.ok(!gate.includes("onClose"));
  assert.ok(idle.includes("<JourneyGate userId={loadIdentity()?.id}><IdlePage /></JourneyGate>"));
});
test("RPCs isolados por conta, avanço unitário, reset único e backup", () => {
  assert.ok(migration.includes("uid uuid := auth.uid()"));
  assert.ok(migration.includes("using (user_id = (select auth.uid()))"));
  assert.ok(migration.includes("p_expected_cursor is distinct from progress.cursor"));
  assert.ok(migration.includes("if progress.completed_at is not null then"));
  assert.ok(migration.includes("for update"));
  assert.ok(migration.includes("insert into private.emerald_journey_backups"));
  assert.ok(migration.includes("journey_reset_requires_reload"));
  assert.ok(migration.includes("transformed := snapshot; -- a prévia NÃO converte"));
  assert.ok(migration.includes("'trainerLevel',1,'trainerXp',0"));
  assert.ok(migration.includes('\'{"level":1,"xp":0}\''));
});
test("só mídias leves são importadas; todos os arquivos são reais e pequenos", () => {
  const gate = read("../src/components/journey/JourneyGate.tsx");
  let bytes = 0;
  for (const file of ["1.webp","2.webp","3.webp","4.webp","5.webp","6.webp","7.webp","emerald 1.webp","intro-music.m4a","typing.m4a"]) {
    const url = new URL("../src/ambiente/map/jorn/" + file, import.meta.url);
    const content = readFileSync(url);
    bytes += statSync(url).size;
    assert.ok(content.length < 400_000);
    if (file.endsWith(".m4a")) assert.equal(content.subarray(4,8).toString("ascii"), "ftyp");
    else assert.equal(content.subarray(0,4).toString("ascii"), "RIFF");
  }
  assert.ok(bytes < 2_700_000);
  assert.ok(!gate.includes(".png"));
  assert.ok(!gate.includes(".opus"));
  assert.ok(gate.includes("preload=\"none\""));
  assert.ok(gate.includes("background?.pause(); keys?.pause()"));
});
test("estrelas permanentes entram nos atributos e sobrevivem à troca de líder", () => {
  const systems = read("../src/game/systems.tsx");
  const fn = systems.match(/export function starsOf\(pet: PetInstance\): number \{[\s\S]*?\n\}/)?.[0];
  assert.ok(fn);
  const mod = { exports: {} };
  runInNewContext(transpile(fn), { module: mod, exports: mod.exports });
  assert.equal(mod.exports.starsOf({ level: 1, legacyStars: 2, rebirths: 0 }), 2);
  assert.equal(mod.exports.starsOf({ level: 1, legacyStars: 2, rebirths: 1 }), 5);
  assert.equal(mod.exports.starsOf({ level: 200, legacyStars: 4, rebirths: 2 }), 7);
  assert.ok(idle.includes("...makePet(entry.species, entry.level, entry.rarity), ...entry"));
  assert.ok(idle.includes("legacyStars: entry.legacyStars ?? basePet.legacyStars"));
  assert.ok(idle.includes("stars={idle.trainerStars ?? 0}"));
});

function saveManagerFixture() {
  const values = new Map();
  let rpcStarted, releaseRpc;
  const started = new Promise((resolve) => { rpcStarted = resolve; });
  const pending = new Promise((resolve) => { releaseRpc = resolve; });
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key) };
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: { id: "owner" } } } }) },
    rpc: async () => { rpcStarted(); return pending; },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { save_version: 0 } }) }) }) }),
  };
  const mod = { exports: {} };
  runInNewContext(transpile(read("../src/lib/saveManager.ts")), {
    module: mod, exports: mod.exports, console, localStorage: storage,
    window: { addEventListener() {} }, document: { addEventListener() {} }, navigator: { onLine: true },
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 2, clearInterval() {},
    require: (id) => {
      if (id === "@/integrations/supabase/client") return { supabase };
      if (id === "@/lib/pokemonMint") return { flushMintQueue: async () => {} };
      throw new Error("Unexpected import: " + id);
    },
  });
  mod.exports.claimSnapshotOwner("owner");
  return { manager: mod.exports, values, started, releaseRpc };
}
test("checkpoint oficial guarda recuperação e neutraliza a fila de antes do reset", async () => {
  const { manager, values } = saveManagerFixture();
  manager.markDirty({ idle: { trainerLevel: 400 }, team: [], restingBench: [], savedAt: 100 });
  const converted = { idle: { trainerLevel: 1, journey: { version: JOURNEY_VERSION } }, team: [], restingBench: [], savedAt: 200 };
  await manager.adoptJourneyCheckpoint("owner", converted, 20);
  assert.equal(values.get("rubym.save.version.owner"), "20");
  assert.equal(values.get("rubym.checkpoint.pending.owner"), undefined);
  assert.ok(values.has("rubym.checkpoint.recovery.owner"));
  assert.equal(manager.loadLastGood("owner").snapshot.idle.trainerLevel, 1);
  await assert.rejects(manager.adoptJourneyCheckpoint("other-account", converted, 21));
});
test("resposta de um save antigo em voo não sobrescreve a confirmação do reborn", async () => {
  const { manager, values, started, releaseRpc } = saveManagerFixture();
  manager.markDirty({ idle: { trainerLevel: 400 }, team: [], restingBench: [], savedAt: 100 });
  const push = manager.flushNow();
  await started;
  await manager.adoptJourneyCheckpoint("owner", { idle: { trainerLevel: 1 }, team: [], restingBench: [], savedAt: 200 }, 30);
  releaseRpc({ data: { ok: true, server_version: 1 }, error: null });
  assert.equal(await push, false);
  assert.equal(values.get("rubym.save.version.owner"), "30");
  assert.equal(manager.loadLastGood("owner").snapshot.idle.trainerLevel, 1);
});
