// W9.4-7: prepare actual NEXT level geometry from separately fetched data.
// No fake delay: the data fetch and Bullet/visual staging must complete.
import {Entity,type StandardMaterial} from 'playcanvas';
import {longCenter,longTangent} from './LongJumpCourse';
import {SPEED_START_Z} from './SpeedCourse';
export type TransitLevelManifest={
  id:string;version:number;startProgress:number;endProgress:number;
  plankStep:number;width:number;baseTopY:number;theme:string;
};
type Shape=(name:string,type:'box'|'sphere'|'cylinder',
  pos:[number,number,number],scale:[number,number,number],
  material:StandardMaterial,solid?:'static'|'dynamic'|false,yaw?:number)=>Entity;
export function parseTransitManifest(x:unknown):TransitLevelManifest{
  if(typeof x!=='object'||!x)throw Error('next-level manifest missing');
  const m=x as Record<string,unknown>;
  if(m.id!=='sky-islands-2'||m.version!==1||
    typeof m.startProgress!=='number'||typeof m.endProgress!=='number'||
    typeof m.plankStep!=='number'||typeof m.width!=='number'||
    typeof m.baseTopY!=='number'||typeof m.theme!=='string'||
    m.startProgress<540||m.endProgress<610||m.endProgress>700||
    m.plankStep<2||m.plankStep>5||m.width<7||m.width>15){
    throw Error('invalid next-level manifest');
  }
  return m as TransitLevelManifest;
}
export function stageTransitLevel(manifest:TransitLevelManifest,shape:Shape,
  road:StandardMaterial,accent:StandardMaterial){
  const nodes:Entity[]=[];
  let count=0;
  for(let d=manifest.startProgress-2;
    d<=manifest.endProgress+4;d+=manifest.plankStep){
    const center=longCenter(d),t=longTangent(d);
    const node=shape('transit-next-road-'+count,'box',
      [center,manifest.baseTopY-.29,SPEED_START_Z-d],
      [manifest.width,.58,manifest.plankStep+.46],road,'static',t.yaw);
    // Build live Bullet proxies before release, then reveal the new world
    // when the route transition is ready. No contact with the current tube.
    node.children[0]!.enabled=false;
    nodes.push(node);
    if(count%4===0){
      const marker=shape('transit-next-accent-'+count,'box',
        [center,manifest.baseTopY+.075,SPEED_START_Z-d],
        [manifest.width-1.1,.15,.38],accent,false,t.yaw);
      marker.enabled=false;
      nodes.push(marker);
    }
    count++;
  }
  return {
    id:manifest.id,
    roadPlanks:count,
    activate:()=>{
      for(const e of nodes){
        const visual=e.children.find(c=>c.name.endsWith('-visual'));
        if(visual)visual.enabled=true;
        else e.enabled=true;
      }
    }
  };
}
