import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const evidenceDir = path.resolve('evidence/w9-3-4');
fs.mkdirSync(evidenceDir, { recursive: true });
const sizes = [
  { name: 'portrait-390x844', width: 390, height: 844 },
  { name: 'small-android-360x800', width: 360, height: 800 },
  { name: 'landscape-844x390', width: 844, height: 390 }
];
const snapshot = page => page.evaluate(() => globalThis.__W9_PLAYCANVAS_TEST__?.snapshot());
const capture = async (page, name) => {
  await page.screenshot({ path: path.join(evidenceDir, name + '.png') });
};

for (const size of sizes) {
  test('W9.3-4 final browser presentation + result/replay ' + size.name, async ({page}) => {
    test.setTimeout(55_000);
    await page.setViewportSize({ width: size.width, height: size.height });
    const pageErrors = [], consoleErrors = [], offOrigin = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('request', req => {
      const url = req.url();
      if (!url.startsWith('http://127.0.0.1:4177/') && !url.startsWith('data:')) {
        offOrigin.push(url);
      }
    });
    await page.goto('/3d/');
    await expect.poll(async () => (await snapshot(page))?.loadedCC0Models).toBe(5);
    await expect.poll(async () => (await snapshot(page))?.frames).toBeGreaterThan(10);
    const initial = await snapshot(page);
    expect(initial.assetFailures).toBe(0);
    expect(initial.fullViewport).toBe(true);
    expect(initial.environmentKind).toBe('soft-garden-v1');
    expect(initial.avatarBoxParts).toBe(0);
    expect(initial.softCourseBoxPieces).toBe(0);
    expect(initial.juicePieces).toBe(12);
    expect(initial.levelId).toBe('bulk-up');
    expect(initial.mass).toBe(4);
    const layout = async () => page.evaluate(() => {
      const doc = globalThis.document;
      const win = globalThis.window;
      const button = doc.querySelector('#start').getBoundingClientRect();
      const canvas = doc.querySelector('#application-canvas').getBoundingClientRect();
      const result = doc.querySelector('#dialog').getBoundingClientRect();
      return {
        scrollWidth: doc.documentElement.scrollWidth,
        innerWidth: win.innerWidth,
        innerHeight: win.innerHeight,
        button: { left: button.left, right: button.right, top: button.top, bottom: button.bottom, height: button.height },
        canvas: { width: canvas.width, height: canvas.height },
        dialog: { left: result.left, right: result.right, top: result.top, bottom: result.bottom },
        feedbackVisible: doc.querySelector('#feedback').classList.contains('show')
      };
    });
    const assertBounds = data => {
      expect(data.scrollWidth).toBeLessThanOrEqual(size.width + 1);
      expect(data.canvas.width).toBeGreaterThanOrEqual(size.width - 2);
      expect(data.canvas.height).toBeGreaterThanOrEqual(size.height - 2);
      expect(data.button.height).toBeGreaterThanOrEqual(48);
      expect(data.button.left).toBeGreaterThanOrEqual(0);
      expect(data.button.right).toBeLessThanOrEqual(size.width);
      expect(data.button.top).toBeGreaterThanOrEqual(0);
      expect(data.button.bottom).toBeLessThanOrEqual(size.height + 1);
      expect(data.dialog.left).toBeGreaterThanOrEqual(0);
      expect(data.dialog.right).toBeLessThanOrEqual(size.width + 1);
    };
    assertBounds(await layout());
    await capture(page, size.name + '-ready');
    await page.locator('#start').click();
    await expect.poll(async () => (await snapshot(page))?.distance).toBeGreaterThan(13);
    const gateLabels = page.locator('.world-gate-label:visible');
    await expect(gateLabels).toHaveCount(2);
    const legibility = await gateLabels.evaluateAll(els => els.map(el => {
      const b = el.getBoundingClientRect();
      return {
        text: el.textContent,
        quality: el.dataset.gateQuality,
        font: parseFloat(globalThis.getComputedStyle(el).fontSize),
        pointer: globalThis.getComputedStyle(el).pointerEvents,
        left: b.left, right: b.right, top: b.top, bottom: b.bottom
      };
    }));
    expect(legibility.map(item => item.text)).toEqual(['+4', '-3']);
    expect(legibility.map(item => item.quality)).toEqual(['better', 'worse']);
    for (const item of legibility) {
      expect(item.font).toBeGreaterThanOrEqual(16);
      expect(item.pointer).toBe('none');
      expect(item.left).toBeGreaterThanOrEqual(0);
      expect(item.right).toBeLessThanOrEqual(size.width);
      expect(item.top).toBeGreaterThan(84);
      expect(item.bottom).toBeLessThanOrEqual(size.height);
    }
    await capture(page, size.name + '-gate-decision');
    await expect.poll(async () => (await snapshot(page))?.phase, { timeout:20000 }).not.toBe('running');
    const resultState = await snapshot(page);
    expect(resultState.levelId).toBe(initial.levelId);
    expect(['level-clear','level-fail','complete']).toContain(resultState.phase);
    expect(await page.locator('#dialog').isVisible()).toBe(true);
    expect(await page.locator('#feedback').evaluate(el => el.classList.contains('show'))).toBe(false);
    assertBounds(await layout());
    await capture(page, size.name + '-result');
    const reports = {
      size, initial: {mass:initial.mass,levelId:initial.levelId},
      legibility,
      result: {phase:resultState.phase, mass:resultState.mass,
        gates:resultState.gatesPassed, pickups:resultState.pickups, hits:resultState.hits},
      consoleErrors, pageErrors, offOrigin
    };
    fs.writeFileSync(path.join(evidenceDir,size.name + '-audit.json'), JSON.stringify(reports, null, 2)+'\n');
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(offOrigin).toEqual([]);
    await page.locator('#start').click();
    await expect.poll(async () => (await snapshot(page))?.phase).toBe('running');
    await expect.poll(async () => (await snapshot(page))?.distance).toBeGreaterThan(0);
    const restarted = await snapshot(page);
    expect(restarted.levelId).toBe(initial.levelId);
    expect(restarted.distance).toBeLessThan(15);
    expect(restarted.mass).toBe(initial.mass);
    expect(await page.locator('#dialog').isVisible()).toBe(false);
  });
}

test.describe('W9.3-4 high-DPI mobile touch acceptance', () => {
  test.use({ deviceScaleFactor:2 });
  test('projected portal labels remain inside CSS viewport and steering works at DPR 2', async ({page}) => {
    test.setTimeout(35_000);
    await page.setViewportSize({width:390,height:844});
    await page.goto('/3d/');
    await expect.poll(async () => (await snapshot(page))?.loadedCC0Models).toBe(5);
    expect(await page.evaluate(() => globalThis.devicePixelRatio)).toBe(2);
    await page.locator('#start').click();
    await expect.poll(async () => page.locator('.world-gate-label:visible').count()).toBe(2);
    const bounds = await page.locator('.world-gate-label:visible').evaluateAll(els => els.map(el => {
      const b=el.getBoundingClientRect();
      return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};
    }));
    for(const b of bounds) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(390);
      expect(b.top).toBeGreaterThanOrEqual(84);
      expect(b.bottom).toBeLessThanOrEqual(844);
    }
    await page.mouse.move(350,465);
    await page.mouse.down();
    await page.waitForTimeout(450);
    expect((await snapshot(page)).playerNormX).toBeGreaterThan(0.55);
    await page.mouse.up();
    await capture(page,'portrait-390x844-dpr2-gate');
  });
});
