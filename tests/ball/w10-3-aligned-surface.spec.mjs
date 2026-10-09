import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const snap=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
test('W10.3 real helical physical deck aligned with rendered strip; stationary and fast swipe work',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/ball/?mode=endless&edition=w103&coaster=extreme&seed=17&start=spiral');
 await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:30000}).toBe(true);
 await page.locator('#start').click();await page.waitForTimeout(1400);
 let s=await snap(page);
 expect(s.trilogy.alignedSurfaceMode).toBe(true);
 expect(s.trilogy.active.alignedSurface).toBe(true);
 expect(s.trilogy.active.guardBodies).toBeGreaterThan(100);
 expect(s.trilogy.falls).toBe(0);
 await page.mouse.move(195,690);await page.mouse.down();
 await page.mouse.move(195,500,{steps:12});
 await page.waitForTimeout(2000);
 s=await snap(page);
 expect(s.trilogy.nativeCcdConfigured).toBe(true);
 expect(s.trilogy.touchDrive.boosts).toBe(1);
 expect(s.trilogy.cameraFinite).toBe(true);
 expect(s.trilogy.falls).toBeLessThan(3);
 expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/w103-aligned-bank.png'});
 await page.mouse.up();
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/w103-track-evidence.json',JSON.stringify({s,errors},null,2));
});
test('W10.3 real banked green guard supplies DOWNFORCE, sparks and boost under physics',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/ball/?mode=endless&edition=w103&coaster=extreme&seed=17&start=spiral&probe=guard');
 await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:30000}).toBe(true);
 await page.locator('#start').click();
 await page.mouse.move(135,690);await page.mouse.down();
 await page.mouse.move(185,530,{steps:10});
 await expect.poll(async()=>(await snap(page))?.trilogy.guardContactCount,
  {timeout:12000,intervals:[250]}).toBeGreaterThan(0);
 await expect.poll(async()=>(await snap(page))?.trilogy.guardBoostFrames,
  {timeout:12000,intervals:[250]}).toBeGreaterThan(0);
 await expect.poll(async()=>(await snap(page))?.trilogy.guardDownforceFrames,
  {timeout:12000,intervals:[250]}).toBeGreaterThan(0);
 let s=await snap(page);
 expect(s.trilogy.guardSparkFrames).toBeGreaterThan(0);
 expect(s.trilogy.active.alignedSurface).toBe(true);
 expect(s.trilogy.falls).toBeLessThan(4);
 expect(s.trilogy.cameraFinite).toBe(true);
 expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/w103-downforce.png'});
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/w103-downforce-evidence.json',JSON.stringify({s,errors},null,2));
 await page.mouse.up();
});
