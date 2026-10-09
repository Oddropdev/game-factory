// W9.9 — authored constraints + truly randomized motif grammar.
// Paths remain strictly monotonic in progress, but lateral and vertical
// geometry form long, wildly changing rollercoaster-like sections.
export type MotifKind='sky-helix'|'gravity-bowl'|'high-dive'|'serpentine'|
 'bank-sweep'|'double-s'|'wave-canyon'|'switchback';
export type Motif={kind:MotifKind;start:number;end:number;amplitude:number;
 rise:number;direction:-1|1;phase:number};
export type CourseGrammar={motifs:Motif[];signature:string;seed:number;index:number;
 start:number;end:number};
const TYPES:readonly MotifKind[]=['sky-helix','gravity-bowl','high-dive','serpentine',
 'bank-sweep','double-s','wave-canyon','switchback'];
const smooth=(t:number)=>t*t*(3-2*t);
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
function rand(seed:number){
 let s=seed>>>0;
 return ()=>{s+=0x6d2b79f5;let t=s;t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
const cache=new Map<string,CourseGrammar>();
export function buildCourseGrammar(index:number,seed:number,start:number,end:number):CourseGrammar{
 if(!Number.isSafeInteger(index)||end-start<300||end-start>900)throw Error('Invalid course grammar bounds');
 const key=[index,seed,start,end].join(':');
 const cached=cache.get(key);if(cached)return cached;
 const r=rand((seed^Math.imul(index+1,0x9e3779b1)^0x416c52cd)>>>0);
 const count=5+(index%2),weights=Array.from({length:count},()=>.84+r()*.32);
 const total=weights.reduce((a,b)=>a+b,0),motifs:Motif[]=[];
 let d=start,last:MotifKind|null=null;
 for(let i=0;i<count;i++){
  let kind=TYPES[Math.floor(r()*TYPES.length)]!;
  if(kind===last)kind=TYPES[(TYPES.indexOf(kind)+1+Math.floor(r()*3))%TYPES.length]!;
  const finish=i===count-1?end:d+(end-start)*weights[i]!/total;
  const span=finish-d;
  const amplitude=(12+r()*18)*Math.min(1,span/105);
  const rise=17+r()*24;
  const direction=r()>.5?1 as const:-1 as const;
  motifs.push({kind,start:d,end:finish,amplitude,rise,direction,phase:r()*2*Math.PI});
  d=finish;last=kind;
 }
 const signature=motifs.map(m=>m.kind+':'+Math.round(m.amplitude*10)+':'+m.direction+
  ':'+Math.round(m.rise*10)).join('|');
 const result={motifs,signature,seed,index,start,end};
 if(cache.size>=8)cache.delete(cache.keys().next().value!);
 cache.set(key,result);return result;
}
export function courseAt(g:CourseGrammar,d:number){
 const t=clamp(d,g.start,g.end);
 const motif=g.motifs.find(m=>t<=m.end)??g.motifs[g.motifs.length-1]!;
 const u=clamp((t-motif.start)/(motif.end-motif.start),0,1);
 const e=Math.sin(Math.PI*u)**2,phase=2*Math.PI*u;
 let lateral=0,height=0;
 switch(motif.kind){
  case 'sky-helix':
   lateral=Math.sin(phase*1.45+motif.phase*.25)*e;
   height=motif.rise*e*(1+.18*Math.sin(phase));break;
  case 'gravity-bowl':
   lateral=Math.cos(phase*1.1+motif.phase*.2)*e;
   height=motif.rise*e*(.86+.14*Math.cos(phase*2));break;
  case 'high-dive':
   lateral=Math.sin(phase*.7+motif.phase*.25)*e;
   height=motif.rise*e*(1+.2*Math.sin(phase*1.5));break;
  case 'serpentine':
   lateral=Math.sin(phase*1.85+motif.phase*.1)*e;
   height=motif.rise*e*.55;break;
  case 'bank-sweep':
   lateral=e*(.85+.15*Math.sin(phase));
   height=motif.rise*e*.58;break;
  case 'double-s':
   lateral=Math.sin(phase*2+motif.phase*.1)*e;
   height=motif.rise*e*.72;break;
  case 'wave-canyon':
   lateral=Math.sin(phase*.9+motif.phase*.18)*e;
   height=motif.rise*e*(.5+.5*smooth(u));break;
  case 'switchback':
   lateral=Math.cos(phase*1.5+motif.phase*.1)*e;
   height=motif.rise*e*.48;break;
 }
 return {x:motif.direction*motif.amplitude*lateral,
  y:Math.max(0,height),kind:motif.kind,motifIndex:g.motifs.indexOf(motif)};
}
export function courseKinematics(g:CourseGrammar,d:number){
 const step=.5,a=courseAt(g,d-step),b=courseAt(g,d),c=courseAt(g,d+step);
 const dx=(c.x-a.x)/(step*2),slope=(c.y-a.y)/(step*2);
 const d2x=(a.x-2*b.x+c.x)/(step*step);
 const curvature=Math.abs(d2x)/Math.pow(1+dx*dx,1.5);
 const bank=clamp(Math.atan2(-d2x*48*48,22)*180/Math.PI,-34,34);
 return {...b,dx,slope,curvature,bank};
}
export function validateCourseGrammar(g:CourseGrammar){
 let maxGrade=0,maxCurvature=0,maxX=0,maxY=0,maxStep=0;
 const kinds=new Set<string>(),steps=1200,delta=(g.end-g.start)/steps;
 let previous=courseAt(g,g.start);
 for(let i=0;i<=steps;i++){
  const d=g.start+i*delta,p=courseKinematics(g,d);
  kinds.add(p.kind);
  maxGrade=Math.max(maxGrade,Math.abs(p.slope));
  maxCurvature=Math.max(maxCurvature,p.curvature);
  maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,p.y);
  maxStep=Math.max(maxStep,Math.hypot(p.x-previous.x,p.y-previous.y));
  previous=p;
 }
 const ports=Math.abs(courseAt(g,g.start).x)+Math.abs(courseAt(g,g.end).x)+
  Math.abs(courseAt(g,g.start).y)+Math.abs(courseAt(g,g.end).y);
 const valid=ports<.0001&&maxGrade<1.65&&maxCurvature<.30&&maxY<=55&&
  maxStep<2.5&&g.motifs.length>=5&&kinds.size>=4;
 return {valid,maxGrade,maxCurvature,maxX,maxY,maxStep,
  motifKinds:kinds.size,motifCount:g.motifs.length,signature:g.signature};
}
