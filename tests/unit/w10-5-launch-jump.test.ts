import {describe,it,expect} from 'vitest';
import {jumpPlan,withLaunchJump,inRealGap,validateJump,rampHeight} from
 '../../spikes/w9-ball/src/LaunchJump';
import {buildMacroCourse,validateMacroCourse} from
 '../../spikes/w9-ball/src/MacroCourse';
describe('W10.5 genuine ballistic launch/landing planning',()=>{
 it('physical gap is 18 meters, real lip tangent gives positive launch and safe landing window',()=>{
  const j=jumpPlan(2040),v=validateJump(j);
  expect(v.valid).toBe(true);
  expect(v.airMeters).toBe(18);
  expect(v.lipDerivative).toBeGreaterThan(.1);
  expect(v.flightHeight).toBeGreaterThan(-.6);
  expect(inRealGap(j.gapStart+4,j)).toBe(true);
  expect(inRealGap(j.gapStart-1,j)).toBe(false);
  expect(inRealGap(j.gapEnd,j)).toBe(false);
  expect(rampHeight(j.rampStart,j)).toBe(0);
  expect(rampHeight(j.gapStart,j)).toBeCloseTo(j.rise,6);
  expect(rampHeight(j.gapEnd,j)).toBeCloseTo(j.rise,6);
  expect(rampHeight(j.blendEnd,j)).toBe(0);
 });
 it('1k sampled worlds retain safe macro geometry after real ramp inserted',()=>{
  for(let index=4;index<1004;index++){
   const start=1340+(index-3)*700,end=start+520;
   const c=buildMacroCourse(index,17,start,end,9*(index%7));
   const road=withLaunchJump(c.road,jumpPlan(start));
   const result=validateMacroCourse({...c,road});
   expect(result.valid,JSON.stringify({index,...result})).toBe(true);
   expect(road).toHaveLength(537);
   expect(road.find(p=>p.d===start)!.y).toBe(0);
   expect(road.find(p=>p.d===end)!.y).toBe(0);
   expect(road.find(p=>p.d===start+50)!.y).toBeCloseTo(2.25);
  }
 },30000);
});
