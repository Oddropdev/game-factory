import { expect, test } from '@playwright/test';
import type { MassRunnerGameTestState } from '../../src/games/mass-runner/MassRunnerGame';
import type { MassRunnerTestBridge } from '../../src/games/mass-runner/MassRunnerTestBridge';
import {
  applyMassOperation,
  MASS_RUNNER_LEVELS,
  type MassRunnerEvent
} from '../../src/games/mass-runner/MassRunnerLevels';

async function gameState(
  page: import('@playwright/test').Page
): Promise<MassRunnerGameTestState> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __GAME_FACTORY_MASS_RUNNER_TEST__: MassRunnerTestBridge;
        }
      ).__GAME_FACTORY_MASS_RUNNER_TEST__.getState()
  );
}

async function canvasPoint(
  page: import('@playwright/test').Page,
  normalizedX: number,
  normalizedY = 0.5
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

async function target(
  page: import('@playwright/test').Page,
  normalizedX: number,
  touch: boolean
): Promise<void> {
  const point = await canvasPoint(page, normalizedX);

  if (touch) {
    await page.touchscreen.tap(point.x, point.y);
  } else {
    await page.mouse.click(point.x, point.y);
  }
}

function eventTarget(
  event: MassRunnerEvent,
  mass: number
): number {
  if (event.kind === 'orb') {
    return event.x;
  }

  if (event.kind === 'hazard') {
    return event.x < 0.5 ? 0.85 : 0.15;
  }

  const left = applyMassOperation(mass, event.left);
  const right = applyMassOperation(mass, event.right);

  return left >= right ? 0.25 : 0.75;
}

async function playCurrentLevel(
  page: import('@playwright/test').Page,
  touch: boolean
): Promise<void> {
  const before = await gameState(page);
  const level = MASS_RUNNER_LEVELS[before.levelIndex];

  if (!level) {
    throw new Error('Missing level for browser route');
  }

  if (before.phase !== 'running') {
    await target(page, 0.5, touch);
    await expect
      .poll(async () => (await gameState(page)).phase)
      .toBe('running');
  }

  for (const event of level.events) {
    const state = await gameState(page);
    const processedBefore = state.eventsProcessed;

    await target(
      page,
      eventTarget(event, state.mass),
      touch
    );

    await expect
      .poll(
        async () => (await gameState(page)).eventsProcessed,
        { timeout: 4_000 }
      )
      .toBeGreaterThan(processedBefore);
  }

  await expect
    .poll(
      async () => (await gameState(page)).phase,
      { timeout: 4_000 }
    )
    .not.toBe('running');
}

test('W7 Mass Runner completes a five-level real-game session', async ({ page }, testInfo) => {
  test.setTimeout(60_000);

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('requestfailed', request =>
    failedRequests.push(request.url())
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?game=mass-runner&platform=web');

  await expect.poll(async () => (await gameState(page)).ready).toBe(true);

  const opening = await gameState(page);

  expect(opening.phase).toBe('ready');
  expect(opening.totalLevels).toBe(5);
  expect(opening.levelSignature.length).toBeGreaterThan(100);

  const openingPath = testInfo.outputPath('mass-runner-opening.png');
  await page.screenshot({ path: openingPath });
  await testInfo.attach('mass-runner-opening', {
    path: openingPath,
    contentType: 'image/png'
  });

  await playCurrentLevel(page, false);

  expect((await gameState(page)).phase).toBe('level-clear');

  const clearPath = testInfo.outputPath('mass-runner-level-clear.png');
  await page.screenshot({ path: clearPath });
  await testInfo.attach('mass-runner-level-clear', {
    path: clearPath,
    contentType: 'image/png'
  });

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);

  const landscape = await gameState(page);
  expect(
    Math.abs(landscape.playerRenderY)
  ).toBeLessThan(landscape.visibleHalfHeight);

  for (let levelIndex = 1; levelIndex < MASS_RUNNER_LEVELS.length; levelIndex += 1) {
    await playCurrentLevel(page, true);

    const state = await gameState(page);

    if (levelIndex < MASS_RUNNER_LEVELS.length - 1) {
      expect(state.phase).toBe('level-clear');
    }
  }

  const complete = await gameState(page);

  expect(complete.phase).toBe('complete');
  expect(complete.levelsCleared).toBe(5);
  expect(complete.totalScore).toBeGreaterThan(500);
  expect(complete.mass).toBeGreaterThanOrEqual(
    complete.targetMass
  );

  const completePath = testInfo.outputPath('mass-runner-complete.png');
  await page.screenshot({ path: completePath });
  await testInfo.attach('mass-runner-complete', {
    path: completePath,
    contentType: 'image/png'
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
