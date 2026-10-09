// W10.7: speed-appropriate side shifting without 100m/s² instantaneous
// changes when the projected spline tangent crosses individual slabs.
// Player controls desired SIDE VELOCITY, not a huge raw side-force burst.
// Nothing computes distance to road center; no centerline autopilot.
export class SmoothLateralDrive{
 private lastAccel=0;
 private filteredSteer=0;
 reset(){this.lastAccel=0;this.filteredSteer=0;}
 step(dt:number,steer:number,lateralSpeed:number,forwardSpeed:number){
  const t=Math.min(.05,Math.max(1/180,dt));
  const desiredInput=Math.max(-1,Math.min(1,steer));
  const response=1-Math.exp(-t*11);
  this.filteredSteer+=(desiredInput-this.filteredSteer)*response;
  const wantedSpeed=(7+Math.min(9,Math.abs(forwardSpeed)*.12))*this.filteredSteer;
  const desiredAccel=Math.max(-30,Math.min(30,(wantedSpeed-lateralSpeed)*2.15));
  const allowedJerk=220*t;
  const accel=Math.max(this.lastAccel-allowedJerk,
   Math.min(this.lastAccel+allowedJerk,desiredAccel));
  this.lastAccel=accel;
  return {accel,filteredSteer:this.filteredSteer,wantedSpeed};
 }
}
