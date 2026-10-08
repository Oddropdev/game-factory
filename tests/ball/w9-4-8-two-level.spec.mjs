import {test,expect} from '@playwright/test';
import {stdout} from 'node:process';
const state=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
const sizes=[
  {name:'portrait-390x844',width:390,height:844},
  {name:'android-small-360x800',width:360,height:800},
  {name:'landscape-844x390',width:844,height:390}
];
for(const viewport of sizes){
  test('W9.4-8 REAL two-level run, coaster and Sunset Ribbon '+viewport.name,async({page})=>{
    test.setTimeout(110_000);
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/ball/?mode=twolevel');
    await expect.poll(async()=>(await state(page))?.physicsLoaded,
      {timeout:20_000}).toBe(true);
    const initial=await state(page);
    expect(initial.twoLevelMode).toBe(true);
    expect(initial.levelIndex).toBe(1);
    expect(initial.level2GateCount).toBe(0);
    expect(initial.nextLevelLoadState).toBe('idle');
    expect(await page.locator('#level-name').innerText()).toContain('LEVEL 1');
    await page.locator('#start').click();
    await expect.poll(async()=>(await state(page))?.tubeEntries,
      {timeout:45_000,intervals:[150,250,400]}).toBe(1);
    const entrance=await state(page);
    expect(entrance.levelOneComplete).toBe(true);
    expect(entrance.levelIndex).toBe(1);
    expect(entrance.rigidbodyType).toBe('kinematic');
    await expect.poll(async()=>(await state(page))?.tubeInvertedFrames,
      {timeout:18_000}).toBeGreaterThan(3);
    const coaster=await state(page);
    expect(coaster.tubeOnSurface).toBe(true);
    expect(coaster.tubeMaxRadiusError).toBeLessThan(.002);
    await page.screenshot({path:'test-results/w9-4-8-coaster-'+viewport.name+'.png'});
    await expect.poll(async()=>(await state(page))?.levelIndex,
      {timeout:25_000,intervals:[150,250,400]}).toBe(2);
    const newWorld=await state(page);
    expect(newWorld.tubeExits).toBe(1);
    expect(newWorld.levelTransitionEvents).toBe(1);
    expect(newWorld.rigidbodyType).toBe('dynamic');
    expect(newWorld.nextLevelId).toBe('sunset-ribbon-2');
    expect(newWorld.nextLevelLoadState).toBe('ready');
    expect(newWorld.level2GateCount).toBe(4);
    expect(newWorld.level2RibbonMeshes).toBe(3);
    expect(newWorld.level2RibbonSamples).toBeGreaterThan(290);
    expect(newWorld.level2Active).toBe(true);
    expect(newWorld.level2Title).toBe('SUNSET RIBBON');
    expect(await page.locator('#level-name').innerText()).toContain('LEVEL 2');
    expect(await page.locator('#gem-label').innerText()).toContain('SUNSET');
    expect(await page.locator('#game').evaluate(e=>e.classList.contains('sunset-world'))).toBe(true);
    await page.screenshot({path:'test-results/w9-4-8-sunset-'+viewport.name+'.png'});
    await expect.poll(async()=>(await state(page))?.phase,
      {timeout:22_000,intervals:[150,250,400]}).toBe('complete');
    const finish=await state(page);
    expect(finish.levelTwoComplete).toBe(true);
    expect(finish.level2Frames).toBeGreaterThan(25);
    expect(finish.level2RoadContactEvents).toBeGreaterThan(0);
    expect(finish.level2GemsCollected).toBeGreaterThan(0);
    expect(finish.tubeEntries).toBe(1);
    expect(finish.tubeExits).toBe(1);
    expect(finish.fallCount).toBe(0);
    expect(finish.grindFalseSideRewards).toBe(0);
    expect(await page.locator('#dialog-title').innerText()).toContain('TWO WORLDS');
    await page.screenshot({path:'test-results/w9-4-8-finish-'+viewport.name+'.png'});
    expect(errors).toEqual([]);
    stdout.write('W948_TWO_LEVEL_PASS '+viewport.name+' '+
      JSON.stringify({elapsed:finish.elapsed,gems:finish.level2GemsCollected,
        roadContacts:finish.level2RoadContactEvents,loadMs:finish.nextLevelLoadMs})+'\n');
  });
}
test('W9.4-8 old W9.4-7 transit mode retains 620m finish and no Sunset world',async({page})=>{
  await page.goto('/ball/?mode=transit');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  const s=await state(page);
  expect(s.transitMode).toBe(true);
  expect(s.twoLevelMode).toBe(false);
  expect(s.courseLength).toBe(620);
  expect(s.level2Active).toBe(false);
  expect(s.level2GateCount).toBe(0);
});
test('W9.4-8 late preload holds at tube exit safely until second world is ready',async({page})=>{
  test.setTimeout(100_000);
  await page.route('**/levels/second-sky.json',async route=>{
    await route.continue();
  });
  await page.goto('/ball/?mode=twolevel&preload=off');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await expect.poll(async()=>(await state(page))?.tubeExits,{timeout:60_000}).toBe(1);
  const s=await state(page);
  expect(s.nextLevelLoadState).toBe('ready');
  expect(s.levelIndex).toBe(2);
  expect(s.tubeHoldSeconds).toBeGreaterThan(0);
  expect(s.tubeFalls).toBe(0);
});
