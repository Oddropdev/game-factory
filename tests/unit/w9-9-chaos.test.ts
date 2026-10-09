import {describe,it,expect,afterEach} from 'vitest';
import {buildCourseGrammar,courseAt,validateCourseGrammar}
 from '../../spikes/w9-ball/src/CourseGrammar';
import {setChaosProfile,setLongCoasterProfile,endlessBounds,generateEndlessWorld}
 from '../../spikes/w9-ball/src/EndlessWorlds';
import {setRichEndlessRoute,parseRoad,trilogyCenter}
 from '../../spikes/w9-ball/src/TrilogyManifest';
afterEach(()=>{setChaosProfile(false);setLongCoasterProfile(false);setRichEndlessRoute(false);});
describe('W9.9 seed-first playable random course grammar',()=>{
 it('1000 worlds: never invalid, monotone ports, deterministic, four+ motifs each',()=>{
  setLongCoasterProfile(true);setRichEndlessRoute(true);setChaosProfile(true,17);
  let previous=1160;const signatures=new Set<string>(),kinds=new Set<string>();
  for(let i=3;i<1000;i++){
   const [start,end]=endlessBounds(i);
   expect(start-previous).toBe(180);previous=end;
   const g=buildCourseGrammar(i,17,start,end);
   const check=validateCourseGrammar(g);
   expect(check.valid).toBe(true);
   expect(check.maxCurvature).toBeLessThan(.115);
   expect(check.maxGrade).toBeLessThan(1.15);
   expect(check.motifKinds).toBeGreaterThanOrEqual(4);
   expect(g.motifs.length).toBeGreaterThanOrEqual(5);
   expect(Math.abs(courseAt(g,start).x)+Math.abs(courseAt(g,end).y)).toBeLessThan(.00001);
   expect(g.signature).toBe(buildCourseGrammar(i,17,start,end).signature);
   signatures.add(g.signature);g.motifs.forEach(m=>kinds.add(m.kind));
  }
  expect(signatures.size).toBeGreaterThan(985);
  expect(kinds.size).toBe(8);
 });
 it('real generated road matches global center and elevation banking',()=>{
  setLongCoasterProfile(true);setRichEndlessRoute(true);setChaosProfile(true,17);
  for(const i of [3,4,5,136,999]){
   const a=generateEndlessWorld(i,17,true);
   const samples=parseRoad(a.road,a.manifest);
   expect(samples.length).toBe(537);
   expect(a.manifest.hazards.length).toBeGreaterThan(10);
   expect(a.road[0]!.width).toBeCloseTo(3.1,2);
   expect(a.manifest.features?.guards).toHaveLength(2);
   const spread=Math.max(...samples.map(p=>p.x))-Math.min(...samples.map(p=>p.x));
   const relief=Math.max(...samples.map(p=>p.y))-Math.min(...samples.map(p=>p.y));
   expect(spread).toBeGreaterThan(12);
   expect(relief).toBeGreaterThan(8);
   expect(samples.every(p=>Math.abs(p.x-trilogyCenter(p.d))<.002)).toBe(true);
  }
 });
 it('same seed reproduces and different seed fundamentally changes the route',()=>{
  const [start,end]=[1340,1860],a=buildCourseGrammar(3,17,start,end);
  const b=buildCourseGrammar(3,18,start,end);
  expect(a.signature).not.toBe(b.signature);
  expect(a.motifs.map(m=>m.kind)).not.toEqual(b.motifs.map(m=>m.kind));
  expect(a.signature).toBe(buildCourseGrammar(3,17,start,end).signature);
 });
});
