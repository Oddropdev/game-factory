import {describe,it,expect} from 'vitest';
import {parseSecondLevelManifest,secondCenter,secondTangent} from
  '../../spikes/w9-ball/src/SecondSkyLevel';
import {longCenter,longTangent} from '../../spikes/w9-ball/src/LongJumpCourse';
import {TUBE_END_PROGRESS,TUBE_START_PROGRESS,
  TransitTubePath} from '../../spikes/w9-ball/src/TubeTransit';
const fixture={
  id:'sunset-ribbon-2',version:1,title:'SUNSET RIBBON',
  startProgress:550,endProgress:700,width:12,plankStep:2.5,
  theme:'coral-lilac',gatePositions:[575,610,646,684],
  gemPositions:[564,591,626,667,691]
};
describe('W9.4-8 independent Level 2',()=>{
  it('accepts the exact finite bounded second world manifest',()=>{
    const m=parseSecondLevelManifest(fixture);
    expect(m.endProgress-m.startProgress).toBe(150);
    expect(m.gatePositions.length).toBe(4);
    expect(m.gemPositions.length).toBe(5);
    expect(()=>parseSecondLevelManifest({...fixture,width:1000})).toThrow();
    expect(()=>parseSecondLevelManifest({...fixture,gatePositions:[575,575]})).toThrow();
    expect(()=>parseSecondLevelManifest({...fixture,endProgress:1200})).toThrow();
  });
  it('joins the original path at 550m without position or tangent snapping',()=>{
    expect(TUBE_END_PROGRESS).toBe(550);
    expect(TUBE_START_PROGRESS).toBe(428);
    expect(secondCenter(550)).toBeCloseTo(longCenter(550),8);
    expect(secondTangent(550).x).toBeCloseTo(longTangent(550).x,6);
    const p=new TransitTubePath();
    expect(p.frames.at(-1)?.center[0]).toBeCloseTo(secondCenter(550),4);
    expect(p.frames.at(-1)?.center[2]).toBeCloseTo(7-550,4);
  });
  it('has a deliberate lateral S bend rather than reusing the old flat road',()=>{
    const v=Array.from({length:151},(_,i)=>secondCenter(550+i));
    expect(Math.max(...v)-Math.min(...v)).toBeGreaterThan(5);
    for(let d=550;d<=699;d+=.5){
      expect(Math.abs(secondCenter(d+.5)-secondCenter(d))).toBeLessThan(.16);
    }
  });
});
