import { expect, test } from '@playwright/test';
import type { FoundationTestBridge, FoundationTestState } from '../../src/testing/TestBridge';

async function state(page: import('@playwright/test').Page): Promise<FoundationTestState> {
  return page.evaluate(
    () =>
      (window as unknown as { __GAME_FACTORY_TEST__: FoundationTestBridge })
        .__GAME_FACTORY_TEST__.getState()
  );
}

async function bridgeCall(
  page: import('@playwright/test').Page,
  method: 'restart' | 'pause' | 'resume'
): Promise<void> {
  await page.evaluate(
    selectedMethod => {
      const bridge = (window as unknown as { __GAME_FACTORY_TEST__: FoundationTestBridge })
        .__GAME_FACTORY_TEST__;
      bridge[selectedMethod]();
    },
    method
  );
}

test('W1 production foundation contract', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('requestfailed', request => failedRequests.push(request.url()));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect.poll(async () => (await state(page)).ready).toBe(true);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  const portraitBox = await canvas.boundingBox();
  expect(portraitBox).not.toBeNull();
  expect(portraitBox!.width).toBeGreaterThan(0);
  expect(portraitBox!.height).toBeGreaterThan(0);

  const initial = await state(page);
  expect(initial.seed).toBe('5eed1234');
  expect(initial.pointerEvents).toBe(0);
  expect(initial.pointerNormX).toBeCloseTo(0.5, 8);
  expect(initial.probeNormX).toBeGreaterThan(0.19);
  expect(initial.probeNormX).toBeLessThan(0.81);

  await page.mouse.move(portraitBox!.x + portraitBox!.width * 0.25, portraitBox!.y + portraitBox!.height * 0.5);
  await page.mouse.down();
  await page.waitForTimeout(50);
  await page.mouse.up();

  await expect.poll(async () => (await state(page)).pointerEvents).toBe(1);
  expect((await state(page)).pointerNormX).toBeCloseTo(0.25, 1);

  await page.touchscreen.tap(
    portraitBox!.x + portraitBox!.width * 0.75,
    portraitBox!.y + portraitBox!.height * 0.5
  );

  await expect.poll(async () => (await state(page)).pointerEvents).toBe(2);
  expect((await state(page)).pointerNormX).toBeCloseTo(0.75, 1);

  await bridgeCall(page, 'pause');
  await expect.poll(async () => (await state(page)).paused).toBe(true);

  await bridgeCall(page, 'resume');
  await expect.poll(async () => (await state(page)).paused).toBe(false);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(async () => (await state(page)).viewport.width).toBeGreaterThan(700);

  const landscapeBox = await canvas.boundingBox();
  expect(landscapeBox).not.toBeNull();
  expect(landscapeBox!.width).toBeGreaterThan(0);
  expect(landscapeBox!.height).toBeGreaterThan(0);

  const beforeRestart = await state(page);
  expect(beforeRestart.pointerNormX).toBeCloseTo(0.75, 1);
  expect(beforeRestart.probeNormX).toBeCloseTo(initial.probeNormX, 10);

  await bridgeCall(page, 'restart');
  await expect.poll(async () => (await state(page)).restartCount).toBe(1);

  const restarted = await state(page);
  expect(restarted.pointerEvents).toBe(0);
  expect(restarted.pointerNormX).toBeCloseTo(0.5, 8);
  expect(restarted.probeNormX).toBeCloseTo(initial.probeNormX, 10);

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect.poll(async () => (await state(page)).viewport.width).toBeGreaterThan(1000);

  const desktopBox = await canvas.boundingBox();
  expect(desktopBox).not.toBeNull();
  expect(desktopBox!.width).toBeGreaterThan(0);
  expect(desktopBox!.height).toBeGreaterThan(0);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
