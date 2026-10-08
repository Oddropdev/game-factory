import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const root=path.resolve('evidence/w9-4-5');
fs.mkdirSync(root,{recursive:true});
const snap=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
const cases=[{id:'portrait-390x844',width:390,height:844},
  {id:'small-android-360x800',width:360,height:800},
  {id:'landscape-844x390',width:844,height:390}];

for(const vp of cases){
  test('W9.4-5 long curve contact drives magnetic glow + real sparks '+vp.id,
    async({page})=>{
      test.setTimeout(55_000);
      await page.setViewportSize({width:vp.width,height:vp.height});
      const errors=[],remote=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{
        if(!r.url().startsWith('http://127.0.0.1:4177/')&&!r.url().startsWith('data:'))
          remote.push(r.url());
      });
      await page.goto('/ball/?mode=rail');
      await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
      const first=await snap(page);
      expect(first.railMode).toBe(true);
      expect(first.rigidbodyType).toBe('dynamic');
      expect(first.courseLength).toBe(440);
      expect(first.magneticRailSections).toBe(3);
      expect(first.magneticRailSegments).toBeGreaterThanOrEqual(45);
      expect(first.railContactEvents).toBe(0);
      expect(first.railSparkCount).toBe(0);
      expect(first.railGlowSections).toEqual([]);
      expect(first.treeCount).toBe(0);
      expect(first.fullViewport).toBe(true);
      await page.screenshot({path:path.join(root,vp.id+'-idle-green-rail.png')});

      // Press near the outer (right-hand) long curve rail before reaching it.
      // The test is real UI steering, not a fake injected physics state.
      await page.locator('#start').click();
      await page.mouse.move(vp.width*.985,vp.height*.72);
      await page.mouse.down();
      await expect.poll(async()=>(await snap(page))?.railApproachFrames,{timeout:10_000})
        .toBeGreaterThan(0);
      await expect.poll(async()=>(await snap(page))?.railContactEvents,{timeout:12_000})
        .toBeGreaterThan(0);
      await expect.poll(async()=>(await snap(page))?.railBoostFrames,{timeout:8_000})
        .toBeGreaterThan(0);
      // Atomically sample contact, glow and sparks in the SAME physics
      // snapshot; separate awaited polls can straddle the afterglow timeout.
      let contact;
      await expect.poll(async()=>{
        contact=await snap(page);
        return contact.railSparkCount>0&&contact.railGlowSections.length>0&&
          contact.railBoostFrames>0&&contact.railBoostSpeedGain>0;
      },{timeout:5_000}).toBe(true);
      expect(contact.railDownForceEvents).toBeGreaterThan(0);
      expect(contact.railAssistSeconds).toBeGreaterThan(0);
      expect(contact.rigidbodyType).toBe('dynamic');
      await page.screenshot({path:path.join(root,vp.id+'-contact-sparks.png')});
      await page.mouse.up();
      expect(errors).toEqual([]);
      expect(remote).toEqual([]);
  });
}

test('W9.4-5 no rail contact: zero sparks and zero contact-only acceleration',
  async({page})=>{
    test.setTimeout(48_000);
    await page.goto('/ball/?mode=rail');
    await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
    await page.locator('#start').click(); // centered input, no sideways steer
    await expect.poll(async()=>(await snap(page))?.position?.[2],{timeout:13_000})
      .toBeLessThan(-85);
    const middle=await snap(page);
    expect(middle.railContactEvents).toBe(0);
    expect(middle.railBoostFrames).toBe(0);
    expect(middle.railSparkCount).toBe(0);
    expect(middle.railGlowSections).toEqual([]);
    expect(middle.railBoostSpeedGain).toBe(0);
});

test('W9.4-5 long rail mode retains real jump, all boosts and clean finish',
  async({page})=>{
    test.setTimeout(65_000);
    await page.goto('/ball/?mode=rail');
    await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
    await page.locator('#start').click();
    await expect.poll(async()=>(await snap(page))?.phase,{timeout:45_000})
      .toBe('complete');
    const final=await snap(page);
    expect(final.jumpCount).toBe(1);
    expect(final.landingContactEvents).toBe(1);
    expect(final.landingCount).toBe(1);
    expect(final.fallCount).toBe(0);
    expect(final.boostCount).toBe(7);
    expect(final.maxSpeedObserved).toBeLessThanOrEqual(65);
    expect(final.magneticRailSections).toBe(3);
    await page.screenshot({path:path.join(root,'portrait-rail-full-finish.png')});
});

test('W9.4-5 swipe still creates physical acceleration and allows steering away',
  async({page})=>{
    test.setTimeout(55_000);
    await page.goto('/ball/?mode=rail');
    await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
    await page.locator('#start').click();
    await page.mouse.move(381,690);
    await page.mouse.down();
    await page.mouse.move(381,575,{steps:3});
    await page.mouse.move(381,453,{steps:3});
    await expect.poll(async()=>(await snap(page))?.swipeCount).toBeGreaterThanOrEqual(2);
    await expect.poll(async()=>(await snap(page))?.railContactEvents,{timeout:12_000})
      .toBeGreaterThan(0);
    await page.mouse.move(5,400,{steps:4});
    await expect.poll(async()=>(await snap(page))?.targetX).toBeLessThan(-2);
    await page.mouse.up();
    expect((await snap(page)).rigidbodyType).toBe('dynamic');
});
