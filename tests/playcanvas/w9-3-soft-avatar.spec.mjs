import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const out = path.resolve('evidence/w9-3');
fs.mkdirSync(out,{recursive:true});
const dimensions=[
  {label:'portrait-390x844',width:390,height:844},
  {label:'small-android-360x800',width:360,height:800},
  {label:'landscape-844x390',width:844,height:390}
];
const probe = page=>page.evaluate(()=>globalThis.__W9_PLAYCANVAS_TEST__?.snapshot());

for(const size of dimensions){
  test('W9.3-1 genuinely smooth toy character '+size.label,async({page})=>{
    test.setTimeout(45_000);
    await page.setViewportSize({width:size.width,height:size.height});
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    await page.goto('/3d/');
    await expect.poll(async()=>(await probe(page))?.loadedCC0Models).toBe(5);
    await expect.poll(async()=>(await probe(page))?.frames).toBeGreaterThan(10);
    const before=await probe(page);
    expect(before.assetFailures).toBe(0);
    expect(before.avatarKind).toBe('soft-toy-v1');
    expect(before.avatarBoxParts).toBe(0);
    expect(before.avatarRoundedParts).toBeGreaterThanOrEqual(20);
    expect(before.modelAttached).toBe(true);
    expect(before.fullViewport).toBe(true);
    await page.screenshot({path:path.join(out,'W9.3-1-'+size.label+'-ready.png')});
    await page.locator('#start').click();
    await expect.poll(async()=>(await probe(page))?.phase).toBe('running');
    await expect.poll(async()=>(await probe(page))?.distance).toBeGreaterThan(4);
    await page.screenshot({path:path.join(out,'W9.3-1-'+size.label+'-running.png')});
    const after=await probe(page);
    expect(after.avatarRoundedParts).toBe(before.avatarRoundedParts);
    expect(after.avatarBoxParts).toBe(0);
    expect(after.levelId).toBe('bulk-up');
    expect(pageErrors).toEqual([]);
  });
}

test('W9.3-1 visual only — existing touch steering and growth model unchanged',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/3d/');
  await expect.poll(async()=>(await probe(page))?.loadedCC0Models).toBe(5);
  await page.locator('#start').click();
  await page.mouse.move(345,430);
  await page.mouse.down();
  await page.waitForTimeout(400);
  const s=await probe(page);
  expect(s.playerNormX).toBeGreaterThan(0.55);
  expect(s.avatarKind).toBe('soft-toy-v1');
  await page.mouse.up();
});
