import {describe,it,expect} from 'vitest';
import {railContactSide,magneticAssist} from '../../spikes/w9-ball/src/MagneticGuardAssist';
import {roadSurfaceY,sweptDeckCatch} from '../../spikes/w9-ball/src/RoadContactSweep';
describe('W10.2 real magnetic guard only',()=>{
 it('recognizes exact real W10 physical guard collision identities',()=>{
  expect(railContactSide('w10-physical-guard-1-150')).toBe(1);
  expect(railContactSide('w10-physical-guard--1-280')).toBe(-1);
  expect(railContactSide('w97-guard-1-120')).toBeNull();
  expect(railContactSide('trilogy-road-something')).toBeNull();
 });
 it('magnets grip near an actual contacting wall, accelerate forward and release opposite swipe',()=>{
  const args={side:1 as const,lateral:4.65,halfWidth:5.4,
   sideSpeed:0,forward:34,steer:.3,now:10,cooldownUntil:0};
  const active=magneticAssist(args);
  expect(active.locked).toBe(true);expect(active.drive).toBeGreaterThan(40);
  expect(active.drive).toBeLessThanOrEqual(90);
  expect(active.spark).toBe(true);
  const release=magneticAssist({...args,steer:-.9});
  expect(release.release).toBe(true);expect(release.locked).toBe(false);
  expect(release.drive).toBe(0);
  expect(magneticAssist({...args,cooldownUntil:11}).locked).toBe(false);
 });
 it('never invents a side magnet when nowhere near the physical rail',()=>{
  const result=magneticAssist({side:-1,lateral:0,halfWidth:5.4,
   sideSpeed:0,forward:10,steer:0,now:10,cooldownUntil:0});
  expect(result.locked).toBe(false);
  expect(result.pull).toBe(0);expect(result.drive).toBe(0);
 });
});
describe('W10.2 collision catch never becomes an invisible wall',()=>{
 const base={previousGap:.72,currentGap:-1.5,currentLateral:1,
  halfWidth:5.4,travel:4,verticalSpeed:-13,roadProgressJump:4};
 it('catches real top-face crossings missed by high-speed Bullet steps',()=>{
  expect(sweptDeckCatch(base)).toBe(true);
  expect(roadSurfaceY(6,20,3)).toBeGreaterThan(6.9);
 });
 it('does not catch sidefalls, backward underside hits, or unsupported gaps',()=>{
  expect(sweptDeckCatch({...base,currentLateral:6})).toBe(false);
  expect(sweptDeckCatch({...base,previousGap:-1})).toBe(false);
  expect(sweptDeckCatch({...base,travel:13})).toBe(false);
  expect(sweptDeckCatch({...base,roadProgressJump:18})).toBe(false);
  expect(sweptDeckCatch({...base,verticalSpeed:2})).toBe(false);
  expect(sweptDeckCatch({...base,currentGap:-6})).toBe(false);
 });
});
