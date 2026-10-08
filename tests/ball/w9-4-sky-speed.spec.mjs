import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const folder=path.resolve('evidence/w9-4-3');
fs.mkdirSync(folder,{recursive:true});
const state=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
const viewports=[
  {label:'portrait-390x844',width:390,height:844},
  {label:'small-android-360x800',width:360,height:800},
  {label:'landscape-844x390',width:844,height:390}
];

for(const size of viewports){
  test('W9.4-3 real floating curved sky course '+size.label,async({page})=>{
    test.setTimeout(42_000);
    await page.setViewportSize({width:size.width,height:size.height});
    const errors=[],remote=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{
      if(!r.url().startsWith('http://127.0.0.1:4177/')&&!r.url().startsWith('data:'))
        remote.push(r.url());
    });
    await page.goto('/ball/?mode=speed');
    await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
    const s=await state(page);
    expect(s.rigidbodyType).toBe('dynamic');
    expect(s.skyKind).toBe('clean-sky-horizon');
    expect(s.speedMode).toBe(true);
    expect(s.treeCount).toBe(0);
    expect(s.coursePlanks).toBeGreaterThanOrEqual(45);
    expect(s.curveDegrees).toBeGreaterThan(5);
    expect(s.magneticSafetyArcs).toBe(2);
    expect(s.boostPads).toBe(3);
    expect(s.fullViewport).toBe(true);
    expect(s.artMode).toBe('placeholder');
    await page.screenshot({path:path.join(folder,size.label+'-sky-ready.png')});
    await page.locator('#start').click();
    await expect.poll(async()=>(await state(page))?.boostCount,{timeout:11_000})
      .toBeGreaterThanOrEqual(1);
    const boosted=await state(page);
    expect(boosted.position[2]).toBeLessThan(-9);
    expect(boosted.maxSpeedObserved).toBeGreaterThan(11);
    await page.screenshot({path:path.join(folder,size.label+'-boosted.png')});
    expect(errors).toEqual([]);
    expect(remote).toEqual([]);
  });
}

test('W9.4-3 upward flick stacks physical impulse, lateral swipe still steers',async({page})=>{
  test.setTimeout(36_000);
  await page.goto('/ball/?mode=speed');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await page.mouse.move(195,700);
  await page.mouse.down();
  await page.mouse.move(195,610,{steps:3});
  await page.mouse.move(195,490,{steps:3});
  await page.mouse.move(195,360,{steps:3});
  await expect.poll(async()=>(await state(page))?.swipeCount).toBeGreaterThanOrEqual(2);
  const after=await state(page);
  expect(after.swipeStacks).toBeGreaterThanOrEqual(2);
  expect(after.maxSpeedObserved).toBeGreaterThan(17);
  expect(after.planarSpeed).toBeLessThanOrEqual(after.speedCap+1.5);
  await page.mouse.move(344,330,{steps:5});
  await expect.poll(async()=>(await state(page))?.targetX).toBeGreaterThan(2.0);
  await page.mouse.up();
  await page.screenshot({path:path.join(folder,'portrait-swipe-speed.png')});
});

test('W9.4-3 magnetic arc produces bounded real force while steering to edge',async({page})=>{
  test.setTimeout(40_000);
  await page.goto('/ball/?mode=speed');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await page.mouse.move(370,630);
  await page.mouse.down();
  await expect.poll(async()=>(await state(page))?.magneticAssistEvents,{timeout:15_000})
    .toBeGreaterThan(0);
  const s=await state(page);
  expect(s.fallCount).toBe(0);
  expect(s.rigidbodyType).toBe('dynamic');
  expect(s.magneticSafetyArcs).toBe(2);
  await page.mouse.up();
  await page.screenshot({path:path.join(folder,'portrait-magnetic-safety.png')});
});

test('W9.4-3 real auto-drive stays on winding course and completes',async({page})=>{
  test.setTimeout(45_000);
  await page.goto('/ball/?mode=speed');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await expect.poll(async()=>(await state(page))?.phase,{timeout:25_000}).toBe('complete');
  const s=await state(page);
  expect(s.boostCount).toBe(3);
  expect(s.fallCount).toBe(0);
  expect(s.maxSpeedObserved).toBeGreaterThan(19);
  expect(s.maxSpeedObserved).toBeLessThanOrEqual(s.speedCap+1);
  expect(s.licensedModels).toBe(0);
  await expect(page.locator('#dialog')).toBeVisible();
  await page.screenshot({path:path.join(folder,'portrait-speed-complete.png')});
});
