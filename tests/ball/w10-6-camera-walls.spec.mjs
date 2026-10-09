import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const snap=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
test('World5 real giant STOP wall exists and impacts actual ball; camera shows more ahead',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/ball/?mode=endless&edition=w106&coaster=extreme&seed=17&start=macro&world=5');
 await expect.poll(async()=>!!(await snap(page))?.physicsLoaded,{timeout:30000}).toBe(true);
 let s=await snap(page);
 expect(s.trilogy.directorMode).toBe(true);
 expect(s.trilogy.active.choiceWallBodies).toBe(1);
 expect(s.trilogy.active.choiceWall.laneWidth).toBe(19);
 expect(s.trilogy.active.alignedSurface).toBe(true);
 await page.locator('#start').click();await page.waitForTimeout(250);
 s=await snap(page);expect(s.trilogy.touchDrive.boosts).toBe(0);
 await page.mouse.move(195,680);await page.mouse.down();
 await page.mouse.move(195,500,{steps:10});
 await expect.poll(async()=>(await snap(page))?.trilogy.choiceWallHits,
  {timeout:16000,intervals:[200]}).toBeGreaterThan(0);
 s=await snap(page);
 expect(s.trilogy.choiceWallStops).toBeGreaterThan(0);
 expect(s.trilogy.cameraWideFrames).toBeGreaterThan(20);
 expect(s.trilogy.maxAdaptiveFov).toBeGreaterThan(73);
 expect(s.trilogy.cameraFinite).toBe(true);
 expect(s.trilogy.falls).toBeLessThan(4);
 expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/w106-giant-wall.png'});
 await page.mouse.up();
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/w106-wall-evidence.json',JSON.stringify({s,errors},null,2));
});
test('Worlds6 through 12 vary heights and negative valleys, no forced global-Y floor reset',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const seen=new Set(),valleys=[];
 for(let world=6;world<=12;world++){
  await page.goto('/ball/?mode=endless&edition=w106&coaster=extreme&seed=17&start=macro&world='+world);
  await expect.poll(async()=>!!(await snap(page))?.physicsLoaded,{timeout:30000}).toBe(true);
  const s=await snap(page);
  expect(s.trilogy.cameraFinite).toBe(true);
  expect(s.trilogy.active.alignedSurface).toBe(true);
  seen.add(s.trilogy.macroKind);
  valleys.push(s.trilogy.active.minElevation);
 }
 expect(seen.size).toBeGreaterThanOrEqual(6);
 expect(valleys.some(y=>y< -30)).toBe(true);
 expect(errors).toEqual([]);
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/w106-valley-evidence.json',
  JSON.stringify({kinds:[...seen],valleys,errors},null,2));
});
