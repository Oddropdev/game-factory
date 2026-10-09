// W10.6 — stable horizon-following chase rig for real 3D climbs,
// valley plunges and reversing banked spiral bends. The rig never controls
// the sphere; all points are used only to frame the player's view.
type P={x:number;y:number;z:number};
export type CameraInput={ball:P;forward:P;roadAhead:P;speed:number;
 turn:number;aspect:number};
export type CameraPose={position:P;target:P;fov:number;
 distance:number;rise:number;targetHeight:number};
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const unit=(v:P):P=>{const l=Math.hypot(v.x,v.y,v.z)||1;
 return {x:v.x/l,y:v.y/l,z:v.z/l}};
export function adaptiveCamera(x:CameraInput):CameraPose{
 const t=unit(x.forward);
 const h=Math.hypot(t.x,t.z)||1;
 const heading={x:t.x/h,z:t.z/h};
 const incline=Math.abs(t.y);
 const turn=clamp(Math.abs(x.turn),0,1);
 const speed=clamp(x.speed/82,0,1);
 // Dramatic pullback is deliberate: narrow portrait phones need enough
 // actual road visible around the next bend, not just the back of the sphere.
 const distance=16+incline*9+turn*7+speed*5;
 const rise=10.5+incline*10.5+turn*3;
 const ball=x.ball;
 const position={x:ball.x-heading.x*distance,
  y:ball.y+rise,z:ball.z-heading.z*distance};
 // Keep the ball within the LOWER HALF while peeking into the next 3D
 // curve, but never point the camera far up into empty sky.
 const aimAhead=clamp(9+speed*8+turn*6,9,19);
 const routeLift=clamp((x.roadAhead.y-ball.y)*.35,-7,8);
 const targetHeight=1.0+routeLift;
 const target={x:ball.x+t.x*aimAhead*.65+
  (x.roadAhead.x-ball.x)*.25,
  y:ball.y+targetHeight,
  z:ball.z+t.z*aimAhead*.65+(x.roadAhead.z-ball.z)*.25};
 const portrait=x.aspect<.8;
 const fov=clamp((portrait?74:63)+incline*11+turn*5+speed*4,
  portrait?70:60,portrait?90:81);
 return {position,target,fov,distance,rise,targetHeight};
}
export function turnIntensity(before:P,after:P){
 const a=unit(before),b=unit(after);
 return clamp(Math.acos(clamp(a.x*b.x+a.y*b.y+a.z*b.z,-1,1))/.8,0,1);
}
