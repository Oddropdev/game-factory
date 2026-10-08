import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const evidence=path.resolve('evidence/w9-4-6');
fs.mkdirSync(evidence,{recursive:true});
const read=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
const views=[{label:'portrait-390x844',width:390,height:844},
  {label:'small-android-360x800',width:360,height:800},
  {label:'landscape-844x390',width:844,height:390}];
for(const view of views){
  test('W9.4-6 two distinct physical rails and genuine floorless bridge '+view.label,
    async({page})=>{
    test.setTimeout(35_000);
    await page.setViewportSize({width:view.width,height:view.height});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/ball/?mode=grind');
    await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:20_000})
      .toBe(true);
    const state=await read(page);
    expect(state.rigidbodyType).toBe('dynamic');
    expect(state.grindMode).toBe(true);
    expect(state.courseLength).toBe(440);
    expect(state.speedCap).toBe(64);
    expect(state.magneticRailSections).toBe(3);
    expect(state.grindTrackBridgeSegments).toBeGreaterThan(8);
    expect(state.grindTrackSecretSegments).toBeGreaterThan(12);
    expect(state.grindTrackSideColliders).toBeGreaterThan(35);
    expect(state.grindVoidMeters).toBe(19);
    expect(state.grindVoidFloorPlanksRemoved).toBeGreaterThan(4);
    expect(state.grindSecretElevationMeters).toBe(2.5);
    expect(state.grindEntries).toBe(0);
    expect(state.guardLockEvents).toBe(0);
    expect(state.grindFalseSideRewards).toBe(0);
    expect(state.fullViewport).toBe(true);
    await page.screenshot({path:path.join(evidence,view.label+'-train-rail-world.png')});
    expect(errors).toEqual([]);
  });
}
test('W9.4-6 GUARD: side lock is strong but opposite swipe releases immediately',
  async({page})=>{
  test.setTimeout(55_000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/ball/?mode=grind');
  await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:20_000})
    .toBe(true);
  await page.locator('#start').click();
  await page.mouse.move(387,650);
  await page.mouse.down();
  await expect.poll(async()=>(await read(page))?.guardLockEvents,{timeout:12_000})
    .toBeGreaterThan(0);
  await expect.poll(async()=>(await read(page))?.guardHoldFrames,{timeout:5_000})
    .toBeGreaterThan(0);
  const locked=await read(page);
  expect(['locked-side','locked-top']).toContain(locked.guardLock);
  expect(locked.railContactEvents).toBeGreaterThan(0);
  expect(locked.guardLockPeakSpeed).toBeGreaterThan(5);
  await page.screenshot({path:path.join(evidence,'guard-locked.png')});
  // Opposite swipe, not simply moving close to the opposite lane.
  await page.mouse.move(4,620,{steps:3});
  await expect.poll(async()=>(await read(page))?.guardReleaseByOppositeSwipe,
    {timeout:2_000}).toBe(1);
  const released=await read(page);
  expect(released.guardLock).toBe('release-cooldown');
  expect(released.guardCoolUntil).toBeGreaterThan(0);
  expect(released.targetX).toBeLessThan(-3.8);
  await page.screenshot({path:path.join(evidence,'guard-released.png')});
  await page.mouse.up();
  expect(errors).toEqual([]);
});
test('W9.4-6 BRIDGE: physical top-only grind travels across missing ground',
  async({page})=>{
  test.setTimeout(65_000);
  await page.goto('/ball/?mode=grind');
  await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:20_000})
    .toBe(true);
  await page.locator('#start').click();
  await expect.poll(async()=>(await read(page))?.grindTopContactEvents,
    {timeout:24_000}).toBeGreaterThan(0);
  await expect.poll(async()=>(await read(page))?.grindBridgeFrames,
    {timeout:10_000}).toBeGreaterThan(0);
  const riding=await read(page);
  expect(riding.grindEntries).toBeGreaterThan(0);
  expect(riding.grindFalseSideRewards).toBe(0);
  expect(riding.grindBoostFrames).toBeGreaterThan(0);
  expect(riding.grindTrackBridgeSegments).toBeGreaterThan(8);
  await page.screenshot({path:path.join(evidence,'bridge-top-grind.png')});
  await expect.poll(async()=>(await read(page))?.position?.[2],
    {timeout:12_000}).toBeLessThan(-216);
  expect((await read(page)).fallCount).toBe(0);
});
test('W9.4-6 original jump mode retains continuous old floor without grind rails',
  async({page})=>{
  test.setTimeout(28_000);
  await page.goto('/ball/?mode=jump');
  await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:20_000})
    .toBe(true);
  const original=await read(page);
  expect(original.grindMode).toBe(false);
  expect(original.grindTrackBridgeSegments).toBe(0);
  expect(original.grindVoidFloorPlanksRemoved).toBe(0);
  expect(original.magneticRailSections).toBe(0);
  expect(original.guardLock).toBe('free');
});
