// W9.4-6 — physically supported top-only narrow train rails, NOT a guard.
// Bridge crosses a floorless gap; secret route branches over and above road.
import {Color,Entity,StandardMaterial} from 'playcanvas';
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
export function buildGrindTrack(shape:Shape) {
  const steel=mat(new Color(.31,.56,.75),new Color(.02,.19,.35),.47);
  const stripe=mat(new Color(.17,.99,.84),new Color(.12,.91,.67),1.5);
  const sides=mat(new Color(.27,.35,.51),new Color(.01,.07,.14),.25);
  let bridgeTops=0,secretTops=0,sideCount=0;
  const route=(kind:GrindRoute,start:number,end:number)=>{
    for(let d=start;d<=end;d+=SPEED_SEGMENT_STEP){
      const center=longCenter(d);
      const p=grindPath(d,center,kind);
      const ahead=grindPath(d+.25,longCenter(d+.25),kind);
      const behind=grindPath(d-.25,longCenter(d-.25),kind);
      const incline=Math.atan((ahead.y-behind.y)/.5)*180/Math.PI;
      const tangent=longTangent(d);
      const entityName=kind==='bridge'?'grind-top-bridge-':'grind-top-secret-';
      shape(entityName+(kind==='bridge'?bridgeTops:secretTops),
        'box',[p.x,p.y-.12,SPEED_START_Z-d],
        [GRIND_HALF_WIDTH*2,.24,SPEED_SEGMENT_STEP+.48],
        steel,'static',tangent.yaw,incline);
      if(kind==='bridge')bridgeTops++;else secretTops++;
      // Separate steel SIDE colliders to test forbidden side attachment.
      for(const sign of [-1,1]){
        shape('grind-side-'+kind+'-'+sideCount++,'box',
          [p.x+sign*(GRIND_HALF_WIDTH+.105),p.y-.48,SPEED_START_Z-d],
          [.21,.75,SPEED_SEGMENT_STEP+.36],sides,'static',
          tangent.yaw,incline);
      }
      shape('grind-energy-spine-'+kind+'-'+d,'box',
        [p.x,p.y+.025,SPEED_START_Z-d],
        [.19,.04,SPEED_SEGMENT_STEP+.17],stripe,false,
        tangent.yaw,incline);
    }
  };
  // Real sloped entry from main floor to +1.12m rail. No physics teleport.
  const entryLength=GRIND_START+3-GRIND_ENTRY_START;
  const mid=GRIND_ENTRY_START+entryLength/2;
  shape('real-grind-entry-ramp','box',
    [longCenter(mid),.48,SPEED_START_Z-mid],
    [2.6,.28,entryLength],stripe,'static',longTangent(mid).yaw,8);
  route('bridge',GRIND_START,GRIND_END);
  // Elevated secret rail: rises ABOVE the road, bends outward and returns.
  // Road remains underneath, so top-only riders have a genuine high path.
  route('secret',SECRET_START,SECRET_END);
  return {bridgeTops,secretTops,topCount:bridgeTops+secretTops,
    sideCount,bridge:[GRIND_START,GRIND_END] as const,
    secret:[SECRET_START,SECRET_END] as const,
    floorlessGap:[GRIND_VOID_FROM,GRIND_VOID_TO] as const,
    bridgeTopY:GRIND_TOP_Y,secretTopPeakY:GRIND_TOP_Y+2.5};
}
