import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const evidenceDir = path.resolve('evidence/w8');
fs.mkdirSync(evidenceDir, { recursive: true });

async function state(page) {
  return page.evaluate(
    () => globalThis.__GAME_FACTORY_MASS_RUNNER_TEST__.getState()
  );
}

async function canvasPoint(page, normalizedX) {
  const box = await page.locator('canvas').first().boundingBox();

  if (!box) {
    throw new Error('canvas has no bounding box');
  }

  return {
    x: box.x + box.width * normalizedX,
    y: box.y + box.height * 0.5
  };
}



async function saveScreenshot(page, name) {
  await page.screenshot({
    path: path.join(evidenceDir, `${name}.png`)
  });
}

async function captureHeroSlice(page, mode) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `/?game=mass-runner&platform=web&presentation=${mode}&autoplay=hero`
  );

  await expect.poll(async () => (await state(page)).ready).toBe(true);
  const openingState = await state(page);
  expect(openingState.presentationMode).toBe(mode);
  expect(openingState.heroAutoplay).toBe(true);

  await saveScreenshot(page, `${mode}-opening`);

  const startPoint = await canvasPoint(page, 0.5);
  await page.mouse.click(startPoint.x, startPoint.y);
  await expect.poll(async () => (await state(page)).phase).toBe('running');

  await page.waitForFunction(
    () =>
      globalThis.__GAME_FACTORY_MASS_RUNNER_TEST__.getState()
        .lastEventId === 'l1-gate-a',
    undefined,
    {
      polling: 'raf',
      timeout: 4_000
    }
  );

  await page.evaluate(() => {
    globalThis.__GAME_FACTORY_TEST__.pause();
  });
  await saveScreenshot(
    page,
    `${mode}-good-gate-impact`
  );
  await page.evaluate(() => {
    globalThis.__GAME_FACTORY_TEST__.resume();
  });

  await expect
    .poll(
      async () => (await state(page)).phase,
      { timeout: 4_000 }
    )
    .toBe('level-clear');

  await page.waitForTimeout(220);
  await saveScreenshot(page, `${mode}-level-clear`);

  const finalState = await state(page);

  expect(finalState.mass).toBe(17);
  expect(finalState.totalScore).toBe(185);
  expect(finalState.pickups).toBe(3);
  expect(finalState.hits).toBe(0);

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
