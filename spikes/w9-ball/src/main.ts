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
import { makeSpeedCourse, trackCenter, trackTangent, inSafetyArc, boostCrossed,
  SPEED_CAP, SPEED_CRUISE, SPEED_FINISH_DISTANCE, SPEED_START_Z } from './SpeedCourse';
import { makeLongJumpCourse, longCenter, longTangent, inLongSafetyArc,
  nextLongBoost, LONG_SPEED_CAP, LONG_FINISH_DISTANCE,
  JUMP_LAUNCH_PROGRESS, JUMP_TARGET_Y_VELOCITY } from './LongJumpCourse';
import { buildCurveRails, railFieldAt, railSectionAt, RAIL_CONTACT_FORCE, RAIL_PULL_MAX,
  RAIL_ADHESION_MAX } from './MagneticRails';
import {buildGrindTrack} from './GrindTrack';
import {GUARD_TOP_Y,GUARD_HOLD_FORCE,GUARD_DOWN_FORCE,GUARD_SPEED_FORCE,
  GRIND_CENTER_FORCE,GRIND_SPEED_FORCE,GRIND_START,GRIND_END,GRIND_TOP_Y,
  GRIND_VOID_FROM,GRIND_VOID_TO,SECRET_START,SECRET_END,
  grindPath,activeGrindRoute,
  PLAYER_RADIUS,RELEASE_COOLDOWN,guardSurface,allowGuardLock,
  oppositeToGuard,grindTopQualifies,relativeRailSpring,
  type GuardLock,type GrindLock} from './RailModes';
import './style.css';

