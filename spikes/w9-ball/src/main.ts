// W9.4-1: a *separate* PlayCanvas + Ammo/Bullet playable ball, not MassRunnerModel.
// All licensed ITHappy originals stay private. Scene uses authored placeholder shapes.
// Real rigidbody contacts govern movement and hazards; visuals never drive physics.
import {
  AmmoPhysicsWorld, AppBase, AppOptions, CameraComponentSystem, CollisionComponentSystem,
  Color, ContainerHandler, Entity, FILLMODE_FILL_WINDOW, LightComponentSystem,
  RenderComponentSystem, RESOLUTION_AUTO, RigidBodyComponentSystem,
  StandardMaterial, TextureHandler, Vec3, WasmModule, createGraphicsDevice
} from 'playcanvas';
import { loadPrivateArt } from './LicensedArt';
import './style.css';

type Phase = 'ready'|'running'|'complete'|'error';
const PHYSICS_TIMEOUT_MS = 15_000;
const FINISH_Z = -97;
const BALL_RADIUS = 0.62;
const MAX_FORWARD_SPEED = 9.5;
const MAX_SIDE_SPEED = 7.5;
const clamp=(x:number,min:number,max:number)=>Math.max(min,Math.min(max,x));
const canvas=document.getElementById('application-canvas') as HTMLCanvasElement;
const root=document.getElementById('game')!;
const ui={
  status:document.getElementById('status')!,
  progress:document.getElementById('progress')!,
  coins:document.getElementById('coins')!,
  message:document.getElementById('message')!,
  dialog:document.getElementById('dialog')!,
  title:document.getElementById('dialog-title')!,
  description:document.getElementById('dialog-description')!,
  start:document.getElementById('start') as HTMLButtonElement
};
let phase:Phase='ready';
let frames=0;
let physicsFrames=0;
let falls=0;
let bumpers=0;
let pickups=0;
let attempts=0;
let elapsed=0;
let targetX=0;
let messageUntil=0;
let lastFallReason='';
let realPhysics=false;

function message(text:string) {
  ui.message.textContent=text;
  ui.message.classList.add('show');
  messageUntil=elapsed+1.1;
}
function material(hex:string, gloss=.43):StandardMaterial {
  const m=new StandardMaterial();
  m.diffuse=new Color(...([1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as [number,number,number]));
  m.metalness=0.025;
  m.gloss=gloss;
  m.update();
  return m;
}
const surfaces={
  track:material('#A2C5F5'), side:material('#E1E9FF'), cream:material('#FFF0C8'),
  mint:material('#83DAB6'), teal:material('#31BDAA'), coral:material('#FF8895'),
  blue:material('#8294EA'), jewel:material('#FFE083',.85), ball:material('#F8FAFF',.75),
  ballBand:material('#4FC5C4',.55), cloud:material('#F8FEFF')
};

const physicsBase=new URL('./ammo/',document.baseURI);
WasmModule.setConfig('Ammo',{
  glueUrl:new URL('ammo.wasm.js',physicsBase).href,
  wasmUrl:new URL('ammo.wasm.wasm',physicsBase).href
});
try {
  await Promise.race([
    new Promise<void>(resolve=>WasmModule.getInstance('Ammo',()=>resolve())),
    new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Ammo physics load timed out')),PHYSICS_TIMEOUT_MS))
  ]);
  realPhysics=true;
} catch(error) {
  phase='error';
  ui.status.textContent='PHYSICS UNAVAILABLE';
  ui.description.textContent='Physics could not load. Check the local Ammo WASM files and retry.';
  ui.title.textContent='LOAD ERROR';
  throw error;
}

const device=await createGraphicsDevice(canvas);
device.maxPixelRatio=Math.min(window.devicePixelRatio||1,1.6);
const options=new AppOptions();
options.graphicsDevice=device;
// AppBase does not automatically guarantee a live backend from a WasmModule.
// Explicitly install Bullet before entities/bodies are created.
options.physicsWorld=new AmmoPhysicsWorld();
options.resourceHandlers=[ContainerHandler,TextureHandler];
options.componentSystems=[
  RenderComponentSystem,CameraComponentSystem,LightComponentSystem,
  CollisionComponentSystem,RigidBodyComponentSystem
];
const app=new AppBase(canvas);
app.init(options);
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);
const physics=app.systems.rigidbody as RigidBodyComponentSystem;
physics.gravity.set(0,-22,0);
const camera=new Entity('follow-camera');
camera.addComponent('camera',{fov:58,nearClip:.1,farClip:150,clearColor:new Color(.71,.90,.97)});
camera.setPosition(0,8.4,21);
camera.lookAt(0,.8,-10);
app.root.addChild(camera);
const light=new Entity('sun');
light.addComponent('light',{type:'directional',intensity:1.65,castShadows:true,
  shadowResolution:768,shadowBias:.12,normalOffsetBias:.07});
