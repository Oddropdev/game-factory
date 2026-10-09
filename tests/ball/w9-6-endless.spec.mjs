import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const read=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());

test('physical browser crosses world three into generated worlds 4, 5 and 6 without a finish',async({page})=>{
 test.setTimeout(600000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/ball/?mode=endless&seed=17');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:30000}).toBe(true);
 let s=await read(page);
 expect(s.endlessMode).toBe(true);expect(s.trilogy.worldIndex).toBe(1);
 expect(s.trilogy.active.id).toBe('crystal');expect(s.trilogy.activeWorldRoots).toBe(1);
 await page.locator('#start').click();
 for(const target of [4,5,6]){
  await expect.poll(async()=>(await read(page))?.trilogy?.worldIndex,{timeout:300000,intervals:[300]}).toBe(target);
  s=await read(page);
  expect(s.phase).toBe('running');
  expect(s.trilogy.state).toBe('world');
  expect(s.trilogy.active.id).toBe('endless-'+target);
  expect(s.trilogy.activeWorldRoots).toBe(1);
  expect(s.trilogy.active.roadBodies).toBeGreaterThan(60);
  expect(s.trilogy.active.trackQuads).toBeGreaterThan(100);
  expect(s.trilogy.active.tier).toBeUndefined();
  expect(s.trilogy.retired).toHaveLength(target-1);
  expect(s.trilogy.retired.every(w=>w.disposed&&w.liveBodies===0)).toBe(true);
  if(target===4||target===6)await page.screenshot({path:'test-results/w96-world-'+target+'.png'});
 }
 expect(s.trilogy.entries).toBe(5);
 expect(s.trilogy.exits).toBe(5);
 expect(s.trilogy.worldContacts[3]).toBeGreaterThan(0);
 expect(s.trilogy.worldContacts[4]).toBeGreaterThan(0);
 expect(s.trilogy.journeys.every(j=>j.validation.valid)).toBe(true);
 expect(s.trilogy.maxRadiusError).toBeLessThan(.002);
 expect(s.trilogy.cameraFinite).toBe(true);
 expect(s.trilogy.maxCameraTurn).toBeLessThan(1.2);
 expect(errors).toEqual([]);
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/w96-six-world-browser-evidence.json',JSON.stringify({s,errors},null,2));
});
