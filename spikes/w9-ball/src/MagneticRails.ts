// W9.4-5: LONG curved, contact-boosting rails. Exclusive to ?mode=rail.
// Full-height STATIC Bullet wall segments are the authoritative contacts;
// distance alone only enables a weaker pre-contact magnetic approach.
import { Color, Entity, StandardMaterial } from 'playcanvas';
import { SPEED_START_Z, SPEED_SEGMENT_STEP, SPEED_TRACK_WIDTH } from './SpeedCourse';
import { longCenter, longTangent } from './LongJumpCourse';

export type RailSide=-1|1;
export type RailSection={id:number;start:number;end:number;side:RailSide};
export const LONG_CURVE_RAILS:readonly RailSection[]=[
  {id:0,start:29,end:81,side:1},
  {id:1,start:100,end:157,side:-1},
  {id:2,start:339,end:394,side:1}
];
export const RAIL_EDGE_OFFSET=SPEED_TRACK_WIDTH/2+.12;
export const RAIL_APPROACH_START=2.5; // ball center offset from track middle
export const RAIL_APPROACH_END=4.65;
export const RAIL_CONTACT_FORCE=155; // N, forward only while Bullet contact exists
export const RAIL_PULL_MAX=100; // N, limited, so steering can overpower it
export const RAIL_ADHESION_MAX=64; // N down, only inside magnetic field

type Point=[number,number,number];
type Shape=(name:string,type:'box'|'sphere'|'cylinder',position:Point,
  scale:Point,material:StandardMaterial,solid?:'static'|'dynamic'|false,
  yaw?:number,pitch?:number)=>Entity;

function railFinishMaterial():StandardMaterial{
  const mat=new StandardMaterial();
  mat.diffuse=new Color(.055,.52,.29);
  mat.emissive=new Color(.06,.7,.26);
  mat.emissiveIntensity=.48;
  mat.gloss=.85;
  mat.update();
  return mat;
}
function sparkFinishMaterial():StandardMaterial{
  const mat=new StandardMaterial();
  mat.diffuse=new Color(.53,1,.67);
  mat.emissive=new Color(.35,1,.48);
  mat.emissiveIntensity=3;
  mat.update();
  return mat;
}
export type RailField={
  section:RailSection;
  distance:number; // positive from curve rail edge toward center
  strength:number;
  normalX:number;
};
export function railFieldAt(progress:number,x:number,y:number):RailField|null{
  const section=LONG_CURVE_RAILS.find(s=>progress>=s.start&&progress<=s.end);
  if(!section||y<-.6||y>2.3)return null;
  const normalX=section.side*(-longTangent(progress).z);
  const railX=longCenter(progress)+normalX*RAIL_EDGE_OFFSET;
  const distance=Math.abs(railX-x);
  const facing=(railX-x)*normalX;
  // Only attraction from INSIDE the course. No pull across the outside void.
  if(facing<0||distance>RAIL_APPROACH_END||distance<.20)return null;
  const offset=(x-longCenter(progress))*normalX;
  if(offset<RAIL_APPROACH_START)return null;
  const strength=Math.max(0,Math.min(1,
    (offset-RAIL_APPROACH_START)/(RAIL_EDGE_OFFSET-RAIL_APPROACH_START)));
  return {section,distance,strength,normalX};
}
export type RailVisuals={
  sections:readonly RailSection[];
  segments:number;
  sparklings:Entity[];
  activeSection:(id:number|null)=>void;
  glowingSections:()=>number[];
};
export function buildCurveRails(shape:Shape):RailVisuals{
  const mats=LONG_CURVE_RAILS.map(()=>railFinishMaterial());
  const step=SPEED_SEGMENT_STEP; // overlap prevents high-speed gaps at joints
  let segments=0;
  for(const section of LONG_CURVE_RAILS){
    for(let d=section.start;d<=section.end;d+=step){
      const progress=Math.min(d,section.end);
      const tangent=longTangent(progress);
      const edge=section.side*RAIL_EDGE_OFFSET;
      const x=longCenter(progress)+edge*(-tangent.z);
      const z=SPEED_START_Z-progress+edge*tangent.x;
      // Collider width 0.36m and height 1.48m, anchored at course edge.
      // The solid wall means this is a physical grind line, not a force-only
      // transparent beam; it can block a fast ball at the bend.
      shape('real-magnetic-rail-'+section.id+'-'+segments,
        'box',[x,.60,z],[.36,1.48,step+.50],
        mats[section.id]!,'static',tangent.yaw);
      segments++;
    }
  }
  const sparkleMaterial=sparkFinishMaterial();
  const sparklings=Array.from({length:16},(_,i)=>{
    const particle=shape('rail-spark-'+i,'sphere',[0,-20,0],
      [.13,.13,.13],sparkleMaterial);
    particle.enabled=false;
    return particle;
  });
  const active=new Set<number>();
  return {
    sections:LONG_CURVE_RAILS,segments,sparklings,
    activeSection:(id:number|null)=>{
      const next=new Set<number>(id===null?[]:[id]);
      for(const section of LONG_CURVE_RAILS){
        const on=next.has(section.id);
        if(on===active.has(section.id))continue;
        const mat=mats[section.id]!;
        mat.emissiveIntensity=on?3.2:.48;
        mat.update();
      }
      active.clear();for(const n of next)active.add(n);
    },
    glowingSections:()=>[...active]
  };
}
