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

async function steer(page, normalizedX) {
  const point = await canvasPoint(page, normalizedX);
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(45);
}

function applyOperation(mass, operation) {
  const next =
    operation.op === 'multiply'
      ? Math.round(mass * operation.value)
      : mass + operation.value;

  return Math.min(99, Math.max(1, next));
}

const heroEvents = [
  { id: 'l1-orb-a', kind: 'orb', x: 0.25, amount: 2 },
  { id: 'l1-hazard', kind: 'hazard', x: 0.5, width: 0.2, penalty: 3 },
  {
    id: 'l1-gate-a',
    kind: 'gate',
    left: { op: 'add', value: 4 },
    right: { op: 'add', value: -3 }
  },
  { id: 'l1-orb-b', kind: 'orb', x: 0.75, amount: 2 },
  {
    id: 'l1-gate-b',
    kind: 'gate',
    left: { op: 'add', value: -2 },
    right: { op: 'add', value: 3 }
  },
  { id: 'l1-orb-c', kind: 'orb', x: 0.5, amount: 2 }
];

function optimalTarget(event, mass) {
  if (event.kind === 'orb') {
    return event.x;
  }

  if (event.kind === 'hazard') {
    return event.x < 0.5 ? 0.86 : 0.14;
  }

  const left = applyOperation(mass, event.left);
  const right = applyOperation(mass, event.right);

  return left >= right ? 0.25 : 0.75;
}

async function saveScreenshot(page, name) {
  await page.screenshot({
    path: path.join(evidenceDir, `${name}.png`)
  });
}

async function captureHeroSlice(page, mode) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `/?game=mass-runner&platform=web&presentation=${mode}`
  );

  await expect.poll(async () => (await state(page)).ready).toBe(true);
  expect((await state(page)).presentationMode).toBe(mode);

  await saveScreenshot(page, `${mode}-opening`);

  await steer(page, 0.5);
  await expect.poll(async () => (await state(page)).phase).toBe('running');

  for (const [index, event] of heroEvents.entries()) {
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