light.setEulerAngles(52,-30,0);
app.root.addChild(light);
app.scene.ambientLight=new Color(.63,.72,.84);

type Point=[number,number,number];
function shape(name:string,type:'box'|'sphere'|'cylinder',pos:Point,scale:Point,
  surface:StandardMaterial,solid:'static'|'dynamic'|false=false):Entity {
  const e=new Entity(name);
  e.setPosition(...pos);
  // World-space collision proxies stay at unit entity scale. Only the render
  // child is scaled. Never rely on a scaled rigidbody parent to resize Bullet.
  const visual=new Entity(name+'-visual');
  visual.setLocalScale(...scale);
  visual.addComponent('render',{type,material:surface,castShadows:solid!==false});
  e.addChild(visual);
  if(solid){
    if(type==='box')e.addComponent('collision',{type:'box',
      halfExtents:new Vec3(scale[0]/2,scale[1]/2,scale[2]/2)});
    else if(type==='sphere')e.addComponent('collision',{type:'sphere',
      radius:Math.max(...scale)/2});
    else e.addComponent('collision',{type:'cylinder',
      radius:Math.max(scale[0],scale[2])/2,height:scale[1]});
    e.addComponent('rigidbody',{type:solid,mass:solid==='dynamic'?1.4:0,
      friction:solid==='dynamic'?1.05:.94,restitution:.11,
      linearDamping:solid==='dynamic'?.25:0,
      angularDamping:solid==='dynamic'?.19:0});
  }
  app.root.addChild(e);
  return e;
}
// The independent physics course: genuine separated planks, not a moving background.
const tracks=[8,-12,-32,-52,-72,-92];
const trackNodes:Entity[]=[];
for(let i=0;i<tracks.length;i++){
  const z=tracks[i]!;
  trackNodes.push(shape('platform-'+i,'box',[0,-.28,z],[8,.55,19.4],
    i%2===0?surfaces.track:surfaces.side,'static'));
  for(const side of [-1,1]) {
    // Visual edge markers only; falling off remains a genuine physics failure.
    shape('edge-' +i+'-'+side,'box',[side*4.02,.035,z],[.12,.1,18.9],surfaces.cream);
  }
}
// Four colorful but *physical* obstacles have low-cost cylinder/sphere colliders.
const hazards:[number,number,'sphere'|'cylinder'][]=[
  [-17,0,'cylinder'],[-37,-1.45,'sphere'],[-57,1.45,'cylinder'],[-77,0,'sphere']
];
const hazardNodes:Entity[]=[];
for(let i=0;i<hazards.length;i++) {
  const [z,x,type]=hazards[i]!;
  hazardNodes.push(shape('hazard-'+i,type,[x,.69,z],
    type==='sphere'?[1.35,1.35,1.35]:[1.25,1.35,1.25],
    i%2===0?surfaces.coral:surfaces.blue,'static'));
}
const treeCrowns:Entity[]=[];
const treeTrunks:Entity[]=[];
for(let i=0;i<9;i++){
  const z=7-i*13;
  const side=i%2===0?-1:1;
  treeCrowns.push(shape('off-track-round-tree-'+i,'sphere',[side*8.5,1.3,z],
    [2.6,2.6,2.6],i%3?surfaces.mint:surfaces.teal));
  treeTrunks.push(shape('off-track-trunk-'+i,'cylinder',[side*8.5,.35,z],
    [.5,1.7,.5],surfaces.cream));
}
for(let i=0;i<5;i++){
  shape('cloud-'+i,'sphere',[(i%2?1:-1)*8,10+i*.4,-10-i*21],
    [5,2.2,3.3],surfaces.cloud);
}
// Distinct striped sphere: rotation comes from Bullet, never a visual spin timer.
const ball=shape('real-rigidbody-ball','sphere',[0,2.2,7],
  [BALL_RADIUS*2,BALL_RADIUS*2,BALL_RADIUS*2],surfaces.ball,'dynamic');
