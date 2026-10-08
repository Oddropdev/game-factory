import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const dir = path.resolve('evidence/w9-2d');
fs.mkdirSync(dir, { recursive: true });
async function state(page) {
  return page.evaluate(() => globalThis.__W9_PLAYCANVAS_TEST__?.snapshot());
}
const scenes=[
  {label:'portrait-390x844',width:390,height:844},
  {label:'small-android-360x800',width:360,height:800},
  {label:'landscape-844x390',width:844,height:390}
];
for(const size of scenes){
  test('W9.2D PlayCanvas real CC0 assets and full viewport '+size.label,async ({page})=>{
    test.setTimeout(45_000);
    await page.setViewportSize({width:size.width,height:size.height});
    const errors=[],offOrigin=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',request=>{
      const url=request.url();
      if(!url.startsWith('http://127.0.0.1:4177/')&&!url.startsWith('data:'))offOrigin.push(url);
    });
    await page.goto('/3d/');
    await expect.poll(async()=>Boolean((await state(page))?.frames>10)).toBe(true);
    await expect.poll(async()=>(await state(page))?.loadedCC0Models).toBe(5);
    const snapshot=await state(page);
    expect(snapshot.assetFailures).toBe(0);
    expect(snapshot.renderer).toBe('playcanvas');
    expect(snapshot.modelAttached).toBe(true);
    expect(snapshot.fullViewport).toBe(true);
    expect(snapshot.viewport[0]).toBeGreaterThanOrEqual(size.width-2);
    expect(snapshot.viewport[1]).toBeGreaterThanOrEqual(size.height-2);
    const canvas=page.locator('#application-canvas');
    const box=await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(size.width-2);
    expect(box.height).toBeGreaterThan(size.height-2);
    const hud=page.locator('#mass');
    await expect(hud).toBeVisible();
    await expect(page.locator('#start')).toBeVisible();
    await page.screenshot({path:path.join(dir,'w9-2d-'+size.label+'-ready.png')});
    await page.locator('#start').click();
    await expect.poll(async()=>(await state(page))?.phase).toBe('running');
    await expect.poll(async()=>(await state(page))?.distance).toBeGreaterThan(4);
    await page.screenshot({path:path.join(dir,'w9-2d-'+size.label+'-running.png')});
    expect(errors).toEqual([]);
    expect(offOrigin).toEqual([]);
  });
}

test('W9.2D mobile pointer steering changes the accepted MassRunnerModel',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/3d/');
  await expect.poll(async()=>(await state(page))?.loadedCC0Models).toBe(5);
  await page.locator('#start').click();
  await expect.poll(async()=>(await state(page))?.phase).toBe('running');
  await page.mouse.move(345,440);
  await page.mouse.down();
  await page.waitForTimeout(700);
  const right=await state(page);
  expect(right.playerNormX).toBeGreaterThan(0.6);
  await page.mouse.move(30,440);
  await page.waitForTimeout(700);
  const left=await state(page);
  expect(left.playerNormX).toBeLessThan(right.playerNormX);
  await page.mouse.up();
});

test('W9.2D source has only one authored level and real five-model provenance',async ({page})=>{
  await page.goto('/3d/');
  await expect.poll(async()=>(await state(page))?.loadedCC0Models).toBe(5);
  const s=await state(page);
  expect(s.totalLevels).toBe(1);
  expect(s.levelId).toBe('bulk-up');
  expect(s.levelNumber).toBe(1);
});
