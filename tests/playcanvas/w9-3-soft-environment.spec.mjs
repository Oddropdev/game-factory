import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const out = path.resolve('evidence/w9-3-3');
fs.mkdirSync(out, { recursive: true });
const sizes = [
  { name: 'portrait-390x844', width: 390, height: 844 },
  { name: 'small-android-360x800', width: 360, height: 800 },
  { name: 'landscape-844x390', width: 844, height: 390 }
];
const probe = page => page.evaluate(() => globalThis.__W9_PLAYCANVAS_TEST__?.snapshot());

for (const size of sizes) {
  test('W9.3-3 real soft garden + 5 phase screenshots ' + size.name, async ({page}) => {
    test.setTimeout(55_000);
    await page.setViewportSize({ width:size.width, height:size.height });
    const errors = [], offOrigin = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => {
      if (!r.url().startsWith('http://127.0.0.1:4177/') && !r.url().startsWith('data:')) {
        offOrigin.push(r.url());
      }
    });
    await page.goto('/3d/');
    await expect.poll(async () => (await probe(page))?.loadedCC0Models).toBe(5);
    await expect.poll(async () => (await probe(page))?.frames).toBeGreaterThan(10);
    const initial = await probe(page);
    expect(initial.assetFailures).toBe(0);
    expect(initial.environmentKind).toBe('soft-garden-v1');
    expect(initial.environmentRoundedPieces).toBe(46);
    expect(initial.environmentBoxPieces).toBe(0);
    expect(initial.avatarBoxParts).toBe(0);
    expect(initial.softCourseBoxPieces).toBe(0);
    expect(initial.juicePieces).toBe(12);
    expect(initial.juiceBursts).toBe(0);
    expect(initial.juiceActive).toBe(false);
    expect(initial.fullViewport).toBe(true);
    expect(initial.levelId).toBe('bulk-up');
    const capture = async phase => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await page.screenshot({ path: path.join(out, size.name + '-' + phase + '.png') });
    };
    await capture('ready');
    await page.locator('#start').click();
    await expect.poll(async () => (await probe(page))?.distance).toBeGreaterThan(4);
    await capture('running');
    await expect.poll(async () => (await probe(page))?.distance).toBeGreaterThan(11);
    await capture('approach');
    await expect.poll(async () => (await probe(page))?.distance).toBeGreaterThan(52);
    await capture('post-gate');
    await expect.poll(async () => (await probe(page))?.phase, { timeout: 18000 }).not.toBe('running');
    await capture('result');
    const final = await probe(page);
    expect(final.juiceBursts).toBeGreaterThanOrEqual(2);
    expect(final.levelId).toBe(initial.levelId);
    expect(final.environmentRoundedPieces).toBe(initial.environmentRoundedPieces);
    expect(errors).toEqual([]);
    expect(offOrigin).toEqual([]);
  });
}

test('W9.3-3 pooled feedback follows real events without touching game physics', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/3d/');
  await expect.poll(async () => (await probe(page))?.loadedCC0Models).toBe(5);
  const before = await probe(page);
  await page.locator('#start').click();
  await expect.poll(async () => (await probe(page))?.distance).toBeGreaterThan(33);
  const after = await probe(page);
  // The unchanged original model determines event results.
  expect(after.mass).toBeGreaterThanOrEqual(1);
  expect(after.juicePieces).toBe(12);
  expect(after.environmentRoundedPieces).toBe(before.environmentRoundedPieces);
  expect(after.juiceBursts).toBeGreaterThanOrEqual(1);
  await page.mouse.move(355, 470);
  await page.mouse.down();
  await page.waitForTimeout(450);
  expect((await probe(page)).playerNormX).toBeGreaterThan(0.55);
  await page.mouse.up();
});

test('W9.3-3 real HUD gate typography + visual feedback cannot intercept gestures', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/3d/');
  await expect.poll(async () => (await probe(page))?.loadedCC0Models).toBe(5);
  expect(await page.locator('#hud').evaluate(e => getComputedStyle(e).pointerEvents)).toBe('none');
  expect(await page.locator('#start').evaluate(e => getComputedStyle(e).minHeight)).toBe('48px');
  await page.locator('#start').click();
  await expect.poll(async () => page.locator('.world-gate-label:visible').count(), { timeout:6000 }).toBe(2);
  const typography = await page.locator('.world-gate-label:visible').evaluateAll(els =>
    els.map(e => ({
      font: parseFloat(getComputedStyle(e).fontSize),
      pointer: getComputedStyle(e).pointerEvents,
      bounds: e.getBoundingClientRect().toJSON()
    }))
  );
  for (const label of typography) {
    expect(label.font).toBeGreaterThanOrEqual(20);
    expect(label.pointer).toBe('none');
    expect(label.bounds.left).toBeGreaterThanOrEqual(0);
    expect(label.bounds.right).toBeLessThanOrEqual(390);
  }
});
