// Optional real-browser regression. Requires Playwright (no production dependency).
// HUD_PREVIEW_URL points to: npx vite --config scripts/previews/vite.config.ts
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
const enabled = process.env.HUD_BROWSER_TEST === "1" || Boolean(process.env.PLAYWRIGHT_MODULE);
const { chromium } = enabled ? await import(process.env.PLAYWRIGHT_MODULE ?? "playwright") : {};
const browser = enabled ? await chromium.launch({
  headless: true, chromiumSandbox: true,
  ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
}) : null;
after(() => browser?.close());
const url = process.env.HUD_PREVIEW_URL ?? "http://127.0.0.1:5176/hud.html";
const artifacts = process.env.HUD_ARTIFACT_DIR ?? join(tmpdir(), "hud-regression");
if (enabled) await mkdir(artifacts, { recursive: true });
const settle = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const box = (page, id) => page.locator(`[data-hud-id="${id}"]`).boundingBox();
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 2, `${actual} != ${expected}`);
const actionCount = (page) => page.locator("#fixture-actions").getAttribute("data-count");
async function mouseDrag(page, id, dx, dy) {
  const before = await box(page, id);
  const x = before.x + before.width / 2, y = before.y + before.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.locator(`[data-hud-id="${id}"].is-hud-dragging`).waitFor();
  await page.mouse.move(x + dx, y + dy, { steps: 16 });
  await page.mouse.up();
  await settle(page);
  return box(page, id);
}
async function touchDrag(page, cdp, id, dx, dy, cancel = false) {
  const before = await box(page, id);
  const x = before.x + before.width / 2, y = before.y + before.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await page.locator(`[data-hud-id="${id}"].is-hud-dragging`).waitFor();
  for (let step = 1; step <= 16; step++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * step / 16, y: y + dy * step / 16 }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
  await settle(page);
  return box(page, id);
}
async function touchTap(page, cdp, x, y) {
  // A quick native press/release must work even directly after a translated drag.
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
async function assertVisibleBlocks(page) {
  const result = await page.locator("[data-hud-id]").evaluateAll((elements) => {
    const frame = document.querySelector(".revo-hud-frame").getBoundingClientRect();
    return elements.filter((element) => element.getClientRects().length).map((element) => {
      const rect = element.getBoundingClientRect();
      return { id: element.dataset.hudId, inside: rect.left >= frame.left - 1 && rect.top >= frame.top - 1 && rect.right <= frame.right + 1 && rect.bottom <= frame.bottom + 1 };
    });
  });
  assert.deepEqual(result.filter((entry) => !entry.inside), []);
}
async function assertCompactCloudRow(page, maxHeight) {
  const clouds = await page.locator(".revo-resource").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, left: rect.left, right: rect.right, height: rect.height };
    }));
  assert.equal(clouds.length, 6);
  for (const [index, cloud] of clouds.entries()) {
    close(cloud.top, clouds[0].top);
    assert.ok(cloud.height <= maxHeight);
    if (index > 0) assert.ok(cloud.left >= clouds[index - 1].right);
  }
  assert.equal(await page.locator('.revo-resource[aria-label^="Pepitas"], .revo-resource[aria-label^="Arremessos"]').count(), 0);
}

