import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const evidence = path.resolve('evidence/w9-3-2');
fs.mkdirSync(evidence, { recursive: true });
const states = [
  { name: 'portrait-390x844', width: 390, height: 844 },
  { name: 'small-android-360x800', width: 360, height: 800 },
  { name: 'landscape-844x390', width: 844, height: 390 }
];
const probe = page => page.evaluate(() =>
  globalThis.__W9_PLAYCANVAS_TEST__?.snapshot()
);

for (const size of states) {
  test('W9.3-2 authentic rounded 3D course ' + size.name, async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize({ width: size.width, height: size.height });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/3d/');
    await expect.poll(async () => (await probe(page))?.loadedCC0Models).toBe(5);
    await expect.poll(async () => (await probe(page))?.frames).toBeGreaterThan(10);
    const state = await probe(page);
    expect(state.softCourse).toBe('rounded-toy-v1');
    expect(state.softCourseBoxPieces).toBe(0);
    expect(state.softTrackPieces).toBeGreaterThanOrEqual(7);
    expect(state.portalCount).toBe(2);
    expect(state.hazardCount).toBe(1);
    expect(state.roundedPortalPieces).toBeGreaterThanOrEqual(20);
    expect(state.roundedHazardPieces).toBeGreaterThanOrEqual(4);
    expect(state.avatarKind).toBe('soft-toy-v1');
    expect(state.fullViewport).toBe(true);

    await page.screenshot({ path: path.join(evidence, size.name + '-ready.png') });
    await page.locator('#start').click();
    await expect.poll(async () => (await probe(page))?.distance, { timeout: 5000 })
      .toBeGreaterThan(11);
    await page.screenshot({ path: path.join(evidence, size.name + '-approach.png') });
    await expect.poll(async () => (await probe(page))?.distance, { timeout: 6000 })
      .toBeGreaterThan(50);
    await page.screenshot({ path: path.join(evidence, size.name + '-post-gate.png') });
    const after = await probe(page);
    expect(after.levelId).toBe('bulk-up');
    expect(after.softCourseBoxPieces).toBe(0);
    expect(errors).toEqual([]);
  });
}

test('W9.3-2 operation glyphs and benefit colors agree with frozen game arithmetic', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/3d/');
  await expect.poll(async () => (await probe(page))?.loadedCC0Models).toBe(5);
  await page.locator('#start').click();
  await expect.poll(async () =>
    (await page.locator('.world-gate-label:visible').count()), { timeout: 6500 }
  ).toBe(2);
  const labels = await page.locator('.world-gate-label:visible').evaluateAll(els =>
    els.map(el => ({
      text: el.textContent,
      quality: el.dataset.gateQuality,
      bounds: (() => {
        const b = el.getBoundingClientRect();
        return [b.left, b.right, b.top, b.bottom];
      })()
    }))
  );
  expect(labels.map(e => e.text)).toEqual(['+4', '-3']);
  expect(labels.map(e => e.quality)).toEqual(['better', 'worse']);
  for (const label of labels) {
    expect(label.bounds[0]).toBeGreaterThanOrEqual(0);
    expect(label.bounds[1]).toBeLessThanOrEqual(390);
    expect(label.bounds[2]).toBeGreaterThanOrEqual(90);
    expect(label.bounds[3]).toBeLessThanOrEqual(844);
  }
  await page.screenshot({ path: path.join(evidence, 'portrait-gate-legibility.png') });
});

test('W9.3-2 reward overlay does not cover upcoming decisions and touch remains native', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/3d/');
  await expect.poll(async () => (await probe(page))?.loadedCC0Models).toBe(5);
  await page.locator('#start').click();
  const rect = await page.locator('#feedback').boundingBox();
  expect(rect.y).toBeGreaterThan(844 * 0.6);
  const pos = await probe(page);
  expect(pos.playerNormX).toBe(0.5);
  await page.mouse.move(355, 470);
  await page.mouse.down();
  await page.waitForTimeout(450);
  expect((await probe(page)).playerNormX).toBeGreaterThan(0.55);
  await page.mouse.up();
});
