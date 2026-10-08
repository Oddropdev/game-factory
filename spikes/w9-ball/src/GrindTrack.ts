// A narrow ELEVATED top-only grind line, visually and physically unlike
// the broad green side/top guard. Collider naming is an authority boundary.
import {Color,Entity,StandardMaterial} from 'playcanvas';
import {SPEED_START_Z,SPEED_SEGMENT_STEP} from './SpeedCourse';
import {longCenter,longTangent} from './LongJumpCourse';
import {GRIND_START,GRIND_END,GRIND_TOP_Y,GRIND_HALF_WIDTH,
  GRIND_ENTRY_START} from './RailModes';
type Point=[number,number,number];
type Shape=(name:string,type:'box'|'sphere'|'cylinder',position:Point,
  scale:Point,material:StandardMaterial,solid?:'static'|'dynamic'|false,
  yaw?:number,pitch?:number)=>Entity;
const mat=(color:Color,emission:Color,strength:number)=>{
  const m=new StandardMaterial();
  m.diffuse=color;m.emissive=emission;m.emissiveIntensity=strength;
  m.gloss=.91;m.update();return m;
};
export function buildGrindTrack(shape:Shape) {
  const steel=mat(new Color(.37,.65,.86),new Color(.02,.26,.45),.4);
  const stripe=mat(new Color(.15,.99,.83),new Color(.10,.94,.67),1.6);
  const sideMat=mat(new Color(.26,.37,.59),new Color(.01,.08,.15),.35);
  const top:Entity[]=[],sides:Entity[]=[];
  // A physically sloped Bullet entry: no forced teleport or camera trick.
  const middle=(GRIND_ENTRY_START+GRIND_START+4)/2;
  shape('real-grind-entry-ramp','box',
    [longCenter(middle),.52,SPEED_START_Z-middle],
    [2.4,.30,GRIND_START+4-GRIND_ENTRY_START],
    stripe,'static',longTangent(middle).yaw,6);
  for(let d=GRIND_START;d<=GRIND_END;d+=SPEED_SEGMENT_STEP){
    const tangent=longTangent(d);
    const center=longCenter(d),z=SPEED_START_Z-d;
    // Only these narrow upper slabs are eligible for top-grind rewards.
    top.push(shape('grind-top-'+top.length,'box',
      [center,GRIND_TOP_Y-.12,z],
      [GRIND_HALF_WIDTH*2,.24,SPEED_SEGMENT_STEP+.45],
      steel,'static',tangent.yaw));
    // Separate SIDE colliders do NOT grant any grind reward or attachment.
    for(const sign of [-1,1]){
      sides.push(shape('grind-side-'+sides.length,'box',
        [center+sign*(GRIND_HALF_WIDTH+.09),.53,z],
        [.20,1.00,SPEED_SEGMENT_STEP+.35],sideMat,'static',tangent.yaw));
    }
    // A slim illuminated crown communicates where top-only contact occurs.
    shape('grind-energy-spine-'+d,'box',
      [center,GRIND_TOP_Y+.026,z],
      [.22,.035,SPEED_SEGMENT_STEP+.1],stripe,false,tangent.yaw);
  }
  return {topCount:top.length,sideCount:sides.length,
    start:GRIND_START,end:GRIND_END,topHeight:GRIND_TOP_Y,
    top,sides};
}
