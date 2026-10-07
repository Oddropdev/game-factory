import { expect, test } from '@playwright/test';
import type { CollectorGameTestState } from '../../src/games/collector/CollectorGame';
import type { CollectorTestBridge } from '../../src/games/collector/CollectorTestBridge';
import type { FoundationTestBridge } from '../../src/testing/TestBridge';

async function collectorState(
  page: import('@playwright/test').Page
): Promise<CollectorGameTestState> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __GAME_FACTORY_COLLECTOR_TEST__: CollectorTestBridge;
        }
      ).__GAME_FACTORY_COLLECTOR_TEST__.getState()
  );
}

async function foundationCall(
  page: import('@playwright/test').Page,
  method: 'restart' | 'pause' | 'resume'
): Promise<void> {
  await page.evaluate(
    selectedMethod => {
      const bridge = (
        window as unknown as {
          __GAME_FACTORY_TEST__: FoundationTestBridge;
        }
      ).__GAME_FACTORY_TEST__;
      bridge[selectedMethod]();
    },
    method
  );
}

async function canvasPoint(
  page: import('@playwright/test').Page,
  normalizedX: number,
  normalizedY: number
): Promise<{ x: number; y: number }> {
  const box = await page.locator('canvas').first().boundingBox();

  if (!box) {
    throw new Error('Canvas has no bounding box');
  }

  return {
    x: box.x + box.width * normalizedX,
    y: box.y + box.height * normalizedY
  };
}

async function mouseTarget(
  page: import('@playwright/test').Page,
  normalizedX: number,
  normalizedY: number
): Promise<void> {
  const point = await canvasPoint(page, normalizedX, normalizedY);
  await page.mouse.click(point.x, point.y);
}

async function touchTarget(
  page: import('@playwright/test').Page,
  normalizedX: number,
  normalizedY: number
): Promise<void> {
  const point = await canvasPoint(page, normalizedX, normalizedY);
  await page.touchscreen.tap(point.x, point.y);
}

test('W3 collector-builder works in the production browser build', async ({ page }, testInfo) => {
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
  await page.goto('/?game=collector');

  await expect.poll(async () => (await collectorState(page)).ready).toBe(true);

  const initial = await collectorState(page);
  expect(initial.status).toBe('collecting');
  expect(initial.carrying).toBe(0);
  expect(initial.deposited).toBe(0);
  expect(initial.resourcesRemaining).toBe(6);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  await foundationCall(page, 'pause');
  const paused = await collectorState(page);
  await page.waitForTimeout(250);
  expect((await collectorState(page)).playerNormX).toBe(paused.playerNormX);
  expect((await collectorState(page)).playerNormY).toBe(paused.playerNormY);
  await foundationCall(page, 'resume');

  const firstBatch = initial.resources.slice(0, 3);

  for (const resource of firstBatch) {
    await mouseTarget(page, resource.x, resource.y);
    await expect
      .poll(async () => {
        const state = await collectorState(page);
        return state.resources.find(item => item.id === resource.id)?.active;
      })
      .toBe(false);
  }

  await expect.poll(async () => (await collectorState(page)).carrying).toBe(3);

  const portraitPath = testInfo.outputPath('collector-portrait.png');
  await page.screenshot({ path: portraitPath });
  await testInfo.attach('collector-portrait', {
    path: portraitPath,
    contentType: 'image/png'
  });

  await mouseTarget(page, initial.buildZone.x, initial.buildZone.y);
  await expect.poll(async () => (await collectorState(page)).deposited).toBe(3);
  await expect.poll(async () => (await collectorState(page)).carrying).toBe(0);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);

  const landscapeState = await collectorState(page);
  expect(landscapeState.visibleWorldHeight).toBeGreaterThan(4);
  expect(landscapeState.visibleWorldHeight).toBeLessThan(5.5);

  const secondBatch = landscapeState.resources.filter(resource => resource.active);

  for (const resource of secondBatch) {
    await touchTarget(page, resource.x, resource.y);
    await expect
      .poll(async () => {
        const state = await collectorState(page);
        return state.resources.find(item => item.id === resource.id)?.active;
      })
      .toBe(false);
  }

  await expect.poll(async () => (await collectorState(page)).carrying).toBe(3);

  const landscapePath = testInfo.outputPath('collector-landscape.png');
  await page.screenshot({ path: landscapePath });
  await testInfo.attach('collector-landscape', {
    path: landscapePath,
    contentType: 'image/png'
  });

  await touchTarget(page, initial.buildZone.x, initial.buildZone.y);

  await expect
    .poll(async () => (await collectorState(page)).status, { timeout: 5_000 })
    .toBe('complete');

  const completed = await collectorState(page);
  expect(completed.collected).toBe(6);
  expect(completed.deposited).toBe(6);
  expect(completed.buildStage).toBe(3);
  expect(completed.depositTrips).toBe(2);
  expect(completed.resourcesRemaining).toBe(0);

  const completePath = testInfo.outputPath('collector-complete.png');
  await page.screenshot({ path: completePath });
  await testInfo.attach('collector-complete', {
    path: completePath,
    contentType: 'image/png'
  });

  await foundationCall(page, 'pause');
  await foundationCall(page, 'restart');
  await expect.poll(async () => (await collectorState(page)).restartCount).toBe(1);

  const restarted = await collectorState(page);
  expect(restarted.status).toBe('collecting');
  expect(restarted.playerNormX).toBe(0.5);
  expect(restarted.playerNormY).toBe(0.72);
  expect(restarted.carrying).toBe(0);
  expect(restarted.deposited).toBe(0);
  expect(restarted.resourcesRemaining).toBe(6);
  expect(restarted.courseSignature).toBe(initial.courseSignature);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
