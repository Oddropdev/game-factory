import process from 'node:process';
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
 expect(t.retired.every(w=>w.disposed&&!w.active&&w.liveBodies===0)).toBe(true);expect(t.activeWorldRoots).toBe(1);
 expect(t.worldContacts[1]).toBeGreaterThan(0);expect(t.worldContacts[2]).toBeGreaterThan(0);
 expect(t.journeys[0].fingerprint).not.toBe(t.journeys[1].fingerprint);
 expect(t.journeys.every(j=>j.validation.valid)).toBe(true);expect(t.invertedFrames).toBeGreaterThan(5);
 expect(t.cameraFinite).toBe(true);expect(t.maxCameraTurn).toBeLessThan(1.2);expect(t.cameraMinClearance).toBeGreaterThan(2.5);
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

test('late geometry and failed manifest hold safely, then recover without losing score',async({page})=>{
 test.setTimeout(280000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let candyRelease;const gate=new Promise(resolve=>{candyRelease=resolve;});
 await page.route('**/levels/candy-road.json',async route=>{
  const response=await route.fetch();await gate;await route.fulfill({response}).catch(()=>{});
 });
 let failRainbow=true;
 await page.route('**/levels/rainbow.json',async route=>{
  if(failRainbow)await route.fulfill({status:503,body:'temporarily unavailable'});else await route.continue();
 });
 await boot(page,'/ball/?mode=trilogy&seed=27');await page.locator('#start').click();
 await expect.poll(async()=>(await read(page))?.trilogy.state,{timeout:150000,intervals:[300]}).toBe('holding');
 const holdA=await read(page);expect(holdA.trilogy.worldIndex).toBe(1);expect(holdA.rigidbodyType).toBe('kinematic');
 expect(holdA.trilogy.retired).toHaveLength(0);expect(holdA.trilogy.maxRadiusError).toBeLessThan(.002);
 candyRelease();
 await expect.poll(async()=>(await read(page))?.trilogy.worldIndex,{timeout:40000}).toBe(2);
 expect((await read(page)).trilogy.gems).toBeGreaterThanOrEqual(holdA.trilogy.gems);
 await expect.poll(async()=>(await read(page))?.trilogy.state,{timeout:60000,intervals:[300]}).toBe('holding');
 const holdB=await read(page);expect(holdB.trilogy.worldIndex).toBe(2);expect(holdB.rigidbodyType).toBe('kinematic');
 expect(holdB.trilogy.retired).toHaveLength(1);expect(holdB.trilogy.exits).toBe(1);expect(holdB.trilogy.loadError).toContain('503');
 failRainbow=false;
 await expect.poll(async()=>(await read(page))?.phase,{timeout:70000,intervals:[300]}).toBe('complete');
 const end=await read(page);expect(end.trilogy.exits).toBe(2);expect(end.trilogy.holdSeconds).toBeGreaterThan(.1);
 expect(end.trilogy.maxRadiusError).toBeLessThan(.002);expect(end.trilogy.falls+end.fallCount).toBe(0);expect(errors).toEqual([]);
 await writeFile('test-results/w95-loading-recovery.json',JSON.stringify({holdA,holdB,end,errors},null,2));
});

test('legacy twolevel keeps real jump, floorless grind, transit and second-level finish',async({page})=>{
 test.setTimeout(160000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await boot(page,'/ball/?mode=twolevel');await page.locator('#start').click();
 await expect.poll(async()=>(await read(page))?.phase,{timeout:145000,intervals:[250]}).toBe('complete');
 const s=await read(page);expect(s.levelTwoComplete).toBe(true);expect(s.tubeEntries).toBe(1);expect(s.tubeExits).toBe(1);
 expect(s.jumpCount).toBe(1);expect(s.landingCount).toBe(1);expect(s.grindFalseSideRewards).toBe(0);
 expect(s.grindVoidEarlyFrames).toBeGreaterThan(0);expect(s.grindVoidLateFrames).toBeGreaterThan(0);
 expect(s.level2RoadContactEvents).toBeGreaterThan(0);expect(s.fallCount).toBe(0);expect(errors).toEqual([]);
 await writeFile('test-results/w95-legacy-twolevel.json',JSON.stringify(s,null,2));
});

test('legacy guards still lock on contact and release on opposite swipe',async({page})=>{
 await boot(page,'/ball/?mode=grind');await page.locator('#start').click();
 await page.mouse.move(387,650);await page.mouse.down();
 await expect.poll(async()=>(await read(page))?.guardLock,{timeout:45000,intervals:[100]}).toMatch(/^locked-(side|top)$/);
 await page.mouse.move(4,620,{steps:2});
 await expect.poll(async()=>(await read(page))?.guardReleaseByOppositeSwipe,{timeout:5000}).toBeGreaterThan(0);
 await page.mouse.up();const s=await read(page);
 expect(s.guardHoldFrames).toBeGreaterThan(0);expect(s.railContactEvents).toBeGreaterThan(0);expect(s.guardReleaseSwipePx).toBeGreaterThan(65);
 await writeFile('test-results/w95-legacy-guard.json',JSON.stringify(s,null,2));
});

test('legacy standalone transit and jump retain their mode boundaries',async({page})=>{
 for(const mode of ['transit','jump']){
  await boot(page,'/ball/?mode='+mode);const s=await read(page);
  expect(s.trilogyMode).toBe(false);expect(s.trilogy).toBe(null);expect(s.rigidbodyType).toBe('dynamic');
  expect(s.courseLength).toBe(mode==='transit'?620:440);
  expect(s.tubeMeshCount).toBe(mode==='transit'?3:0);
  expect(s.nextLevelLoadState).toBe('idle');
 }
});

test('owner-only purchased visuals survive both resource handoffs',async({page})=>{
 test.skip(process.env.W95_OWNER!=='1','Requires local purchased packs; never supplied to public CI');
 test.setTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await boot(page,'/ball/?mode=trilogy&seed=17&art=licensed');
 expect((await read(page)).trilogy.privateMeshes).toBeGreaterThan(5);
 await page.locator('#start').click();
 await expect.poll(async()=>(await read(page)).elapsed,{timeout:20000}).toBeGreaterThan(2.5);
 if(process.env.W95_OWNER_SKIP_CRYSTAL!=='1')await page.screenshot({path:'test-results/w95-final-crystal.png'});
 await expect.poll(async()=>(await read(page)).trilogy.invertedFrames,{timeout:120000,intervals:[100]}).toBeGreaterThan(2);
 await page.screenshot({path:'test-results/w95-final-coaster.png'});
 await expect.poll(async()=>(await read(page)).trilogy.worldIndex,{timeout:60000,intervals:[200]}).toBe(2);
 const candy=await read(page);expect(candy.trilogy.active.privateMeshes).toBeGreaterThan(3);expect(candy.trilogy.active.missing).toEqual([]);
 if(process.env.W95_OWNER_SKIP_WORLDS!=='1')await page.screenshot({path:'test-results/w95-final-candy.png'});
 await expect.poll(async()=>(await read(page)).trilogy.worldIndex,{timeout:60000,intervals:[200]}).toBe(3);
 const rainbow=await read(page);expect(rainbow.trilogy.active.privateMeshes).toBeGreaterThan(10);expect(rainbow.trilogy.active.missing).toEqual([]);
 if(process.env.W95_OWNER_SKIP_WORLDS!=='1')await page.screenshot({path:'test-results/w95-final-rainbow.png'});
 await expect.poll(async()=>(await read(page)).phase,{timeout:60000}).toBe('complete');
 const s=await read(page);await writeFile('test-results/w95-owner-evidence.json',JSON.stringify({s,candy,rainbow,errors},null,2));expect(s.trilogy.cameraFinite).toBe(true);expect(s.trilogy.maxCameraTurn).toBeLessThan(1.2);expect(s.trilogy.cameraMinClearance).toBeGreaterThan(2.5);
 expect(s.trilogy.retired.every(w=>w.disposed&&w.liveBodies===0)).toBe(true);expect(s.trilogy.falls+s.fallCount).toBe(0);expect(errors).toEqual([]);
});
