// W9.4-3: one fixed, hand-authored sky-speed course.
// Geometry and gameplay facts are deterministic; Ammo alone moves the player.
// Positive progress runs toward negative world Z, in metres.
import { Entity, StandardMaterial } from 'playcanvas';

export const SPEED_START_Z=7;
export const SPEED_FINISH_DISTANCE=174;
export const SPEED_TRACK_WIDTH=9.0;
export const SPEED_CRUISE=16;
export const SPEED_CAP=52; // first empirical browser tuning ceiling; not an engine limit
export const SPEED_BOOSTS=[18,74,129] as const;
export const SPEED_SAFETY_ARCS=[[38,85],[102,149]] as const;
export const SPEED_SEGMENT_STEP=3.5;

type Surfaces={
  track:StandardMaterial;side:StandardMaterial;cream:StandardMaterial;
  mint:StandardMaterial;teal:StandardMaterial;coral:StandardMaterial;
  blue:StandardMaterial;jewel:StandardMaterial;
};
type Point=[number,number,number];
type Shape=(name:string,type:'box'|'sphere'|'cylinder',pos:Point,scale:Point,
  material:StandardMaterial,solid?:'static'|'dynamic'|false,yaw?:number)=>Entity;
const smooth=(a:number,b:number,x:number)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};
export function trackCenter(progress:number):number {
  // Gentle first right arc, then a longer left return. Not a straight plank.
  return 6.1*smooth(22,79,progress)-7.9*smooth(91,157,progress);
}
export function trackTangent(progress:number):{x:number;z:number;yaw:number}{
  const derivative=(trackCenter(progress+.25)-trackCenter(progress-.25))/.5;
  const length=Math.hypot(derivative,1);
  return {x:derivative/length,z:-1/length,yaw:-Math.atan(derivative)*180/Math.PI};
}
export function inSafetyArc(progress:number):boolean {
  return SPEED_SAFETY_ARCS.some(([a,b])=>progress>=a&&progress<=b);
}
export function boostCrossed(from:number,to:number,used:Set<number>):number|null{
  for(let i=0;i<SPEED_BOOSTS.length;i++){
    const p=SPEED_BOOSTS[i]!;
    if(!used.has(i)&&from<p&&to>=p)return i;
  }
  return null;
}
export function makeSpeedCourse(shape:Shape,surfaces:Surfaces,
  suppressLegacyEdge:(progress:number,side:number)=>boolean=()=>false) {
  const road:Entity[]=[];
  const rails:Entity[]=[];
  const pads:Entity[]=[];
  let curveDegrees=0,segments=0;
  for(let d=0;d<=SPEED_FINISH_DISTANCE+6;d+=SPEED_SEGMENT_STEP){
    const center=trackCenter(d),t=trackTangent(d),z=SPEED_START_Z-d;
    // Slight overlapping box-proxy seams prevent the physical ball from falling
    // between small segments at high velocity. Every proxy is static Bullet.
    road.push(shape('sky-course-plank-'+segments,'box',
      [center,-.29,z],[SPEED_TRACK_WIDTH,.58,SPEED_SEGMENT_STEP+.42],
      segments%2===0?surfaces.track:surfaces.side,'static',t.yaw));
    if(Math.abs(t.yaw)>curveDegrees)curveDegrees=Math.abs(t.yaw);
    for(const side of [-1,1] as const){
      if(suppressLegacyEdge(d,side))continue;
      const outside=side*(SPEED_TRACK_WIDTH/2-.16);
      const x=center+outside*(-t.z);
      const vz=outside*t.x;
      // Visual edge language. Not an invisible autopilot or full-height wall.
      rails.push(shape('sky-edge-'+segments+'-'+side,'box',
        [x,.045,z+vz],[.12,.12,SPEED_SEGMENT_STEP+.3],
        inSafetyArc(d)?surfaces.teal:surfaces.cream,false,t.yaw));
    }
    segments++;
  }
  for(let i=0;i<SPEED_BOOSTS.length;i++){
    const d=SPEED_BOOSTS[i]!,t=trackTangent(d),center=trackCenter(d);
    // Crossing this visibly marked pad applies a real Bullet impulse.
    pads.push(shape('magnetic-boost-pad-'+i,'box',
      [center,.055,SPEED_START_Z-d],[SPEED_TRACK_WIDTH-1.7,.12,3.1],
      i===0?surfaces.mint:surfaces.jewel,false,t.yaw));
    for(const side of [-1,1] as const)
      shape('pad-pulse-'+i+'-'+side,'box',
        [center+side*2.55,.13,SPEED_START_Z-d],[.48,.1,2.6],
        surfaces.teal,false,t.yaw);
  }
  // Two elevated magnetic safety arcs mark where invisible spring attraction
  // is allowed to help. They follow the winding road, but do not steer freely.
  let safetyMarkers=0;
  for(const [start,end] of SPEED_SAFETY_ARCS){
    for(let d=start;d<=end;d+=5.25){
      const t=trackTangent(d),center=trackCenter(d),z=SPEED_START_Z-d;
      for(const side of [-1,1] as const){
        // Rail-mode green grind surfaces replace overlapping decorative
        // safety rails; no duplicate silhouette competing for the contact.
        if(suppressLegacyEdge(d,side))continue;
        const edge=side*(SPEED_TRACK_WIDTH/2+.16);
        const x=center+edge*(-t.z);
        const zz=z+edge*t.x;
        shape('magnetic-safety-arc-'+safetyMarkers,'box',
          [x,.65,zz],[.18,.25,5.6],surfaces.teal,false,t.yaw);
        safetyMarkers++;
      }
    }
  }
  return {road,rails,pads,segmentCount:segments,curveDegrees,
    safetyMarkers,boostCount:SPEED_BOOSTS.length,treeCount:0 as const,
    skyKind:'clean-sky-horizon' as const};
}
