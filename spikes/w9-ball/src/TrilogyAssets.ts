// Optional owner-local visual templates. Each world owns its asset handles and releases them.
import {Asset,ContainerResource,Entity,Vec3,type AppBase,type RenderComponent} from 'playcanvas';
const names:Record<string,string>={ball:'ball_001.glb',bumper:'obstacle_18_001.glb',
 roller:'obstacle_1_001.glb',tree:'tree_002.glb',checkpoint:'checkpoint_001.glb',
 arch:'arch_001.glb',balloon:'air_balloon_001.glb',coin:'coin_001.glb'};
export const privateArtEnabled=()=>import.meta.env.VITE_ITHAPPY_ASSETS==='1'||new URL(location.href).searchParams.get('art')==='licensed';
export class WorldAssets{
 private static nextOwner=1;private owner=WorldAssets.nextOwner++;
 assets:Asset[]=[];templates=new Map<string,Entity>();missing:string[]=[];disposed=false;
 constructor(private app:AppBase){}
 async load(ids:string[]){
  if(!privateArtEnabled())return;
  await Promise.all(ids.map(async id=>{
   const file=names[id];if(!file)return;
   const asset=new Asset('trilogy-'+id,'container',{url:'./licensed/'+file+'?worldOwner='+this.owner});this.assets.push(asset);this.app.assets.add(asset);
   try{
    await new Promise<void>((resolve,reject)=>{
     const timeout=setTimeout(()=>reject(Error('Private model timeout')),8000);
     asset.once('load',()=>{clearTimeout(timeout);resolve();});asset.once('error',(e:unknown)=>{clearTimeout(timeout);reject(e);});
     this.app.assets.load(asset);
    });
    if(this.disposed){asset.unload();return;}
    this.templates.set(id,(asset.resource as ContainerResource).instantiateRenderEntity());
   }catch{this.missing.push(file);}
  }));
 }
 attach(id:string,anchor:Entity,size:Vec3,grounded=false){
  const source=this.templates.get(id);if(!source)return false;
  const mesh=source.clone(),fit=new Entity('private-cosmetic-'+id);fit.addChild(mesh);
  // Infer verified GLB bounds after source transforms; collider parent remains unit scale.
  const renders=mesh.findComponents('render') as RenderComponent[];
  const low=new Vec3(Infinity,Infinity,Infinity),high=new Vec3(-Infinity,-Infinity,-Infinity);
  for(const r of renders)for(const mi of r.meshInstances){const b=mi.aabb;
   low.min(new Vec3().sub2(b.center,b.halfExtents));high.max(new Vec3().add2(b.center,b.halfExtents));}
  const extent=new Vec3().sub2(high,low),center=new Vec3().add2(low,high).mulScalar(.5);
  if(!Number.isFinite(extent.x)||extent.length()<.001){fit.destroy();return false;}
  const scale=Math.min(size.x/Math.max(.001,extent.x),size.y/Math.max(.001,extent.y),size.z/Math.max(.001,extent.z));
  fit.setLocalScale(scale,scale,scale);
  fit.setLocalPosition(-center.x*scale,-(grounded?low.y:center.y)*scale,-center.z*scale);
  anchor.addChild(fit);return true;
 }
 dispose(){this.disposed=true;for(const t of this.templates.values())t.destroy();this.templates.clear();
  for(const a of this.assets){a.unload();this.app.assets.remove(a);}this.assets=[];}
}
