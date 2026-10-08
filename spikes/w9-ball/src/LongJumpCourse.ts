// W9.4-4 — an independent extension of the frozen 174m speed hero.
// A physical inclined ramp, an actual open-air gap, and a separate wide
// Bullet landing deck. No source assets, fake teleports or simulated jumps.
import { Entity, StandardMaterial } from 'playcanvas';
import { SPEED_START_Z, SPEED_SEGMENT_STEP, SPEED_TRACK_WIDTH,
  trackCenter, trackTangent } from './SpeedCourse';

export const LONG_FINISH_DISTANCE=440;
export const LONG_SPEED_CAP=64; // trial cap (230.4km/h), not device-certified
export const LONG_EXTRA_BOOSTS=[192,214,338,405] as const;
export const JUMP_LAUNCH_PROGRESS=242;
export const JUMP_GAP_FROM=246;
export const JUMP_GAP_TO=258;
export const LANDING_START=258;
export const LANDING_END=329;
export const JUMP_TARGET_Y_VELOCITY=9.2;

type Point=[number,number,number];
type Shape=(name:string,type:'box'|'sphere'|'cylinder',pos:Point,
  scale:Point,material:StandardMaterial,
  solid?:'static'|'dynamic'|false,yaw?:number,pitch?:number)=>Entity;
type Surfaces={track:StandardMaterial;side:StandardMaterial;
  cream:StandardMaterial;mint:StandardMaterial;teal:StandardMaterial;
  jewel:StandardMaterial;};
const smooth=(a:number,b:number,p:number)=>{
  const t=Math.max(0,Math.min(1,(p-a)/(b-a)));
  return t*t*(3-2*t);
};
export function longCenter(progress:number):number{
  return trackCenter(progress)+7.2*smooth(333,385,progress)
    -6.1*smooth(399,440,progress);
}
export function longTangent(progress:number):{x:number;z:number;yaw:number}{
  if(progress<320)return trackTangent(progress);
  const derivative=(longCenter(progress+.25)-longCenter(progress-.25))/.5;
  const mag=Math.hypot(derivative,1);
  return {x:derivative/mag,z:-1/mag,yaw:-Math.atan(derivative)*180/Math.PI};
}
export const inLongSafetyArc=(p:number):boolean=>p>=263&&p<=326;
export function nextLongBoost(from:number,to:number,used:Set<number>):
  number|null {
  for(let i=0;i<LONG_EXTRA_BOOSTS.length;i++){
    const p=LONG_EXTRA_BOOSTS[i]!;
    if(from<p&&to>=p&&!used.has(3+i))return i;
  }
  return null;
}
export function makeLongJumpCourse(shape:Shape,surfaces:Surfaces,
  suppressLegacyEdge:(progress:number,side:number)=>boolean=()=>false) {
  const road:Entity[]=[];
  const pads:Entity[]=[];
  let segmentCount=0,safetyMarkers=0;
  // The old W9.4-3 174m route stays intact; append instead of replacing it.
  for(let d=182;d<=LONG_FINISH_DISTANCE+6;d+=SPEED_SEGMENT_STEP){
    if(d>=234&&d<330)continue; // genuine void except the ramp/landing.
    const center=longCenter(d),t=longTangent(d),z=SPEED_START_Z-d;
    road.push(shape('long-sky-plank-'+segmentCount,'box',[center,-.29,z],
      [SPEED_TRACK_WIDTH,.58,SPEED_SEGMENT_STEP+.42],
      segmentCount%2===0?surfaces.track:surfaces.side,'static',t.yaw));
    segmentCount++;
    for(const side of [-1,1] as const){
      if(suppressLegacyEdge(d,side))continue;
      shape('long-sky-rail-'+d+'-'+side,'box',
        [center+side*4.35*(-t.z),.07,z+side*4.35*t.x],
        [.16,.14,SPEED_SEGMENT_STEP+.32],surfaces.cream,false,t.yaw);
    }
  }
  // Ramp entrance matches top of preceding flat planks; slope lifts the
  // ball before its literal break from the surface at ~246m.
  const rampCenter=239,rampLength=14.5;
  const ramp=shape('real-bullet-launch-ramp','box',
    [longCenter(rampCenter),.99,SPEED_START_Z-rampCenter],
    [SPEED_TRACK_WIDTH,1.0,rampLength],
    surfaces.mint,'static',longTangent(rampCenter).yaw,10);
  // The landing is a distinct 71m x 14m STATIC rigidbody, not background art.
  // It overlaps the onward road at its far end for stable high-speed contact.
  const landingMid=(LANDING_START+LANDING_END)/2;
  const landing=shape('long-landing-deck','box',
    [longCenter(landingMid),-.69,SPEED_START_Z-landingMid],
    [14,1.38,LANDING_END-LANDING_START+1.6],
    surfaces.side,'static');
  for(const side of [-1,1] as const){
    shape('landing-catch-edge-'+side,'box',
      [longCenter(landingMid)+side*6.9,.05,SPEED_START_Z-landingMid],
      [.18,.18,LANDING_END-LANDING_START+.8],surfaces.teal);
  }
  shape('takeoff-chevron','box',[longCenter(244),2.36,SPEED_START_Z-244],
    [7.6,.14,.9],surfaces.jewel);
  shape('landing-target','box',
    [longCenter(281),.12,SPEED_START_Z-281],
    [9,.12,4.1],surfaces.teal);
  for(let i=0;i<LONG_EXTRA_BOOSTS.length;i++){
    const d=LONG_EXTRA_BOOSTS[i]!,t=longTangent(d);
    pads.push(shape('long-magnetic-boost-'+i,'box',
      [longCenter(d),.055,SPEED_START_Z-d],
      [SPEED_TRACK_WIDTH-1.2,.12,3.2],surfaces.jewel,false,t.yaw));
  }
  // Landing-area side arcs visibly communicate bounded magnetic assistance.
  for(let d=263;d<=326;d+=5.25){
    for(const side of [-1,1] as const){
      shape('landing-magnetic-arc-'+safetyMarkers,'box',
        [longCenter(d)+side*6.95,.65,SPEED_START_Z-d],
        [.22,.36,5.65],surfaces.teal);
      safetyMarkers++;
    }
  }
  return {road,pads,ramp,landing,segmentCount,
    safetyMarkers,extraBoosts:LONG_EXTRA_BOOSTS.length,
    length:LONG_FINISH_DISTANCE,gapMeters:JUMP_GAP_TO-JUMP_GAP_FROM,
    landingWidth:14};
}