type Phase = 'ready'|'running'|'complete'|'error';
const PHYSICS_TIMEOUT_MS = 15_000;
const gameMode=new URL(window.location.href).searchParams.get('mode');
const grindMode=gameMode==='grind';
const railMode=gameMode==='rail'||grindMode;
const longJumpMode=gameMode==='jump'||railMode;
const speedMode=gameMode==='speed'||longJumpMode;
const activeSpeedCap=longJumpMode?LONG_SPEED_CAP:SPEED_CAP;
const finishDistance=longJumpMode?LONG_FINISH_DISTANCE:SPEED_FINISH_DISTANCE;
const centerAt=(progress:number)=>longJumpMode?longCenter(progress):trackCenter(progress);
const tangentAt=(progress:number)=>longJumpMode?longTangent(progress):trackTangent(progress);
const FINISH_Z = speedMode?SPEED_START_Z-finishDistance:-97;
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
let swipeCount=0,swipeStacks=0,boostCount=0,boostSurge=0;
let maxSpeedObserved=0,magnetActivations=0,previousProgress=0;
const triggeredBoosts=new Set<number>();
let pointerLastY:number|null=null;
let launched=false,landed=false,jumpCount=0,landingCount=0;
let jumpAirtime=0,maxJumpHeight=0,launchSpeed=0,landingSpeed=0;
let landingContactEvents=0,airborneFrames=0;
let railContactEvents=0,railBoostFrames=0,railAssistSeconds=0;
let railApproachFrames=0,railMaxSpeed=0,railContactSpeedStart=0;
let railBoostSpeedGain=0,railPeakContactGain=0,railDownForceEvents=0;
let railLastContactAt=-100,railRecentSection:number|null=null;
let legacySafetyForceInRailSection=0,railEntrySteeringFrames=0;
const touchingRails=new Set<string>();
let guardLock:GuardLock='free',guardSide:-1|1|null=null;
let guardLockEvents=0,guardTopEvents=0,guardSideEvents=0;
let guardReleaseEvents=0,guardReleaseByOppositeSwipe=0;
let guardLockSeconds=0,guardLockPeakSpeed=0,guardCoolUntil=0;
let guardHoldFrames=0,guardLastTouch=-100;
let grindLock:GrindLock='off',grindEntries=0,grindExits=0;
let grindSeconds=0,grindBoostFrames=0,grindTopContactEvents=0;
let grindSideContactEvents=0,grindFalseSideRewards=0,grindPeakSpeed=0;
let grindLastTopTouch=-100;
const touchingGrindTop=new Set<string>();

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
camera.addComponent('camera',{fov:58,nearClip:.1,farClip:250,
  clearColor:new Color(.59,.84,.99)});
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
  surface:StandardMaterial,solid:'static'|'dynamic'|false=false,yaw=0,pitch=0):Entity {
  const e=new Entity(name);
  e.setPosition(...pos);
  if(yaw||pitch)e.setEulerAngles(pitch,yaw,0);
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
if(!speedMode)for(let i=0;i<tracks.length;i++){
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
if(!speedMode)for(let i=0;i<hazards.length;i++) {
  const [z,x,type]=hazards[i]!;
  hazardNodes.push(shape('hazard-'+i,type,[x,.69,z],
    type==='sphere'?[1.35,1.35,1.35]:[1.25,1.35,1.25],
    i%2===0?surfaces.coral:surfaces.blue,'static'));
}
const treeCrowns:Entity[]=[];
const treeTrunks:Entity[]=[];
if(!speedMode)for(let i=0;i<9;i++){
  const z=7-i*13;
  const side=i%2===0?-1:1;
  treeCrowns.push(shape('off-track-round-tree-'+i,'sphere',[side*8.5,1.3,z],
    [2.6,2.6,2.6],i%3?surfaces.mint:surfaces.teal));
  treeTrunks.push(shape('off-track-trunk-'+i,'cylinder',[side*8.5,.35,z],
    [.5,1.7,.5],surfaces.cream));
}
for(let i=0;i<(speedMode?9:5);i++){
  const side=i%2?1:-1;
  shape('cloud-'+i,'sphere',[side*(speedMode?17:8),10+i*.4,-10-i*21],
    [speedMode?8:5,2.2,speedMode?5:3.3],surfaces.cloud);
}
const suppressOldEdge=(progress:number,side:number)=>
  railMode&&railSectionAt(progress)?.side===side;
const speedWorld=speedMode?makeSpeedCourse(shape,surfaces,suppressOldEdge):null;
const jumpWorld=longJumpMode?makeLongJumpCourse(shape,surfaces,suppressOldEdge,
  d=>grindMode&&d>=GRIND_VOID_FROM&&d<=GRIND_VOID_TO):null;
const magneticRails=railMode?buildCurveRails(shape):null;
const grindTrack=grindMode?buildGrindTrack(shape):null;
// Distinct striped sphere: rotation comes from Bullet, never a visual spin timer.
const ball=shape('real-rigidbody-ball','sphere',[0,2.2,7],
  [BALL_RADIUS*2,BALL_RADIUS*2,BALL_RADIUS*2],surfaces.ball,'dynamic');
const band=new Entity('ball-stripe');
band.addComponent('render',{type:'sphere',material:surfaces.ballBand,castShadows:false});
band.setLocalPosition(0,.44,0);
band.setLocalScale(.85,.17,.85);
ball.addChild(band);
const body=ball.rigidbody!;
if(railMode){
  const readContact=(other:Entity|null|undefined)=>{
    if(!other)return null;
    const match=/^real-magnetic-rail-(\d+)-/.exec(other.name);
    return match?Number(match[1]):null;
  };
  ball.collision!.on('collisionstart',(event:{other:Entity})=>{
    if(phase!=='running')return;
    const id=readContact(event.other);
    if(id===null)return;
    touchingRails.add(event.other.name);
    if(grindMode&&elapsed>=guardCoolUntil&&guardLock!=='release-cooldown'){
      const section=magneticRails!.sections[id]!;
      const surface=guardSurface(ball.getPosition().y);
      if(allowGuardLock(surface,true,guardCoolUntil,elapsed)&&
        !oppositeToGuard(targetX,section.side)){
        if(guardLock!=='locked-side'&&guardLock!=='locked-top')guardLockEvents++;
        guardLock=surface==='top'?'locked-top':'locked-side';
        guardSide=section.side;
        guardLastTouch=elapsed;
        if(surface==='top')guardTopEvents++;else guardSideEvents++;
        message(surface==='top'?'GUARD TOP LOCK!':'MAGNET LOCK!');
      }
    }
    railContactEvents++;
    railRecentSection=id;railLastContactAt=elapsed;
    railContactSpeedStart=Math.hypot(body.linearVelocity.x,body.linearVelocity.z);
    message('RAIL BOOST!');
  });
  // Unlike collisionstart's ContactResult.other, PlayCanvas collisionend
  // emits the OTHER ENTITY directly. Never dereference `event.other` here.
  ball.collision!.on('collisionend',(other:Entity)=>{
    if(readContact(other)!==null)touchingRails.delete(other.name);
  });
}
if(grindMode){
  ball.collision!.on('collisionstart',(event:{other:Entity})=>{
    if(phase!=='running')return;
    const other=event.other;
    if(other.name.startsWith('grind-side-')){
      grindSideContactEvents++;return;
    }
    if(!other.name.startsWith('grind-top-'))return;
    // Physical top-collider contact alone is recorded; the locked grind
    // state is granted only when height and centerline ALSO prove TOP riding.
    // A side impact, including on a top slab's edge, cannot start a grind.
    touchingGrindTop.add(other.name);
    grindTopContactEvents++;
  });
  ball.collision!.on('collisionend',(other:Entity)=>{
    if(other.name.startsWith('grind-top-'))touchingGrindTop.delete(other.name);
  });
}
if(longJumpMode){
  ball.collision!.on('collisionstart',(event:{other:Entity})=>{
    if(event.other.name==='long-landing-deck'&&launched&&!landed&&phase==='running'){
      landed=true;landingCount++;landingContactEvents++;
      landingSpeed=Math.hypot(body.linearVelocity.x,body.linearVelocity.z);
      message('CLEAN LANDING!');
    }
  });
}
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
  const x=speedMode?centerAt(SPEED_START_Z-z):[-2.5,2.5,0,-2.2,2.4,0][i]!;
  const e=shape('gem-'+i,'sphere',[x,1,z],[.88,.88,.88],surfaces.jewel);
  // Explicit pickup radius is presentation/game logic; dynamic ball physics
  // remains responsible for the ball's actual position and velocity.
  gems.push({node:e,collected:false});
}
const finish=shape('finish-line','box',
  [speedMode?centerAt(finishDistance):0,.045,FINISH_Z-1],
  [8,.1,.65],surfaces.teal);
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
  swipeStacks=0;boostSurge=0;previousProgress=0;triggeredBoosts.clear();
  launched=false;landed=false;jumpAirtime=0;maxJumpHeight=0;
  touchingRails.clear();touchingGrindTop.clear();
  magneticRails?.activeSection(null);
  guardLock='free';guardSide=null;guardCoolUntil=0;
  grindLock='off';grindLastTopTouch=-100;
  railLastContactAt=-100;railRecentSection=null;
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
  swipeCount=0;swipeStacks=0;boostCount=0;boostSurge=0;
  maxSpeedObserved=0;magnetActivations=0;previousProgress=0;
  triggeredBoosts.clear();pointerLastY=null;
  launched=false;landed=false;jumpCount=0;landingCount=0;
  jumpAirtime=0;maxJumpHeight=0;launchSpeed=0;landingSpeed=0;
  airborneFrames=0;landingContactEvents=0;
  railContactEvents=0;railBoostFrames=0;railAssistSeconds=0;
  railApproachFrames=0;railMaxSpeed=0;railContactSpeedStart=0;
  railBoostSpeedGain=0;railPeakContactGain=0;railDownForceEvents=0;
  railLastContactAt=-100;railRecentSection=null;touchingRails.clear();
  legacySafetyForceInRailSection=0;railEntrySteeringFrames=0;
  magneticRails?.activeSection(null);
  guardLock='free';guardSide=null;guardCoolUntil=0;
  guardLockEvents=0;guardTopEvents=0;guardSideEvents=0;
  guardReleaseEvents=0;guardReleaseByOppositeSwipe=0;
  guardLockSeconds=0;guardLockPeakSpeed=0;guardHoldFrames=0;
  guardLastTouch=-100;
  grindLock='off';grindEntries=0;grindExits=0;grindSeconds=0;
  grindBoostFrames=0;grindTopContactEvents=0;
  grindSideContactEvents=0;grindFalseSideRewards=0;grindPeakSpeed=0;
  grindLastTopTouch=-100;touchingGrindTop.clear();
  body.teleport(0,2.2,7);
  body.linearVelocity=new Vec3(0,0,0);
  body.angularVelocity=new Vec3(0,0,0);
  gems.forEach(g=>{g.collected=false;g.node.enabled=true;});
  ui.dialog.classList.add('hidden');
  ui.message.classList.remove('show');
}
ui.start.disabled=false;
if(!speedMode)ui.start.textContent='START ROLL →';
ui.status.textContent='AMMO PHYSICS READY';
if(speedMode){
  ui.title.innerHTML='SKY <em>SPEED.</em>';
  ui.description.textContent=grindMode?
    'Green GUARDS boost from their side or top: strong magnetic hold until you swipe away. The separate narrow GRIND track only carries you on its TOP.':
    railMode?
    'Ride the long green curve rails. Lean into them to stick, spark and accelerate, then launch over the sky gap. Flick UP for extra speed.':
    longJumpMode?
    'Flick UP to build speed. Hit the ramp, fly across the open sky and catch the wide magnetic landing platform.':
    'Flick UP to accelerate. Drag sideways to carve sky curves. Hit magnetic boost pads and ride the safety arcs.';
  document.querySelector('.hint')!.textContent=railMode?
    '↑ FLICK · ↔ LEAN INTO GREEN CURVE RAILS':'↑ FLICK TO ACCELERATE · ↔ STEER';
  ui.start.textContent=grindMode?'START GUARD + GRIND →':
    railMode?'START RAIL RUN →':
    longJumpMode?'START LONG JUMP →':'START SKY ROLL →';
}
ui.start.addEventListener('click',e=>{e.preventDefault();restart();});
const releaseGuard=()=>{
  if(!grindMode||guardSide===null||
    (guardLock!=='locked-side'&&guardLock!=='locked-top'))return;
  guardReleaseEvents++;
  guardReleaseByOppositeSwipe++;
  guardLock='release-cooldown';
  guardCoolUntil=elapsed+RELEASE_COOLDOWN;
  const away=-guardSide;
  // Exit impulse has real Bullet momentum. Magnetic pull is disabled for the
  // entire cooldown, so it cannot immediately recapture the player.
  body.applyImpulse(new Vec3(away*1.4*5.5,0,0));
  touchingRails.clear();
  message('RELEASE!');
};
const steer=(clientX:number)=>{
  // In rail mode the legal outer lane must reach the Bullet wall at x≈3.8m.
  // Legacy modes keep their original ±3.3m control envelope untouched.
  const max=railMode?4.18:3.3;
  targetX=clamp(((clientX/window.innerWidth)-.5)*(railMode?8.4:7),-max,max);
  if(grindMode&&guardSide!==null&&oppositeToGuard(targetX,guardSide))
    releaseGuard();
};
const flickForward=()=>{
  if(!speedMode||phase!=='running')return;
  const p=ball.getPosition(),v=body.linearVelocity;
  const tangent=tangentAt(SPEED_START_Z-p.z);
  const current=v.x*tangent.x+v.z*tangent.z;
  if(current>=activeSpeedCap-.4)return;
  swipeStacks=Math.min(6,swipeStacks+1);
  swipeCount++;
  // Mass * target delta-velocity is a real Bullet impulse, not an animated
  // speed display. Do not overshoot the measured safe speed ceiling.
  const delta=Math.min(6.8,activeSpeedCap-current);
  body.applyImpulse(new Vec3(tangent.x*delta*1.4,0,tangent.z*delta*1.4));
  message('FLICK + SPEED!');
};
root.addEventListener('pointerdown',e=>{
  if((e.target as HTMLElement).closest('button'))return;
  if(phase!=='running')restart();
  steer(e.clientX);
  pointerLastY=e.clientY;
});
root.addEventListener('pointermove',e=>{
  if(e.buttons!==0||e.pointerType==='touch'){
    steer(e.clientX);
    if(pointerLastY!==null&&pointerLastY-e.clientY>52){
      flickForward();pointerLastY=e.clientY;
    }
  }
});
root.addEventListener('pointerup',()=>{pointerLastY=null;});
root.addEventListener('pointercancel',()=>{pointerLastY=null;});
window.addEventListener('keydown',e=>{
  if(e.code==='Space'||e.code==='Enter'){e.preventDefault();restart();}
  if(e.code==='ArrowLeft'||e.code==='KeyA')targetX=clamp(targetX-.9,-3.3,3.3);
  if(e.code==='ArrowRight'||e.code==='KeyD')targetX=clamp(targetX+.9,-3.3,3.3);
  if(grindMode&&guardSide!==null&&oppositeToGuard(targetX,guardSide))
    releaseGuard();
  if(e.code==='ArrowUp'||e.code==='KeyW')flickForward();
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
    if(speedMode){
      const progress=SPEED_START_Z-p.z,t=tangentAt(progress);
      const forward=v.x*t.x+v.z*t.z;
      const lateral=v.x*(-t.z)+v.z*t.x;
      const sideError=p.x-centerAt(progress)-targetX;
      const sideForce=clamp(-sideError*76-(lateral)*13,-270,270);
      const requested=Math.min(activeSpeedCap,
        (longJumpMode?20:SPEED_CRUISE)+swipeStacks*6+boostSurge);
      const drive=clamp((requested-forward)*24,-130,240);
      body.applyForce(new Vec3(t.x*drive+(-t.z)*sideForce,0,
        t.z*drive+t.x*sideForce));
      body.applyTorque(new Vec3(-7*t.z,0,7*t.x));
      const edgeOffset=p.x-centerAt(progress);
      const railSection=railMode?railSectionAt(progress):null;
      const railField=railMode?railFieldAt(progress,p.x,p.y):null;
      // Rail priority is SECTION-based, not proximity-based: the previous
      // fallback `!railField` re-enabled the old inward push near the edge,
      // precisely when the player tried to lean into the green rail.
      // Keep classic safety elsewhere and in untouched ?mode=jump/speed.
      const legacySafetyAllowed=railSection===null;
      if(legacySafetyAllowed&&
        (inSafetyArc(progress)||longJumpMode&&inLongSafetyArc(progress))&&
        Math.abs(edgeOffset)>2.8){
        // Limited physical spring assist (not forced teleport or autopilot).
        const inward=-Math.sign(edgeOffset)*Math.min(260,
          (Math.abs(edgeOffset)-2.8)*150+Math.max(0,Math.sign(edgeOffset)*lateral)*18);
        body.applyForce(new Vec3(inward,0,0));
        magnetActivations++;
      }
      if(railSection&&Math.abs(targetX)>3.3)railEntrySteeringFrames++;
      if(grindMode&&touchingRails.size>0&&guardLock.startsWith('locked'))
        guardLastTouch=elapsed;
      if(grindMode&&guardLock==='release-cooldown'&&elapsed>=guardCoolUntil){
        guardLock='free';guardSide=null;
      }
      if(grindMode&&guardLock.startsWith('locked')&&
        (railSection===null||elapsed-guardLastTouch>.22)){
        guardLock='free';guardSide=null;
      }
      const guardHeld=grindMode&&
        (guardLock==='locked-side'||guardLock==='locked-top')&&
        guardSide!==null&&elapsed>=guardCoolUntil&&railSection!==null;
      if(grindMode&&guardHeld){
        const section=railSection!;
        const outward=section.side*(-t.z);
        const railX=centerAt(progress)+outward*4.62;
        const intendedX=guardLock==='locked-top'?railX:
          railX-outward*(PLAYER_RADIUS+.19);
        const hold=relativeRailSpring(p.x,v.x,intendedX,340,25,GUARD_HOLD_FORCE);
        const topTarget=GUARD_TOP_Y+PLAYER_RADIUS;
        const vertical=guardLock==='locked-top'?
          relativeRailSpring(p.y,v.y,topTarget,290,30,200):
          -GUARD_DOWN_FORCE;
        body.applyForce(new Vec3(hold,vertical,0));
        body.applyForce(new Vec3(t.x*GUARD_SPEED_FORCE,0,t.z*GUARD_SPEED_FORCE));
        guardHoldFrames++;guardLockSeconds+=tick;
        guardLockPeakSpeed=Math.max(guardLockPeakSpeed,Math.hypot(v.x,v.z));
      }
      // The old approach field remains a weaker preview, but never competes
      // with locked guidance or the intentionally released cooldown.
      if(railField&&magneticRails&&
        (!grindMode||(!guardHeld&&elapsed>=guardCoolUntil))){
        railApproachFrames++;
        // A finite spring towards the solid rail and a small downforce make
        // high-speed leaning safer. Input forces can still overcome these.
        const pull=Math.min(RAIL_PULL_MAX,
          (18+RAIL_PULL_MAX*railField.strength)*railField.strength);
        const down=RAIL_ADHESION_MAX*railField.strength;
        body.applyForce(new Vec3(railField.normalX*pull,-down,0));
        if(down>0)railDownForceEvents++;
        // Sustained extra forward power needs a real Bullet collision event:
        // geometric proximity by itself NEVER grants a rail-speed bonus.
        const touching=[...touchingRails].some(n=>
          n.startsWith('real-magnetic-rail-'+railField.section.id+'-'));
        if(touching&&(!grindMode||elapsed>=guardCoolUntil)){
          const capRoom=Math.max(0,activeSpeedCap-forward);
          const force=RAIL_CONTACT_FORCE*Math.min(1,capRoom/4);
          if(force>0){
            body.applyForce(new Vec3(t.x*force,0,t.z*force));
            railBoostFrames++;railAssistSeconds+=tick;
            railBoostSpeedGain+=force*tick/1.4;
          }
          railLastContactAt=elapsed;railRecentSection=railField.section.id;
          railMaxSpeed=Math.max(railMaxSpeed,Math.hypot(v.x,v.z));
          railPeakContactGain=Math.max(railPeakContactGain,
            Math.hypot(v.x,v.z)-railContactSpeedStart);
        }
      }
      if(grindMode){
        // Strict top-only: a side wall has its own collider and NEVER grants
        // grind mode. A real top collision + position validates the surface.
        const route=activeGrindRoute(progress);
        const routePoint=route?grindPath(progress,centerAt(progress),route):null;
        const rightCollider=[...touchingGrindTop].some(n=>
          n.startsWith('grind-top-'+(route??'none')+'-'));
        const onTop=rightCollider&&routePoint!==null&&
          grindTopQualifies(p.y,p.x,routePoint.x,routePoint.y,true);
        if(onTop){
          grindLastTopTouch=elapsed;
          if(grindLock!=='top-grind'){
            grindLock='top-grind';grindEntries++;
            message(route==='secret'?'SECRET TOP GRIND!':'BRIDGE GRIND!');
          }
          const guide=relativeRailSpring(p.x,v.x,routePoint!.x,
            300,20,GRIND_CENTER_FORCE);
          const down=relativeRailSpring(p.y,v.y,routePoint!.y+PLAYER_RADIUS,
            200,22,140);
          body.applyForce(new Vec3(guide,down,0));
          const room=Math.max(0,activeSpeedCap-forward);
          if(room>.1){
            const force=GRIND_SPEED_FORCE*Math.min(1,room/5);
            body.applyForce(new Vec3(t.x*force,0,t.z*force));
            grindBoostFrames++;
          }
          grindSeconds+=tick;
          grindPeakSpeed=Math.max(grindPeakSpeed,Math.hypot(v.x,v.z));
        }else if(grindLock==='top-grind'&&elapsed-grindLastTopTouch>.18){
          grindLock='exit-cooldown';grindExits++;
        }
        if(grindLock==='exit-cooldown'&&elapsed-grindLastTopTouch>.7)
          grindLock='off';
      }
      const crossed=boostCrossed(previousProgress,progress,triggeredBoosts);
      const extra=longJumpMode?nextLongBoost(previousProgress,progress,triggeredBoosts):null;
      if(crossed!==null){
        triggeredBoosts.add(crossed);boostCount++;
        boostSurge=Math.min(22,boostSurge+13);
        const impulse=Math.max(0,Math.min(12,activeSpeedCap-forward));
        body.applyImpulse(new Vec3(t.x*impulse*1.4,0,t.z*impulse*1.4));
        message('MAGNETIC BOOST!');
      }
      if(extra!==null){
        const id=3+extra;
        triggeredBoosts.add(id);boostCount++;
        boostSurge=Math.min(24,boostSurge+16);
        const delta=Math.max(0,Math.min(13,activeSpeedCap-forward));
        body.applyImpulse(new Vec3(t.x*delta*1.4,0,t.z*delta*1.4));
        message('LONG BOOST!');
      }
      if(longJumpMode&&!launched&&previousProgress<JUMP_LAUNCH_PROGRESS&&
        progress>=JUMP_LAUNCH_PROGRESS){
        // Physically increase only the vertical velocity at the lip of a
        // genuinely inclined Bullet ramp. Never teleport across the gap.
        launched=true;jumpCount++;
        launchSpeed=Math.hypot(v.x,v.z);
        const dv=Math.max(0,JUMP_TARGET_Y_VELOCITY-v.y);
        body.applyImpulse(new Vec3(0,dv*1.4,0));
        message('SKY JUMP!');
      }
      if(longJumpMode&&launched&&!landed){
        airborneFrames++;
        jumpAirtime+=tick;
        maxJumpHeight=Math.max(maxJumpHeight,p.y);
      }
      previousProgress=Math.max(previousProgress,progress);
      boostSurge=Math.max(0,boostSurge-tick*1.6);
      const planar=Math.hypot(v.x,v.z);
      if(planar>activeSpeedCap){
        const ratio=activeSpeedCap/planar;
        body.linearVelocity=new Vec3(v.x*ratio,v.y,v.z*ratio);
      }
      maxSpeedObserved=Math.max(maxSpeedObserved,Math.min(planar,activeSpeedCap));
    }else{
      const sideForce=clamp((targetX-p.x)*36-v.x*11,-95,95);
      const drive=clamp((-MAX_FORWARD_SPEED-v.z)*13,-60,100);
      body.applyForce(new Vec3(sideForce,0,drive));
      body.applyTorque(new Vec3(-4,0,-sideForce*.028));
      if(Math.abs(v.x)>MAX_SIDE_SPEED||Math.abs(v.z)>MAX_FORWARD_SPEED+2){
        body.linearVelocity=new Vec3(
          clamp(v.x,-MAX_SIDE_SPEED,MAX_SIDE_SPEED),v.y,
          clamp(v.z,-MAX_FORWARD_SPEED-2,MAX_FORWARD_SPEED+2));
      }
    }
    for(const g of gems){
      if(g.collected)continue;
      const gp=g.node.getPosition();
      const dx=p.x-gp.x,dz=p.z-gp.z,dy=p.y-gp.y;
      if(dx*dx+dz*dz+dy*dy<1.35*1.35){
        g.collected=true;g.node.enabled=false;pickups++;message('+ GEM!');
      }
    }
    if(p.y< -5 || (speedMode?Math.abs(p.x-centerAt(SPEED_START_Z-p.z))>(longJumpMode?12:9.5):Math.abs(p.x)>9.5))checkpoint();
    if(p.z<=FINISH_Z){
      phase='complete';
      ui.dialog.classList.remove('hidden');
      ui.title.innerHTML='TRACK <em>CLEARED!</em>';
      ui.description.textContent=`You collected ${pickups}/6 gems, bumped ${bumpers} times and finished in ${elapsed.toFixed(1)}s. Roll again?`;
      ui.start.textContent='ROLL AGAIN →';
    }
  }
  const pos=ball.getPosition();
  if(magneticRails){
    const contactGlow=phase==='running'&&
      elapsed-railLastContactAt<.38?railRecentSection:null;
    magneticRails.activeSection(contactGlow);
    const contactVisible=contactGlow!==null;
    const pSpeed=Math.hypot(body.linearVelocity.x,body.linearVelocity.z);
    // Small pooled emissive spark spheres: no per-frame allocation, and
    // NEVER lit merely because the ball is near a rail.
    for(const [i,spark] of magneticRails.sparklings.entries()){
      spark.enabled=contactVisible&&(i<12);
      if(spark.enabled){
        const t=elapsed*33+i*2.4;
        const railNormal=contactGlow===null?1:
          magneticRails.sections[contactGlow]!.side;
        // Visibly radiate short golden-green streaks backwards from the
        // TRUE rail-ball contact. Pooling keeps draw calls predictable.
        spark.setPosition(pos.x+railNormal*(.53+.24*Math.sin(t*1.3)),
          pos.y-.06+.42*Math.abs(Math.sin(t)),
          pos.z-(i%4)*.32+.22*Math.cos(t*1.15)-Math.min(.45,pSpeed*.007));
        spark.setEulerAngles(Math.sin(t)*28,Math.cos(t*.8)*32,t*7);
      }
    }
  }
  // Camera composition follows physical position, never controls it.
  if(speedMode){
    const forward=tangentAt(SPEED_START_Z-pos.z);
    const speed=Math.hypot(body.linearVelocity.x,body.linearVelocity.z);
    const chase=15+clamp(speed/activeSpeedCap,0,1)*5.5;
    camera.setPosition(pos.x-forward.x*chase*.48,
      8.8+(longJumpMode?Math.max(0,pos.y-1)*.45:0),pos.z+chase);
    camera.lookAt(pos.x+forward.x*21,
      longJumpMode?Math.max(.5,pos.y*.75):.5,pos.z-22);
    camera.camera!.fov=clamp((window.innerWidth/window.innerHeight<.78?68:58)+speed*.29,58,84);
  }else{
    camera.setPosition(pos.x*.24,8.1,pos.z+14.8);
    camera.lookAt(pos.x*.18,.65,pos.z-12);
  }
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
      coursePlanks:speedMode?(speedWorld!.segmentCount+(jumpWorld?.segmentCount??0)):tracks.length,
      physicalBumpers:hazardNodes.length,
      speedMode,longJumpMode,railMode,skyKind:speedWorld?.skyKind??'classic',
      legacyRailVisualsSuppressed:(speedWorld?.hiddenLegacyEdges??0)+
        (jumpWorld?.hiddenLegacyEdges??0),
      magneticRailSections:magneticRails?.sections.length??0,
      magneticRailSegments:magneticRails?.segments??0,
      railContactEvents,railBoostFrames,railAssistSeconds,
      grindMode,guardLock,guardSide,guardLockEvents,guardTopEvents,
      guardSideEvents,guardReleaseEvents,guardReleaseByOppositeSwipe,
      guardLockSeconds,guardLockPeakSpeed,guardHoldFrames,guardCoolUntil,
      grindLock,grindEntries,grindExits,grindSeconds,
      grindBoostFrames,grindTopContactEvents,grindSideContactEvents,
      grindFalseSideRewards,grindPeakSpeed,
      grindTrackTopSegments:grindTrack?.topCount??0,
      grindTrackBridgeSegments:grindTrack?.bridgeTops??0,
      grindTrackSecretSegments:grindTrack?.secretTops??0,
      grindVoidFloorPlanksRemoved:jumpWorld?.removedFloorPlanks??0,
      grindVoidMeters:grindMode?GRIND_VOID_TO-GRIND_VOID_FROM:0,
      grindSecretElevationMeters:grindMode?grindTrack!.secretTopPeakY-GRIND_TOP_Y:0,
      grindActiveRoute:grindMode?activeGrindRoute(SPEED_START_Z-p.z):null,
      grindTrackSideColliders:grindTrack?.sideCount??0,
      legacySafetyForceInRailSection,railEntrySteeringFrames,
      railPrioritySectionId:railMode?railSectionAt(SPEED_START_Z-p.z)?.id??null:null,
      railApproachFrames,railDownForceEvents,
      railMaxSpeed,railBoostSpeedGain,railPeakContactGain,
      railContactNames:[...touchingRails],
      railGlowSections:magneticRails?.glowingSections()??[],
      railSparkCount:magneticRails?.sparklings.filter(e=>e.enabled).length??0,
      curveDegrees:speedWorld?.curveDegrees??0,
      magneticSafetyArcs:speedMode?2:0,
      boostPads:(speedWorld?.boostCount??0)+(jumpWorld?.extraBoosts??0),
      boostCount, swipeCount,swipeStacks,
      jumpCount,landingCount,landed,jumpAirtime,maxJumpHeight,
      launchSpeed,landingSpeed,airborneFrames,landingContactEvents,
      gapMeters:jumpWorld?.gapMeters??0,
      landingWidth:jumpWorld?.landingWidth??0,
      courseLength:longJumpMode?LONG_FINISH_DISTANCE:SPEED_FINISH_DISTANCE,
      magneticAssistEvents:magnetActivations,
      speedCap:speedMode?activeSpeedCap:MAX_FORWARD_SPEED,
      planarSpeed:Math.hypot(v.x,v.z),maxSpeedObserved,
      centerlineX:speedMode?centerAt(SPEED_START_Z-p.z):0,
      treeCount:speedMode?0:treeCrowns.length,
      artMode:licensedArt.mode,licensedModels:licensedArt.loaded,
      licensedMeshes:licensedArt.activeMeshes,
      licensedMissing:licensedArt.requiredMissing,
      dynamicBallStillPhysics:licensedArt.dynamicBallStillPhysics,
      localWasm:new URL('ammo.wasm.wasm',physicsBase).pathname,
      fullViewport:canvas.clientWidth>=window.innerWidth-2&&canvas.clientHeight>=window.innerHeight-2
    };
  }
}});