const band=new Entity('ball-stripe');
band.addComponent('render',{type:'sphere',material:surfaces.ballBand,castShadows:false});
band.setLocalPosition(0,.44,0);
band.setLocalScale(.85,.17,.85);
ball.addChild(band);
const body=ball.rigidbody!;
let lastImpact=-100;
ball.collision!.on('collisionstart',(event:{other:Entity})=>{
  if(event.other.name.startsWith('hazard-') && elapsed-lastImpact>.3){
    bumpers++;
    lastImpact=elapsed;
    if(phase==='running')message('BONK!');
  }
});
const gems:{node:Entity;collected:boolean}[]=[];
for(let i=0;i<6;i++){
  const z=-6-i*15.2;
  const x=[-2.5,2.5,0,-2.2,2.4,0][i]!;
  const e=shape('gem-'+i,'sphere',[x,1,z],[.88,.88,.88],surfaces.jewel);
  // Explicit pickup radius is presentation/game logic; dynamic ball physics
  // remains responsible for the ball's actual position and velocity.
  gems.push({node:e,collected:false});
}
const finish=shape('finish-line','box',[0,.045,-98],[8,.1,.65],surfaces.teal);
// Licensed GLB art overlays are opt-in and never alter the unit-scale
// Bullet rigidbodies or authored course. CI without private packs is unchanged.
const licensedArt=await loadPrivateArt(app,{
  tracks:trackNodes,hazards:hazardNodes,treeCrowns,treeTrunks,
  ball,ballBand:band,finish
});
const checkpoint=()=>{ // a fall respawns without changing the authoritative physics body type
  falls++;
  lastFallReason='fell-off-track';
  body.teleport(0,2.2,7);
  body.linearVelocity=new Vec3(0,0,0);
  body.angularVelocity=new Vec3(0,0,0);
  targetX=0;
  gems.forEach(g=>{g.collected=false;g.node.enabled=true;});
  pickups=0;
  if(phase==='running')message('TRY AGAIN!');
};
function restart(){
  if(!realPhysics||phase==='error')return;
  attempts++;
  phase='running';
  elapsed=0;
  falls=0;
  bumpers=0;
  pickups=0;
  lastFallReason='';
  lastImpact=-100;
  targetX=0;
  body.teleport(0,2.2,7);
  body.linearVelocity=new Vec3(0,0,0);
  body.angularVelocity=new Vec3(0,0,0);
  gems.forEach(g=>{g.collected=false;g.node.enabled=true;});
  ui.dialog.classList.add('hidden');
  ui.message.classList.remove('show');
}
ui.start.disabled=false;
ui.start.textContent='START ROLL →';
ui.status.textContent='AMMO PHYSICS READY';
ui.start.addEventListener('click',e=>{e.preventDefault();restart();});
const steer=(clientX:number)=>{targetX=clamp(((clientX/window.innerWidth)-.5)*7,-3.3,3.3);};
root.addEventListener('pointerdown',e=>{
  if((e.target as HTMLElement).closest('button'))return;
  if(phase!=='running')restart();
  steer(e.clientX);
});
root.addEventListener('pointermove',e=>{
  if(e.buttons!==0||e.pointerType==='touch')steer(e.clientX);
});
window.addEventListener('keydown',e=>{
  if(e.code==='Space'||e.code==='Enter'){e.preventDefault();restart();}
  if(e.code==='ArrowLeft'||e.code==='KeyA')targetX=clamp(targetX-.9,-3.3,3.3);
  if(e.code==='ArrowRight'||e.code==='KeyD')targetX=clamp(targetX+.9,-3.3,3.3);
});
function onResize(){
  app.resizeCanvas();
  camera.camera!.fov=window.innerWidth/window.innerHeight<.78?68:56;
}
window.addEventListener('resize',onResize);
onResize();

