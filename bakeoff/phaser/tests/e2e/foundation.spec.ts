import { expect, test } from '@playwright/test';

type BakeoffState = {
  engine: string;
  ready: boolean;
  paused: boolean;
  score: number;
  pointerEvents: number;
  restartCount: number;
  targetNormX: number;
};

declare global {
  interface Window {
    __BAKEOFF__: {
      engine: string;
      getState(): BakeoffState;
      restart(): void;
      pause(): void;
      resume(): void;
    };
  }
}

async function state(page: import('@playwright/test').Page): Promise<BakeoffState> {
  return page.evaluate(() => window.__BAKEOFF__.getState());
}

async function targetPoint(page: import('@playwright/test').Page) {
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounding box');
  const current = await state(page);
  return {
    x: box.x + box.width * current.targetNormX,
    y: box.y + box.height * 0.5,
    box
  };
}

test('equivalent mobile-first foundation contract', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', request => failedRequests.push(request.url()));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect.poll(async () => (await state(page)).ready).toBe(true);

  const firstCanvas = page.locator('canvas').first();
  await expect(firstCanvas).toBeVisible();
  const portraitBox = await firstCanvas.boundingBox();
  expect(portraitBox).not.toBeNull();
  expect(portraitBox!.width).toBeGreaterThan(0);
  expect(portraitBox!.height).toBeGreaterThan(0);

  const initial = await state(page);
  expect(initial.score).toBe(0);
  expect(initial.targetNormX).toBeGreaterThan(0.14);
  expect(initial.targetNormX).toBeLessThan(0.86);

  // Mouse/pointer path.
  let point = await targetPoint(page);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).score).toBe(1);

  // Touch path against the newly spawned deterministic target.
  point = await targetPoint(page);
  await page.touchscreen.tap(point.x, point.y);
  await expect.poll(async () => (await state(page)).score).toBe(2);
  expect((await state(page)).pointerEvents).toBeGreaterThanOrEqual(2);

  // Explicit lifecycle control.
  await page.evaluate(() => window.__BAKEOFF__.pause());
  await expect.poll(async () => (await state(page)).paused).toBe(true);
  await page.evaluate(() => window.__BAKEOFF__.resume());
  await expect.poll(async () => (await state(page)).paused).toBe(false);

  // Landscape resize must preserve state and a usable canvas.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(150);
  const landscapeBox = await firstCanvas.boundingBox();
  expect(landscapeBox).not.toBeNull();
  expect(landscapeBox!.width).toBeGreaterThan(0);
  expect(landscapeBox!.height).toBeGreaterThan(0);
  expect((await state(page)).score).toBe(2);

  // Deterministic restart: target and score return to the same initial state.
  await page.evaluate(() => window.__BAKEOFF__.restart());
  await expect.poll(async () => (await state(page)).ready).toBe(true);
  const restarted = await state(page);
  expect(restarted.score).toBe(0);
  expect(restarted.restartCount).toBe(1);
  expect(restarted.targetNormX).toBeCloseTo(initial.targetNormX, 10);

  // Desktop resize is also a required profile.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(100);
  const desktopBox = await firstCanvas.boundingBox();
  expect(desktopBox).not.toBeNull();
  expect(desktopBox!.width).toBeGreaterThan(0);
  expect(desktopBox!.height).toBeGreaterThan(0);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
