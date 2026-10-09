import {Entity,Vec3,type AppBase,type GraphicsDevice,type StandardMaterial} from 'playcanvas';
import {WorldAssets} from './TrilogyAssets';
import {projectSpiral,type SpiralPoint} from './SpiralCourse';
import {buildWorldArt,coinMesh,polished} from './TrilogyArt';
import {parseWorld,parseRoad,WORLD_URLS,trilogyCenter,trilogyTangent,
 type RoadSample,type WorldManifest} from './TrilogyManifest';
export type Gem={node:Entity;collected:boolean;d:number};
export class TrilogyWorld{
 readonly root:Entity;readonly assets:WorldAssets;
 materials:StandardMaterial[]=[];gems:Gem[]=[];roadBodies=0;hazardBodies=0;
 disposed=false;active=false;meshCount=0;islandCount=0;trackQuads=0;privateMeshes=0;
 guardBodies=0;grindTops=0;grindSides=0;boxObstacles=0;
 private glowingGuard:StandardMaterial|null=null;private guardIsLit=false;
 constructor(readonly app:AppBase,readonly manifest:WorldManifest,readonly road:RoadSample[],
  root?:Entity,readonly rich=false,readonly minimalist=false,readonly chaos=false,
  readonly spiral=false,readonly stableRoad=false){
  this.root=root??new Entity('world-'+manifest.id);this.root.enabled=false;
  if(!this.root.parent)app.root.addChild(this.root);this.assets=new WorldAssets(app);
 }
 async prepare(device:GraphicsDevice,legacy=false){
  const m=this.manifest;
  const art=buildWorldArt(device,this.root,m,this.road,this.minimalist);
  if(this.spiral)this.glowingGuard=art.mats.guard;
  this.materials=art.materials;this.meshCount=art.meshCount;this.islandCount=art.islandCount;this.trackQuads=art.trackQuads;
  if(!legacy&&this.spiral)this.prepareSpiralColliders();
  if(!legacy&&!this.spiral)for(let i=0;i<this.road.length;i+=2){
   const p=this.road[i]!,t=trilogyTangent(p.d),bank=p.bank;
   const e=new Entity('trilogy-road-'+m.id+'-'+i);this.root.addChild(e);
   const prev=this.road[Math.max(0,i-1)]!,next=this.road[Math.min(this.road.length-1,i+1)]!;
   const pitch=this.minimalist?Math.atan2(next.y-prev.y,next.d-prev.d)*180/Math.PI:0;
   e.setPosition(p.x,p.y-.30,7-p.d);e.setEulerAngles(pitch,t.yaw,bank);
   e.addComponent('collision',{type:'box',halfExtents:new Vec3(p.width/2,.30,1.2)});
   e.addComponent('rigidbody',{type:'static',friction:this.chaos?.36:.85,restitution:0});this.roadBodies++;
  }
  if(this.rich&&!this.spiral&&m.features){
   const guard=polished('#43e69b',.8),grind=polished('#4aabf9',.8),side=polished('#32557d',.1);
   this.materials.push(guard,grind,side);this.prepareRails(m,guard,grind,side);
  }
  for(const [i,d] of m.gems.entries()){
   const e=new Entity('trilogy-gem-'+i);this.root.addChild(e);
   const point=this.spiral?this.roadPoint(d):null;
   e.setPosition(point?.x??trilogyCenter(d),
    (point?.y??(this.minimalist?this.roadHeight(d):0))+1.25,
    point?.z??7-d);
   e.addComponent('render',{meshInstances:[coinMesh(device,art.mats.gold)],castShadows:true});
   this.gems.push({node:e,collected:false,d});
  }
  // Physical hazards sit in optional outer lanes; center route stays readable.
  const hazardAnchors:Entity[]=[];
  for(const [i,d] of m.hazards.entries()){
   const side=i%3===0?-2.6:i%3===1?2.6:0;
   const e=new Entity((this.minimalist?'w98-crate-':'hazard-')+m.id+'-'+i);this.root.addChild(e);
   const point=this.spiral?this.roadPoint(d):null;
   const t=this.spiral?this.spiralTangent(d):null;
   const y=(point?.y??(this.minimalist?this.roadHeight(d):0))+.82;
   e.setPosition((point?.x??trilogyCenter(d))+side*(t?.rx??1),y,
    (point?.z??7-d)+side*(t?.rz??0));
   if(this.minimalist){
    // Just one low-poly BOX mesh and one light Bullet body per obstacle.
    // A hit can knock it away; no decorative islands outside the road.
    e.addComponent('collision',{type:'box',halfExtents:new Vec3(.70,.70,.70)});
    e.addComponent('rigidbody',{type:'dynamic',mass:.55,friction:.54,restitution:.13});
    this.boxObstacles++;
   }else{
    e.addComponent('collision',{type:'sphere',radius:.72});
    e.addComponent('rigidbody',{type:'static',restitution:.65});
   }
   const visual=new Entity('placeholder');visual.setLocalScale(1.4,1.4,1.4);
   visual.addComponent('render',{type:this.minimalist?'box':'sphere',
     material:art.mats.road[i%art.mats.road.length],castShadows:!this.minimalist});
   e.addChild(visual);hazardAnchors.push(e);this.hazardBodies++;
  }
  if(this.minimalist)return; // W9.8 has no owner-only environmental models.
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
 roadPoint(d:number){
  const first=this.road[0]!,last=this.road[this.road.length-1]!;
  const u=Math.max(first.d,Math.min(last.d,d));
  const i=Math.max(0,Math.min(this.road.length-2,Math.floor(u-first.d)));
  const a=this.road[i]!,b=this.road[i+1]!,f=Math.max(0,Math.min(1,(u-a.d)/(b.d-a.d||1)));
  return {d:u,x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,
   z:(a.z??7-a.d)+((b.z??7-b.d)-(a.z??7-a.d))*f,
   width:a.width+(b.width-a.width)*f};
 }
 spiralTangent(d:number){
  const a=this.roadPoint(d-.6),b=this.roadPoint(d+.6);
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz)||1;
  const tx=dx/l,ty=dy/l,tz=dz/l,hl=Math.hypot(tx,tz)||1;
  return {x:tx,y:ty,z:tz,rx:-tz/hl,rz:tx/hl};
 }
 project(position:Vec3,hint=0){
  return projectSpiral(this.road as SpiralPoint[],position,hint);
 }
 setGuardLit(enabled:boolean){
  if(this.disposed||!this.glowingGuard||this.guardIsLit===enabled)return;
  this.guardIsLit=enabled;
  this.glowingGuard.emissiveIntensity=enabled?3.0:.45;
  this.glowingGuard.update();
 }
 private prepareSpiralColliders(){
  const m=this.manifest;
  const from=m.spiralCoilStart??m.start+110,to=m.spiralCoilEnd??m.end-160;
  for(let i=0;i<this.road.length-1;i++){
   const a=this.road[i]!,b=this.road[i+1]!;
   const dx=b.x-a.x,dy=b.y-a.y,dz=(b.z??7-b.d)-(a.z??7-a.d);
   const length=Math.hypot(dx,dy,dz),horizontal=Math.hypot(dx,dz)||1;
   const yaw=-Math.atan2(dx,-dz)*180/Math.PI,pitch=Math.atan2(dy,horizontal)*180/Math.PI;
   const e=new Entity('trilogy-road-'+m.id+'-'+i);
   const thick=this.stableRoad?1.25:.30;
   e.setPosition((a.x+b.x)/2,(a.y+b.y)/2-thick,
    ((a.z??7-a.d)+(b.z??7-b.d))/2);
   e.setEulerAngles(pitch,yaw,(a.bank+b.bank)/2);
   e.addComponent('collision',{type:'box',halfExtents:new Vec3(
    a.width/2,thick,length/2+(this.stableRoad?.65:.11))});
   e.addComponent('rigidbody',{type:'static',friction:this.stableRoad?.78:.6,restitution:0});
   this.root.addChild(e);this.roadBodies++;
   // Guard only genuinely dangerous 360-degree climbing spiral.
   if(a.d<from-5||a.d>to+5||i%2!==0)continue;
   for(const side of [-1,1]){
    const rx=dz/horizontal,rz=-dx/horizontal;
    const edge=new Entity('w10-physical-guard-'+side+'-'+i);
    const width=a.width/2-.18;
    edge.setPosition((a.x+b.x)/2+side*rx*width,(a.y+b.y)/2+.85,
     ((a.z??7-a.d)+(b.z??7-b.d))/2+side*rz*width);
    edge.setEulerAngles(pitch,yaw,0);
    edge.addComponent('collision',{type:'box',halfExtents:new Vec3(.22,1.06,length+.30)});
    edge.addComponent('rigidbody',{type:'static',friction:.2,restitution:.02});
    this.root.addChild(edge);this.guardBodies++;
   }
  }
 }
 roadFrame(d:number){
  const first=this.road[0]!,last=this.road[this.road.length-1]!;
  const t=Math.max(first.d,Math.min(last.d,d));
  const idx=Math.min(this.road.length-2,Math.max(0,Math.floor(t-first.d)));
  const a=this.road[idx]!,b=this.road[idx+1]!;
  const u=Math.max(0,Math.min(1,(t-a.d)/(b.d-a.d||1)));
  return {y:a.y+(b.y-a.y)*u,bank:a.bank+(b.bank-a.bank)*u,
   width:a.width+(b.width-a.width)*u};
 }
 roadHeight(d:number){
  const first=this.road[0]!,last=this.road[this.road.length-1]!;
  const t=Math.max(first.d,Math.min(last.d,d));
  const idx=Math.min(this.road.length-2,Math.max(0,Math.floor(t-first.d)));
  const a=this.road[idx]!,b=this.road[idx+1]!;
  return a.y+(b.y-a.y)*Math.max(0,Math.min(1,(t-a.d)/(b.d-a.d||1)));
 }
 private prepareRails(m:WorldManifest,guardMat:StandardMaterial,grindMat:StandardMaterial,sideMat:StandardMaterial){
  const features=m.features!;
  const segment=(name:string,d:number,side:-1|1,offset:number,y:number,
   width:number,height:number,depth:number,material:StandardMaterial)=>{
   const t=trilogyTangent(d),x=trilogyCenter(d)+side*(-t.z)*offset,z=7-d+side*t.x*offset;
   const e=new Entity(name);this.root.addChild(e);
   const slope=this.minimalist?Math.atan2(this.roadHeight(d+1)-this.roadHeight(d-1),2)*180/Math.PI:0;
   e.setPosition(x,y+(this.minimalist?this.roadHeight(d):0),z);
   e.setEulerAngles(slope,t.yaw,0);
   e.addComponent('collision',{type:'box',halfExtents:new Vec3(width/2,height/2,depth/2)});
   e.addComponent('rigidbody',{type:'static',friction:this.chaos?.18:.9,restitution:0});
   const visual=new Entity(name+'-visual');visual.setLocalScale(width,height,depth);
   visual.addComponent('render',{type:'box',material,castShadows:true});e.addChild(visual);
  };
  for(const [i,g] of features.guards.entries())for(let d=g.start;d<=g.end;d+=2){
   // The green guard has genuine SIDE and TOP Bullet contact authority.
   segment(`w97-guard-${g.side}-${i}-${d}`,d,g.side,
    this.chaos?4.3:4.25,this.chaos?.43:.67,
    this.chaos?.25:.48,this.chaos?.86:1.34,2.35,guardMat);
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
  grindSides:this.grindSides,boxObstacles:this.boxObstacles,minimalist:this.minimalist,
  spiral:this.spiral,stableRoad:this.stableRoad,
  chaos:this.chaos,
  maxElevation:Math.max(...this.road.map(p=>p.y)),
  meshes:this.meshCount,islands:this.islandCount,trackQuads:this.trackQuads,
  liveBodies:this.disposed?0:this.root.findComponents('rigidbody').length,
  privateMeshes:this.privateMeshes,missing:this.assets.missing};}
}
export async function fetchWorld(index:number,signal?:AbortSignal){
 const get=async(url:string)=>{const r=await fetch(new URL(url,document.baseURI),{signal});if(!r.ok)throw Error('World HTTP '+r.status);return r.json();};
 const manifest=parseWorld(await get(WORLD_URLS[index]!),index);
 const road=parseRoad(await get(manifest.geometry),manifest);return {manifest,road};
}
