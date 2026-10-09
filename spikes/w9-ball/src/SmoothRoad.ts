// W10.7 — one physical+visual source of truth. The earlier road samples
// contain abruptly joined path primitives; neighboring static Bullet slabs
// then form ~0.65m overlapping, differently tilted contact ramps.
// Filter the SOURCE points (not just the rendered surface) and keep the
// same output for camera, road ribbon, projected tangent and colliders.
import type {SpiralPoint} from './SpiralCourse';
export function smoothRoad(road:readonly SpiralPoint[],radius=9,passes=2):SpiralPoint[]{
 if(road.length<36)return road.map(p=>({...p}));
 let rows=road.map(p=>({...p}));
 // Hann-like finite-support kernel; symmetric for no phase lead/lag.
 const kernel=Array.from({length:radius*2+1},(_,j)=>{
  const d=Math.abs(j-radius);
  return .5+.5*Math.cos(Math.PI*d/(radius+1));
 });
 for(let pass=0;pass<passes;pass++){
  const last=rows.length-1,weight=kernel.reduce((a,b)=>a+b,0);
  const next=rows.map((p,i)=>{
   // PORTS are pinned: the first 12 samples before the world and all 4
   // samples after its exit must be byte-for-byte unchanged.
   // Fade the FILTER STRENGTH rather than stopping it abruptly: a hard
   // on/off smoothing boundary itself became a physical kink in testing.
   const ease=(u:number)=>{const t=Math.max(0,Math.min(1,u));return t*t*(3-2*t)};
   const strength=.60*ease((i-13)/27)*ease((last-i-5)/37);
   if(strength<.000001)return {...p};
   let x=0,y=0,z=0,bank=0;
   for(let j=-radius;j<=radius;j++){
    const q=rows[i+j]!,k=kernel[j+radius]!/weight;
    x+=q.x*k;y+=q.y*k;z+=q.z*k;bank+=q.bank*k;
   }
   return {...p,x:p.x*(1-strength)+x*strength,
    y:p.y*(1-strength)+y*strength,
    z:p.z*(1-strength)+z*strength,
    bank:p.bank*(1-strength)+bank*strength};
  });
  rows=next;
 }
 return rows;
}
export function roadContinuity(road:readonly SpiralPoint[]){
 let maxTurn=0,maxStep=0,maxNormalChange=0;
 let sumTurn=0,steps=0;
 for(let i=1;i<road.length-1;i++){
  const a=road[i-1]!,b=road[i]!,c=road[i+1]!;
  const u=[b.x-a.x,b.y-a.y,b.z-a.z],v=[c.x-b.x,c.y-b.y,c.z-b.z];
  const lu=Math.hypot(...u),lv=Math.hypot(...v);
  const cos=(u[0]!*v[0]!+u[1]!*v[1]!+u[2]!*v[2]!)/(lu*lv||1);
  const angle=Math.acos(Math.max(-1,Math.min(1,cos)));
  maxTurn=Math.max(maxTurn,angle);
  maxStep=Math.max(maxStep,lu,lv);
  maxNormalChange=Math.max(maxNormalChange,Math.abs(c.bank-a.bank));
  sumTurn+=angle;steps++;
 }
 return {maxTurn,maxStep,maxNormalChange,meanTurn:sumTurn/Math.max(1,steps)};
}
