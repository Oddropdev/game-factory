import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const evidence=path.resolve('evidence/w9-4-1');
fs.mkdirSync(evidence,{recursive:true});
const snap=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
const sizes=[
  {name:'portrait-390x844',width:390,height:844},
  {name:'small-android-360x800',width:360,height:800},
  {name:'landscape-844x390',width:844,height:390}
];
for(const size of sizes) {
  test('W9.4 actual Ammo rigidbody and viewport '+size.name,async({page})=>{
    test.setTimeout(35_000);
    await page.setViewportSize({width:size.width,height:size.height});
    const pageErrors=[],remote=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    page.on('request',r=>{
      if(!r.url().startsWith('http://127.0.0.1:4177/')&&!r.url().startsWith('data:'))
        remote.push(r.url());
    });
    await page.goto('/ball/');
    await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
    await expect.poll(async()=>(await snap(page))?.frames).toBeGreaterThan(10);
    const initial=await snap(page);
    expect(initial.physicsBackend).toBe('ammo-bullet');
    expect(initial.rigidbodyType).toBe('dynamic');
    expect(initial.coursePlanks).toBe(6);
    expect(initial.physicalBumpers).toBe(4);
    expect(initial.fullViewport).toBe(true);
    expect(initial.localWasm).toContain('/ball/ammo/ammo.wasm.wasm');
    await page.screenshot({path:path.join(evidence,size.name+'-ready.png')});
    const status=page.locator('#status');
    await expect(status).toContainText('PHYSICS READY');
    await page.locator('#start').click();
    await page.waitForTimeout(1200);
    const physicsAfterStart=await snap(page);
    globalThis.console.log('W9_4_PHYSICS_INITIAL_DRIVE '+JSON.stringify({
      position:physicsAfterStart.position,
      velocity:physicsAfterStart.linearVelocity,
      spin:physicsAfterStart.angularVelocity,
      falls:physicsAfterStart.fallCount,
      phase:physicsAfterStart.phase,
      frames:physicsAfterStart.physicsFrames
    }));
    expect(physicsAfterStart.fallCount).toBe(0);
    await expect.poll(async()=> (await snap(page))?.position?.[2],{timeout:7_000})
      .toBeLessThan(-1);
    const moving=await snap(page);
    expect(moving.physicsFrames).toBeGreaterThan(15);
    expect(moving.position[1]).toBeLessThan(initial.position[1]+1);
    expect(Math.abs(moving.angularVelocity[0])+Math.abs(moving.angularVelocity[2]))
      .toBeGreaterThan(.05);
    await page.screenshot({path:path.join(evidence,size.name+'-moving.png')});
    expect(pageErrors).toEqual([]);
    expect(remote).toEqual([]);
  });
}

test('W9.4 finger drag changes real rigidbody X, not a cosmetic transform',async({page})=>{
  test.setTimeout(30_000);
  await page.goto('/ball/');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await page.mouse.move(350,610);
  await page.mouse.down();
  await expect.poll(async()=>(await snap(page))?.position?.[0],{timeout:5_000})
    .toBeGreaterThan(.9);
  const right=await snap(page);
  expect(right.targetX).toBeGreaterThan(2);
  await page.mouse.move(50,610);
  await expect.poll(async()=>(await snap(page))?.targetX).toBeLessThan(-2);
  await expect.poll(async()=>(await snap(page))?.position?.[0],{timeout:6_000})
    .toBeLessThan(right.position[0]-.5);
  await page.mouse.up();
  const left=await snap(page);
  expect(left.rigidbodyType).toBe('dynamic');
  expect(left.position[2]).toBeLessThan(right.position[2]);
  await page.screenshot({path:path.join(evidence,'portrait-steering.png')});
});

test('W9.4 restart resets physical momentum and adds no gameplay mutation',async({page})=>{
  test.setTimeout(30_000);
  await page.goto('/ball/');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  await expect.poll(async()=>(await snap(page))?.position?.[2]).toBeLessThan(-3);
  const before=await snap(page);
  await page.keyboard.press('Space');
  await expect.poll(async()=>(await snap(page))?.attempts).toBe(2);
  const after=await snap(page);
  expect(after.position[2]).toBeGreaterThan(before.position[2]);
  expect(after.rigidbodyType).toBe('dynamic');
  expect(after.gemCount).toBe(0);
  expect(after.phase).toBe('running');
});

test('W9.4 live bumper collision is reported by Ammo collision callbacks',async({page})=>{
  test.setTimeout(30_000);
  await page.goto('/ball/');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  await page.locator('#start').click();
  // The first bumper is centered on the unsteered lane at z=-17.
  await expect.poll(async()=>(await snap(page))?.bumpCount,{timeout:12_000})
    .toBeGreaterThanOrEqual(1);
  const hit=await snap(page);
  expect(hit.position[2]).toBeLessThan(-10);
  // Physical collision is authoritative; 60 render frames is not a stable
  // timing contract on low-FPS mobile GPUs or Chromium software rendering.
  expect(hit.physicsFrames).toBeGreaterThan(15);
});
