import { expect, test } from '@playwright/test';

async function gameState(page) {
  return page.evaluate(
    () => globalThis.__GAME_FACTORY_MASS_RUNNER_TEST__?.getState()
  );
}

test('W9 clean public URL launches the real Mass Runner, not a proof game', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page).toHaveTitle('Mass Runner — W9 Playtest');
  await expect.poll(async () => (await gameState(page))?.ready).toBe(true);
  const state = await gameState(page);
  expect(state.phase).toBe('ready');
  expect(state.levelNumber).toBe(1);
  expect(state.totalLevels).toBe(5);
  expect(state.presentationMode).toBe('polished');
  expect(state.heroAutoplay).toBe(false);
  expect(state.soundEnabled).toBe(true);
  expect(new URL(page.url()).searchParams.get('game')).toBe('mass-runner');
  expect(errors).toEqual([]);
});

test('W9 default game is input-driven on mobile, never autoplay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect.poll(async () => (await gameState(page))?.ready).toBe(true);
  const box = await page.locator('canvas').first().boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Canvas not visible');
  await page.touchscreen.tap(
    box.x + box.width * 0.52,
    box.y + box.height * 0.58
  );
  await expect.poll(async () => (await gameState(page)).phase).toBe('running');
  const current = await gameState(page);
  expect(current.pointerEvents).toBeGreaterThan(0);
  expect(current.heroAutoplay).toBe(false);
});

test('W9 ignores attempts to select unrelated proof games from the exported URL', async ({ page }) => {
  await page.goto('/?game=runner&presentation=polished');
  await expect.poll(async () => (await gameState(page))?.ready).toBe(true);
  expect((await gameState(page)).totalLevels).toBe(5);
  expect(new URL(page.url()).searchParams.get('game')).toBe('mass-runner');
});

test('W9 feedback is usable on mobile and creates a local copy-only report', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const outgoing = [];
  page.on('request', req => {
    if (!req.url().startsWith('http://127.0.0.1:4175/')) {
      outgoing.push(req.url());
    }
  });
  await page.goto('/feedback.html');
  await expect(page.getByRole('heading', { name: 'How did Mass Runner feel?' })).toBeVisible();
  await page.locator('#device').selectOption({ label: 'Android phone' });
  await page.locator('#understood').selectOption({ label: 'Yes, immediately' });
  await page.locator('#level').selectOption({ label: 'Finished all 5 levels' });
  await page.locator('#steering').selectOption('4');
  await page.locator('#fun').selectOption('5');
  await page.locator('#sound').selectOption({ label: 'Good / satisfying' });
  await page.locator('#issue').fill('Gate labels are a bit small');
  await page.getByRole('button', { name: 'Generate feedback to copy' }).click();
  const report = await page.locator('#result').inputValue();
  expect(report).toContain('device: Android phone');
  expect(report).toContain('fun: 5');
  expect(report).toContain('Gate labels are a bit small');
  await expect(page.locator('#status')).not.toBeEmpty();
  expect(outgoing).toEqual([]);
});

test('W9 asset references stay relative for subpath hosting', async ({ page }) => {
  await page.goto('/');
  const paths = await page.locator('script[src],link[href]').evaluateAll(els =>
    els.map(x => x.getAttribute('src') ?? x.getAttribute('href'))
  );
  expect(paths.length).toBeGreaterThan(0);
  for (const p of paths) {
    expect(p.startsWith('/assets/')).toBe(false);
    expect(p.startsWith('http')).toBe(false);
  }
});
