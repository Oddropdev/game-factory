import { expect, test } from '@playwright/test';
import type { PhysicsGameTestState } from '../../src/games/physics/PhysicsGame';
import type { PhysicsTestBridge } from '../../src/games/physics/PhysicsTestBridge';
import type {
  FoundationTestBridge,
  FoundationTestState
} from '../../src/testing/TestBridge';

async function physicsState(
  page: import('@playwright/test').Page
): Promise<PhysicsGameTestState> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __GAME_FACTORY_PHYSICS_TEST__: PhysicsTestBridge;
        }
      ).__GAME_FACTORY_PHYSICS_TEST__.getState()
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

test('W4 physics-puzzle works in the production browser build', async ({ page }, testInfo) => {
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
  await page.goto('/?game=physics');

  await expect.poll(async () => (await physicsState(page)).ready).toBe(true);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  const initial = await physicsState(page);
  expect(initial.status).toBe('ready');
  expect(initial.shots).toBe(0);
  expect(initial.collisions).toBe(0);
  expect(initial.courseSignature.length).toBeGreaterThan(20);

  const lowShot = await canvasPoint(page, 0.82, 0.68);
  await page.mouse.click(lowShot.x, lowShot.y);

  await expect.poll(async () => (await physicsState(page)).shots).toBe(1);

  await foundationCall(page, 'pause');
  const paused = await physicsState(page);
  await page.waitForTimeout(250);

  const stillPaused = await physicsState(page);
  expect(stillPaused.ballX).toBe(paused.ballX);
  expect(stillPaused.ballY).toBe(paused.ballY);
  expect(stillPaused.ticks).toBe(paused.ticks);

  await foundationCall(page, 'resume');

  await expect
    .poll(async () => (await physicsState(page)).collisions, { timeout: 3_000 })
    .toBeGreaterThan(0);

  const portraitPath = testInfo.outputPath('physics-portrait-obstacle-hit.png');
  await page.screenshot({ path: portraitPath });
  await testInfo.attach('physics-portrait-obstacle-hit', {
    path: portraitPath,
    contentType: 'image/png'
  });

  await foundationCall(page, 'pause');
  await foundationCall(page, 'restart');
  await expect.poll(async () => (await physicsState(page)).restartCount).toBe(1);

  const restarted = await physicsState(page);
  expect(restarted.status).toBe('ready');
  expect(restarted.ballX).toBe(initial.ballX);
  expect(restarted.ballY).toBe(initial.ballY);
  expect(restarted.courseSignature).toBe(initial.courseSignature);

  await foundationCall(page, 'resume');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(async () => (await foundationState(page)).viewport.width)
    .toBeGreaterThan(700);

  const landscapeReady = await physicsState(page);
  expect(landscapeReady.visibleWorldHeight).toBeGreaterThan(4);
  expect(landscapeReady.visibleWorldHeight).toBeLessThan(5.5);

  const solution = await canvasPoint(
    page,
    landscapeReady.solutionAim.x,
    landscapeReady.solutionAim.y
  );
  await page.touchscreen.tap(solution.x, solution.y);

  await expect.poll(async () => (await physicsState(page)).shots).toBe(1);
  await expect
    .poll(async () => (await physicsState(page)).ticks)
    .toBeGreaterThan(8);
  expect((await physicsState(page)).status).toBe('flying');

  const landscapePath = testInfo.outputPath('physics-landscape-flight.png');
  await page.screenshot({ path: landscapePath });
  await testInfo.attach('physics-landscape-flight', {
    path: landscapePath,
    contentType: 'image/png'
  });

  await expect
    .poll(async () => (await physicsState(page)).status, { timeout: 3_000 })
    .toBe('solved');

  const solved = await physicsState(page);
  expect(solved.collisions).toBe(0);
  expect(solved.pointerEvents).toBe(1);

  const solvedPath = testInfo.outputPath('physics-solved.png');
  await page.screenshot({ path: solvedPath });
  await testInfo.attach('physics-solved', {
    path: solvedPath,
    contentType: 'image/png'
  });

  await foundationCall(page, 'restart');
  await expect.poll(async () => (await physicsState(page)).restartCount).toBe(2);

  const finalReset = await physicsState(page);
  expect(finalReset.status).toBe('ready');
  expect(finalReset.ballX).toBe(initial.ballX);
  expect(finalReset.ballY).toBe(initial.ballY);
  expect(finalReset.shots).toBe(0);
  expect(finalReset.collisions).toBe(0);
  expect(finalReset.courseSignature).toBe(initial.courseSignature);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
