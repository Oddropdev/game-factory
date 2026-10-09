import {Entity,Vec3,type AppBase,type GraphicsDevice,type StandardMaterial} from 'playcanvas';
import {WorldAssets} from './TrilogyAssets';
import {buildWorldArt,coinMesh,polished} from './TrilogyArt';
import {parseWorld,parseRoad,WORLD_URLS,trilogyCenter,trilogyTangent,
 type RoadSample,type WorldManifest} from './TrilogyManifest';
export type Gem={node:Entity;collected:boolean;d:number};
export class TrilogyWorld{
 readonly root:Entity;readonly assets:WorldAssets;
 materials:StandardMaterial[]=[];gems:Gem[]=[];roadBodies=0;hazardBodies=0;
 disposed=false;active=false;meshCount=0;islandCount=0;trackQuads=0;privateMeshes=0;
 guardBodies=0;grindTops=0;grindSides=0;
 constructor(readonly app:AppBase,readonly manifest:WorldManifest,readonly road:RoadSample[],
  root?:Entity,readonly rich=false){
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
   e.setPosition(p.x,p.y-.30,7-p.d);e.setEulerAngles(0,t.yaw,bank);
   e.addComponent('collision',{type:'box',halfExtents:new Vec3(p.width/2,.30,1.2)});
   e.addComponent('rigidbody',{type:'static',friction:.85,restitution:0});this.roadBodies++;
  }
  if(this.rich&&m.features){
   const guard=polished('#43e69b',.8),grind=polished('#4aabf9',.8),side=polished('#32557d',.1);
   this.materials.push(guard,grind,side);this.prepareRails(m,guard,grind,side);
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
 private prepareRails(m:WorldManifest,guardMat:StandardMaterial,grindMat:StandardMaterial,sideMat:StandardMaterial){
  const features=m.features!;
  const segment=(name:string,d:number,side:-1|1,offset:number,y:number,
   width:number,height:number,depth:number,material:StandardMaterial)=>{
   const t=trilogyTangent(d),x=trilogyCenter(d)+side*(-t.z)*offset,z=7-d+side*t.x*offset;
   const e=new Entity(name);this.root.addChild(e);e.setPosition(x,y,z);e.setEulerAngles(0,t.yaw,0);
   e.addComponent('collision',{type:'box',halfExtents:new Vec3(width/2,height/2,depth/2)});
   e.addComponent('rigidbody',{type:'static',friction:.9,restitution:0});
   const visual=new Entity(name+'-visual');visual.setLocalScale(width,height,depth);
   visual.addComponent('render',{type:'box',material,castShadows:true});e.addChild(visual);
  };
  for(const [i,g] of features.guards.entries())for(let d=g.start;d<=g.end;d+=2){
   // The green guard has genuine SIDE and TOP Bullet contact authority.
   segment(`w97-guard-${g.side}-${i}-${d}`,d,g.side,4.25,.67,.48,1.34,2.35,guardMat);
   this.guardBodies++;
  }
  for(const [i,g] of features.grinds.entries())for(let d=g.start-13;d<=g.end;d+=2){
   const approach=Math.max(0,Math.min(1,(d-(g.start-13))/13));
   const top=.22+.96*(approach*approach*(3-2*approach)),center=top-.13;
   // Elevated BLUE train-rail runs on TOP ONLY. Separate side colliders
   // never count as grind boost. A physical ramp gives the ball an entry.
   segment(`w97-grind-top-${i}-${d}`,d,g.side,2.9,center,1.50,.26,2.35,grindMat);
   this.grindTops++;
   if(d>=g.start)for(const sign of [-1,1]){
    // Outside flank. Naming prevents false positive side rewards.
    const off=2.9+sign*.86*g.side;
    segment(`w97-grind-side-${i}-${d}-${sign}`,d,g.side,off,.71,.18,.65,2.35,sideMat);
    this.grindSides++;
   }
  }
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
  hazardBodies:this.hazardBodies,guardBodies:this.guardBodies,grindTops:this.grindTops,
  grindSides:this.grindSides,meshes:this.meshCount,islands:this.islandCount,trackQuads:this.trackQuads,
  liveBodies:this.disposed?0:this.root.findComponents('rigidbody').length,
  privateMeshes:this.privateMeshes,missing:this.assets.missing};}
}
export async function fetchWorld(index:number,signal?:AbortSignal){
 const get=async(url:string)=>{const r=await fetch(new URL(url,document.baseURI),{signal});if(!r.ok)throw Error('World HTTP '+r.status);return r.json();};
 const manifest=parseWorld(await get(WORLD_URLS[index]!),index);
 const road=parseRoad(await get(manifest.geometry),manifest);return {manifest,road};
}
