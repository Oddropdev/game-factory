import {describe,it,expect} from 'vitest';
import {buildMacroCourse} from '../../spikes/w9-ball/src/MacroCourse';
import {generateSpiralRoad,spiralSpec} from '../../spikes/w9-ball/src/SpiralCourse';
import {smoothRoad,roadContinuity} from '../../spikes/w9-ball/src/SmoothRoad';
import {SmoothLateralDrive} from '../../spikes/w9-ball/src/SmoothLateralDrive';
import {cornerGuardPlan,outerTurn} from '../../spikes/w9-ball/src/OuterCornerRails';
describe('W10.7 one continuous source for physics and pixels',()=>{
 it('approved full 360-degree coil gains smooth joins without moving the tube ports',()=>{
  const raw=generateSpiralRoad(spiralSpec(3,17,1340,1860,0));
  const smooth=smoothRoad(raw,10,2);
  const before=roadContinuity(raw),after=roadContinuity(smooth);
  expect(smooth).toHaveLength(raw.length);
  expect(smooth[0]).toEqual(raw[0]);expect(smooth.at(-1)).toEqual(raw.at(-1));
  expect(after.maxTurn).toBeLessThan(before.maxTurn);
  expect(after.maxTurn).toBeLessThan(.12);
  expect(after.maxStep).toBeLessThan(8);
 });
 it('1000 seeded combinations stay finite and smoothed on hills, drops, loops and switchbacks',()=>{
  let softened=0;
  for(let index=3;index<1003;index++){
   const start=1340+(index-3)*700;
   const macro=buildMacroCourse(index,17,start,start+520,0,'extreme');
   const smooth=smoothRoad(macro.road,10,2);
   const metrics=roadContinuity(smooth);
   expect(metrics.maxTurn).toBeLessThan(.24);
   expect(metrics.maxStep).toBeLessThan(8);
   expect(smooth[0]).toEqual(macro.road[0]);
   expect(smooth.at(-1)).toEqual(macro.road.at(-1));
   if(metrics.maxTurn<roadContinuity(macro.road).maxTurn)softened++;
  }
  expect(softened).toBeGreaterThan(900);
 },30000);
});
describe('W10.7 actual outside curve guards',()=>{
 it('a known full 360 loop gets frequent short single-side sections',()=>{
  const road=smoothRoad(generateSpiralRoad(spiralSpec(3,17,1340,1860,0)),10,2);
  const plan=cornerGuardPlan(road);
  expect(plan.length).toBeGreaterThan(18);
  expect(plan.every(g=>g.end-g.start<=7)).toBe(true);
  expect(plan.every(g=>g.side===1||g.side===-1)).toBe(true);
  expect(plan.some(g=>g.turn>.14)).toBe(true);
  for(const g of plan){
   const turn=outerTurn(road,Math.floor((g.start+g.end)/2));
   expect(Math.sign(turn)).toBe(-g.side);
  }
 });
 it('perfectly straight road must never get fake guards',()=>{
  const road=Array.from({length:300},(_,i)=>({d:i,x:0,y:0,z:-i,bank:0,width:10.8}));
  expect(cornerGuardPlan(road)).toHaveLength(0);
 });
});
describe('W10.7 stable manual steering without autopilot',()=>{
 it('caps lateral acceleration and jerk; idle settles lateral speed not track center',()=>{
  const controller=new SmoothLateralDrive(),dt=1/90;
  let last=0,max=0;
  for(let i=0;i<400;i++){
   const input=i<90?1:i<180?-1:0;
   const v=controller.step(dt,input,0,74);
   expect(Math.abs(v.accel)).toBeLessThanOrEqual(30.00001);
   expect(Math.abs(v.accel-last)).toBeLessThanOrEqual(220*dt+.00001);
   max=Math.max(max,Math.abs(v.accel));last=v.accel;
  }
  expect(max).toBeGreaterThan(10);
  controller.reset();
  expect(controller.step(dt,0,0,0).accel).toBe(0);
 });
});
