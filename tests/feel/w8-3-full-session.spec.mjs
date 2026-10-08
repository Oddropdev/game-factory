import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const evidenceDir = path.resolve('evidence/w8-3');
fs.mkdirSync(evidenceDir, { recursive: true });

async function state(page) {
  return page.evaluate(
    () => globalThis.__GAME_FACTORY_MASS_RUNNER_TEST__.getState()
  );
}

async function tapToAdvance(page) {
  const bounds = await page.locator('canvas').first().boundingBox();
  if (!bounds) throw new Error('Mass Runner canvas unavailable');
  await page.mouse.click(
    bounds.x + bounds.width * 0.5,
    bounds.y + bounds.height * 0.5
  );
}

test('W8.3 five-level polished session is complete and capturable', async ({ page }) => {
  test.setTimeout(75_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    '/?game=mass-runner&platform=web&presentation=polished&autoplay=hero&audio=off'
  );
  await expect.poll(async () => (await state(page)).ready).toBe(true);
  await page.screenshot({
    path: path.join(evidenceDir, 'opening-portrait.png')
  });

  for (let level = 0; level < 5; level += 1) {
    const before = await state(page);
    // The accepted model advances its index when the player taps on CLEAR,
    // not when the previous level reaches the finish.
    expect(before.levelIndex).toBe(level === 0 ? 0 : level - 1);
    expect(before.phase).toBe(level === 0 ? 'ready' : 'level-clear');
    await tapToAdvance(page);
    await expect.poll(async () => (await state(page)).phase).toBe('running');
    await expect.poll(async () => (await state(page)).levelIndex).toBe(level);

    if (level === 2) {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.screenshot({
        path: path.join(evidenceDir, 'level-3-landscape.png')
      });
      expect((await state(page)).visibleHalfHeight).toBeGreaterThan(0);
      await page.setViewportSize({ width: 390, height: 844 });
    }

    await expect.poll(
      async () => (await state(page)).phase,
      { timeout: 8_000 }
    ).toBe(level === 4 ? 'complete' : 'level-clear');

    const snapshot = await state(page);
    expect(snapshot.levelIndex).toBe(level);
    expect(snapshot.mass).toBeGreaterThanOrEqual(snapshot.targetMass);
    expect(snapshot.soundEnabled).toBe(false);
    await page.screenshot({
      path: path.join(
        evidenceDir,
        `level-${level + 1}-${snapshot.phase}.png`
      )
    });
  }

  const final = await state(page);
  expect(final.phase).toBe('complete');
  expect(final.levelsCleared).toBe(5);
  expect(final.totalScore).toBeGreaterThan(500);
  expect(final.presentationCue).toBe('complete');

  const video = page.video();
  await page.close();
  if (!video) throw new Error('Full-session video unavailable');
  fs.copyFileSync(
    await video.path(),
    path.join(evidenceDir, 'full-five-level-polished.webm')
  );
});

test('W8.3 failure then retry remains playable', async ({ page }) => {
  test.setTimeout(30_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    '/?game=mass-runner&platform=web&presentation=polished&audio=off'
  );
  await expect.poll(async () => (await state(page)).ready).toBe(true);
  await tapToAdvance(page);
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  await expect.poll(
    async () => (await state(page)).phase,
    { timeout: 8_000 }
  ).toBe('level-fail');

  const failed = await state(page);
  expect(failed.levelIndex).toBe(0);
  expect(failed.mass).toBeLessThan(failed.targetMass);

  await page.screenshot({
    path: path.join(evidenceDir, 'level-1-fail.png')
  });
  await tapToAdvance(page);
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  const retried = await state(page);
  expect(retried.levelIndex).toBe(0);
  expect(retried.mass).toBe(4);
  expect(retried.soundCuesDispatched).toBe(0);
});
