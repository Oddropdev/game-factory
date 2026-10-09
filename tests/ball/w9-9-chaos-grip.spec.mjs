import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const snapshot=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
test('randomized magnetic-grip roads remain playable through World 6',async({page})=>{
 test.setTimeout(460000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/ball/?mode=endless&edition=w99&coaster=extreme&seed=17');
 await expect.poll(async()=>(await snapshot(page))?.physicsLoaded,{timeout:30000}).toBe(true);
 expect((await snapshot(page)).trilogy.chaosMode).toBe(true);
 await page.locator('#start').click();
 await expect.poll(async()=>(await snapshot(page))?.trilogy?.worldIndex,
  {timeout:320000,intervals:[350]}).toBe(4);
 let s=await snapshot(page);
 expect(s.phase).toBe('running');
 expect(s.trilogy.active.chaos).toBe(true);
 expect(s.trilogy.active.islands).toBe(0);
 expect(s.trilogy.active.boxObstacles).toBeGreaterThan(11);
 expect(s.trilogy.active.maxElevation).toBeGreaterThan(7);
 await expect.poll(async()=>(await snapshot(page))?.trilogy?.gripFrames,
  {timeout:40000}).toBeGreaterThan(30);
 await page.screenshot({path:'test-results/w99-world4-chaos.png'});
 await expect.poll(async()=>(await snapshot(page))?.trilogy?.worldIndex,
  {timeout:200000,intervals:[400]}).toBe(6);
 s=await snapshot(page);
 expect(s.trilogy.gripFrames).toBeGreaterThan(300);
 expect(s.trilogy.falls).toBeLessThan(5);
 expect(s.trilogy.active.islands).toBe(0);
 expect(s.trilogy.activeWorldRoots).toBe(1);
 expect(s.trilogy.maxSurfaceGap).toBeLessThan(35);
 expect(s.trilogy.journeys.every(j=>j.validation.valid)).toBe(true);
 expect(s.trilogy.retired.every(w=>w.disposed&&w.liveBodies===0)).toBe(true);
 expect(s.trilogy.maxRadiusError).toBeLessThan(.002);
 expect(s.trilogy.cameraFinite).toBe(true);
 expect(errors).toEqual([]);
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/w99-evidence.json',JSON.stringify({s,errors},null,2));
});
