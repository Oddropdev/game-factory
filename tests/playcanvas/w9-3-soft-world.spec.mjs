import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const out = path.resolve('evidence/w9-3-3');
fs.mkdirSync(out, { recursive: true });
const read = page => page.evaluate(() => globalThis.__W9_PLAYCANVAS_TEST__?.snapshot());
const viewports = [
  { name: 'portrait-390x844', width: 390, height: 844 },
  { name: 'small-android-360x800', width: 360, height: 800 },
  { name: 'landscape-844x390', width: 844, height: 390 }
];
for (const vp of viewports) {
  test('W9.3-3 real soft world '+vp.name, async ({ page }) => {
    test.setTimeout(55_000);
    await page.setViewportSize({width: vp.width, height: vp.height});
    const failures=[], offOrigin=[];
    page.on('pageerror', error => failures.push(error.message));
    page.on('request', req => {
      if (!req.url().startsWith('http://127.0.0.1:4177/') && !req.url().startsWith('data:'))
        offOrigin.push(req.url());
    });
    await page.goto('/3d/');
    await expect.poll(async ()=>(await read(page))?.loadedCC0Models).toBe(5);
    await expect.poll(async ()=>(await read(page))?.frames).toBeGreaterThan(10);
    const state=await read(page);
    expect(state.assetFailures).toBe(0);
    expect(state.softWorldStyle).toBe('rounded-garden-v1');
    expect(state.softBackgroundBoxPieces).toBe(0);
    expect(state.softCloudBanks).toBe(4);
    expect(state.softGardenPlants).toBe(8);
    expect(state.softEnvironmentPieces).toBeGreaterThanOrEqual(45);
    expect(state.juiceCapacity).toBe(9);
    expect(state.juiceActive).toBe(0);
    expect(state.avatarKind).toBe('soft-toy-v1');
    expect(state.softCourse).toBe('rounded-toy-v1');
    expect(state.fullViewport).toBe(true);
    await page.screenshot({path:path.join(out,vp.name+'-ready.png')});
    await page.locator('#start').click();
    await expect.poll(async ()=>(await read(page))?.distance,{timeout:5000}).toBeGreaterThan(16);
    await page.screenshot({path:path.join(out,vp.name+'-running.png')});
    await expect.poll(async ()=>(await read(page))?.distance,{timeout:7000}).toBeGreaterThan(46);
    await page.screenshot({path:path.join(out,vp.name+'-gate-approach.png')});
    expect(failures).toEqual([]);
    expect(offOrigin).toEqual([]);
  });
}
test('W9.3-3 pooled event rewards stay bounded and die out', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/3d/');
  await expect.poll(async ()=>(await read(page))?.loadedCC0Models).toBe(5);
  expect((await read(page)).juiceActive).toBe(0);
  await page.locator('#start').click();
  await expect.poll(async ()=>(await read(page))?.juiceActive,{timeout:7000,intervals:[60]})
    .toBeGreaterThan(0);
  const active=await read(page);
  expect(active.juiceActive).toBeLessThanOrEqual(active.juiceCapacity);
  await page.screenshot({path:path.join(out,'portrait-reward-juice.png')});
  await page.waitForTimeout(1050);
  expect((await read(page)).juiceActive).toBeLessThanOrEqual(9);
  const overlay=page.locator('#feedback');
  const bounds=await overlay.boundingBox();
  expect(bounds.y).toBeGreaterThan(844*.6);
});
test('W9.3-3 does not change original gate values or drag steering', async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/3d/');
  await expect.poll(async ()=>(await read(page))?.loadedCC0Models).toBe(5);
  await page.locator('#start').click();
  await expect.poll(async()=>(await page.locator('.world-gate-label:visible').count()),
    {timeout:6500}).toBe(2);
  const labels=await page.locator('.world-gate-label:visible').allTextContents();
  expect(labels).toEqual(['+4','-3']);
  await page.mouse.move(355,455);
  await page.mouse.down();
  await page.waitForTimeout(400);
  expect((await read(page)).playerNormX).toBeGreaterThan(.55);
  await page.mouse.up();
});

test('W9.3-3 never celebrates a missed pickup, but reacts to a real hit', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/3d/');
  await expect.poll(async()=>(await read(page))?.loadedCC0Models).toBe(5);
  await page.locator('#start').click();
  // At x=0.5 the first orb (x=0.25) is missed; the centre hazard is hit.
  await expect.poll(async()=>(await read(page))?.eventsProcessed,{timeout:6500})
    .toBeGreaterThanOrEqual(1);
  const missed=await read(page);
  expect(missed.lastEventId).toBe('l1-orb-a');
  expect(missed.pickups).toBe(0);
  expect(missed.juiceActive).toBe(0);
  await expect(page.locator('#feedback')).not.toHaveClass(/show/);
  await expect.poll(async()=>(await read(page))?.eventsProcessed,{timeout:6500})
    .toBeGreaterThanOrEqual(2);
  const hit=await read(page);
  expect(hit.lastEventId).toBe('l1-hazard');
  expect(hit.hits).toBe(1);
  expect(hit.juiceActive).toBeGreaterThan(0);
  expect(hit.juiceActive).toBeLessThanOrEqual(hit.juiceCapacity);
  expect(await page.locator('#feedback').textContent()).toBe('OUCH!');
  await page.screenshot({path:path.join(out,'portrait-confirmed-hit-juice.png')});
});
