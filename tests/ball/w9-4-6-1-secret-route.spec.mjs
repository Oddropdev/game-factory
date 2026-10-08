import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const folder=path.resolve('evidence/w9-4-6-1');
fs.mkdirSync(folder,{recursive:true});
const snap=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
const progress=s=>7-s.position[2];

test('W9.4-6.1 optional secret rail is actually selectable, climbs, rides and returns via physical TOP',async({page})=>{
  test.setTimeout(65_000);
  page.setDefaultTimeout(5000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/ball/?mode=grind');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await expect.poll(async()=>progress(await snap(page)),{timeout:25_000}).toBeGreaterThan(302);
  // A real player steering choice; not a teleport or test-only body setter.
  await page.mouse.move(48,595);
  await page.mouse.down();
  const samples=[],start=Date.now();
  let peak=0,rode=false,climbed=false,descended=false,finished=false;
  let previousSecretFrames=0;
  while(Date.now()-start<24_000){
    const s=await snap(page);
    const p=progress(s);
    if(s.grindSecretFrames>previousSecretFrames){
      rode=true;
      peak=Math.max(peak,s.position[1]);
      if(p>=359&&p<=385&&s.position[1]>=2.7)climbed=true;
      if(p>391&&p<=418&&s.position[1]<peak-.5)descended=true;
    }
    previousSecretFrames=s.grindSecretFrames;
    if(samples.length===0||p-samples[samples.length-1].p>8)
      samples.push({p:+p.toFixed(1),x:+s.position[0].toFixed(2),
        y:+s.position[1].toFixed(2),speed:+s.planarSpeed.toFixed(1),
        secret:s.grindSecretFrames,side:s.grindSideContactEvents,
        top:s.grindTopContactEvents,falls:s.fallCount,phase:s.phase});
    if(s.phase==='complete'||s.phase==='error'){finished=true;break;}
    if(p>422)break;
    await page.waitForTimeout(65);
  }
  await page.mouse.up();
  const end=await snap(page);
  console.log('W9461_SECRET_TRACE',JSON.stringify({samples,rode,climbed,descended,
    peak,end:{phase:end.phase,position:end.position,falls:end.fallCount,
    secret:end.grindSecretFrames,entries:end.grindEntries,
    top:end.grindTopContactEvents,side:end.grindSideContactEvents}}));
  await page.screenshot({path:path.join(folder,'secret-route-end.png')});
  expect(errors).toEqual([]);
  expect(end.fallCount).toBe(0);
  expect(rode).toBe(true);
  expect(climbed).toBe(true);
  expect(descended).toBe(true);
  expect(peak).toBeGreaterThan(3);
});

test('W9.4-6.1 center-lane baseline may bypass secret without free TOP reward',async({page})=>{
  test.setTimeout(50_000);
  await page.goto('/ball/?mode=grind');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await expect.poll(async()=>progress(await snap(page)),{timeout:27_000}).toBeGreaterThan(411);
  const end=await snap(page);
  console.log('W9461_CENTER_TRACE',JSON.stringify({pos:end.position,secret:end.grindSecretFrames,fallCount:end.fallCount}));
  expect(end.fallCount).toBe(0);
  expect(end.grindSecretFrames).toBe(0);
});
