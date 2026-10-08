import { expect, test } from '@playwright/test';

async function state(page) {
  return page.evaluate(
    () => globalThis.__GAME_FACTORY_MASS_RUNNER_TEST__.getState()
  );
}

async function start(page) {
  await expect.poll(async () => (await state(page)).ready).toBe(true);
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('Canvas unavailable');
  await page.mouse.click(
    box.x + box.width * 0.5,
    box.y + box.height * 0.5
  );
  await expect.poll(async () => (await state(page)).phase).toBe('running');
}

test('W8.2 evidence mode remains explicitly muted', async ({ page }) => {
  await page.goto(
    '/?game=mass-runner&platform=web&presentation=polished&autoplay=hero&audio=off'
  );
  await start(page);
  await expect
    .poll(async () => (await state(page)).phase, { timeout: 5000 })
    .toBe('level-clear');
  const result = await state(page);
  expect(result.soundEnabled).toBe(false);
  expect(result.soundCuesDispatched).toBe(0);
  expect(result.presentationCue).toBe('level-clear');
  expect(result.mass).toBe(17);
});

test('W8.2 web sound dispatch is user-gesture gated', async ({ page }) => {
  await page.goto(
    '/?game=mass-runner&platform=web&presentation=polished&autoplay=hero'
  );
  expect((await state(page)).soundCuesDispatched).toBe(0);
  expect((await state(page)).soundUnlocked).toBe(false);
  await start(page);
  await expect
    .poll(async () => (await state(page)).soundCuesDispatched, {
      timeout: 5000
    })
    .toBeGreaterThan(0);
  expect((await state(page)).soundUnlocked).toBe(true);
});

test('W8.2 YouTube mute changes immediately stop dispatch and do not replay', async ({ page }) => {
  await page.addInitScript(() => {
    let enabled = true;
    const handlers = new Set();
    globalThis.__toggleSdkAudio = next => {
      enabled = next;
      for (const handler of handlers) handler(next);
    };
    globalThis.ytgame = {
      IN_PLAYABLES_ENV: true,
      game: {
        firstFrameReady() {},
        gameReady() {},
        async loadData() { return ''; },
        async saveData() {}
      },
      system: {
        isAudioEnabled() { return enabled; },
        onAudioEnabledChange(handler) {
          handlers.add(handler);
          return () => handlers.delete(handler);
        },
        onPause() { return () => {}; },
        onResume() { return () => {}; }
      }
    };
  });

  await page.goto(
    '/?game=mass-runner&platform=youtube&presentation=polished&autoplay=hero'
  );
  await start(page);
  await expect
    .poll(async () => (await state(page)).soundCuesDispatched)
    .toBeGreaterThan(0);
  await page.evaluate(() => globalThis.__toggleSdkAudio(false));
  const muted = await state(page);
  expect(muted.soundEnabled).toBe(false);
  await expect.poll(async () => (await state(page)).phase).toBe('level-clear');
  expect((await state(page)).soundCuesDispatched).toBe(
    muted.soundCuesDispatched
  );
  await page.evaluate(() => globalThis.__toggleSdkAudio(true));
  expect((await state(page)).soundEnabled).toBe(true);
  expect((await state(page)).soundCuesDispatched).toBe(
    muted.soundCuesDispatched
  );
});

test('W8.2 unavailable browser audio is non-fatal', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: undefined
    });
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(
    '/?game=mass-runner&platform=web&presentation=polished&autoplay=hero'
  );
  await start(page);
  await expect
    .poll(async () => (await state(page)).phase, { timeout: 5000 })
    .toBe('level-clear');
  expect(errors).toEqual([]);
});
