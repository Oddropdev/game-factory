import {describe,expect,it} from 'vitest';
import {GRIND_HALF_WIDTH,GRIND_TOP_Y,PLAYER_RADIUS,
  grindPath,grindTopQualifies,trappedBelowGrind} from
  '../../spikes/w9-ball/src/RailModes';

describe('W9.4-6.2 underside recovery cannot authorize grind',()=>{
  it('requires stalled motion below the running surface',()=>{
    expect(trappedBelowGrind(GRIND_TOP_Y-.35,0,0,GRIND_TOP_Y,0,false)).toBe(true);
    expect(trappedBelowGrind(GRIND_TOP_Y-.35,0,0,GRIND_TOP_Y,14,false)).toBe(false);
    expect(trappedBelowGrind(GRIND_TOP_Y-.35,6,0,GRIND_TOP_Y,0,false)).toBe(false);
    expect(trappedBelowGrind(GRIND_TOP_Y+PLAYER_RADIUS,0,0,GRIND_TOP_Y,0,false)).toBe(false);
    expect(trappedBelowGrind(GRIND_TOP_Y-.35,0,0,GRIND_TOP_Y,0,true)).toBe(false);
  });
  it('never grants top-only authority from an underside or side collision',()=>{
    const y=GRIND_TOP_Y-.3;
    expect(grindTopQualifies(y,0,0,GRIND_TOP_Y,true)).toBe(false);
    expect(grindTopQualifies(GRIND_TOP_Y+PLAYER_RADIUS,
      GRIND_HALF_WIDTH+.1,0,GRIND_TOP_Y,true)).toBe(false);
    expect(grindTopQualifies(GRIND_TOP_Y+PLAYER_RADIUS,
      0,0,GRIND_TOP_Y,false)).toBe(false);
    expect(grindTopQualifies(GRIND_TOP_Y+PLAYER_RADIUS,
      0,0,GRIND_TOP_Y,true)).toBe(true);
  });
  it('preserves the smoothly varying elevated optional lane',()=>{
    const p0=grindPath(344,0,'secret');
    const crest=grindPath(379,0,'secret');
    const exit=grindPath(402,0,'secret');
    expect(crest.y).toBeGreaterThan(p0.y+2.3);
    expect(exit.y).toBeLessThan(crest.y-2.3);
    for(let d=345;d<401;d++){
      const a=grindPath(d,0,'secret'),b=grindPath(d+.5,0,'secret');
      expect(Math.abs(a.y-b.y)).toBeLessThan(.12);
      expect(Math.abs(a.x-b.x)).toBeLessThan(.16);
    }
  });
});
