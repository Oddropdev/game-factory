// W10.2: actual-contact rail assist, NOT an invisible edge boundary.
// This pure profile keeps contact parsing, release and boost rules testable.
export type GuardSide=-1|1;
export const railContactSide=(name:string):GuardSide|null=>{
 const m=/^w10-physical-guard-(-?1)-\d+$/.exec(name);
 return m?(Number(m[1]) as GuardSide):null;
};
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(x,b));
export function magneticAssist(args:{
 side:GuardSide;lateral:number;halfWidth:number;sideSpeed:number;
 forward:number;steer:number;now:number;cooldownUntil:number;
}){
 const {side,lateral,halfWidth,sideSpeed,forward,steer,now,cooldownUntil}=args;
 const nearEdge=Math.abs(lateral-side*(halfWidth-.28))<1.9;
 const release=steer*side<-.43;
 const locked=now>=cooldownUntil&&nearEdge&&!release;
 const target=side*(halfWidth-.75);
 const pull=locked?clamp((target-lateral)*16-sideSpeed*4,-50,50):0;
 const drive=locked?clamp((72-forward)*2.8,0,90):0;
 return {locked,release,nearEdge,pull,drive,
  spark:locked&&Math.abs(sideSpeed)<12};
}
