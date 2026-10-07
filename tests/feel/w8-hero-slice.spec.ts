import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { MassRunnerGameTestState } from '../../src/games/mass-runner/MassRunnerGame';
import type { MassRunnerTestBridge } from '../../src/games/mass-runner/MassRunnerTestBridge';
import {
  applyMassOperation,
  MASS_RUNNER_LEVELS,
  type MassRunnerEvent
} from '../../src/games/mass-runner/MassRunnerLevels';

type PresentationMode = 'baseline' | 'polished';

const evidenceDir = path.resolve('evidence/w8');
fs.mkdirSync(evidenceDir, { recursive: true });

async function state(
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
  normalizedX: number
): Promise<{ x: number; y: number }> {
  const box = await page.locator('canvas').first().boundingBox();

  if (!box) {
    throw new Error('canvas has no bounding box');
  }

  return {
    x: box.x + box.width * normalizedX,
    y: box.y + box.height * 0.5
  };
}

async function steer(
  page: import('@playwright/test').Page,
  normalizedX: number
): Promise<void> {
  const point = await canvasPoint(page, normalizedX);
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(45);
}

function optimalTarget(
  event: MassRunnerEvent,
  mass: number
): number {
  if (event.kind === 'orb') {
    return event.x;
  }

  if (event.kind === 'hazard') {
    return event.x < 0.5 ? 0.86 : 0.14;
  }

  const left = applyMassOperation(mass, event.left);
  const right = applyMassOperation(mass, event.right);

  return left >= right ? 0.25 : 0.75;
}

async function saveScreenshot(
  page: import('@playwright/test').Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: path.join(evidenceDir, `${name}.png`)
  });
}

async function captureHeroSlice(
  page: import('@playwright/test').Page,
  mode: PresentationMode
): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `/?game=mass-runner&platform=web&presentation=${mode}`
  );

  await expect.poll(async () => (await state(page)).ready).toBe(true);
  expect((await state(page)).presentationMode).toBe(mode);

  await saveScreenshot(page, `${mode}-opening`);

  await steer(page, 0.5);
  await expect.poll(async () => (await state(page)).phase).toBe('running');

  const level = MASS_RUNNER_LEVELS[0];
  if (!level) {
    throw new Error('hero level missing');
  }

  for (const [index, event] of level.events.entries()) {
    const before = await state(page);
    const target = optimalTarget(event, before.mass);

    await steer(page, target);

    await expect
      .poll(
        async () => (await state(page)).eventsProcessed,
        { timeout: 4_000 }
      )
      .toBeGreaterThan(before.eventsProcessed);

    if (index === 2) {
      await saveScreenshot(
        page,
        `${mode}-good-gate-impact`
      );
    }
  }

  await expect
    .poll(
      async () => (await state(page)).phase,
      { timeout: 4_000 }
    )
    .toBe('level-clear');

  await page.waitForTimeout(220);
  await saveScreenshot(page, `${mode}-level-clear`);

  const finalState = await state(page);

  if (mode === 'polished') {
    expect(finalState.presentationCue).toBe('level-clear');
  } else {
    expect(finalState.presentationCue).toBeNull();
  }

  const video = page.video();
  await page.close();

  if (!video) {
    throw new Error('hero slice video was not recorded');
  }

  const videoPath = await video.path();
  fs.copyFileSync(
    videoPath,
    path.join(evidenceDir, `${mode}-hero-slice.webm`)
  );
}

test.describe.configure({ mode: 'serial' });

test('W8.1 baseline hero slice', async ({ page }) => {
  await captureHeroSlice(page, 'baseline');
});

test('W8.1 polished hero slice', async ({ page }) => {
  await captureHeroSlice(page, 'polished');
});
