// W10.3: one single orthonormal physical frame for the visible ribbon,
// the static Bullet slab, real physical guards and road-normal downforce.
// Right × Up = Back (opposite forward tangent); no Euler angle ambiguity.
export type V3={x:number;y:number;z:number};
export const add=(a:V3,b:V3):V3=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
export const scale=(v:V3,k:number):V3=>({x:v.x*k,y:v.y*k,z:v.z*k});
export const sub=(a:V3,b:V3):V3=>add(a,scale(b,-1));
export const dot=(a:V3,b:V3)=>a.x*b.x+a.y*b.y+a.z*b.z;
export const magnitude=(v:V3)=>Math.hypot(v.x,v.y,v.z);
export const unit=(v:V3):V3=>{
 const length=magnitude(v)||1;return scale(v,1/length);
};
export type TrackFrame={forward:V3;right:V3;up:V3;back:V3;
 position:(center:V3,lateral:number,height:number)=>V3;
 lateral:(center:V3,p:V3)=>number;
 clearance:(center:V3,p:V3)=>number};
export function trackFrame(tangent:V3,bankDeg:number):TrackFrame{
 const forward=unit(tangent);
 const h=Math.hypot(forward.x,forward.z)||1;
 const horizontalRight={x:-forward.z/h,y:0,z:forward.x/h};
 // Cross(right,forward) is a genuinely perpendicular deck normal on hills.
 const flatUp={
  x:-forward.x*forward.y/h,
  y:h,
  z:-forward.z*forward.y/h};
 const b=bankDeg*Math.PI/180,c=Math.cos(b),s=Math.sin(b);
 const right=unit(add(scale(horizontalRight,c),scale(flatUp,s)));
 const up=unit(sub(scale(flatUp,c),scale(horizontalRight,s)));
 const back=scale(forward,-1);
 return {forward,right,up,back,
  position:(center,lateral,height)=>add(add(center,scale(right,lateral)),scale(up,height)),
  lateral:(center,p)=>dot(sub(p,center),right),
  clearance:(center,p)=>dot(sub(p,center),up)};
}
export function surfaceContact(frame:TrackFrame,center:V3,ball:V3,width:number){
 return {lateral:frame.lateral(center,ball),
  clearance:frame.clearance(center,ball),
  inside:Math.abs(frame.lateral(center,ball))<=width*.5+.32};
}
export function guardDownforce(args:{
 frame:TrackFrame;mass:number;verticalFromDeck:number;normalVelocity:number;
 nearGuard:boolean;magnetActive:boolean}){
 if(!args.nearGuard||!args.magnetActive)return {x:0,y:0,z:0};
 // Directed INTO the REAL banked road surface, not global gravity;
 // stronger than free-road adhesion, with bounded positive separation damping.
 const strength=args.mass*(72+
  Math.min(95,Math.max(0,args.verticalFromDeck-.62)*65+
   Math.max(0,args.normalVelocity)*14));
 return scale(args.frame.up,-strength);
}
