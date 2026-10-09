import {describe,it,expect} from 'vitest';
import {spiralSpec,spiralPosition,generateSpiralRoad,projectSpiral,spiralMetrics}
 from '../../spikes/w9-ball/src/SpiralCourse';
describe('W10 true spatial 360 degree spiral',()=>{
 it('genuinely reverses global-Z direction within a full 360 horizontal coil, climbs high and descends',()=>{
  const s=spiralSpec(3,17,1340,1860,12),r=generateSpiralRoad(s),m=spiralMetrics(s);
  expect(m.rotationDegrees).toBe(360);expect(m.rise).toBeGreaterThan(55);
  expect(m.radius).toBeGreaterThan(35);expect(m.length).toBeGreaterThan(620);
  expect(r.length).toBe(537);
  expect(r.filter((p,i)=>i&&p.z>r[i-1]!.z+.02).length).toBeGreaterThan(50);
  const a=spiralPosition(s,s.coilStart),b=spiralPosition(s,s.coilEnd);
  expect(a.x).toBeCloseTo(b.x,5);expect(a.z).toBeCloseTo(b.z,5);
  expect(Math.abs(a.y-b.y)).toBeGreaterThan(50);
  expect(spiralPosition(s,s.end).z).toBeCloseTo(7-s.end);
  expect(m.maxTurn).toBeLessThan(.12);
  expect(m.maxPitch).toBeLessThan(.85);
 });
 it('3D nearest-point progress increases even while the ball goes backwards in world Z',()=>{
  const s=spiralSpec(3,17,1340,1860,-7),r=generateSpiralRoad(s);
  let hint=12,last=s.start-12,reverse=0;
  for(let d=s.start;d<=s.end;d+=3){
   const p=spiralPosition(s,d);
   const q=projectSpiral(r,{x:p.x,y:p.y+1.1,z:p.z},hint);
   expect(Math.abs(q.d-d)).toBeLessThan(1.5);
   expect(q.d).toBeGreaterThanOrEqual(last-.5);
   if(d>s.coilStart+30&&d<s.coilEnd-30&&p.z>spiralPosition(s,d-3).z)reverse++;
   hint=q.index;last=q.d;
  }
  expect(reverse).toBeGreaterThan(14);
 });
 it('1000 seeded spiral stages have stable ports, 360 turn and large varied radius/rise',()=>{
  const fingerprints=new Set<string>();
  for(let i=3;i<1000;i++){
   const start=1340+(i-3)*700,end=start+520;
   const a=spiralSpec(i,17,start,end,(i%7)*9),b=spiralSpec(i,17,start,end,(i%7)*9);
   expect(a).toEqual(b);
   const metrics=spiralMetrics(a);
   expect(metrics.rotationDegrees).toBe(360);
   expect(metrics.length).toBeGreaterThan(600);
   expect(metrics.maxTurn).toBeLessThan(.16);
   expect(metrics.maxPitch).toBeLessThan(.95);
   fingerprints.add([a.hand,Math.round(a.radius*100),Math.round(a.rise*100)].join('/'));
  }
  expect(fingerprints.size).toBeGreaterThan(980);
 });
});
