// Optional: GAME_RESTART_BROWSER_TEST=1, Playwright and the isolated fixture server.
import assert from "node:assert/strict";
import { after, test } from "node:test";
const enabled = process.env.GAME_RESTART_BROWSER_TEST === "1" || Boolean(process.env.PLAYWRIGHT_MODULE);
const { chromium } = enabled ? await import(process.env.PLAYWRIGHT_MODULE ?? "playwright") : {};
const browser = enabled ? await chromium.launch({
  headless: true, chromiumSandbox: true,
  ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
}) : null;
after(() => browser?.close());
const url = process.env.GAME_RESTART_PREVIEW_URL ?? "http://127.0.0.1:5176/game-restart.html";

test("real browser: manual signal waits for checkpoint, saves progress and reloads once", { skip: !enabled }, async () => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  let navigations = 0;
  page.on("framenavigated", (frame) => { if (frame === page.mainFrame()) navigations++; });
  let acknowledge;
  let checkpointSeen;
  const checkpointStarted = new Promise((resolve) => { checkpointSeen = resolve; });
  await page.route("**/fixture-checkpoint", (route) => new Promise((resolve) => {
    acknowledge = async () => { await route.fulfill({ json: { ok: true } }); resolve(); };
    checkpointSeen();
  }));
  await page.goto(url);
  assert.equal(await page.getByText("Atualização importante do jogo", { exact: true }).count(), 0);
  await page.locator("#simulate").click();
  await page.getByText("Atualização importante do jogo", { exact: true }).waitFor();
  await page.getByRole("dialog", { name: "Salvando e reiniciando o jogo" }).waitFor({ timeout: 10_000 });
  await checkpointStarted;
  assert.equal(navigations, 1);
  assert.equal(await page.evaluate(() => localStorage.getItem("fixture.restart-progress")), null);
  const reloaded = page.waitForEvent("framenavigated", { predicate: (frame) => frame === page.mainFrame() });
  await acknowledge();
  await reloaded;
  await page.getByText("Progresso restaurado", { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("fixture.restart-progress"))), {
    gold: 521111, level: 18, pokemon: "pikachu",
  });
  // No automatic polling and no replay: the reloaded page must stay put.
  await page.waitForTimeout(1_500);
  assert.equal(navigations, 2);
  await context.close();
});

test("real browser: unsafe action postpones the restart and failed checkpoint keeps the page", { skip: !enabled }, async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let navigations = 0;
  page.on("framenavigated", (frame) => { if (frame === page.mainFrame()) navigations++; });
  await page.route("**/fixture-checkpoint", (route) => route.fulfill({ status: 503, json: { ok: false } }));
  await page.goto(url);
  await page.getByLabel("Ação em andamento (não pode reiniciar)").check();
  await page.locator("#simulate").click();
  await page.getByText("Vamos salvar seu progresso e reiniciar assim que a ação atual terminar.", { exact: true }).waitFor();
  await page.waitForTimeout(1_000);
  assert.equal(navigations, 1);
  assert.equal(await page.evaluate(() => localStorage.getItem("fixture.restart-progress")), null);
  await page.getByLabel("Ação em andamento (não pode reiniciar)").uncheck();
  await page.getByText("Não foi possível confirmar o salvamento agora.", { exact: false }).waitFor({ timeout: 20_000 });
  assert.equal(navigations, 1);
  assert.equal(await page.evaluate(() => sessionStorage.getItem("fixture.restart-resumed")), "true");
  await context.close();
});