app.on('update',(dt:number)=>{
  frames++;
  const tick=Math.min(dt,.05);
  const p=ball.getPosition();
  const v=body.linearVelocity;
  if(phase==='running') {
    physicsFrames++;
    elapsed+=tick;
    // Input forces and actual rigidbody velocity feed Bullet. No animation
    // interpolates a fake ball position. Lateral damping is user-relative.
    const sideForce=clamp((targetX-p.x)*36-v.x*11,-95,95);
    const drive=clamp((-MAX_FORWARD_SPEED-v.z)*13,-60,100);
    body.applyForce(new Vec3(sideForce,0,drive));
    // Contact friction supplies roll; torque reinforces visible spin.
    body.applyTorque(new Vec3(-4,0,-sideForce*.028));
    if(Math.abs(v.x)>MAX_SIDE_SPEED||Math.abs(v.z)>MAX_FORWARD_SPEED+2){
      body.linearVelocity=new Vec3(
        clamp(v.x,-MAX_SIDE_SPEED,MAX_SIDE_SPEED),v.y,
        clamp(v.z,-MAX_FORWARD_SPEED-2,MAX_FORWARD_SPEED+2));
    }
    for(const g of gems){
      if(g.collected)continue;
      const gp=g.node.getPosition();
      const dx=p.x-gp.x,dz=p.z-gp.z,dy=p.y-gp.y;
      if(dx*dx+dz*dz+dy*dy<1.35*1.35){
        g.collected=true;g.node.enabled=false;pickups++;message('+ GEM!');
      }
    }
    if(p.y< -3 || Math.abs(p.x)>9.5)checkpoint();
    if(p.z<=FINISH_Z){
      phase='complete';
      ui.dialog.classList.remove('hidden');
      ui.title.innerHTML='TRACK <em>CLEARED!</em>';
      ui.description.textContent=`You collected ${pickups}/6 gems, bumped ${bumpers} times and finished in ${elapsed.toFixed(1)}s. Roll again?`;
      ui.start.textContent='ROLL AGAIN →';
    }
  }
  const pos=ball.getPosition();
  // Camera composition follows physical position, never controls it.
  camera.setPosition(pos.x*.24,8.1,pos.z+14.8);
  camera.lookAt(pos.x*.18,.65,pos.z-12);
  ui.coins.textContent=String(pickups);
  ui.progress.style.width=(clamp((7-pos.z)/(7-FINISH_Z),0,1)*100).toFixed(1)+'%';
  if(elapsed>messageUntil)ui.message.classList.remove('show');
  ui.status.textContent=phase==='running'?
    `ROLLING · ${Math.round(-pos.z+7)} m · ${Math.round(Math.abs(body.linearVelocity.z)*3.6)} km/h`:
    (phase==='complete'?'PHYSICS COURSE COMPLETE':'AMMO PHYSICS READY');
});
app.start();
// Probe is intentionally read-only; tests must drive real touch/keyboard input.
Object.assign(window,{__W9_BALL_TEST__:{
  snapshot:()=>{
    const p=ball.getPosition(),v=body.linearVelocity,w=body.angularVelocity;
    return {
      phase,renderer:'playcanvas',physicsBackend:'ammo-bullet',
      physicsLoaded:realPhysics,rigidbodyType:body.type,
      frames,physicsFrames,position:[p.x,p.y,p.z],
      linearVelocity:[v.x,v.y,v.z],angularVelocity:[w.x,w.y,w.z],
      targetX,fallCount:falls,bumpCount:bumpers,gemCount:pickups,
      attempts,elapsed,finishZ:FINISH_Z,lastFallReason,
      coursePlanks:tracks.length,physicalBumpers:hazards.length,
      artMode:licensedArt.mode,licensedModels:licensedArt.loaded,
      licensedMeshes:licensedArt.activeMeshes,
      licensedMissing:licensedArt.requiredMissing,
      dynamicBallStillPhysics:licensedArt.dynamicBallStillPhysics,
      localWasm:new URL('ammo.wasm.wasm',physicsBase).pathname,
      fullViewport:canvas.clientWidth>=window.innerWidth-2&&canvas.clientHeight>=window.innerHeight-2
    };
  }
}});
