// W9.4-8: Level 2 is an independently loaded, visually distinct playable level.
// The prior 440m road and tube remain unchanged. Stage Bullet surfaces first,
// then activate an intentionally different art palette only at tube exit.
import {Entity,type StandardMaterial} from 'playcanvas';
import {longCenter} from './LongJumpCourse';
import {SPEED_START_Z} from './SpeedCourse';
type Vec=[number,number,number];
type Shape=(name:string,type:'box'|'sphere'|'cylinder',pos:Vec,scale:Vec,
  material:StandardMaterial,solid?:'static'|'dynamic'|false,
  yaw?:number,pitch?:number)=>Entity;
export type SecondLevelManifest={
  id:'sunset-ribbon-2';version:1;title:string;startProgress:number;
  endProgress:number;width:number;plankStep:number;theme:'coral-lilac';
  gatePositions:number[];gemPositions:number[];
};
const smooth=(a:number,b:number,x:number)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};
// Continuous first derivative at 550m: clean Bullet tube -> road handoff.
export function secondCenter(d:number):number{
  return longCenter(550)+4.4*smooth(573,616,d)
    -7.0*smooth(630,670,d)+2.6*smooth(679,700,d);
}
export function secondTangent(d:number){
  const gradient=(secondCenter(d+.25)-secondCenter(d-.25))/.5;
  const mag=Math.hypot(gradient,1);
  return {x:gradient/mag,z:-1/mag,yaw:-Math.atan(gradient)*180/Math.PI};
}
export function parseSecondLevelManifest(input:unknown):SecondLevelManifest{
  if(!input||typeof input!=='object')throw Error('Second level manifest absent');
  const m=input as Record<string,unknown>;
  const gates=m.gatePositions,gems=m.gemPositions;
  const validNumbers=(xs:unknown,min:number,max:number,minCount:number)=>{
    return Array.isArray(xs)&&xs.length>=minCount&&xs.length<=8&&
      xs.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max)&&
      xs.every((x,i)=>i===0||x>xs[i-1]);
  };
  if(m.id!=='sunset-ribbon-2'||m.version!==1||m.title!=='SUNSET RIBBON'||
    m.startProgress!==550||m.endProgress!==700||
    m.width!==12||m.plankStep!==2.5||m.theme!=='coral-lilac'||
    !validNumbers(gates,557,695,3)||!validNumbers(gems,555,697,4))
    throw Error('Unsafe or invalid second level manifest');
  return m as SecondLevelManifest;
}
export type SecondGem={node:Entity;collected:boolean;progress:number};
export function stageSecondLevel(m:SecondLevelManifest,shape:Shape,
  mats:{road:StandardMaterial;alternate:StandardMaterial;
    arch:StandardMaterial;trim:StandardMaterial;gem:StandardMaterial;
    island:StandardMaterial}){
  const visualSurfaces:Entity[]=[],decor:Entity[]=[],gems:SecondGem[]=[];
  let planks=0,gates=0;
  for(let d=m.startProgress-2;d<=m.endProgress+3;d+=m.plankStep){
    const t=secondTangent(d),x=secondCenter(d),z=SPEED_START_Z-d;
    const e=shape('level2-real-road-'+planks,'box',
      [x,-.29,z],[m.width,.58,m.plankStep+.38],
      planks%3===0?mats.alternate:mats.road,'static',t.yaw);
    e.children[0]!.enabled=false;visualSurfaces.push(e.children[0]! as Entity);
    if(planks%4===0){
      const left=shape('level2-ribbon-left-'+planks,'box',
        [x-m.width/2+.17,.05,z],[.2,.15,m.plankStep*4],
        mats.trim,false,t.yaw);
      const right=shape('level2-ribbon-right-'+planks,'box',
        [x+m.width/2-.17,.05,z],[.2,.15,m.plankStep*4],
        mats.trim,false,t.yaw);
      left.enabled=false;right.enabled=false;decor.push(left,right);
    }
    if(planks%7===0){
      for(const side of [-1,1]){
        const orb=shape('level2-floating-island-'+planks+'-'+side,'sphere',
          [x+side*10,-1.65,z],[4.5,1.1,5.6],mats.island,false);
        orb.enabled=false;decor.push(orb);
      }
    }
    planks++;
  }
  for(const p of m.gatePositions){
    const x=secondCenter(p),z=SPEED_START_Z-p,t=secondTangent(p);
    for(const side of [-1,1]){
      const post=shape('level2-gate-'+gates+'-post-'+side,'cylinder',
        [x+side*4.75,1.9,z],[.58,3.9,.58],mats.arch,false,t.yaw);
      post.enabled=false;decor.push(post);
    }
    // Soft bead arch: no rigid collision and no squared-off beams.
    for(let i=0;i<=12;i++){
      const theta=Math.PI*i/12;
      const arch=shape('level2-gate-'+gates+'-arch-'+i,'sphere',
        [x-4.75*Math.cos(theta),3.62+3.75*Math.sin(theta),z],
        [.74,.74,.74],i%3===0?mats.trim:mats.arch,false,t.yaw);
      arch.enabled=false;decor.push(arch);
    }
    gates++;
  }
  for(let i=0;i<m.gemPositions.length;i++){
    const p=m.gemPositions[i]!,x=secondCenter(p);
    const e=shape('level2-collectible-'+i,'sphere',
      [x,1.1,SPEED_START_Z-p],[1.05,1.05,1.05],mats.gem,false);
    e.enabled=false;
    gems.push({node:e,collected:false,progress:p});
  }
  let active=false;
  return {
    id:m.id,title:m.title,theme:m.theme,roadPlanks:planks,gateCount:gates,
    gems, get active(){return active;},
    activate(){
      if(active)return;
      active=true;
      for(const child of visualSurfaces)child.enabled=true;
      for(const e of decor)e.enabled=true;
      for(const g of gems)g.node.enabled=!g.collected;
    },
    deactivate(){
      active=false;
      for(const child of visualSurfaces)child.enabled=false;
      for(const e of decor)e.enabled=false;
      for(const g of gems){g.collected=false;g.node.enabled=false;}
    }
  };
}
export type SecondLevelInstance=ReturnType<typeof stageSecondLevel>;
