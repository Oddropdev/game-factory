// Reuses W9.4-7 arc-length motion and parallel transport. Pure generation and
// validation are deliberately independent of rendering and Bullet ownership.
import {TransitTubePath,TUBE_OFFSET,type V3} from './TubeTransit';

export type TransitPort={progress:number;x:number;dx:number};
export type TransitValidation={valid:boolean;errors:string[];minRadius:number;
  clearance:number;maxFrameTurn:number;invertedSamples:number};
export type SeededTransit={path:TransitTubePath;requestedSeed:number;seed:number;
  attempts:number;fallback:boolean;kind:'loop'|'helix'|'sweep';
  validation:TransitValidation;fingerprint:string;entry:TransitPort;exit:TransitPort};
export function seededRandom(seed:number){
  let s=seed>>>0;
  return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
const unit=(v:V3):V3=>{const n=Math.hypot(...v);return v.map(x=>x/n) as V3;};
const dot=(a:V3,b:V3)=>a.reduce((s,x,i)=>s+x*b[i]!,0);
const distance=(a:V3,b:V3)=>Math.hypot(...a.map((x,i)=>x-b[i]!));

function spline(knots:V3[],entry:TransitPort,exit:TransitPort){
  const dirs=knots.map((p,i):V3=>{
    if(i===0)return unit([entry.dx,0,-1]);
    if(i===knots.length-1)return unit([exit.dx,0,-1]);
    const a=unit(p.map((x,j)=>x-knots[i-1]![j]!) as V3);
    const b=unit(knots[i+1]!.map((x,j)=>x-p[j]!) as V3);
    return unit(a.map((x,j)=>x+b[j]!) as V3);
  });
  const lengths=knots.slice(1).map((p,i)=>distance(p,knots[i]!));
  return (u:number):V3=>{
    const t=Math.max(0,Math.min(1,u))*(knots.length-1);
    const i=Math.min(knots.length-2,Math.floor(t)),f=t-i,f2=f*f,f3=f2*f;
    const l=lengths[i]!;
    const l0=Math.min(l,lengths[i-1]??l),l1=Math.min(l,lengths[i+1]??l);
    return knots[i]!.map((x,j)=>(2*f3-3*f2+1)*x+(f3-2*f2+f)*dirs[i]![j]!*l0+
      (-2*f3+3*f2)*knots[i+1]![j]!+(f3-f2)*dirs[i+1]![j]!*l1) as V3;
  };
}
export function transitCandidate(seed:number,entry:TransitPort,exit:TransitPort,fallback=false){
  const rand=seededRandom(seed),span=exit.progress-entry.progress;
  const radius=13+rand()*5,lift=8+rand()*6,hand=rand()>.5?1:-1;
  const kind:SeededTransit['kind']=fallback?'sweep':seed%3===0?'helix':'loop';
  const lerpX=(t:number)=>entry.x+(exit.x-entry.x)*t;
  const p=(d:number,x:number,y:number):V3=>[x,2.36+y,7-entry.progress-d];
  const knots:V3[]=[p(0,entry.x,0),p(15,entry.x+entry.dx*10,3.4)];
  if(kind==='loop'){
    const base=span*.52,drift=11+rand()*3;
    const startX=lerpX(.5)-hand*drift*.5;
    knots.push(p(base-20,startX-hand*1.6,lift-2));
    for(let i=0;i<=18;i++){
      const a=i/18*Math.PI*2;
      // The full vertical loop advances sideways, leaving >11m clearance
      // between its entry and return instead of intersecting its own tube.
      knots.push(p(base+radius*Math.sin(a),startX+hand*drift*i/18,
        lift+radius*(1-Math.cos(a))));
    }
    knots.push(p(span-36,lerpX(.78)+hand*3,lift*.7));
  }else if(kind==='helix'){
    const amplitude=7+rand()*3;
    for(let i=0;i<=16;i++){
      const t=i/16,a=t*Math.PI*2,window=Math.sin(Math.PI*t);
      knots.push(p(38+(span-76)*t,lerpX(t)+hand*amplitude*Math.sin(a)*window,
        5+lift*.65+amplitude*.75*(1-Math.cos(a))));
    }
  }else{
    knots.push(p(span*.30,lerpX(.3)+3,10),p(span*.55,lerpX(.55)-3,16),
      p(span*.78,lerpX(.78)-2,8));
  }
  knots.push(p(span-15,exit.x-exit.dx*10,3.4),p(span,exit.x,0));
  return {path:new TransitTubePath(760,spline(knots,entry,exit),true),kind};
}
export function validateTransit(path:TransitTubePath,entry:TransitPort,exit:TransitPort):TransitValidation{
  const errors:string[]=[],f=path.frames;
  let minRadius=Infinity,maxFrameTurn=0,clearance=Infinity,invertedSamples=0;
  if(!Number.isFinite(path.length)||path.length<80||path.length>500)errors.push('length');
  for(let i=0;i<f.length;i++){
    const a=f[i]!;
    if([...a.center,...a.tangent,...a.normal].some(x=>!Number.isFinite(x)))errors.push('finite');
    if(a.tangent[2]>.15)invertedSamples++;
    if(a.center[1]<2.30||a.center[2]>7-entry.progress+.2||a.center[2]<7-exit.progress-.2)
      errors.push('world-clearance');
    if(i){
      const b=f[i-1]!,turn=Math.acos(Math.max(-1,Math.min(1,dot(a.tangent,b.tangent))));
      minRadius=Math.min(minRadius,(a.distance-b.distance)/Math.max(turn,1e-8));
      maxFrameTurn=Math.max(maxFrameTurn,turn);
      if(dot(a.normal,b.normal)<.85)errors.push('frame-continuity');
    }
  }
  // Uniform arc-length samples avoid the variable spline-parameter spacing.
  // Subtract one full sample interval: the two nearest endpoints together
  // can be at most that far from a pair of actual swept-surface points.
  const spacing=.8,points=[];
  for(let d=0;d<path.length;d+=spacing)points.push(path.at(d));
  points.push(path.at(path.length));
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    if(points[j]!.distance-points[i]!.distance<9)continue;
    clearance=Math.min(clearance,distance(points[i]!.center,points[j]!.center));
  }
  clearance-=spacing;
  if(minRadius<3.4)errors.push('curvature');
  if(maxFrameTurn>.32)errors.push('tangent-continuity');
  if(clearance<TUBE_OFFSET*2+.8)errors.push('self-clearance');
  for(const [index,port] of [[0,entry],[f.length-1,exit]] as const){
    const a=f[index]!,desired=unit([port.dx,0,-1]);
    if(distance(a.center,[port.x,2.36,7-port.progress])>.002)errors.push('endpoint');
    if(dot(a.tangent,desired)<.998)errors.push('port-tangent');
    if(a.normal[1]>-.998)errors.push('port-normal');
  }
  return {valid:errors.length===0,errors:[...new Set(errors)],minRadius,clearance,maxFrameTurn,invertedSamples};
}
export function generateTransit(seed:number,entry:TransitPort,exit:TransitPort):SeededTransit{
  if(!Number.isFinite(seed)||exit.progress-entry.progress<100)throw Error('Invalid transit contract');
  for(let attempt=0;attempt<=12;attempt++){
    const actual=attempt===12?0:(seed+Math.imul(attempt,0x9e3779b9))>>>0;
    const {path,kind}=transitCandidate(actual,entry,exit,attempt===12);
    const validation=validateTransit(path,entry,exit);
    if(!validation.valid)continue;
    let hash=2166136261;
    for(const f of path.frames)for(const x of f.center){
      hash=Math.imul(hash^Math.round(x*1000),16777619)>>>0;
    }
    return {path,requestedSeed:seed>>>0,seed:actual,attempts:attempt+1,
      fallback:attempt===12,kind,validation,fingerprint:hash.toString(16).padStart(8,'0'),entry,exit};
  }
  throw Error('Known-safe transit failed validation; do not release the ball');
}
