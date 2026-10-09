// W10.2: an actual ribbon-surface crossing check for collision misses.
// Never applies a lateral restoring force, never rescues beyond deck edges.
export const roadSurfaceY=(y:number,bankDeg:number,lateral:number)=>
 y+Math.sin(bankDeg*Math.PI/180)*lateral;
export function sweptDeckCatch(o:{
 previousGap:number;currentGap:number;currentLateral:number;halfWidth:number;
 travel:number;verticalSpeed:number;roadProgressJump:number;
}){
 return o.previousGap>=.44&&o.currentGap<.47&&o.currentGap> -4.5&&
  Math.abs(o.currentLateral)<o.halfWidth-.26&&
  o.travel<11&&o.roadProgressJump<14&&o.verticalSpeed<-.1;
}
