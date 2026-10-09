// W10.7: short, frequent *outer-side only* real guards on physical turns.
// No mile-long double rails on straight sections. Exactly the same plan
// is shared by batched visual mesh and Bullet static collision boxes.
import type {SpiralPoint} from './SpiralCourse';
export type CornerRail={start:number;end:number;side:-1|1;turn:number};
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export function outerTurn(road:readonly SpiralPoint[],index:number,look=9){
 const a=road[clamp(index-look,0,road.length-1)]!,
  b=road[clamp(index,0,road.length-1)]!,
  c=road[clamp(index+look,0,road.length-1)]!;
 const ux=b.x-a.x,uz=b.z-a.z,vx=c.x-b.x,vz=c.z-b.z;
 const ua=Math.hypot(ux,uz)||1,va=Math.hypot(vx,vz)||1;
 const cross=(ux*vz-uz*vx)/(ua*va);
 const dot=(ux*vx+uz*vz)/(ua*va);
 return Math.atan2(cross,dot);
}
export function cornerGuardPlan(road:readonly SpiralPoint[],maxLength=7):CornerRail[]{
 const segments:CornerRail[]=[];let active:CornerRail|null=null;
 for(let i=1;i<road.length-2;i++){
  const turn=outerTurn(road,i);
  const side: -1|1|null=Math.abs(turn)>.095?turn>0?-1:1:null;
  // End short pieces before introducing a new sign / straight.
  if(active&&(side!==active.side||i-active.start>=maxLength)){
   if(active.end-active.start>=2)segments.push(active);
   active=null;
  }
  if(side!==null){
   if(!active)active={start:i,end:i,side,turn:Math.abs(turn)};
   active.end=i+1;active.turn=Math.max(active.turn,Math.abs(turn));
  }
 }
 if(active&&active.end-active.start>=2)segments.push(active);
 return segments;
}
export function isMandatorySharpTurn(road:readonly SpiralPoint[],i:number){
 // A forced 90° decision is NOT an arbitrary wall on a straight.
 // It must be a declared sharp approach, and no wall is placed by
 // W10.7 unless a later level-motif explicitly selects this condition.
 const angle=outerTurn(road,i,14);
 return Math.abs(angle)>=1.30&&Math.abs(angle)<=1.85;
}
