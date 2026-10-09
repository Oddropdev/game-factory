import {Entity,Vec3,type AppBase,type GraphicsDevice,type StandardMaterial} from 'playcanvas';
import {WorldAssets} from './TrilogyAssets';
import {buildWorldArt,coinMesh} from './TrilogyArt';
import {parseWorld,parseRoad,WORLD_URLS,trilogyCenter,trilogyTangent,
 type RoadSample,type WorldManifest} from './TrilogyManifest';
export type Gem={node:Entity;collected:boolean;d:number};
export class TrilogyWorld{
 readonly root:Entity;readonly assets:WorldAssets;
 materials:StandardMaterial[]=[];gems:Gem[]=[];roadBodies=0;hazardBodies=0;
 disposed=false;active=false;meshCount=0;islandCount=0;trackQuads=0;privateMeshes=0;
 constructor(readonly app:AppBase,readonly manifest:WorldManifest,readonly road:RoadSample[],root?:Entity){
  this.root=root??new Entity('world-'+manifest.id);this.root.enabled=false;
  if(!this.root.parent)app.root.addChild(this.root);this.assets=new WorldAssets(app);
 }
 async prepare(device:GraphicsDevice,legacy=false){
  const m=this.manifest;
  const art=buildWorldArt(device,this.root,m,this.road);
  this.materials=art.materials;this.meshCount=art.meshCount;this.islandCount=art.islandCount;this.trackQuads=art.trackQuads;
  if(!legacy)for(let i=0;i<this.road.length;i+=2){
   const p=this.road[i]!,t=trilogyTangent(p.d),bank=p.bank;
   const e=new Entity('trilogy-road-'+m.id+'-'+i);this.root.addChild(e);
   e.setPosition(p.x,-.30,7-p.d);e.setEulerAngles(0,t.yaw,bank);
   e.addComponent('collision',{type:'box',halfExtents:new Vec3(p.width/2,.30,1.2)});
   e.addComponent('rigidbody',{type:'static',friction:.85,restitution:0});this.roadBodies++;
  }
  for(const [i,d] of m.gems.entries()){
   const e=new Entity('trilogy-gem-'+i);this.root.addChild(e);e.setPosition(trilogyCenter(d),1.25,7-d);
   e.addComponent('render',{meshInstances:[coinMesh(device,art.mats.gold)],castShadows:true});
   this.gems.push({node:e,collected:false,d});
  }
  // Physical hazards sit in optional outer lanes; center route stays readable.
  const hazardAnchors:Entity[]=[];
  for(const [i,d] of m.hazards.entries()){
   const e=new Entity('hazard-'+m.id+'-'+i),side=i%2?1:-1;this.root.addChild(e);
   e.setPosition(trilogyCenter(d)+side*3.1,.75,7-d);
   e.addComponent('collision',{type:'sphere',radius:.72});e.addComponent('rigidbody',{type:'static',restitution:.65});
   const visual=new Entity('placeholder');visual.setLocalScale(1.44,1.44,1.44);visual.addComponent('render',{type:'sphere',material:art.mats.road[i%art.mats.road.length],castShadows:true});e.addChild(visual);
   hazardAnchors.push(e);this.hazardBodies++;
  }
  await this.assets.load(m.privateModels); 
  if(this.disposed)return;
  hazardAnchors.forEach(e=>{if(this.assets.attach(m.id==='candy'?'roller':'bumper',e,new Vec3(1.44,1.44,1.44))){e.findByName('placeholder')!.enabled=false;this.privateMeshes++;}});
  for(let i=0;i<5;i++){
   const d=m.start+15+i*(m.end-m.start-30)/5,e=new Entity('licensed-world-scenery');this.root.addChild(e);
   e.setPosition(trilogyCenter(d)+(i%2?14:-14),-1,7-d);
   if(this.assets.attach(m.id==='candy'&&i%2?'balloon':'tree',e,new Vec3(5,9,5),true))this.privateMeshes++;
  }
  if(m.id==='rainbow')for(const g of this.gems){
   if(this.assets.attach('coin',g.node,new Vec3(1.3,1.3,.36))){g.node.render!.enabled=false;this.privateMeshes++;}
  }
  const gate=new Entity('licensed-checkpoint');this.root.addChild(gate);gate.setPosition(trilogyCenter(m.end-6),0,13-m.end);
  if(this.assets.attach(m.id==='candy'?'arch':'checkpoint',gate,new Vec3(10,7,3),true))this.privateMeshes++;
 }
 activate(){if(this.disposed)throw Error('Activating disposed world');this.root.enabled=true;this.active=true;}
 collect(position:Vec3,time:number){let count=0;for(const g of this.gems){if(g.collected)continue;
  g.node.setEulerAngles(0,time*70,0);const p=g.node.getPosition();
  if(p.distance(position)<1.75){g.collected=true;g.node.enabled=false;count++;}}
  return count;
 }
 dispose(){if(this.disposed)return;this.root.destroy();this.assets.dispose();for(const m of this.materials)m.destroy();
  this.materials=[];this.gems=[];this.active=false;this.disposed=true;}
 snapshot(){return {id:this.manifest.id,active:this.active,disposed:this.disposed,roadBodies:this.roadBodies,
  hazardBodies:this.hazardBodies,meshes:this.meshCount,islands:this.islandCount,trackQuads:this.trackQuads,
  liveBodies:this.disposed?0:this.root.findComponents('rigidbody').length,
  privateMeshes:this.privateMeshes,missing:this.assets.missing};}
}
export async function fetchWorld(index:number,signal?:AbortSignal){
 const get=async(url:string)=>{const r=await fetch(new URL(url,document.baseURI),{signal});if(!r.ok)throw Error('World HTTP '+r.status);return r.json();};
 const manifest=parseWorld(await get(WORLD_URLS[index]!),index);
 const road=parseRoad(await get(manifest.geometry),manifest);return {manifest,road};
}
