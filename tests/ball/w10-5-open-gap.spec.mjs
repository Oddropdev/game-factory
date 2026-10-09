import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const snap=p=>p.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
test('actual 18m open-air road gap with ballistic uphill launch and physical landing',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/ball/?mode=endless&edition=w105&coaster=extreme&seed=17&start=jump');
 await expect.poll(async()=>!!(await snap(page))?.physicsLoaded,{timeout:30000}).toBe(true);
 let s=await snap(page);
 expect(s.trilogy.worldIndex).toBe(5);
 expect(s.trilogy.jumpMode).toBe(true);
 expect(s.trilogy.active.actualGap).toBe(18);
 expect(s.trilogy.active.roadBodies).toBeLessThan(530);
 expect(s.trilogy.active.roadBodies).toBeGreaterThan(480);
 expect(s.trilogy.active.alignedSurface).toBe(true);
 await page.locator('#start').click();
 await page.waitForTimeout(600);
 s=await snap(page);expect(s.trilogy.touchDrive.boosts).toBe(0);
 await page.mouse.move(195,700);await page.mouse.down();
 await page.mouse.move(195,475,{steps:14});
 await expect.poll(async()=>(await snap(page))?.trilogy?.jumpLaunchFrames,
  {timeout:12000,intervals:[250]}).toBeGreaterThan(0);
 await expect.poll(async()=>(await snap(page))?.trilogy?.jumpAirFrames,
  {timeout:12000,intervals:[250]}).toBeGreaterThan(0);
 await expect.poll(async()=>(await snap(page))?.trilogy?.jumpLandings,
  {timeout:12000,intervals:[250]}).toBeGreaterThan(0);
 s=await snap(page);
 expect(s.trilogy.cameraFinite).toBe(true);
 expect(s.trilogy.nativeCcdConfigured).toBe(true);
 expect(s.trilogy.falls).toBeLessThan(3);
 expect(s.trilogy.worldIndex).toBe(5);
 expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/w105-real-jump.png'});
 await page.mouse.up();
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/w105-airtime-evidence.json',JSON.stringify({s,errors},null,2));
});