test("desktop: hold/drag is precise, never clicks, persists across reload and map margins", { skip: !enabled }, async () => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.getByRole("button", { name: "Expandir tokens e recursos", exact: true }).waitFor();
  await settle(page);
  const before = await box(page, "profile");
  const after = await mouseDrag(page, "profile", 183.5, 142.25);
  close(after.x, before.x + 183.5);
  close(after.y, before.y + 142.25);
  assert.equal(await actionCount(page), "0");
  // Losing window focus cancels a drag without overwriting the last saved drop.
  await page.mouse.move(after.x + 40, after.y + 35);
  await page.mouse.down();
  await page.locator('[data-hud-id="profile"].is-hud-dragging').waitFor();
  await page.mouse.move(after.x + 120, after.y + 80, { steps: 5 });
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await settle(page);
  const cancelled = await box(page, "profile");
  close(cancelled.x, after.x);
  close(cancelled.y, after.y);
  assert.equal(await page.locator(".is-hud-dragging").count(), 0);
  await page.reload();
  await page.getByRole("button", { name: "Recolher perfil do treinador", exact: true }).waitFor();
  await settle(page);
  const restored = await box(page, "profile");
  close(restored.x, after.x);
  close(restored.y, after.y);
  await page.getByRole("button", { name: "Expandir tokens e recursos", exact: true }).click();
  await assertCompactCloudRow(page, 36);
  assert.match(await page.locator('[aria-label="Cristais vermelhos: 1.250"]').innerText(), /1\.250/);
  await page.screenshot({ path: join(artifacts, "hud-desktop.png") });
  await page.getByRole("button", { name: "Recolher perfil do treinador", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Expandir perfil do treinador", exact: true }).waitFor();
  await page.getByRole("button", { name: "Recolher tokens e recursos", exact: true }).waitFor();
  await page.goto(`${url}?inset=100`);
  await settle(page);
  await assertVisibleBlocks(page);
  await page.getByRole("button", { name: "Abrir menu principal", exact: true }).click();
  await page.getByRole("button", { name: "Restaurar HUD", exact: true }).click();
  await settle(page);
  assert.equal(await page.evaluate(() => localStorage.getItem("rubym.hud-positions.v1:hud-preview:desktop")), null);
  await assertVisibleBlocks(page);
  assert.deepEqual(errors, []);
  await context.close();
});

test("touch landscape: native long-press drag, normal taps, resize, expansion and saved position", { skip: !enabled }, async () => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const cdp = await context.newCDPSession(page);
  await page.goto(url);
  await page.getByRole("button", { name: "Expandir tokens e recursos", exact: true }).waitFor();
  await settle(page);
  const before = await box(page, "auto");
  const moved = await touchDrag(page, cdp, "auto", -250, -60);
  close(moved.x, before.x - 250);
  close(moved.y, before.y - 60);
  assert.equal(await actionCount(page), "0");
  assert.equal(await page.locator('[data-hud-id="auto"]').getAttribute("aria-pressed"), "false");
  await touchTap(page, cdp, moved.x + moved.width / 2, moved.y + moved.height / 2);
  await page.waitForFunction(() => document.querySelector("#fixture-actions").dataset.count === "1", null, { timeout: 5000 });
  assert.equal(await actionCount(page), "1");
  const potionBefore = await box(page, "potion");
  const potionCancelled = await touchDrag(page, cdp, "potion", -100, -40, true);
  close(potionCancelled.x, potionBefore.x);
  close(potionCancelled.y, potionBefore.y);
  assert.equal(await page.locator(".is-hud-dragging").count(), 0);
  assert.equal(await actionCount(page), "1");
  await page.reload();
  await settle(page);
  const restored = await box(page, "auto");
  close(restored.x, moved.x);
  close(restored.y, moved.y);
  await page.getByRole("button", { name: "Expandir tokens e recursos", exact: true }).tap();
  await settle(page);
  await assertVisibleBlocks(page);
  await assertCompactCloudRow(page, 30);
  await page.screenshot({ path: join(artifacts, "hud-mobile.png") });
  await page.setViewportSize({ width: 667, height: 375 });
  await settle(page);
  await assertVisibleBlocks(page);
  await assertCompactCloudRow(page, 30);
  const clipped = await page.locator(".revo-resource strong").evaluateAll((elements) =>
    elements.filter((element) => element.scrollWidth > element.clientWidth).map((element) => element.textContent));
  assert.deepEqual(clipped, []);
  await page.screenshot({ path: join(artifacts, "hud-mobile-small.png") });
  // The mission button, bag and menu must be separate, usable circles.
  const missions = await box(page, "capture-quests");
  const bag = await box(page, "bag");
  assert.ok(missions.x + missions.width < bag.x);
  const joystick = await page.locator(".revo-touch-stick").boundingBox();
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: joystick.x + 80, y: joystick.y + 50 }] });
  assert.notEqual(await page.locator("#fixture-actions").getAttribute("data-joystick"), '{"x":0,"y":0}');
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal(await page.locator("#fixture-actions").getAttribute("data-joystick"), '{"x":0,"y":0}');
  assert.deepEqual(errors, []);
  await context.close();
});

test("touch: consecutive drags and immediate taps never swallow the next action", { skip: !enabled }, async () => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(url);
  await page.getByRole("button", { name: "Expandir tokens e recursos", exact: true }).waitFor();
  await settle(page);
  for (let attempt = 0; attempt < 8; attempt++) {
    const moved = await touchDrag(page, cdp, "auto", attempt % 2 ? 140 : -140, -2);
    await touchTap(page, cdp, moved.x + moved.width / 2, moved.y + moved.height / 2);
    await page.waitForFunction((count) => document.querySelector("#fixture-actions").dataset.count === String(count), attempt + 1, { timeout: 5000 });
  }
  await context.close();
});
