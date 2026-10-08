import { expect, test } from '@playwright/test';

const snap=page=>page.evaluate(()=>globalThis.__W9_BALL_TEST__?.snapshot());
test('W9.4-2 default build preserves Bullet play even without paid assets',async({page})=>{
  test.setTimeout(30_000);
  const external=[],privateRequests=[];
  page.on('request',r=>{
    if(r.url().includes('/licensed/'))privateRequests.push(r.url());
    if(!r.url().startsWith('http://127.0.0.1:4177/')&&!r.url().startsWith('data:'))external.push(r.url());
  });
  await page.goto('/ball/');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  const initial=await snap(page);
  expect(initial.artMode).toBe('placeholder');
  expect(initial.licensedModels).toBe(0);
  expect(initial.dynamicBallStillPhysics).toBe(true);
  expect(privateRequests).toEqual([]);
  expect(external).toEqual([]);
  await page.locator('#start').click();
  await expect.poll(async()=>(await snap(page))?.position?.[2],{timeout:8000}).toBeLessThan(-3);
  expect((await snap(page)).rigidbodyType).toBe('dynamic');
});

test('W9.4-2 owner-installed GLBs load without changing Bullet physics',async({page})=>{
  test.skip(process.env.W9_4_2_LICENSED_ART!=='1',
    'Owner-licensed GLBs are intentionally absent from public GitHub Actions');
  test.setTimeout(40_000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/ball/');
  await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:20_000}).toBe(true);
  const initial=await snap(page);
  expect(initial.artMode).toBe('licensed');
  expect(initial.licensedModels).toBe(6);
  expect(initial.licensedMeshes).toBe(21); // 6 planks + 4 bumpers + 9 trees + ball + checkpoint
  expect(initial.licensedMissing).toEqual([]);
  expect(initial.dynamicBallStillPhysics).toBe(true);
  await page.screenshot({path:'evidence/w9-4-2-private-licensed-ready.png'});
  await page.locator('#start').click();
  await expect.poll(async()=>(await snap(page))?.position?.[2],{timeout:9000}).toBeLessThan(-3);
  expect((await snap(page)).rigidbodyType).toBe('dynamic');
  expect(errors).toEqual([]);
});
