import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const folder=path.resolve('evidence/w9-4-5-1');
fs.mkdirSync(folder,{recursive:true});
const snap=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
const views=[
  {name:'portrait-390x844',width:390,height:844},
  {name:'small-android-360x800',width:360,height:800},
  {name:'landscape-844x390',width:844,height:390}
];
for(const size of views){
  test('W9.4-5.1 can deliberately reach green rail with no opposing old safety '+size.name,
    async({page})=>{
    test.setTimeout(48_000);
    await page.setViewportSize({width:size.width,height:size.height});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/ball/?mode=rail');
    await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000})
      .toBe(true);
    const ready=await snap(page);
    expect(ready.railMode).toBe(true);
    expect(ready.magneticRailSections).toBe(3);
    expect(ready.legacyRailVisualsSuppressed).toBeGreaterThan(12);
    expect(ready.legacySafetyForceInRailSection).toBe(0);
    expect(ready.railContactEvents).toBe(0);
    await page.screenshot({path:path.join(folder,size.name+'-priority-ready.png')});
    await page.locator('#start').click();
    await page.mouse.move(size.width*.99,size.height*.68);
    await page.mouse.down();
    await expect.poll(async()=>(await snap(page))?.targetX,{timeout:2500})
      .toBeGreaterThan(3.8);
    await expect.poll(async()=>(await snap(page))?.railEntrySteeringFrames,{timeout:11_000})
      .toBeGreaterThan(0);
    await expect.poll(async()=>(await snap(page))?.railContactEvents,{timeout:12_000})
      .toBeGreaterThan(0);
    await expect.poll(async()=>(await snap(page))?.railBoostFrames,{timeout:7_000})
      .toBeGreaterThan(0);
    let engaged;
    await expect.poll(async()=>{
      engaged=await snap(page);
      return engaged.railSparkCount>0&&engaged.railGlowSections.length>0 &&
        engaged.railBoostSpeedGain>0;
    },{timeout:5000}).toBe(true);
    expect(engaged.legacySafetyForceInRailSection).toBe(0);
    expect(engaged.railDownForceEvents).toBeGreaterThan(0);
    expect(engaged.rigidbodyType).toBe('dynamic');
    await page.screenshot({path:path.join(folder,size.name+'-contact-engaged.png')});
    // Player chooses to disengage, not a permanent auto-snapping path.
    await page.mouse.move(size.width*.01,size.height*.65,{steps:5});
    await expect.poll(async()=>(await snap(page))?.targetX).toBeLessThan(-3.8);
    await page.mouse.up();
    expect(errors).toEqual([]);
  });
}

test('W9.4-5.1 unchanged long-jump fallback keeps original steering range',
  async({page})=>{
  test.setTimeout(40_000);
  await page.goto('/ball/?mode=jump');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000})
    .toBe(true);
  await page.locator('#start').click();
  await page.mouse.move(390,650);
  await page.mouse.down();
  const state=await snap(page);
  expect(state.railMode).toBe(false);
  expect(state.legacyRailVisualsSuppressed).toBe(0);
  expect(state.targetX).toBeLessThanOrEqual(3.3);
  expect(state.magneticRailSections).toBe(0);
  await page.mouse.up();
});
