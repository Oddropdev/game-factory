// W10.4 magnetic-tube to world motion continuity.
// Forward direction always follows the outgoing *physical* 3D road tangent.
export type Direction={x:number;y:number;z:number};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function exitVelocity(tangent:Direction,tubeSpeed=62){
 const norm=Math.hypot(tangent.x,tangent.y,tangent.z)||1;
 const speed=clamp(tubeSpeed*1.20,72,82);
 return {x:tangent.x/norm*speed,y:tangent.y/norm*speed,
  z:tangent.z/norm*speed,speed};
}
// The optional launch thruster acts for <1.1s after ACTUAL tube exit,
// never on direct restart: swipe controls take over once the timer ends.
export function exitAfterburner(elapsed:number,forwardSpeed:number){
 if(elapsed<0||elapsed>=1.05)return 0;
 const fade=1-elapsed/1.05;
 return clamp((94-forwardSpeed)*3.1,0,66)*fade;
}
