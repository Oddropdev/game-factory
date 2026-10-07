import { expect, test } from '@playwright/test';
import type {
  FoundationTestBridge,
  FoundationTestState
} from '../../src/testing/TestBridge';
import type { RunnerTestBridge } from '../../src/games/runner/RunnerTestBridge';
import type { RunnerGameTestState } from '../../src/games/runner/RunnerGame';

async function runnerState(
  page: import('@playwright/test').Page
): Promise<RunnerGameTestState> {
  return page.evaluate(
    () =>
      (window as unknown as { __GAME_FACTORY_RUNNER_TEST__: RunnerTestBridge })
        .__GAME_FACTORY_RUNNER_TEST__.getState()
  );
}

async function foundationState(
  page: import('@playwright/test').Page
): Promise<FoundationTestState> {
  return page.evaluate(
    () =>
      (window as unknown as { __GAME_FACTORY_TEST__: FoundationTestBridge })
        .__GAME_FACTORY_TEST__.getState()
  );
}

async function foundationCall(
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

test('W2 runner works in the production browser build', async ({ page }, testInfo) => {
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

  await expect.poll(async () => (await runnerState(page)).ready).toBe(true);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  const portraitBox = await canvas.boundingBox();
  expect(portraitBox).not.toBeNull();

  const initial = await runnerState(page);
  expect(initial.status).toBe('running');
  expect(initial.distance).toBeLessThan(15);
  expect(initial.courseSignature.length).toBeGreaterThan(20);

  await expect
    .poll(async () => (await runnerState(page)).distance)
    .toBeGreaterThan(initial.distance + 2);

  await page.mouse.move(
    portraitBox!.x + portraitBox!.width * 0.25,
    portraitBox!.y + portraitBox!.height * 0.5
  );
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();

  await expect.poll(async () => (await runnerState(page)).targetNormX).toBeCloseTo(0.25, 1);
  await expect.poll(async () => (await runnerState(page)).playerNormX).toBeLessThan(0.45);

  const portraitPath = testInfo.outputPath('runner-portrait.png');
  await page.screenshot({ path: portraitPath });
  await testInfo.attach('runner-portrait', { path: portraitPath, contentType: 'image/png' });

  await foundationCall(page, 'pause');
  const pausedAt = (await runnerState(page)).distance;
  await page.waitForTimeout(250);
  expect((await runnerState(page)).distance).toBe(pausedAt);

  await foundationCall(page, 'resume');

  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(async () => (await foundationState(page)).viewport.width)
    .toBeGreaterThan(700);

  const landscapeBox = await canvas.boundingBox();
  expect(landscapeBox).not.toBeNull();

  const landscapeState = await runnerState(page);
  expect(Math.abs(landscapeState.playerRenderY)).toBeLessThan(
    landscapeState.visibleHalfHeight
  );

  await page.touchscreen.tap(
    landscapeBox!.x + landscapeBox!.width * 0.75,
    landscapeBox!.y + landscapeBox!.height * 0.5
  );
  await expect.poll(async () => (await runnerState(page)).targetNormX).toBeCloseTo(0.75, 1);

  const landscapePath = testInfo.outputPath('runner-landscape.png');
  await page.screenshot({ path: landscapePath });
  await testInfo.attach('runner-landscape', { path: landscapePath, contentType: 'image/png' });

  await expect
    .poll(async () => (await runnerState(page)).status, { timeout: 7_000 })
    .toBe('finished');

  const finished = await runnerState(page);
  expect(finished.distance).toBe(100);
  expect(finished.progress).toBe(1);
  expect(finished.gatesPassed).toBe(2);
  expect(finished.eventsProcessed).toBe(7);

  const finishPath = testInfo.outputPath('runner-finish.png');
  await page.screenshot({ path: finishPath });
  await testInfo.attach('runner-finish', { path: finishPath, contentType: 'image/png' });

  await foundationCall(page, 'pause');
  await foundationCall(page, 'restart');
  await expect.poll(async () => (await runnerState(page)).restartCount).toBe(1);

  const restarted = await runnerState(page);
  expect(restarted.distance).toBe(0);
  expect(restarted.progress).toBe(0);
  expect(restarted.playerNormX).toBe(0.5);
  expect(restarted.targetNormX).toBe(0.5);
  expect(restarted.courseSignature).toBe(initial.courseSignature);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
