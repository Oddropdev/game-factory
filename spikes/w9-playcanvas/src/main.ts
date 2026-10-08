// W9.2D: Licensed PlayCanvas Engine starter structure
// Upstream: playcanvas/create-playcanvas (MIT), Engine third-person starter.
// Gameplay source of truth: accepted local MassRunnerModel (no duplicate scoring).
import {
  AppBase, AppOptions, CameraComponentSystem, Color, ContainerHandler, type ContainerResource,
  Entity, FILLMODE_FILL_WINDOW, LightComponentSystem, RenderComponentSystem,
  RESOLUTION_AUTO, StandardMaterial, TextureHandler, Vec3, createGraphicsDevice
} from 'playcanvas';
import { MassRunnerModel } from '../../../src/games/mass-runner/MassRunnerModel';
import { MASS_RUNNER_LEVELS, applyMassOperation, type MassRunnerEvent } from '../../../src/games/mass-runner/MassRunnerLevels';
import { createSoftAvatar } from './SoftAvatar';
import {
  createSoftTrack, createSoftPortal, createSoftHazard,
  createSoftStripe, createSoftShadow,
  type SoftPortal
} from './SoftCourse';
import { createSoftEnvironment } from './SoftEnvironment';
import { createSoftJuice } from './SoftJuice';
import './style.css';

const level = MASS_RUNNER_LEVELS[0]!;
const model = new MassRunnerModel([level]);
const root = document.getElementById('game')!;
const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
const hud = {
  progress: document.getElementById('progress')!,
  mass: document.getElementById('mass')!,
  target: document.getElementById('target')!,
  score: document.getElementById('score')!,
  feedback: document.getElementById('feedback')!,
  dialog: document.getElementById('dialog')!,
  title: document.getElementById('dialog-title')!,
  description: document.getElementById('dialog-description')!,
  button: document.getElementById('start') as HTMLButtonElement
};
const device = await createGraphicsDevice(canvas);
device.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
const options = new AppOptions();
options.graphicsDevice = device;
options.componentSystems = [RenderComponentSystem, CameraComponentSystem, LightComponentSystem];
options.resourceHandlers = [TextureHandler, ContainerHandler];
const app = new AppBase(canvas);
app.init(options);
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

const material = (hex: string, emissive = 0): StandardMaterial => {
  const m = new StandardMaterial();
  const red = parseInt(hex.slice(1,3), 16)/255;
  const green = parseInt(hex.slice(3,5), 16)/255;
  const blue = parseInt(hex.slice(5,7), 16)/255;
  m.diffuse = new Color(red, green, blue);
  m.emissive = new Color(red*emissive, green*emissive, blue*emissive);
  m.metalness = 0.015;
  m.gloss = 0.49;
  m.update();
  return m;
};
const mats = {
  road: material('#8E9CE4'), edge: material('#FFF0C9',.08),
  stripe: material('#F6FDFF',.12), cyan: material('#46DDBD',.12),
  red: material('#FF7994',.08), grass: material('#83E3BA'),
  blue: material('#A7DDFF'), white: material('#F7FDFF'),
  purple: material('#B9A8FF',.08), gold: material('#FFE177',.16)
};
const camera = new Entity('hero-camera');
camera.addComponent('camera',{
  clearColor:new Color(.655,.867,1),fov:63,nearClip:.1,farClip:160
});
camera.setPosition(0,7.35,12.8);
camera.lookAt(0,.8,-12);
app.root.addChild(camera);
const sun = new Entity('sun');
sun.addComponent('light',{type:'directional',intensity:1.75,castShadows:true,
  shadowResolution:768,shadowBias:.12,normalOffsetBias:.07});
sun.setEulerAngles(48, -25, 0);
app.root.addChild(sun);
app.scene.ambientLight = new Color(.62,.72,.81);

