// W9.4-2: optional owner-installed ITHappy artwork. Visual transforms only.
// All Ammo colliders, course distances, steering, reward/restart rules stay fixed.
// Private GLBs are installed by tools/install-w9-4-ithappy.ps1 and ignored by Git.
import { type AppBase, ContainerResource, Entity } from 'playcanvas';

export type ArtId='road'|'roller'|'bumper'|'checkpoint'|'ball'|'tree';
export type ArtMode='placeholder'|'licensed'|'partial';
type Vec3=[number,number,number];
type ArtSpec={ id:ArtId; file:string; size:Vec3; center:Vec3; target:Vec3 };
const artSpecs:readonly ArtSpec[]=[
  {id:'road',file:'road_001.glb',size:[6.34,1.34,13.89],center:[0,0,-.038],target:[8,.56,19.4]},
  {id:'roller',file:'obstacle_1_001.glb',size:[2.73,1.70,1.88],center:[1.023,.851,-.04],target:[1.4,1.3,1.4]},
  {id:'bumper',file:'obstacle_18_001.glb',size:[2.57,2.4,2.57],center:[0,1.199,0],target:[1.45,1.45,1.45]},
  {id:'checkpoint',file:'checkpoint_001.glb',size:[6.53,5,1.41],center:[0,2.5,0],target:[7.6,5.8,1.64]},
  {id:'ball',file:'ball_001.glb',size:[1.97,2,2],center:[0,0,0],target:[1.24,1.24,1.24]},
  {id:'tree',file:'tree_002.glb',size:[5.19,6.85,3.11],center:[-.009,3.291,.212],target:[3.15,4.15,2.12]}
];
export type ArtTargets={
  tracks:Entity[];
  hazards:Entity[];
  treeCrowns:Entity[];
  treeTrunks:Entity[];
  ball:Entity;
  ballBand:Entity;
  finish:Entity;
};
export type ArtReport={
  mode:ArtMode;
  loaded:number;
  expected:number;
  activeMeshes:number;
  requiredMissing:string[];
  dynamicBallStillPhysics:boolean;
};

function installMesh(model:Entity, anchor:Entity, bounds:Vec3, center:Vec3, target:Vec3,
  yOffset=0, preserveRatio=true):void {
  // Source models differ in units/origins; keep collider parent unit scale.
  // All visual normalization lives in a child node and never affects Bullet.
  const sx=target[0]/bounds[0];
  const sy=target[1]/bounds[1];
  const sz=target[2]/bounds[2];
  const scale=preserveRatio?Math.min(sx,sy,sz):1;
  const s:Vec3=preserveRatio?[scale,scale,scale]:[sx,sy,sz];
  const container=new Entity('ithappy-visual-fit');
  container.setLocalScale(...s);
  // Imported GLB origins vary radically; center the verified mesh bounds in
  // the target transform so the collision anchor never moves.
  container.setLocalPosition(-center[0]*s[0],yOffset-center[1]*s[1],-center[2]*s[2]);
  container.addChild(model);
  anchor.addChild(container);
}
function hideDefault(entity:Entity) {
  const render=entity.findByName(entity.name+'-visual');
  if(render) render.enabled=false;
}
function showDefault(entity:Entity) {
  const render=entity.findByName(entity.name+'-visual');
  if(render) render.enabled=true;
}
function attachTemplate(template:Entity, anchor:Entity, spec:ArtSpec,
  yOffset=0, preserveRatio=true):void {
  installMesh(template.clone(),anchor,spec.size,spec.center,spec.target,yOffset,preserveRatio);
}
export async function loadPrivateArt(app:AppBase, targets:ArtTargets):Promise<ArtReport> {
  const enabled=import.meta.env.VITE_ITHAPPY_ASSETS==='1' ||
    new URL(window.location.href).searchParams.get('art')==='licensed';
  const report:ArtReport={mode:'placeholder',loaded:0,expected:artSpecs.length,
    activeMeshes:0,requiredMissing:[],dynamicBallStillPhysics:targets.ball.rigidbody?.type==='dynamic'};
  if(!enabled)return report;
  const templates=new Map<ArtId,Entity>();
  for(const spec of artSpecs) {
    const source=await new Promise<Entity|null>(resolve=>{
      app.assets.loadFromUrl('./licensed/'+spec.file,'container',(err,asset)=>{
        if(err||!asset?.resource){resolve(null);return;}
        try{resolve((asset.resource as ContainerResource)
          .instantiateRenderEntity({castShadows:true}));}
        catch{resolve(null);}
      });
    });
    if(source){templates.set(spec.id,source);report.loaded++;}
    else report.requiredMissing.push(spec.file);
  }
  const road=templates.get('road'),roller=templates.get('roller');
  const bumper=templates.get('bumper'),tree=templates.get('tree');
  const ball=templates.get('ball'),checkpoint=templates.get('checkpoint');
  if(road){
    for(const track of targets.tracks){
      attachTemplate(road,track,artSpecs[0]!,0,false);
      hideDefault(track);report.activeMeshes++;
    }
  }
  if(roller&&bumper){
    for(const [i,hazard] of targets.hazards.entries()){
      const kind=i%2===0?'roller':'bumper';
      attachTemplate(kind==='roller'?roller:bumper,hazard,artSpecs[kind==='roller'?1:2]!);
      hideDefault(hazard);report.activeMeshes++;
    }
  }
  if(tree){
    for(let i=0;i<targets.treeCrowns.length;i++){
      const crown=targets.treeCrowns[i]!,trunk=targets.treeTrunks[i]!;
      // Position at canopy center; keep the trees outside collision path.
      attachTemplate(tree,crown,artSpecs[5]!,1.0);
      hideDefault(crown);hideDefault(trunk);report.activeMeshes++;
    }
  }
  if(checkpoint){
    attachTemplate(checkpoint,targets.finish,artSpecs[3]!,3.0);
    report.activeMeshes++;
  }
  if(ball){
    attachTemplate(ball,targets.ball,artSpecs[4]!,0);
    hideDefault(targets.ball);
    targets.ballBand.enabled=false;report.activeMeshes++;
  }
  // Never accept a partial visual swap as fully licensed.
  report.mode=report.loaded===report.expected?'licensed':
    report.loaded>0?'partial':'placeholder';
  // If a source model fails, the physics object and primitive stay visible.
  for(const track of targets.tracks)if(!road)showDefault(track);
  for(const hazard of targets.hazards)if(!(roller&&bumper))showDefault(hazard);
  return report;
}
