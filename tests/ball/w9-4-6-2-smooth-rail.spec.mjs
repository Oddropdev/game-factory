import {test,expect} from '@playwright/test';
const state=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());

test('W9.4-6.2 continuous secret rail artwork retains genuine top-only colliders',async({page})=>{
  await page.goto('/ball/?mode=grind');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  const s=await state(page);
  expect(s.grindSmoothMeshCount).toBe(4);
  expect(s.grindSmoothVisualSegments).toBeGreaterThan(150);
  expect(s.grindTrackSecretSegments).toBeGreaterThan(25);
  expect(s.grindTrackSideColliders).toBeGreaterThan(65);
  expect(s.grindTrapRecoveries).toBe(0);
  expect(s.grindFalseSideRewards).toBe(0);
  expect(s.dynamicBallStillPhysics).toBe(true);
  await page.screenshot({path:'test-results/w9-4-6-2-smooth-rail.png'});
});
test('W9.4-6.2 older jump mode does not instantiate secret rail',async({page})=>{
  await page.goto('/ball/?mode=jump');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  const s=await state(page);
  expect(s.grindSmoothMeshCount).toBe(0);
  expect(s.grindTrackSecretSegments).toBe(0);
});
