// W9.4-6 — two DIFFERENT sports, not two names for the same rail.
// GUARD = broad side OR top contact, strong magnetic lock, opposite swipe escape.
// GRIND = narrow raised top-only contact; side contact NEVER locks or boosts.
export type GuardLock='free'|'approach'|'locked-side'|'locked-top'|'release-cooldown';
export type GrindLock='off'|'top-grind'|'exit-cooldown';
export const GUARD_TOP_Y=1.34;
export const GRIND_TOP_Y=1.12;
export const PLAYER_RADIUS=.62;
export const RELEASE_COOLDOWN=.75;
export const OPPOSITE_RELEASE_INPUT=1.05;
export const GUARD_HOLD_FORCE=475;
export const GUARD_DOWN_FORCE=118;
export const GUARD_SPEED_FORCE=250;
export const GRIND_CENTER_FORCE=390;
export const GRIND_SPEED_FORCE=285;
export const GRIND_START=196;
export const GRIND_END=231;
export const GRIND_HALF_WIDTH=.86;
export const GRIND_ENTRY_START=168;
export const GRIND_VOID_FROM=198;
export const GRIND_VOID_TO=217;
export const SECRET_START=344;
export const SECRET_END=402;
export type GrindRoute='bridge'|'secret';
const smooth=(a:number,b:number,v:number)=>{
  const t=Math.max(0,Math.min(1,(v-a)/(b-a)));
  return t*t*(3-2*t);
};
// Optional upper secret rail: rises 2.5m and bends outside the broad
// track, then descends. Geometry is independent from the side-boost guard.
export function grindPath(progress:number,centerlineX:number,route:GrindRoute){
  if(route==='bridge')return {x:centerlineX,y:GRIND_TOP_Y};
  // The upper shortcut is a CHOICE on the left lane, never an obstacle
  // in the centerline. Side selection begins well ahead of the 344m rail.
  // Third green GUARD is on the opposite outer right edge.
  const entryLane=-3.0*(smooth(301,313,progress)-smooth(398,417,progress));
  const branchBend=-1.35*(smooth(352,374,progress)-smooth(385,399,progress));
  const elevation=2.5*(smooth(348,375,progress)-smooth(382,401,progress));
  return {x:centerlineX+entryLane+branchBend,y:GRIND_TOP_Y+elevation};
}
export function activeGrindRoute(progress:number):GrindRoute|null{
  if(progress>=GRIND_START-1&&progress<=GRIND_END+1)return 'bridge';
  if(progress>=SECRET_START-1&&progress<=SECRET_END+1)return 'secret';
  return null;
}

export function guardSurface(ballY:number):'side'|'top'{
  return ballY>=GUARD_TOP_Y+PLAYER_RADIUS-.20?'top':'side';
}
export function oppositeToGuard(targetX:number,side:-1|1):boolean{
  // Rail side is a COURSE choice. The opposite swipe must be deliberate,
  // measured relative to the course center, not a transient vibration.
  return side*targetX < -OPPOSITE_RELEASE_INPUT;
}
export function allowGuardLock(
  surface:'side'|'top',hasPhysicalContact:boolean,cooldownUntil:number,now:number
):boolean{
  return hasPhysicalContact && now>=cooldownUntil &&
    (surface==='side'||surface==='top');
}
export function grindTopQualifies(
  ballY:number,ballX:number,railX:number,railTopY:number,hasTopColliderContact:boolean
):boolean{
  // True top CONTACT plus the ball's center ABOVE the running surface.
  // Wide x allowance would misclassify the narrow track's side wall.
  return hasTopColliderContact&&
    ballY>=railTopY+PLAYER_RADIUS-.24 &&
    Math.abs(ballX-railX)<=GRIND_HALF_WIDTH-.06;
}
// Recovery eligibility is deliberately NOT a new contact/boost permission.
// A nearly stationary ball trapped BELOW a rail is redirected to a safe deck;
// the regular top-only Bullet contact gate remains authoritative.
export function trappedBelowGrind(
  ballY:number,ballX:number,railX:number,railTopY:number,
  planarSpeed:number,hasTopContact:boolean
):boolean{
  return !hasTopContact&&ballY<railTopY-.05&&
    Math.abs(ballX-railX)<GRIND_HALF_WIDTH+1.4&&planarSpeed<4;
}

export function relativeRailSpring(
  position:number,velocity:number,target:number,gain:number,damping:number,max:number
):number{
  return Math.max(-max,Math.min(max,(target-position)*gain-velocity*damping));
}
