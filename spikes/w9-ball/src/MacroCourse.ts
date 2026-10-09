// W10.4 — seed-deterministic macro-motif grammar. Deliberately large curves.
// Geometry is 3D path-position based: movement may reverse world Z.
// All motifs enter and leave at the same physical tube ports; never stitch
// noisy random angle changes or introduce unmodelled gaps.
import {generateSpiralRoad,spiralSpec,type SpiralPoint,type SpiralSpec} from './SpiralCourse';
export type MacroKind='grand-helix'|'double-helix'|'mega-slalom'|
 'figure-eight'|'sky-switchback'|'crest-dive';
export type MacroCourse={kind:MacroKind;motifs:string[];index:number;seed:number;
 start:number;end:number;road:SpiralPoint[];spec:SpiralSpec;signature:string};
const TYPES:MacroKind[]=['grand-helix','double-helix','mega-slalom',
 'figure-eight','sky-switchback','crest-dive'];
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const smooth=(t:number)=>{const u=clamp(t,0,1);return u*u*(3-2*u)};
function random(seed:number){let x=seed>>>0;return ()=>{x+=0x6d2b79f5;let t=x;t=Math.imul(t^(t>>>15),t|1);
 t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};}
function chosen(index:number,seed:number):MacroKind{
 if(index===3)return 'grand-helix'; // Keep approved first 360-degree test unchanged.
 const cycle=Math.floor((index-4)/TYPES.length),step=(index-4)%TYPES.length;
 const r=random((seed^Math.imul(cycle+1,0x517cc1b7))>>>0),order=[...TYPES];
 for(let k=order.length-1;k>0;k--){const p=Math.floor(r()*(k+1));[order[k],order[p]]=[order[p]!,order[k]!];}
 return order[step]!;
}
function bendPos(kind:MacroKind,p:SpiralPoint,start:number,end:number,
 amplitude:number,rise:number,hand:-1|1){
 const entry=start+85,exit=end-74;
 if(p.d<=entry||p.d>=exit)return p;
 const u=(p.d-entry)/(exit-entry),w=Math.sin(Math.PI*u)**2,phase=2*Math.PI*u;
 // Strong *macro* waves, with smooth value AND smooth derivative at both
 // boundaries. No razor-sharp seam joints from adjacent noisy motifs.
 let x=0,y=0,z=0,bank=0;
 switch(kind){
 case 'mega-slalom':
  x=hand*amplitude*Math.sin(phase)*w*1.4;
  z=amplitude*.62*Math.sin(phase)*w;
  y=rise*w*(.75+.25*Math.sin(phase)**2);
  bank=hand*24*w*Math.sin(phase);break;
 case 'figure-eight':
  x=hand*amplitude*Math.sin(phase)*w*1.2;
  z=amplitude*.68*Math.sin(phase*2)*w;
  y=rise*w*(.75+.25*Math.sin(phase*2)**2);
  bank=hand*23*w*Math.cos(phase);break;
 case 'sky-switchback':
  x=hand*amplitude*Math.sin(phase*1.5)*w*1.3;
  z=amplitude*.90*Math.sin(phase)*w;
  y=rise*w*(.6+.4*Math.sin(phase)**2);
  bank=hand*27*w*Math.sin(phase*1.5);break;
 case 'crest-dive':
  x=hand*amplitude*.8*Math.sin(phase*.72)*w;
  z=amplitude*.40*Math.sin(phase)*w;
  y=rise*w*(.72+.28*Math.sin(phase*1.5)**2);
  bank=hand*21*w*Math.sin(phase);break;
 default:break;
 }
 return {...p,x:p.x+x,y:p.y+y,z:(p.z??7-p.d)+z,bank};
}
export function buildMacroCourse(index:number,seed:number,start:number,end:number,axis:number):MacroCourse{
 const spec=spiralSpec(index,seed,start,end,axis),kind=chosen(index,seed);
 const rand=random((seed^Math.imul(index+1,0x7feb352d)^0x4accd12d)>>>0);
 const amplitude=45+rand()*31,rise=48+rand()*36;
 const hand=rand()>.5?1 as const:-1 as const;
 let road:SpiralPoint[];
 let motifs:string[];
 if(kind==='grand-helix'||kind==='double-helix'){
  road=generateSpiralRoad(spec).map(p=>{
   if(index===3)return p; // Accepted W10.3 baseline physics proof unchanged.
   if(kind==='double-helix'&&p.d>=spec.coilStart&&p.d<=spec.coilEnd){
    const u=(p.d-spec.coilStart)/(spec.coilEnd-spec.coilStart),angle=
     (spec.hand===1?Math.PI:0)+spec.hand*4*Math.PI*u;
    return {...p,x:spec.axis+spec.hand*spec.radius+spec.radius*Math.cos(angle),
     z:7-spec.coilStart+spec.radius*Math.sin(angle),y:spec.rise*smooth(u),
     bank:spec.hand*25*Math.sin(Math.PI*u)**2};
   }
   if(p.d<=spec.coilEnd||p.d>=end)return p;
   // A second independent, giant descending motif after the 360/720 turn.
   const u=(p.d-spec.coilEnd)/(end-spec.coilEnd),w=Math.sin(Math.PI*u)**2;
   return {...p,x:p.x+hand*amplitude*.85*w*Math.sin(Math.PI*u),
    y:p.y+rise*.36*w,
    z:(p.z??7-p.d)+amplitude*.32*Math.sin(2*Math.PI*u)*w,
    bank:p.bank+hand*12*w*Math.sin(2*Math.PI*u)};
  });
  motifs=kind==='double-helix'?['double-360-coil','skyline-drop','wide-exit-sweep']:
   ['full-360-coil','summit-dive','wide-exit-sweep'];
 }else{
  // Non-loop kinds follow one shared tube axis only at their ports, NOT
  // through the middle. Each has major spatial reversals, peaks and bank.
  road=generateSpiralRoad(spec).map(p=>{
   const flat={...p,x:axis,y:0,z:7-p.d,bank:0,width:p.width};
   return bendPos(kind,flat,start,end,amplitude,rise,hand);
  });
  motifs=kind==='mega-slalom'?['giant-s-bend','elevated-sweep','long-dive']:
   kind==='figure-eight'?['wide-figure-eight','elevated-crossing','exit-roll']:
   kind==='sky-switchback'?['reverse-heading-bend','sky-crest','canyon-descend']:
   ['mountain-climb','double-crest','steep-dive'];
 }
 const signature=[index,seed,kind,spec.hand,
  Math.round(spec.radius*10),Math.round(amplitude*10),Math.round(rise*10),hand].join(':');
 return {kind,motifs,index,seed,start,end,road,spec,signature};
}
export function validateMacroCourse(c:MacroCourse){
 const {road,start,end,spec}=c;let minGap=Infinity,maxStep=0,maxTurn=0,maxPitch=0;
 let length=0,reverseZ=0,peak=0,rangeX=[Infinity,-Infinity];
 for(let i=1;i<road.length;i++){
  const a=road[i-1]!,b=road[i]!,dx=b.x-a.x,dy=b.y-a.y,dz=(b.z??7-b.d)-(a.z??7-a.d);
  const step=Math.hypot(dx,dy,dz);
  maxStep=Math.max(maxStep,step);length+=step;
  maxPitch=Math.max(maxPitch,Math.abs(Math.atan2(dy,Math.hypot(dx,dz))));
  if(dz>.02)reverseZ++;
  peak=Math.max(peak,b.y);rangeX=[Math.min(rangeX[0]!,b.x),Math.max(rangeX[1]!,b.x)];
  minGap=Math.min(minGap,step);
  if(i>1){const p=road[i-2]!,ux=a.x-p.x,uy=a.y-p.y,
   uz=(a.z??7-a.d)-(p.z??7-p.d);
   const dot=ux*dx+uy*dy+uz*dz,mag=Math.hypot(ux,uy,uz)*step||1;
   maxTurn=Math.max(maxTurn,Math.acos(clamp(dot/mag,-1,1)));}
 }
 const first=road.find(p=>p.d===start)!,last=road.find(p=>p.d===end)!;
 const ports=Math.hypot(first.x-spec.axis,first.y,first.z!-(7-start),
  last.x-spec.axis,last.y,last.z!-(7-end));
 const distinct=rangeX[1]!-rangeX[0]!;
 const valid=Number.isFinite(length)&&ports<.001&&road.length===537&&
  maxTurn<.20&&maxPitch<1.24&&maxStep<8&&minGap>.02&&
  length>500&&peak>26&&distinct>15&&c.motifs.length>=3;
 return {valid,ports,length,maxTurn,maxPitch,maxStep,minGap,reverseZ,
  peak,spanX:distinct,kind:c.kind,motifs:c.motifs,signature:c.signature};
}
