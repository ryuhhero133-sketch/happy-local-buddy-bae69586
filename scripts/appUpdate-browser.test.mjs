// Optional: APP_UPDATE_BROWSER_TEST=1, Playwright and the isolated fixture server.
import assert from "node:assert/strict";
import { after, test } from "node:test";
const enabled = process.env.APP_UPDATE_BROWSER_TEST === "1" || Boolean(process.env.PLAYWRIGHT_MODULE);
const { chromium } = enabled ? await import(process.env.PLAYWRIGHT_MODULE ?? "playwright") : {};
const browser = enabled ? await chromium.launch({
  headless: true, chromiumSandbox: true,
  ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
}) : null;
after(() => browser?.close());
const url = process.env.APP_UPDATE_PREVIEW_URL ?? "http://127.0.0.1:5176/app-update.html";
const version = { version: "preview-next" };

test("real browser: waits for cloud acknowledgement, persists progress and reloads only once", { skip: !enabled }, async () => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  let navigations = 0;
  page.on("framenavigated", (frame) => { if (frame === page.mainFrame()) navigations++; });
  await page.route("**/__app-version", (route) => route.fulfill({ json: version }));
  let acknowledge;
  let checkpointSeen;
  const checkpointStarted = new Promise((resolve) => { checkpointSeen = resolve; });
  await page.route("**/fixture-checkpoint", (route) => new Promise((resolve) => {
    acknowledge = async () => { await route.fulfill({ json: { ok: true } }); resolve(); };
    checkpointSeen();
  }));
  await page.goto(url);
  await page.getByText("Uma nova versão chegou!", { exact: true }).waitFor({ timeout: 20_000 });
  await page.getByRole("dialog", { name: "Atualizando o jogo" }).waitFor({ timeout: 15_000 });
  await checkpointStarted;
  assert.equal(navigations, 1);
  assert.equal(await page.evaluate(() => localStorage.getItem("fixture.update-progress")), null);
  assert.ok(acknowledge);
  const reloaded = page.waitForEvent("framenavigated", { predicate: (frame) => frame === page.mainFrame() });
  await acknowledge();
  await reloaded;
  await page.getByText("Progresso restaurado", { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("fixture.update-progress"))), {
    gold: 521111, level: 18, pokemon: "pikachu",
  });
  // Same stale bundle after reload: the per-tab guard must block a second refresh.
  await page.route("**/fixture-checkpoint", (route) => route.fulfill({ json: { ok: true } }));
  await page.getByText("A atualização está aguardando uma conexão estável.", { exact: false }).waitFor({ timeout: 25_000 });
  assert.equal(navigations, 2);
  await context.close();
});

test("real browser: failed checkpoint preserves the page and returns to gameplay", { skip: !enabled }, async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let navigations = 0;
  page.on("framenavigated", (frame) => { if (frame === page.mainFrame()) navigations++; });
  await page.route("**/__app-version", (route) => route.fulfill({ json: version }));
  await page.route("**/fixture-checkpoint", (route) => route.fulfill({ status: 503, json: { ok: false } }));
  await page.goto(url);
  await page.getByText("Ainda não foi possível confirmar o salvamento.", { exact: false }).waitFor({ timeout: 25_000 });
  assert.equal(navigations, 1);
  assert.equal(await page.getByRole("dialog", { name: "Atualizando o jogo" }).count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem("fixture.update-progress")), null);
  assert.equal(await page.evaluate(() => sessionStorage.getItem("fixture.update-resumed")), "true");
  await context.close();
});
