import {describe,it,expect,afterEach} from 'vitest';
import {endlessBounds,generateEndlessWorld,setLongCoasterProfile}
 from '../../spikes/w9-ball/src/EndlessWorlds';
import {parseRoad,setRichEndlessRoute,trilogyCenter,trilogyTangent}
 from '../../spikes/w9-ball/src/TrilogyManifest';

afterEach(()=>{setLongCoasterProfile(false);setRichEndlessRoute(false);});
describe('W9.8 track-first endless worlds',()=>{
 it('retains W9.6 / W9.7 lengths and first three world contracts by default',()=>{
  expect(endlessBounds(3)).toEqual([1340,1560]);
  expect(generateEndlessWorld(3,17,true).road).toHaveLength(227);
 });
 it('builds longer 520m 3D helical roads with exact tube mouth, no arches',()=>{
  setLongCoasterProfile(true);setRichEndlessRoute(true);
  for(const index of [3,4,5,136,999]){
   const [start,end]=endlessBounds(index);
   expect(end-start).toBe(520);
   const a=generateEndlessWorld(index,17,true);
   expect(a).toEqual(generateEndlessWorld(index,17,true));
   expect(a.road).toHaveLength(537);
   expect(parseRoad(a.road,a.manifest)).toHaveLength(537);
   expect(a.manifest.arches).toHaveLength(0);
   expect(a.manifest.hazards.length).toBeGreaterThanOrEqual(12);
   const elev=Math.max(...a.road.map(p=>p.y));
   const xs=a.road.map(p=>p.x);
   expect(elev).toBeGreaterThan(23);
   expect(Math.max(...xs)-Math.min(...xs)).toBeGreaterThan(21);
   expect(a.road[0]!.width).toBeCloseTo(3.1,2);
   expect(a.road.find(p=>p.d===start)!.y).toBeCloseTo(0,5);
   expect(a.road.find(p=>p.d===end)!.y).toBeCloseTo(0,5);
   expect(Math.abs(trilogyTangent(start).dx)).toBeLessThan(.08);
   expect(Math.abs(trilogyTangent(end).dx)).toBeLessThan(.08);
   expect(Math.abs(a.road.find(p=>p.d===end)!.x-trilogyCenter(end))).toBeLessThan(.002);
  }
 });
 it('1,000 worlds have deterministic monotonic 180m transit gaps in W9.8',()=>{
  setLongCoasterProfile(true);setRichEndlessRoute(true);
  let end=1160;
  for(let index=3;index<1000;index++){
   const [start,next]=endlessBounds(index);
   expect(start-end).toBe(180);
   const w=generateEndlessWorld(index,901,true);
   expect(w.manifest.worldNumber).toBe(index+1);
   expect(w.manifest.features?.guards).toHaveLength(2);
   expect(w.manifest.features?.grinds).toHaveLength(1);
   expect(w.road[0]!.d).toBe(start-12);
   expect(w.road.at(-1)!.d).toBe(next+4);
   end=next;
  }
 });
});
