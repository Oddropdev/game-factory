// W9.4-7 — arc-length sampled, parallel-transported full-3D magnetic tube.
// No collision/bonus authority is delegated to decorative tube geometry.
import {Entity,Mesh,MeshInstance,type GraphicsDevice,type StandardMaterial} from 'playcanvas';
import {longCenter} from './LongJumpCourse';
import {SPEED_START_Z} from './SpeedCourse';

export const TUBE_START_PROGRESS=428;
export const TUBE_END_PROGRESS=550;
export const TUBE_FINISH_PROGRESS=620;
export const TUBE_RADIUS=1.12;
export const TUBE_BALL_RADIUS=.62;
export const TUBE_OFFSET=TUBE_RADIUS+TUBE_BALL_RADIUS;
export const TUBE_CRUISE_METRES_PER_SECOND=44;
export type V3=[number,number,number];
export type TubeFrame={center:V3;tangent:V3;normal:V3;binormal:V3;u:number;distance:number};
const add=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a:V3,s:number):V3=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V3,b:V3):V3=>[
  a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2],
  a[0]*b[1]-a[1]*b[0]];
const length=(a:V3)=>Math.hypot(...a);
const unit=(a:V3):V3=>mul(a,1/(length(a)||1));
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const smooth=(a:number,b:number,x:number)=>{
  const t=clamp((x-a)/(b-a),0,1);
  return t*t*(3-2*t);
};
export function tubeCenter(u:number):V3{
  const s=clamp(u,0,1);
  const progress=TUBE_START_PROGRESS+(TUBE_END_PROGRESS-TUBE_START_PROGRESS)*s;
  const elevated=smooth(.07,.29,s)*(1-smooth(.73,.96,s));
  // True vertical loop: the forward coordinate reverses locally rather
  // than merely sculpting a hump on an always-forward road.
  const loopWindow=smooth(.29,.335,s)*(1-smooth(.625,.67,s));
  const loopAngle=2*Math.PI*(s-.335)/.29;
  const loopZ=loopWindow*12*Math.sin(loopAngle);
  const loopY=loopWindow*12*(1-Math.cos(loopAngle));
  return [
    longCenter(progress)+4.4*Math.sin(Math.PI*s)**2*Math.sin(Math.PI*s*2),
    2.36+8*elevated+loopY,
    SPEED_START_Z-progress+loopZ
  ];
}
function tangentAt(u:number,centerAt:(u:number)=>V3=tubeCenter):V3{
  const e=.0002;
  return unit(sub(centerAt(Math.min(1,u+e)),centerAt(Math.max(0,u-e))));
}
function transport(n:V3,t0:V3,t1:V3):V3{
  const axis=cross(t0,t1),sin=length(axis);
  if(sin<1e-10)return unit(sub(n,mul(t1,dot(n,t1))));
  const a=mul(axis,1/sin),cos=clamp(dot(t0,t1),-1,1);
  // Rodrigues rotation is the minimal rotation mapping successive tangents.
  const rotated=add(add(mul(n,cos),mul(cross(a,n),sin)),
    mul(a,dot(a,n)*(1-cos)));
  return unit(sub(rotated,mul(t1,dot(rotated,t1))));
}
export class TransitTubePath{
  readonly frames:TubeFrame[]=[];
  readonly length:number;
  constructor(sampleCount=400,centerAt:(u:number)=>V3=tubeCenter,alignExit=false){
    let previous=tangentAt(0,centerAt);
    let normal=unit(sub([0,-1,0] as V3,mul(previous,dot([0,-1,0],previous))));
    let distance=0,prevCenter=centerAt(0);
    for(let i=0;i<=sampleCount;i++){
      const u=i/sampleCount,center=centerAt(u),t=tangentAt(u,centerAt);
      if(i>0){
        distance+=length(sub(center,prevCenter));
        normal=transport(normal,previous,t);
      }
      const b=unit(cross(t,normal));
      this.frames.push({u,center,tangent:t,normal,binormal:b,distance});
      prevCenter=center;previous=t;
    }
    this.length=distance;
    // New seeded paths may accumulate transport roll. Distribute its inverse
    // smoothly so the exit is bottom-aligned without a last-frame angle snap.
    // The accepted W9.4-7 curve retains its original exact frames by default.
    if(alignExit){
      const end=this.frames.at(-1)!;
      const down=unit(sub([0,-1,0],mul(end.tangent,dot([0,-1,0],end.tangent))));
      const twist=Math.atan2(dot(down,end.binormal),dot(down,end.normal));
      for(const f of this.frames){
        const a=twist*smooth(.12,.95,f.distance/distance);
        f.normal=unit(add(mul(f.normal,Math.cos(a)),mul(f.binormal,Math.sin(a))));
        f.binormal=unit(cross(f.tangent,f.normal));
      }
    }
  }
  at(distance:number):TubeFrame{
    const target=clamp(distance,0,this.length);
    let lo=0,hi=this.frames.length-1;
    while(hi-lo>1){
      const mid=(lo+hi)>>1;
      if(this.frames[mid]!.distance<target)lo=mid;else hi=mid;
    }
    const a=this.frames[lo]!,b=this.frames[hi]!;
    const f=(target-a.distance)/(b.distance-a.distance||1);
    const tangent=unit(add(mul(a.tangent,1-f),mul(b.tangent,f)));
    let normal=unit(add(mul(a.normal,1-f),mul(b.normal,f)));
    normal=unit(sub(normal,mul(tangent,dot(normal,tangent))));
    return {
      center:add(mul(a.center,1-f),mul(b.center,f)),
      tangent,normal,binormal:unit(cross(tangent,normal)),
      u:a.u+(b.u-a.u)*f,distance:target
    };
  }
  position(distance:number,angle=0,offset=TUBE_OFFSET):V3{
    const f=this.at(distance);
    const n=add(mul(f.normal,Math.cos(angle)),mul(f.binormal,Math.sin(angle)));
    return add(f.center,mul(n,offset));
  }
}
export function buildTubeMesh(
  device:GraphicsDevice,root:Entity,path:TransitTubePath,
  skin:StandardMaterial,accent:StandardMaterial
){
  const rings=path.frames.length,sides=16;
  const surface=(name:string,material:StandardMaterial,radius:number,sideStart=0,sideEnd=sides)=>{
    const positions:number[]=[],normals:number[]=[],indices:number[]=[];
    for(let i=0;i<rings;i++){
      const f=path.frames[i]!;
      for(let j=sideStart;j<=sideEnd;j++){
        const angle=j/sides*2*Math.PI;
        const radial=add(mul(f.normal,Math.cos(angle)),mul(f.binormal,Math.sin(angle)));
        positions.push(...add(f.center,mul(radial,radius)));
        normals.push(...radial);
      }
    }
    const stride=sideEnd-sideStart+1;
    for(let i=0;i<rings-1;i++)for(let j=0;j<stride-1;j++){
      const a=i*stride+j,b=a+1,c=(i+1)*stride+j,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
    const mesh=new Mesh(device);
    mesh.setPositions(positions);mesh.setNormals(normals);mesh.setIndices(indices);
    mesh.update();
    const entity=new Entity(name);
    entity.addComponent('render',{meshInstances:[new MeshInstance(mesh,material)],
      castShadows:false});
    root.addChild(entity);
    return entity;
  };
  surface('transit-tube-continuous-body',skin,TUBE_RADIUS);
  // Luminous spiral strips share the exact centerline and normal frames.
  surface('transit-tube-accent-left',accent,TUBE_RADIUS+.018,3,4);
  surface('transit-tube-accent-right',accent,TUBE_RADIUS+.018,11,12);
  return {meshCount:3,pathSampleCount:path.frames.length,tubeLength:path.length};
}
