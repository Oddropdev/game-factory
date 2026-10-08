import {describe,it,expect} from 'vitest';
import {TransitTubePath,TUBE_OFFSET,TUBE_RADIUS,tubeCenter} from
  '../../spikes/w9-ball/src/TubeTransit';
import {parseTransitManifest} from '../../spikes/w9-ball/src/TransitNextSector';

describe('W9.4-7 true 3D magnetic transit geometry',()=>{
  it('samples by arc length, even across the inverted 3D loop',()=>{
    const path=new TransitTubePath();
    expect(path.length).toBeGreaterThan(130);
    expect(path.frames.length).toBe(401);
    expect(path.frames.some(f=>f.tangent[2]>0)).toBe(true);
    for(let i=1;i<path.frames.length;i++)
      expect(path.frames[i]!.distance).toBeGreaterThan(path.frames[i-1]!.distance);
    for(let d=1;d<path.length;d+=2){
      const p=path.at(d),q=path.at(d+1);
      const step=Math.hypot(p.center[0]-q.center[0],
        p.center[1]-q.center[1],p.center[2]-q.center[2]);
      expect(step).toBeLessThan(1.15);
    }
  });
  it('locks all travel positions exactly on the cylindrical surface',()=>{
    const path=new TransitTubePath();
    for(let d=0;d<=path.length;d+=3)
      for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
        const f=path.at(d),pos=path.position(d,angle);
        expect(Math.abs(Math.hypot(
          pos[0]-f.center[0],pos[1]-f.center[1],
          pos[2]-f.center[2])-TUBE_OFFSET)).toBeLessThan(1e-6);
      }
    expect(TUBE_RADIUS).toBeGreaterThan(.8);
  });
  it('begins and ends at the original road surface elevation',()=>{
    const path=new TransitTubePath();
    const atStart=path.position(0),atEnd=path.position(path.length,0);
    expect(atStart[1]).toBeGreaterThan(.4);
    expect(atStart[1]).toBeLessThan(1.6);
    expect(atEnd[1]).toBeGreaterThan(.4);
    expect(atEnd[1]).toBeLessThan(1.6);
    expect(tubeCenter(0)[2]).toBeGreaterThan(tubeCenter(1)[2]+100);
  });
});
describe('W9.4-7 next-level manifest hardening',()=>{
  it('rejects invalid scene manifests',()=>{
    expect(()=>parseTransitManifest({id:'unknown'})).toThrow();
    expect(()=>parseTransitManifest(null)).toThrow();
    expect(parseTransitManifest({
      id:'sky-islands-2',version:1,startProgress:550,
      endProgress:620,plankStep:3.5,width:9,baseTopY:0,theme:'teal-sky'
    }).endProgress).toBe(620);
  });
});
