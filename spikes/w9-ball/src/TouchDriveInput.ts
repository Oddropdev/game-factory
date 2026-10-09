// W10.1 Touch Drive: player-authoritative, no hidden forward or lateral autopilot.
// Axis: swipe UP is forward, DOWN reverse/brake, LEFT/RIGHT steer on the road.
// One impulse per separate touch. Keeping a finger down supplies sustained thrust.
// Both axes can be combined freely during the same touch.
const clamp=(v:number)=>Math.min(1,Math.max(-1,v));
export type TouchDriveSnapshot={active:boolean;holding:boolean;armed:boolean;forward:number;steer:number;
 boosts:number;releases:number;session:number;pendingBoost:{forward:number;steer:number}|null};
export class TouchDriveInput{
 private pointer:number|null=null;
 private x=0;private y=0;
 private forward=0;private steer=0;private armed=false;
 private pending:{forward:number;steer:number}|null=null;
 boosts=0;releases=0;session=0;
 down(id:number,x:number,y:number){
  if(this.pointer!==null)return false;
  this.pointer=id;this.x=x;this.y=y;this.armed=true;
  this.forward=0;this.steer=0;this.session++;
  return true;
 }
 move(id:number,x:number,y:number){
  if(id!==this.pointer)return false;
  const dx=x-this.x,dy=this.y-y;
  // Dead zone stops accidental motor activation on initial pointer down.
  if(this.armed&&Math.hypot(dx,dy)>=18){
   const length=Math.hypot(dx,dy)||1;
   this.pending={forward:dy/length,steer:dx/length};
   this.armed=false;this.boosts++;
  }
  if(!this.armed){
   this.forward=clamp(dy/90);
   this.steer=clamp(dx/105);
  }
  return true;
 }
 consumeBoost(){
  const result=this.pending;this.pending=null;return result;
 }
 up(id:number){
  if(id!==this.pointer)return false;
  this.pointer=null;this.armed=false;this.forward=0;this.steer=0;
  this.pending=null;this.releases++;return true;
 }
 cancel(){if(this.pointer!==null)this.up(this.pointer);}
 get active(){return this.pointer!==null;}
 get holding(){return this.pointer!==null&&!this.armed;}
 get throttle(){return this.forward;}
 get lateral(){return this.steer;}
 snapshot():TouchDriveSnapshot{
  return {active:this.active,holding:this.holding,armed:this.armed,forward:this.forward,
   steer:this.steer,boosts:this.boosts,releases:this.releases,
   session:this.session,pendingBoost:this.pending};
 }
}
