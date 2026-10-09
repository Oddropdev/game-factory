import {describe,it,expect,afterEach} from 'vitest';
import {endlessBounds,generateEndlessWorld,generateWorldFeatures}
 from '../../spikes/w9-ball/src/EndlessWorlds';
import {trilogyCenter,trilogyTangent,parseRoad,setRichEndlessRoute}
 from '../../spikes/w9-ball/src/TrilogyManifest';
import {generateExtremeTransit} from '../../spikes/w9-ball/src/SeededTransit';
afterEach(()=>setRichEndlessRoute(false));
describe('W9.7 rich generated worlds',()=>{
 it('has guards on two sides, accessible elevated top-only rails and obstacles through World 1000',()=>{
  setRichEndlessRoute(true);
  for(const index of [3,4,5,17,136,499,999]){
   const a=generateEndlessWorld(index,17,true);
   expect(a).toEqual(generateEndlessWorld(index,17,true));
   expect(parseRoad(a.road,a.manifest)).toHaveLength(227);
   expect(a.manifest.features?.guards).toHaveLength(2);
   expect(a.manifest.features?.grinds).toHaveLength(1);
   expect(a.manifest.features!.guards[0]!.side).not.toBe(a.manifest.features!.guards[1]!.side);
   expect(a.manifest.hazards.length).toBeGreaterThan(1);
   expect(a.manifest.features!.guards.every(g=>g.start>a.manifest.start+10&&g.end<a.manifest.end-10)).toBe(true);
   expect(a.manifest.features!.grinds.every(g=>g.start>a.manifest.start+10&&g.end<a.manifest.end-10)).toBe(true);
  }
 });
 it('varied side landings preserve actual tube and road ports without breaking legacy route',()=>{
  setRichEndlessRoute(true);
  const xs=new Set<number>();
  for(let i=3;i<60;i++){
   const w=generateEndlessWorld(i,7,true),[start,end]=endlessBounds(i);
   expect(Math.abs(trilogyCenter(start)-w.road.find(p=>p.d===start)!.x)).toBeLessThan(.002);
   expect(Math.abs(trilogyCenter(end)-w.road.find(p=>p.d===end)!.x)).toBeLessThan(.002);
   expect(Math.abs(trilogyTangent(start).dx)).toBeLessThan(.05);
   xs.add(Math.round(trilogyCenter(start)));
  }
  expect(xs.size).toBeGreaterThan(24);
  setRichEndlessRoute(false);
  const legacy=trilogyCenter(endlessBounds(3)[0]);
  setRichEndlessRoute(true);
  expect(Math.abs(legacy-trilogyCenter(endlessBounds(3)[0]))).toBeGreaterThan(2);
 });
 it('generates genuinely high 3D helices with validated endpoints and deterministic seeds',()=>{
  setRichEndlessRoute(true);
  const entry={progress:1160,x:trilogyCenter(1160),dx:trilogyTangent(1160).dx};
  const exit={progress:1340,x:trilogyCenter(1340),dx:0};
  let extreme=0;
  for(let seed=1;seed<=16;seed++){
   const a=generateExtremeTransit(seed,entry,exit),b=generateExtremeTransit(seed,entry,exit);
   expect(a.validation.valid).toBe(true);
   expect(a.fingerprint).toBe(b.fingerprint);
   const height=Math.max(...a.path.frames.map(f=>f.center[1]))-2.36;
   if(!a.fallback&&height>31)extreme++;
   expect(a.path.position(a.path.length,0)[0]).toBeCloseTo(exit.x,2);
  }
  expect(extreme).toBeGreaterThanOrEqual(9);
 });
});
