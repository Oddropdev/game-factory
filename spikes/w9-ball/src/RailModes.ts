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
export const GRIND_START=190;
export const GRIND_END=227;
export const GRIND_HALF_WIDTH=.86;
export const GRIND_ENTRY_START=183;

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
  ballY:number,ballX:number,centerX:number,hasTopColliderContact:boolean
):boolean{
  // A named top slab collision is mandatory; height alone is NOT evidence.
  return hasTopColliderContact&&
    ballY>=GRIND_TOP_Y+PLAYER_RADIUS-.25 &&
    Math.abs(ballX-centerX)<=GRIND_HALF_WIDTH+PLAYER_RADIUS+.16;
}
export function relativeRailSpring(
  position:number,velocity:number,target:number,gain:number,damping:number,max:number
):number{
  return Math.max(-max,Math.min(max,(target-position)*gain-velocity*damping));
}
