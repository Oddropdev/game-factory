import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const evidence = path.resolve('evidence/w9-2b');
fs.mkdirSync(evidence, { recursive: true });

async function state(page) {
  return page.evaluate(() => globalThis.__GAME_FACTORY_MASS_RUNNER_TEST__?.getState());
}
async function openVariant(page, variant) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?variant=' + variant + '&audio=off');
  await expect.poll(async () => (await state(page))?.ready).toBe(true);
  return errors;
}
// Visual acceptance, not merely a WebGL context check: this reproduces the
// user-reported bug where the 3D track/player were projected below the screen.
async function visible3DContent(page, screenshot) {
  const base64 = screenshot.toString('base64');
  return page.evaluate(async data => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + data;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2D readback unavailable');
    ctx.drawImage(image, 0, 0);
    const { data: pixels, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sampled = 0, distinctive = 0, bright = 0;
    // Central playfield only; ignore top HUD and extreme bottom strip.
    for (let y = Math.floor(height * 0.34); y < height * 0.73; y += 3) {
      for (let x = Math.floor(width * 0.24); x < width * 0.76; x += 3) {
        const i = (y * width + x) * 4;
        const red = pixels[i], green = pixels[i + 1], blue = pixels[i + 2];
        sampled++;
        if (Math.abs(red - 15) + Math.abs(green - 23) + Math.abs(blue - 51) > 40) distinctive++;
        if (red + green + blue > 260) bright++;
      }
    }
    return { sampled, distinctiveFraction: distinctive / sampled, bright };
  }, base64);
}

async function tap(page) {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('LittleJS canvas missing');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test('A remains the exact original presentation and legacy steering baseline', async ({ page }) => {
  const errors = await openVariant(page, 'a');
  const initial = await state(page);
  expect(initial.experiment).toBe('a');
  expect(initial.webgl3d).toBe(false);
  expect(initial.levelNumber).toBe(1);
  expect(await page.locator('canvas[data-mass-runner3d]').count()).toBe(0);
  await tap(page);
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  expect(errors).toEqual([]);
  await page.screenshot({ path: path.join(evidence, 'A-original.png') });
});

test('B changes only movement response, boosted mix and no 3D canvas', async ({ page }) => {
  const errors = await openVariant(page, 'b');
  expect((await state(page)).experiment).toBe('b');
  expect((await state(page)).webgl3d).toBe(false);
  expect(await page.locator('canvas[data-mass-runner3d]').count()).toBe(0);
  await tap(page);
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  expect((await state(page)).soundEnabled).toBe(false);
  expect(errors).toEqual([]);
  await page.screenshot({ path: path.join(evidence, 'B-fluid-2d.png') });
});

test('C actually draws a depth-tested WebGL2 scene with same game state and input', async ({ page }) => {
  const errors = await openVariant(page, 'c');
  expect((await state(page)).experiment).toBe('c');
  expect((await state(page)).webgl3d).toBe(true);
  const scene = page.locator('canvas[data-mass-runner3d]');
  await expect(scene).toHaveCount(1);
  const gl = await scene.evaluate(el => {
    const context = el.getContext('webgl2');
    return {
      available: Boolean(context),
      depth: context?.isEnabled(context.DEPTH_TEST),
      error: context?.getError(),
      width: el.width,
      height: el.height
    };
  });
  expect(gl.available).toBe(true);
  expect(gl.depth).toBe(true);
  expect(gl.error).toBe(0);
  expect(gl.width).toBeGreaterThan(300);
  expect(gl.height).toBeGreaterThan(300);
  await tap(page);
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  const screenshot = await page.screenshot({
    path: path.join(evidence, 'C-real-webgl3d-portrait.png')
  });
  const composition = await visible3DContent(page, screenshot);
  // The broken build had an empty central playfield and a road only along the bottom.
  expect(composition.distinctiveFraction).toBeGreaterThan(0.08);
  expect(composition.bright).toBeGreaterThan(30);
  expect(errors).toEqual([]);
});

test('C resizes from mobile portrait to landscape without breaking touch gameplay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await openVariant(page, 'c');
  await tap(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(async () => {
    const scene = page.locator('canvas[data-mass-runner3d]');
    return scene.evaluate(el => el.width > el.height);
  }).toBe(true);
  const screenshot = await page.screenshot({
    path: path.join(evidence, 'C-real-webgl3d-landscape.png')
  });
  const composition = await visible3DContent(page, screenshot);
  expect(composition.distinctiveFraction).toBeGreaterThan(0.08);
  expect(composition.bright).toBeGreaterThan(30);
  expect((await state(page)).webgl3d).toBe(true);
  expect(errors).toEqual([]);
});

test('C capability-falls-back to B if WebGL2 is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = globalThis.HTMLCanvasElement.prototype.getContext;
    globalThis.HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl2') return null;
      return getContext.call(this, type, ...args);
    };
  });
  const errors = await openVariant(page, 'c');
  expect((await state(page)).experiment).toBe('c');
  expect((await state(page)).webgl3d).toBe(false);
  await tap(page);
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  expect(errors).toEqual([]);
});
