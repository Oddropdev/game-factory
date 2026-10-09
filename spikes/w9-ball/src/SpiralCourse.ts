// W10: full 360 degree ascending helical WORLD, not a transit-only tube.
// d is course progress, never inferred from global Z once the helix starts.
export type SpiralPoint={d:number;x:number;y:number;z:number;bank:number;width:number};
export type SpiralSpec={index:number;seed:number;start:number;end:number;axis:number;hand:-1|1;radius:number;rise:number;coilStart:number;coilEnd:number;sweep:number};
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const smooth=(u:number)=>{const t=clamp(u,0,1);return t*t*(3-2*t)};
function random(seed:number){let x=seed>>>0;return ()=>{x+=0x6d2b79f5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};}
export function spiralSpec(index:number,seed:number,start:number,end:number,axis:number):SpiralSpec{
 if(index<3||end-start<470||!Number.isFinite(axis))throw Error('Invalid spiral ports');
 const r=random((seed^Math.imul(index+1,0x9e3779b1)^0x10c0a53e)>>>0);
 return {index,seed,start,end,axis,hand:r()>.5?1:-1,radius:37+r()*12,rise:57+r()*24,
 coilStart:start+105+r()*8,coilEnd:start+355+r()*12,sweep:27+r()*22};
}
export function spiralPosition(s:SpiralSpec,d:number):SpiralPoint{
 const {start,end,axis,coilStart,coilEnd,hand,radius,rise}=s;
 if(d>end)return {d,x:axis,y:0,z:7-d,bank:0,width:10.8};
 if(d<=coilStart){const w=smooth((d-start+12)/36);
  return {d,x:axis,y:0,z:7-d,bank:0,width:3.1+7.7*w};}
 if(d<=coilEnd){
  const u=clamp((d-coilStart)/(coilEnd-coilStart),0,1);
  const angle=(hand===1?Math.PI:0)+hand*2*Math.PI*u;
  return {d,x:axis+hand*radius+radius*Math.cos(angle),
   y:rise*smooth(u),z:7-coilStart+radius*Math.sin(angle),
   bank:hand*23*Math.sin(Math.PI*u)**2,width:10.8};}
 const u=clamp((d-coilEnd)/(end-coilEnd),0,1),w=Math.sin(Math.PI*u)**2;
 return {d,x:axis+hand*s.sweep*w*Math.sin(2*Math.PI*u),y:rise*(1-smooth(u)),
  z:(7-coilStart)+(coilStart-end)*u,bank:hand*18*w*Math.sin(2*Math.PI*u),width:10.8};
}
export function generateSpiralRoad(s:SpiralSpec):SpiralPoint[]{
 const rows:SpiralPoint[]=[];for(let d=s.start-12;d<=s.end+4;d++)rows.push(spiralPosition(s,d));return rows;
}
export type RoadProjection={d:number;index:number;x:number;y:number;z:number;
 lateral:number;distance:number;surfaceGap:number;tangent:{x:number;y:number;z:number};
 right:{x:number;z:number};width:number};
export function projectSpiral(road:readonly SpiralPoint[],p:{x:number;y:number;z:number},hint=0,range=110):RoadProjection{
 if(road.length<3)throw Error('Empty road');
 let best=Infinity,idx=0,fraction=0;
 const lo=clamp(Math.floor(hint)-30,0,road.length-2),hi=clamp(Math.ceil(hint)+range,0,road.length-2);
 for(let i=lo;i<=hi;i++){const a=road[i]!,b=road[i+1]!,dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
  const f=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);
  const dist=(p.x-a.x-f*dx)**2+(p.y-a.y-f*dy)**2+(p.z-a.z-f*dz)**2;
  if(dist<best){best=dist;idx=i;fraction=f;}}
 const a=road[idx]!,b=road[idx+1]!,dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
 const l=Math.hypot(dx,dy,dz)||1,tx=dx/l,ty=dy/l,tz=dz/l,h=Math.hypot(tx,tz)||1;
 const rx=-tz/h,rz=tx/h,x=a.x+fraction*dx,y=a.y+fraction*dy,z=a.z+fraction*dz;
 return {d:a.d+(b.d-a.d)*fraction,index:idx,x,y,z,distance:Math.sqrt(best),
  lateral:(p.x-x)*rx+(p.z-z)*rz,surfaceGap:p.y-y,tangent:{x:tx,y:ty,z:tz},
  right:{x:rx,z:rz},width:a.width+(b.width-a.width)*fraction};
}
export function spiralMetrics(s:SpiralSpec){
 const road=generateSpiralRoad(s);let length=0,maxTurn=0,maxPitch=0;
 for(let i=1;i<road.length;i++){const a=road[i-1]!,b=road[i]!;
  length+=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
  maxPitch=Math.max(maxPitch,Math.abs(Math.atan2(b.y-a.y,Math.hypot(b.x-a.x,b.z-a.z))));
  if(i>1){const p=road[i-2]!,ux=a.x-p.x,uz=a.z-p.z,vx=b.x-a.x,vz=b.z-a.z;
   maxTurn=Math.max(maxTurn,Math.abs(Math.atan2(ux*vz-uz*vx,ux*vx+uz*vz)));}}
 return {length,rotationDegrees:360,rise:s.rise,radius:s.radius,maxTurn,maxPitch,
  start:spiralPosition(s,s.start),end:spiralPosition(s,s.end),segmentCount:road.length};
}