const courseMetrics = createSoftTrack(app.root, mats);
const environment = createSoftEnvironment(app.root);
const juice = createSoftJuice(app.root, mats.gold, mats.red);
const stripes: Entity[] = [];
for (let i = 0; i < 17; i++) for (const x of [-1.25, 1.25]) {
  stripes.push(createSoftStripe('lane-glow', app.root, mats, x, 4 - i * 4));
}
const player = new Entity('character-anchor');
player.setPosition(0,0,2.5);
app.root.addChild(player);
const baseShadow = createSoftShadow(app.root, material('#405a7e'));
// PlayCanvas owns smooth toy avatar geometry; the legacy Kenney character is
// still available as a pinned reference but is not the visible W9.3 hero.
const avatar = createSoftAvatar(player);

const data: Array<{event: MassRunnerEvent; node: Entity; portal?: SoftPortal}> = [];
let portalCount = 0;
let hazardCount = 0;
for (const event of level.events) {
  const node = new Entity('event-' + event.id);
  app.root.addChild(node);
  if (event.kind === 'gate') {
    const portal = createSoftPortal(event.id, node, mats);
    courseMetrics.portalParts += portal.roundedParts;
    portalCount++;
    data.push({ event, node, portal });
  } else if (event.kind === 'hazard') {
    const parts = createSoftHazard(event.id, node, event.width, mats);
    courseMetrics.hazardParts += parts;
    hazardCount++;
    data.push({ event, node });
  } else {
    data.push({ event, node });
  }
}

let loaded=0, failures=0;
const assets = ['character','tree','coin','platform','flag'] as const;
const templates=new Map<string,Entity>();
async function loadModel(id:typeof assets[number]):Promise<void>{
  return new Promise(resolve=>{
    app.assets.loadFromUrl('./models/'+id+'.glb','container',(err,asset)=>{
      if(err || !asset?.resource){failures++; console.error('W9.2D missing CC0 model',id,err);resolve();return;}
      templates.set(id,(asset.resource as ContainerResource).instantiateRenderEntity({castShadows:true}));
      loaded++;
      resolve();
    });
  });
}
await Promise.all(assets.map(loadModel));
const clone=(id:typeof assets[number],parent:Entity,pos:[number,number,number],scale:number):Entity|null=>{
  const source=templates.get(id);
  if(!source)return null;
  const e=source.clone();
  e.setLocalPosition(...pos);
  e.setLocalScale(scale,scale,scale);
  parent.addChild(e);
  return e;
};
// Five pinned CC0 assets stay loaded for provenance; only the coin is instanced.
// Blocky trees/flag have been removed in favour of original soft forms.
for(const item of data){
  if(item.event.kind==='orb')clone('coin',item.node,[0,.98,0],1.0);
  // No blocky Kenney platform overlays on rounded soft hazard rollers.
}

