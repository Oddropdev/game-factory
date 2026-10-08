import {test,expect} from '@playwright/test';
const read=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
test('W9.4-7 smooth geometric tube exists only in dedicated mode',async({page})=>{
  await page.goto('/ball/?mode=transit');
  await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  const s=await read(page);
  expect(s.transitMode).toBe(true);
  expect(s.grindMode).toBe(true);
  expect(s.tubeMeshCount).toBe(3);
  expect(s.tubePathSamples).toBe(401);
  expect(s.tubeLength).toBeGreaterThan(130);
  expect(s.nextLevelLoadState).toBe('idle');
  expect(s.rigidbodyType).toBe('dynamic');
  expect(s.courseLength).toBe(620);
  expect(s.grindFalseSideRewards).toBe(0);
  await page.screenshot({path:'test-results/w9-4-7-tube-initial.png'});
});
test('W9.4-7 genuine run stays attached through full inversion and stages next island',async({page})=>{
  test.setTimeout(110_000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/ball/?mode=transit');
  await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await expect.poll(async()=>(await read(page))?.tubeEntries,
    {timeout:50_000,intervals:[200,300,500]}).toBe(1);
  await expect.poll(async()=>(await read(page))?.tubeInvertedFrames,
    {timeout:30_000,intervals:[200,300,500]}).toBeGreaterThan(5);
  const inverted=await read(page);
  expect(inverted.tubeLockFrames).toBeGreaterThan(10);
  expect(inverted.tubeOnSurface).toBe(true);
  expect(inverted.rigidbodyType).toBe('kinematic');
  expect(inverted.tubeMaxRadiusError).toBeLessThan(.002);
  expect(inverted.guardLock).toBe('free');
  expect(inverted.grindLock).toBe('off');
  expect(inverted.grindFalseSideRewards).toBe(0);
  await page.screenshot({path:'test-results/w9-4-7-inverted.png'});
  await expect.poll(async()=>(await read(page))?.tubeExits,
    {timeout:30_000,intervals:[200,300,500]}).toBe(1);
  const exit=await read(page);
  expect(exit.rigidbodyType).toBe('dynamic');
  expect(exit.tubeState).toBe('released');
  expect(exit.nextLevelLoadState).toBe('ready');
  expect(exit.nextLevelPlanks).toBeGreaterThan(15);
  expect(exit.tubeExitSpeed).toBeGreaterThan(20);
  expect(exit.tubeFalls).toBe(0);
  expect(exit.nextLevelLoadError).toBe('');
  await page.screenshot({path:'test-results/w9-4-7-next-island.png'});
  expect(errors).toEqual([]);
});
test('W9.4-7 original jump never receives tube or next-level objects',async({page})=>{
  await page.goto('/ball/?mode=jump');
  await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  const s=await read(page);
  expect(s.transitMode).toBe(false);
  expect(s.tubeMeshCount).toBe(0);
  expect(s.nextLevelLoadState).toBe('idle');
  expect(s.rigidbodyType).toBe('dynamic');
});
