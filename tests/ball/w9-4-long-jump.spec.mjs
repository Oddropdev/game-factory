import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const dir=path.resolve('evidence/w9-4-4');
fs.mkdirSync(dir,{recursive:true});
const snap=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
const viewports=[{name:'portrait-390x844',width:390,height:844},
  {name:'small-android-360x800',width:360,height:800},
  {name:'landscape-844x390',width:844,height:390}];

for(const vp of viewports){
  test('W9.4-4 real extended 440m sky course '+vp.name,async({page})=>{
    test.setTimeout(55_000);
    await page.setViewportSize({width:vp.width,height:vp.height});
    const errors=[],offOrigin=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{
      if(!r.url().startsWith('http://127.0.0.1:4177/')&&!r.url().startsWith('data:'))
        offOrigin.push(r.url());
    });
    await page.goto('/ball/?mode=jump');
    await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
    const initial=await snap(page);
    expect(initial.speedMode).toBe(true);
    expect(initial.longJumpMode).toBe(true);
    expect(initial.courseLength).toBe(440);
    expect(initial.gapMeters).toBeGreaterThanOrEqual(12);
    expect(initial.landingWidth).toBe(14);
    expect(initial.boostPads).toBe(7);
    expect(initial.speedCap).toBe(64);
    expect(initial.rigidbodyType).toBe('dynamic');
    expect(initial.treeCount).toBe(0);
    expect(initial.fullViewport).toBe(true);
    expect(initial.artMode).toBe('placeholder');
    await page.screenshot({path:path.join(dir,vp.name+'-long-ready.png')});
    await page.locator('#start').click();
    await expect.poll(async()=>(await snap(page))?.jumpCount,{timeout:20_000})
      .toBeGreaterThanOrEqual(1);
    const takeoff=await snap(page);
    expect(takeoff.maxJumpHeight).toBeGreaterThanOrEqual(0);
    expect(takeoff.launchSpeed).toBeGreaterThan(15);
    await page.screenshot({path:path.join(dir,vp.name+'-takeoff.png')});
    await expect.poll(async()=>(await snap(page))?.landingCount,{timeout:10_000})
      .toBeGreaterThanOrEqual(1);
    const landing=await snap(page);
    expect(landing.maxJumpHeight).toBeGreaterThan(1);
    expect(landing.jumpAirtime).toBeGreaterThan(.12);
    expect(landing.landingSpeed).toBeGreaterThan(8);
    expect(landing.fallCount).toBe(0);
    await page.screenshot({path:path.join(dir,vp.name+'-landing.png')});
    expect(errors).toEqual([]);
    expect(offOrigin).toEqual([]);
  });
}

test('W9.4-4 real 440m run lands and preserves speed to finish',async({page})=>{
  test.setTimeout(60_000);
  await page.goto('/ball/?mode=jump');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await expect.poll(async()=>(await snap(page))?.phase,{timeout:35_000}).toBe('complete');
  const last=await snap(page);
  expect(last.jumpCount).toBe(1);
  expect(last.landingCount).toBe(1);
  expect(last.landingContactEvents).toBe(1);
  expect(last.fallCount).toBe(0);
  expect(last.boostCount).toBe(7);
  expect(last.maxSpeedObserved).toBeGreaterThan(40);
  expect(last.maxSpeedObserved).toBeLessThanOrEqual(65);
  expect(last.landingSpeed).toBeGreaterThan(12);
  expect(last.rigidbodyType).toBe('dynamic');
  await expect(page.locator('#dialog-title')).toContainText('CLEARED');
  await page.screenshot({path:path.join(dir,'portrait-long-finish.png')});
});

test('W9.4-4 swipe impulse still increases speed on the longer course',async({page})=>{
  test.setTimeout(40_000);
  await page.goto('/ball/?mode=jump');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await page.mouse.move(190,690);
  await page.mouse.down();
  await page.mouse.move(190,570,{steps:3});
  await page.mouse.move(190,445,{steps:3});
  await page.mouse.move(190,320,{steps:3});
  await expect.poll(async()=>(await snap(page))?.swipeCount).toBeGreaterThanOrEqual(2);
  const s=await snap(page);
  expect(s.swipeStacks).toBeGreaterThanOrEqual(2);
  expect(s.speedCap).toBe(64);
  expect(s.maxSpeedObserved).toBeGreaterThan(18);
  await page.mouse.up();
  await page.screenshot({path:path.join(dir,'portrait-flick-boost.png')});
});