const gateLabels=[document.createElement('div'),document.createElement('div')];
for(const el of gateLabels){
  el.className='world-gate-label';
  el.style.cssText='position:absolute;pointer-events:none;z-index:11;padding:7px 10px;border-radius:14px;font-weight:1000;font-size:clamp(18px,6vw,28px);color:white;text-shadow:0 2px 4px #1239;transform:translate(-50%,-50%);display:none;box-shadow:0 5px 12px #163c6077';
  root.append(el);
}
let target=0.5, accumulator=0, elapsed=0, lastEventId:string|null=null, showUntil=0;
let previousMass = model.snapshot().mass;
let previousPickups = model.snapshot().pickups;
let previousHits = model.snapshot().hits;
let visualFrames=0;
const showFeedback=(value:string)=>{
  hud.feedback.textContent=value;hud.feedback.classList.add('show');showUntil=elapsed+1.0;
};
const start=()=>{
  model.startOrAdvance();
  if(model.snapshot().phase==='running')hud.dialog.classList.add('hidden');
};
hud.button.addEventListener('click',e=>{e.preventDefault();start();});
const steer=(clientX:number)=>{target=Math.min(1,Math.max(0,clientX/window.innerWidth));};
root.addEventListener('pointerdown',e=>{
  if((e.target as HTMLElement).closest('button'))return;
  if(model.snapshot().phase!=='running')start();
  steer(e.clientX);
});
root.addEventListener('pointermove',e=>{if(e.buttons!==0||e.pointerType==='touch')steer(e.clientX);});
window.addEventListener('keydown',e=>{
  if(e.code==='Space'||e.code==='Enter')start();
  if(e.code==='ArrowLeft'||e.code==='KeyA')target=Math.max(0,target-.18);
  if(e.code==='ArrowRight'||e.code==='KeyD')target=Math.min(1,target+.18);
});
const onResize=()=>{
  app.resizeCanvas();
  // Camera and HUD composition are portrait-first, not a stretched 2D canvas.
  const landscape = window.innerWidth > window.innerHeight;
  camera.camera!.fov=window.innerWidth/window.innerHeight<.75?67:58;
  camera.setPosition(0,landscape?7.8:7.35,landscape?14.6:12.8);
  camera.lookAt(0,.8,-12);
};
window.addEventListener('resize',onResize);
onResize();
const opLabel=(op:{op:'add'|'multiply';value:number},mass:number)=>{
  if(op.op==='multiply')return '×'+op.value;
  const difference=applyMassOperation(mass,op)-mass;
  return difference>=0?'+'+difference:String(difference);
};
const present=()=>{
  const s=model.snapshot();
  hud.mass.textContent=String(s.mass);
  hud.target.textContent=String(s.targetMass);
  hud.score.textContent=String(s.totalScore).padStart(4,'0');
  hud.progress.style.width=(s.progress*100).toFixed(1)+'%';
  if(lastEventId!==s.lastEventId&&s.lastEventId){
    const e=level.events.find(x=>x.id===s.lastEventId);
    // Model reports processed events even when an orb/hazard is missed.
    // Feedback must only fire on a real pickup/hit or an actual gate crossing.
    const didPickup=e?.kind==='orb'&&s.pickups>previousPickups;
    const didHit=e?.kind==='hazard'&&s.hits>previousHits;
    const didGate=e?.kind==='gate';
    if(didGate)showFeedback(s.mass>previousMass?'MASS UP!':'GATE!');
    else if(didPickup)showFeedback('+ COINS');
    else if(didHit)showFeedback('OUCH!');
    if(didGate||didPickup||didHit)juice.trigger(didHit||s.mass<previousMass?'impact':'reward',
      elapsed,(s.playerNormX-.5)*6.6);
    lastEventId=s.lastEventId;
  }
  previousMass=s.mass;
  previousPickups=s.pickups;
  previousHits=s.hits;
  if(showUntil<elapsed)hud.feedback.classList.remove('show');
  player.setPosition((s.playerNormX-.5)*6.6,0,2.5);
  // W9.3: exclusively visual toy motion. Mass, steering and timing remain
  // owned by the unchanged deterministic model.
  avatar.update(elapsed, s.phase === 'running', s.playerNormX, s.mass);
  // Juice never changes the authoritative mass scale, colliders or steering.
  const impulse = juice.impulse(elapsed);
  if(impulse>0){
    const scale=avatar.root.getLocalScale();
    avatar.root.setLocalScale(scale.x*(1+impulse*.12),scale.y*(1-impulse*.10),
      scale.z*(1+impulse*.12));
  }
  juice.update(elapsed,(s.playerNormX-.5)*6.6);
  baseShadow.setPosition((s.playerNormX-.5)*6.6,.025,2.5);
  const growth=Math.min(1.32,.68+s.mass*.017);
  player.setLocalScale(growth,growth,growth);
  for(let i=0;i<stripes.length;i++){
    const index=Math.floor(i/2),x=i%2===0?-1.25:1.25;
    stripes[i]!.setPosition(x,.04,5-((index*4+s.distance*.4)%66));
  }
  let nextGate: (typeof data)[number]|undefined;
  for(const item of data){
    const remaining=item.event.distance-s.distance;
    item.node.enabled=remaining>-1 && remaining<125;
    if(!item.node.enabled)continue;
    item.node.setPosition(
      item.event.kind==='gate'?0:(item.event.x-.5)*6.6,
      0,1.5-remaining*.47
    );
    if(item.event.kind==='gate'){
      const betterLeft=applyMassOperation(s.mass,item.event.left)>=applyMassOperation(s.mass,item.event.right);
      item.portal!.setBestLeft(betterLeft);
      if(!nextGate&&remaining>0)nextGate=item;
    }
  }
  gateLabels.forEach(el=>el.style.display='none');
  if(nextGate?.event.kind==='gate'){
    const remaining=nextGate.event.distance-s.distance;
    if(remaining<39&&remaining>3){
      const op=[nextGate.event.left,nextGate.event.right];
      const z=1.5-remaining*.47;
      for(let i=0;i<2;i++){
        const targetPosition=new Vec3(i===0?-1.9:1.9,3.08,z);
        const world=camera.camera!.worldToScreen(targetPosition);
        // PlayCanvas worldToScreen returns CSS viewport coordinates even when
        // the render device uses a larger backing resolution (DPR 2 capped
        // at 1.6). Dividing by maxPixelRatio displaces the labels on phones.
        const cssX=world.x;
        const cssY=world.y;
        const element=gateLabels[i]!;
        element.textContent=opLabel(op[i]!,s.mass);
        // Observable independent projection for CSS-anchor QA at DPR1/2.
        element.dataset.projectedX=String(world.x);
        element.dataset.projectedY=String(world.y);
        const betterLeft=applyMassOperation(s.mass,op[0]!)>=applyMassOperation(s.mass,op[1]!);
        const advantageous=i===0?betterLeft:!betterLeft;
        element.style.background=advantageous?'#149D84':'#CE547B';
        element.dataset.gateQuality=advantageous?'better':'worse';
        element.dataset.gateOperation=op[i]!.op;
        element.style.left=cssX+'px';element.style.top=cssY+'px';
        element.style.display=cssX>0&&cssX<window.innerWidth&&cssY>100&&cssY<window.innerHeight?'block':'none';
      }
    }
  }
  if(s.phase==='complete'||s.phase==='level-clear'||s.phase==='level-fail'){
    hud.dialog.classList.remove('hidden');
    // Result copy is the only primary message: no stale reward praise beneath it.
    hud.feedback.classList.remove('show');
    hud.title.innerHTML=s.phase==='complete'||s.phase==='level-clear'?'LEVEL <em>CLEAR!</em>':'NOT <em>ENOUGH.</em>';
    hud.description.textContent=s.phase==='complete'||s.phase==='level-clear'?'The first 3D hero slice is complete. Play again to compare the feel.':'Pick better gates and collect more coins to reach your target.';
    hud.button.textContent=s.phase==='complete'||s.phase==='level-clear'?'PLAY AGAIN →':'RETRY RUN →';
  }
  if(s.phase==='running')hud.dialog.classList.add('hidden');
};
app.on('update',(dt:number)=>{
  elapsed+=Math.min(dt,.1);
  visualFrames++;
  accumulator+=Math.min(dt,.08);
  while(accumulator>1/60){
    // MassRunnerModel remains authoritative for timing/collision/growth.
    model.step(target,'fluid');
    accumulator-=1/60;
  }
  present();
});
app.start();
// A checkable probe replaces "WebGL runs" with load, viewport and actual progression.
Object.assign(window,{
  __W9_PLAYCANVAS_TEST__:{
    snapshot:()=>({
      ...model.snapshot(),
      loadedCC0Models:loaded,assetFailures:failures,template:'official-playcanvas-engine',
      renderer:'playcanvas',viewport:[canvas.clientWidth,canvas.clientHeight],
      resolution:[canvas.width,canvas.height],frames:visualFrames,
      playerVisible:player.enabled,cameraFov:camera.camera?.fov,
      modelAttached:avatar.root.enabled,
      avatarKind:'soft-toy-v1',
      avatarRoundedParts:avatar.partCount,
      avatarBoxParts:avatar.boxPartCount,
      softCourse:'rounded-toy-v1',
      softTrackPieces:courseMetrics.trackParts,
      roundedPortalPieces:courseMetrics.portalParts,
      roundedHazardPieces:courseMetrics.hazardParts,
      portalCount,
      hazardCount,
      softCourseBoxPieces:courseMetrics.boxParts,
       environmentKind:environment.identity,
       environmentRoundedPieces:environment.pieces,
       environmentBoxPieces:environment.boxPieces,
       juicePieces:juice.pieces,
       juiceBursts:juice.bursts,
       juiceActive:juice.active,
       juiceLastKind:juice.lastKind,
      fullViewport:canvas.clientWidth>=window.innerWidth-2&&canvas.clientHeight>=window.innerHeight-2
    })
  }
});
