import crystal from '../../spikes/w9-ball/public/levels/crystal.json';
import candy from '../../spikes/w9-ball/public/levels/candy.json';
import rainbow from '../../spikes/w9-ball/public/levels/rainbow.json';
import crystalRoad from '../../spikes/w9-ball/public/levels/crystal-road.json';
import candyRoad from '../../spikes/w9-ball/public/levels/candy-road.json';
import rainbowRoad from '../../spikes/w9-ball/public/levels/rainbow-road.json';
import {describe,it,expect} from 'vitest';
import {parseWorld,parseRoad,trilogyTangent} from '../../spikes/w9-ball/src/TrilogyManifest';
import {generateTransit,transitCandidate,validateTransit} from '../../spikes/w9-ball/src/SeededTransit';
const data=(name:string)=>JSON.parse(JSON.stringify(({crystal,candy,rainbow,'crystal-road':crystalRoad,'candy-road':candyRoad,'rainbow-road':rainbowRoad} as Record<string,unknown>)[name]));
describe('W9.5 fetched world contracts',()=>{
 it('loads three distinct geometry contracts and real banking',()=>{
  const worlds=['crystal','candy','rainbow'].map((id,i)=>{const m=parseWorld(data(id),i);return {m,road:parseRoad(data(id+'-road'),m)};});
  expect(new Set(worlds.map(w=>w.m.scenerySeed)).size).toBe(3);
  expect(worlds[2]!.road.some(r=>r.bank>10)).toBe(true);
  expect(worlds[2]!.road.some(r=>r.bank< -10)).toBe(true);
  for(const {m,road} of worlds){expect(road.length).toBeGreaterThan(180);expect(m.gems.length).toBeGreaterThan(12);}
 });
 it('rejects malformed and discontinuous incoming content before staging',()=>{
  const m=parseWorld(data('rainbow'),2),r=data('rainbow-road');r[5].x+=3;
  expect(()=>parseRoad(r,m)).toThrow();expect(()=>parseWorld({...m,geometry:'https://other/remote'},2)).toThrow();
 });
 it('validates both handoffs, generated diversity and the fallback geometry',()=>{
  for(const [start,end] of [[428,590],[770,940]]){
   const entry={progress:start!,x:data(start===428?'crystal-road':'candy-road').find((p:{d:number})=>p.d===start).x,dx:trilogyTangent(start!).dx};
   const exit={progress:end!,x:data(end===590?'candy-road':'rainbow-road').find((p:{d:number})=>p.d===end).x,dx:0};
   const fallback=transitCandidate(0,entry,exit,true);expect(validateTransit(fallback.path,entry,exit).valid).toBe(true);
   for(let seed=100;seed<116;seed++)expect(generateTransit(seed,entry,exit).validation.valid).toBe(true);
  }
 });
});
