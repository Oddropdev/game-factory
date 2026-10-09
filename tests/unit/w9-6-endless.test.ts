import {describe,it,expect} from 'vitest';
import {endlessBounds,generateEndlessWorld,simulateEndlessCatalog,worldDesign}
 from '../../spikes/w9-ball/src/EndlessWorlds';
import {trilogyCenter,trilogyTangent,parseRoad} from '../../spikes/w9-ball/src/TrilogyManifest';
import {generateSpectacleTransit} from '../../spikes/w9-ball/src/SeededTransit';

describe('W9.6 infinite route and biome contracts',()=>{
 it('generates 997 safe deterministic new worlds up to World 1000',()=>{
  const a=simulateEndlessCatalog(17,1000),b=simulateEndlessCatalog(17,1000);
  expect(a).toEqual(b);expect(a.worlds).toBe(1000);
  expect(a.generated).toBe(997);expect(a.monotonic).toBe(true);
  expect(a.minGap).toBeGreaterThanOrEqual(150);
  expect(a.variants).toBeGreaterThan(800);
  expect(a.minDistinctWindow).toBeGreaterThanOrEqual(19);
  expect(a.maxTier).toBe(10);
 });
 it('World 137 has a unique structural seed, safe genuine road and tier progression',()=>{
  const i=136,w=generateEndlessWorld(i,17),copy=generateEndlessWorld(i,17);
  expect(w).toEqual(copy);
  expect(w.manifest.worldNumber).toBe(137);
  expect(w.manifest.tier).toBe(10);
  expect(w.manifest.start).toBe(endlessBounds(i)[0]);
  expect(w.manifest.gems.length).toBeGreaterThan(12);
  expect(w.manifest.hazards.length).toBeGreaterThan(8);
  expect(parseRoad(w.road,w.manifest)).toHaveLength(227);
  expect(worldDesign(i,17)).not.toEqual(worldDesign(i+1,17));
 });
 it('world/rollercoaster ports remain finite and tangent-matched across 1000 worlds',()=>{
  for(let index=2;index<1000;index++){
   const end=index===2?1160:endlessBounds(index)[1],start=endlessBounds(index+1)[0];
   expect(start-end).toBeGreaterThanOrEqual(150);
   const entryX=trilogyCenter(end),exitX=trilogyCenter(start);
   expect(Math.abs(entryX)).toBeLessThan(40);
   expect(Math.abs(exitX)).toBeLessThan(40);
   expect(Math.abs(trilogyTangent(start).dx)).toBeLessThan(.02);
  }
 });
 it('spectacle coasters have validated geometric clearance and broad real S curves',()=>{
  let broad=0,tall=0;
  for(let seed=1;seed<=20;seed++){
   const entry={progress:770,x:trilogyCenter(770),dx:trilogyTangent(770).dx};
   const exit={progress:940,x:trilogyCenter(940),dx:0};
   const coaster=generateSpectacleTransit(seed,entry,exit);
   expect(coaster.validation.valid).toBe(true);
   const x=coaster.path.frames.map(f=>f.center[0]);
   const y=coaster.path.frames.map(f=>f.center[1]);
   if(Math.max(...x)-Math.min(...x)>19)broad++;
   if(Math.max(...y)-Math.min(...y)>14)tall++;
  }
  expect(broad).toBeGreaterThanOrEqual(17);
  expect(tall).toBeGreaterThanOrEqual(17);
 });
});
