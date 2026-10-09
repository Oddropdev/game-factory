import {describe,it,expect} from 'vitest';
import {buildMacroCourse,validateMacroCourse} from '../../spikes/w9-ball/src/MacroCourse';
import {exitVelocity,exitAfterburner} from '../../spikes/w9-ball/src/EntryBoost';
import {spiralPosition} from '../../spikes/w9-ball/src/SpiralCourse';
describe('W10.4 1000 playable-scale, diverse physical macro road proposals',()=>{
 it('1000 seeded worlds: no angle cracks, tube ports exact, long hills and multiple macro families',()=>{
  const kinds=new Set<string>(),signatures=new Set<string>();let reverse=0;
  for(let index=3;index<1003;index++){
   const start=1340+(index-3)*700,end=start+520,seed=17;
   const c=buildMacroCourse(index,seed,start,end,(index%7)*9);
   const verdict=validateMacroCourse(c);
   expect(verdict.valid,JSON.stringify({index,...verdict})).toBe(true);
   expect(verdict.ports).toBeLessThan(.001);
   expect(verdict.length).toBeGreaterThan(500);
   expect(c.road).toHaveLength(537);
   expect(c.motifs).toHaveLength(3);
   expect(c.signature).toBe(buildMacroCourse(index,seed,start,end,(index%7)*9).signature);
   kinds.add(c.kind);signatures.add(c.signature);
   if(verdict.reverseZ>15)reverse++;
   for(const p of c.road)expect(Number.isFinite(p.x+p.y+(p.z??0)+p.bank)).toBe(true);
  }
  expect(kinds.size).toBe(6);
  expect(signatures.size).toBe(1000);
  expect(reverse).toBeGreaterThan(300);
 },30000);
 it('full six-world round always selects each family once in seeded shuffle',()=>{
  for(const seed of [0,17,123456789]){
   const kinds=new Set(Array.from({length:6},(_,j)=>
    buildMacroCourse(4+j,seed,2040+j*700,2560+j*700,0).kind));
   expect(kinds.size).toBe(6);
  }
 });
 it('first spiral preserves approved W10.3 positions sample for sample',()=>{
  const c=buildMacroCourse(3,17,1340,1860,0);
  for(const p of c.road){
   const base=spiralPosition(c.spec,p.d);
   expect(p).toEqual(base);
  }
 });
});
describe('Tube afterburner continuity',()=>{
 it('exit momentum is aligned and never silently zero, no unintended perpetual autopilot',()=>{
  const t={x:.3,y:.4,z:-.8660254};
  const v=exitVelocity(t,62);
  expect(v.speed).toBeGreaterThan(70);
  expect(v.speed).toBeLessThanOrEqual(82);
  expect(v.x*t.x+v.y*t.y+v.z*t.z).toBeGreaterThan(70);
  expect(exitAfterburner(0,74)).toBeGreaterThan(30);
  expect(exitAfterburner(.4,78)).toBeGreaterThan(0);
  expect(exitAfterburner(1.05,50)).toBe(0);
  expect(exitAfterburner(-1,0)).toBe(0);
  expect(exitAfterburner(15,0)).toBe(0);
 });
});
