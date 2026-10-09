import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
const read=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
async function boot(page,url='/ball/?mode=trilogy&seed=17'){
 await page.goto(url);await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:30000}).toBe(true);
}
test('continuous three worlds: real loads, seeds, physics, disposal and finish',async({page})=>{
 test.setTimeout(240000);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('/levels/'))requests.push(r.url().split('/levels/')[1]);});
 await boot(page);const initial=await read(page);
 expect(initial.trilogy.worldIndex).toBe(1);expect(initial.trilogy.activeWorldRoots).toBe(1);
 expect(requests).toEqual(['crystal.json','crystal-road.json']);
 await page.locator('#start').click();
 await expect.poll(async()=>(await read(page))?.elapsed,{timeout:20000}).toBeGreaterThan(2);
 await page.screenshot({path:'test-results/w95-crystal.png'});
 await expect.poll(async()=>(await read(page))?.trilogy.entries,{timeout:140000,intervals:[250]}).toBe(1);
 await page.keyboard.press('ArrowRight');
 await expect.poll(async()=>Math.abs((await read(page)).trilogy.angle)).toBeGreaterThan(.05);
 await expect.poll(async()=>(await read(page))?.trilogy.worldIndex,{timeout:60000,intervals:[150]}).toBe(2);
 await page.screenshot({path:'test-results/w95-candy.png'});
 await expect.poll(async()=>(await read(page))?.trilogy.worldIndex,{timeout:60000,intervals:[150]}).toBe(3);
 await page.screenshot({path:'test-results/w95-rainbow.png'});
 await expect.poll(async()=>(await read(page))?.phase,{timeout:60000,intervals:[200]}).toBe('complete');
 const s=await read(page),t=s.trilogy;
 expect(t.entries).toBe(2);expect(t.exits).toBe(2);expect(t.retired.map(w=>w.id)).toEqual(['crystal','candy']);
 expect(t.retired.every(w=>w.disposed&&!w.active)).toBe(true);expect(t.activeWorldRoots).toBe(1);
 expect(t.worldContacts[1]).toBeGreaterThan(0);expect(t.worldContacts[2]).toBeGreaterThan(0);
 expect(t.journeys[0].fingerprint).not.toBe(t.journeys[1].fingerprint);
 expect(t.journeys.every(j=>j.validation.valid)).toBe(true);expect(t.invertedFrames).toBeGreaterThan(5);
 expect(t.maxRadiusError).toBeLessThan(.002);expect(t.falls+s.fallCount).toBe(0);expect(t.gems).toBeGreaterThan(10);
 expect(requests).toEqual(['crystal.json','crystal-road.json','candy.json','candy-road.json','rainbow.json','rainbow-road.json']);
 for(let i=1;i<=2;i++){
  const order=t.history.filter(e=>e.world===i).map(e=>e.event);
  expect(order.indexOf('fetch-start')).toBeLessThan(order.indexOf('prepared-disabled'));
  expect(order.indexOf('prepared-disabled')).toBeLessThan(order.indexOf('activated'));
 }
 expect(errors).toEqual([]);await mkdir('test-results',{recursive:true});
 await writeFile('test-results/w95-continuous-evidence.json',JSON.stringify({state:s,requests,errors},null,2));
});
