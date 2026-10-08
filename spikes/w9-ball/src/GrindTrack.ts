// W9.4-6 — physically supported top-only narrow train rails, NOT a guard.
// Bridge crosses a floorless gap; secret route branches over and above road.
import {Color,Entity,StandardMaterial,type GraphicsDevice} from 'playcanvas';
import {buildSmoothSecretGrind} from './SmoothGrind';
import {SPEED_START_Z,SPEED_SEGMENT_STEP} from './SpeedCourse';
import {longCenter,longTangent} from './LongJumpCourse';
import {GRIND_START,GRIND_END,GRIND_TOP_Y,GRIND_HALF_WIDTH,
  GRIND_ENTRY_START,GRIND_VOID_FROM,GRIND_VOID_TO,
  SECRET_START,SECRET_END,grindPath,type GrindRoute} from './RailModes';
type Point=[number,number,number];
type Shape=(name:string,type:'box'|'sphere'|'cylinder',position:Point,
  scale:Point,material:StandardMaterial,solid?:'static'|'dynamic'|false,
  yaw?:number,pitch?:number)=>Entity;
const mat=(color:Color,emission:Color,strength:number)=>{
  const m=new StandardMaterial();
  m.diffuse=color;m.emissive=emission;m.emissiveIntensity=strength;
  m.gloss=.91;m.update();return m;
};
export function buildGrindTrack(shape:Shape,device:GraphicsDevice,root:Entity) {
  const steel=mat(new Color(.31,.56,.75),new Color(.02,.19,.35),.47);
  const stripe=mat(new Color(.17,.99,.84),new Color(.12,.91,.67),1.5);
  const sides=mat(new Color(.27,.35,.51),new Color(.01,.07,.14),.25);
  let bridgeTops=0,secretTops=0,sideCount=0;
  const route=(kind:GrindRoute,start:number,end:number)=>{
    const step=kind==='secret'?1.75:SPEED_SEGMENT_STEP;
    for(let d=start;d<=end;d+=step){
      const center=longCenter(d);
      const p=grindPath(d,center,kind);
      const ahead=grindPath(d+.25,longCenter(d+.25),kind);
      const behind=grindPath(d-.25,longCenter(d-.25),kind);
      const incline=Math.atan((ahead.y-behind.y)/.5)*180/Math.PI;
      const tangent=longTangent(d);
      const entityName=kind==='bridge'?'grind-deck-bridge-':'grind-top-secret-';
      // On the fast straight bridge these are render-only panels. The
      // separate single long STATIC collider below is the contact authority
      // and eliminates frame-dependent jumps at adjacent Bullet seams.
      // Short overlapping Bullet proxies follow the actual rising curve.
      // Render-only panels are replaced by ONE continuous spline mesh.
      const top=shape(entityName+(kind==='bridge'?bridgeTops:secretTops),
        'box',[p.x,p.y-.12,SPEED_START_Z-d],
        [GRIND_HALF_WIDTH*2,.24,step+.48],
        steel,kind==='bridge'?false:'static',tangent.yaw,incline);
      if(kind==='secret')top.children[0]!.enabled=false;
      if(kind==='bridge')bridgeTops++;else secretTops++;
      // Separate steel SIDE colliders to test forbidden side attachment.
      for(const sign of [-1,1]){
        const sideCollider=shape('grind-side-'+kind+'-'+sideCount++,'box',
          [p.x+sign*(GRIND_HALF_WIDTH+.105),p.y-.48,SPEED_START_Z-d],
          [.21,.75,step+.36],sides,'static',
          tangent.yaw,incline);
        if(kind==='secret')sideCollider.children[0]!.enabled=false;
      }
      if(kind==='bridge')shape('grind-energy-spine-'+kind+'-'+d,'box',
        [p.x,p.y+.025,SPEED_START_Z-d],
        [.19,.04,step+.17],stripe,false,
        tangent.yaw,incline);
    }
  };
  // Real gentle entry. The former 8-degree, 10m approach launched
  // the ball vertically ~15.7m/s at 50m/s and missed the train track.
  // Spread the rise over 30m at ~2deg; do not teleport or fake contact.
  const entryLength=GRIND_START+2-GRIND_ENTRY_START;
  const mid=GRIND_ENTRY_START+entryLength/2;
  shape('real-grind-entry-ramp','box',
    [longCenter(mid),.51,SPEED_START_Z-mid],
    [2.8,.24,entryLength],stripe,'static',longTangent(mid).yaw,2.05);
  // One uninterrupted static Bullet rail carries the ball over the void.
  // This remains a TOP collider: side objects keep different names and
  // never satisfy the strict top-only grind reward predicate.
  const bridgeMid=(GRIND_START+GRIND_END)/2;
  shape('grind-top-bridge-continuous','box',
    [longCenter(bridgeMid),GRIND_TOP_Y-.12,SPEED_START_Z-bridgeMid],
    [GRIND_HALF_WIDTH*2,.24,GRIND_END-GRIND_START+1.8],
    steel,'static',longTangent(bridgeMid).yaw);
  route('bridge',GRIND_START,GRIND_END);
  // Optional left-lane entry: actual inclined Bullet slope from the broad
  // 0m deck toward the secret TOP (1.12m); NOT an invisible auto-snap.
  // The 32m lead-in is gentle enough to be approached at racing speed.
  const secretEntry=SECRET_START-31;
  const secretLength=SECRET_START+1-secretEntry;
  const secretMid=secretEntry+secretLength/2;
  const secretApproach=grindPath(secretMid,longCenter(secretMid),'secret');
  const entry=shape('real-secret-rail-entry-ramp','box',
    [secretApproach.x,.49,SPEED_START_Z-secretMid],
    [2.4,.24,secretLength],stripe,'static',
    longTangent(secretMid).yaw,2.05);
  entry.children[0]!.enabled=false;
  // Separated LEFT elevated side branch, never crosses centerline/right guard.
  route('secret',SECRET_START,SECRET_END);
  const smooth=buildSmoothSecretGrind(device,root,steel,stripe,sides);
  return {bridgeTops,secretTops,topCount:bridgeTops+secretTops,
    smoothMeshCount:smooth.meshCount,smoothVisualSegments:smooth.visualSegments,
    sideCount,bridge:[GRIND_START,GRIND_END] as const,
    secret:[SECRET_START,SECRET_END] as const,
    floorlessGap:[GRIND_VOID_FROM,GRIND_VOID_TO] as const,
    bridgeTopY:GRIND_TOP_Y,secretTopPeakY:GRIND_TOP_Y+2.5};
}
