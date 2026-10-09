// W10.5 — actual open-air gap, a real uphill launch lip and safe landing.
// Always opt-in to a separate preview; no invisible supporting collider in gap.
import type {SpiralPoint} from './SpiralCourse';
export type JumpPlan={start:number;rampStart:number;gapStart:number;gapEnd:number;
 landingEnd:number;blendEnd:number;rise:number;minSafeSpeed:number;
 airMeters:number};
export const smooth=(t:number)=>{
 const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u);
};
export function jumpPlan(worldStart:number):JumpPlan{
 return {start:worldStart,rampStart:worldStart+17,gapStart:worldStart+50,
  gapEnd:worldStart+68,landingEnd:worldStart+111,
  blendEnd:worldStart+148,rise:2.25,minSafeSpeed:43,airMeters:18};
}
export function rampHeight(d:number,j:JumpPlan){
 if(d<=j.rampStart)return 0;
 if(d<j.gapStart){
  const l=j.gapStart-j.rampStart,u=(d-j.rampStart)/l,h=j.rise;
  // Cubic Hermite: flat inlet, 0.12 upward slope at the *actual* lip.
  const slope=.12*l;
  return (slope-2*h)*u*u*u+(3*h-slope)*u*u;
 }
 if(d<=j.landingEnd)return j.rise;
 if(d<j.blendEnd)return j.rise*(1-smooth((d-j.landingEnd)/(j.blendEnd-j.landingEnd)));
 return 0;
}
export function withLaunchJump(road:readonly SpiralPoint[],j:JumpPlan):SpiralPoint[]{
 return road.map(p=>({...p,y:p.y+rampHeight(p.d,j)}));
}
export const inRealGap=(d:number,j:JumpPlan)=>d>=j.gapStart&&d<j.gapEnd;
export const isRampProtected=(d:number,j:JumpPlan)=>d>=j.rampStart&&d<=j.blendEnd;
export function validateJump(j:JumpPlan){
 const lipDerivative=(rampHeight(j.gapStart,j)-rampHeight(j.gapStart-.1,j))/.1;
 const flight=j.airMeters/j.minSafeSpeed,vertical=j.minSafeSpeed*lipDerivative*flight-
  11*flight*flight;
 const connected=j.rampStart<j.gapStart&&j.gapStart<j.gapEnd&&
  j.gapEnd<j.landingEnd&&j.landingEnd<j.blendEnd;
 return {valid:connected&&j.rise>=1.5&&j.rise<4&&j.airMeters<=22&&
  lipDerivative>.085&&lipDerivative<.17&&vertical>-.9&&vertical<5,
  lipDerivative,flight,flightHeight:vertical,airMeters:j.airMeters};
}
