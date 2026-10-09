import {describe,it,expect} from 'vitest';
import {generateTransit} from '../../spikes/w9-ball/src/SeededTransit';
import {longCenter} from '../../spikes/w9-ball/src/LongJumpCourse';
const entry={progress:428,x:longCenter(428),dx:(longCenter(428+.25)-longCenter(428-.25))/.5};
const exit={progress:590,x:longCenter(550),dx:0};
describe('W9.5 seeded magnetic path acceptance',()=>{
 it('validates 64 reproducible layouts and includes genuine inversions',()=>{
  let loops=0;const hashes=new Set<string>();
  for(let seed=1;seed<=64;seed++){
   const a=generateTransit(seed,entry,exit),b=generateTransit(seed,entry,exit);
   expect(a.validation.valid).toBe(true);expect(a.fingerprint).toBe(b.fingerprint);
   hashes.add(a.fingerprint);if(a.validation.invertedSamples>4)loops++;
   for(let d=0;d<a.path.length;d+=5){
    const f=a.path.at(d),p=a.path.position(d,1.7);
    expect(Math.hypot(...p.map((v,i)=>v-f.center[i]!))).toBeCloseTo(1.74,5);
   }
  }
  expect(hashes.size).toBeGreaterThan(40);expect(loops).toBeGreaterThan(15);
 });
 it('rejects impossible input',()=>expect(()=>generateTransit(NaN,entry,exit)).toThrow());
});
