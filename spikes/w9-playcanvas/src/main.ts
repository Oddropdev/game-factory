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
  m.metalness = 0.07;
  m.gloss = 0.38;
  m.update();
  return m;
};
const mats = {
  road: material('#6979d8'), edge: material('#f6c75f',.22),
  stripe: material('#dcf9fc',.25), cyan: material('#22e6e8',.35),
  red: material('#ff517a',.2), grass: material('#57c487'),
  blue: material('#62b7ff'), white: material('#eefcff'),
  purple: material('#e99cf9',.25), gold: material('#ffdc4c',.45)
};
function block(name:string, position:[number,number,number], size:[number,number,number], m:StandardMaterial, parent:Entity=app.root):Entity{
  const e=new Entity(name);
  e.addComponent('render',{type:'box',material:m});
  e.setPosition(...position);
  e.setLocalScale(...size);
  parent.addChild(e);
  return e;
}
const camera = new Entity('hero-camera');
camera.addComponent('camera',{
  clearColor:new Color(.51,.77,.98),fov:63,nearClip:.1,farClip:160
});
camera.setPosition(0,7.4,12.8);
camera.lookAt(0,.8,-12);
app.root.addChild(camera);
const sun = new Entity('sun');
sun.addComponent('light',{type:'directional',intensity:2.1,castShadows:true,
  shadowResolution:1024,shadowBias:.12,normalOffsetBias:.07});
sun.setEulerAngles(48, -25, 0);
app.root.addChild(sun);
app.scene.ambientLight = new Color(.53,.61,.72);

block('wide-3d-track',[0,-.28,-24],[7.8,.5,80],mats.road);
block('grass-left',[-12,-.7,-27],[17,1.0,92],mats.grass);
block('grass-right',[12,-.7,-27],[17,1.0,92],mats.grass);
block('edge-left',[-3.8,.14,-24],[.22,.33,80],mats.gold);
block('edge-right',[3.8,.14,-24],[.22,.33,80],mats.gold);
const stripes: Entity[]=[];
for(let i=0;i<17;i++)for(const x of [-1.25,1.25]){
  stripes.push(block('lane-glow',[x,.01,4-i*4],[.065,.045,1.9],mats.stripe));
}
const decorations:Entity[]=[];
for(let i=0;i<13;i++)for(const sign of [-1,1]){
  decorations.push(block('road-bumper',[sign*4.55,.07,3-i*6],[.3,.25,1.7],i%2?mats.cyan:mats.purple));
}
const player = new Entity('character-anchor');
player.setPosition(0,0,2.5);
app.root.addChild(player);
const baseShadow=block('player-shadow',[0,.02,2.5],[1.25,.03,.96],material('#405a7e'));
const placeholder=block('avatar-model-loading',[0,1.1,0],[.76,1.7,.64],mats.blue,player);

const data: Array<{event:MassRunnerEvent;node:Entity;left?:Entity;right?:Entity}>=[];
for(const event of level.events){
  const node=new Entity('event-'+event.id);
  app.root.addChild(node);
  if(event.kind==='gate'){
    const left=block(event.id+'-left',[-1.93,1.33,0],[3.6,2.66,.46],mats.cyan,node);
    const right=block(event.id+'-right',[1.93,1.33,0],[3.6,2.66,.46],mats.red,node);
    // The gate opening is readable in depth: thin portal headers, not solid walls.
    left.setLocalScale(3.5,.38,.48);
    right.setLocalScale(3.5,.38,.48);
    left.setLocalPosition(-1.85,2.5,0);
    right.setLocalPosition(1.85,2.5,0);
    for(const [x,m] of [[-3.47,mats.cyan],[-.25,mats.cyan],[.25,mats.red],[3.47,mats.red]] as const){
      block('portal-post',[x,1.28,0],[.27,2.55,.4],m,node).setLocalPosition(x,1.28,0);
    }
    data.push({event,node,left,right});
  }else if(event.kind==='hazard'){
    block('hazard-plinth',[0,.5,0],[event.width*7.7,1,.9],mats.red,node);
    block('hazard-light',[0,1.08,0],[event.width*7.9,.17,1],mats.gold,node);
    data.push({event,node});
  }else{
    data.push({event,node});
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
const avatar=clone('character',player,[0,.06,0],2.9);
if(avatar){placeholder.enabled=false;avatar.setEulerAngles(0,180,0);}
for(const [i,dec] of decorations.entries()){
  if(i%2===0)clone('tree',app.root,[(i%2===0?-1:1)*8.4,0,-(i/2)*8],1.9);
  dec.enabled=true;
}
for(const item of data){
  if(item.event.kind==='orb')clone('coin',item.node,[0,.98,0],1.0);
  if(item.event.kind==='hazard')clone('platform',item.node,[0,.25,0],.5);
}
clone('flag',app.root,[4,0,-53],1.2);

const gateLabels=[document.createElement('div'),document.createElement('div')];
for(const el of gateLabels){
  el.className='world-gate-label';
  el.style.cssText='position:absolute;pointer-events:none;z-index:11;padding:7px 10px;border-radius:14px;font-weight:1000;font-size:clamp(18px,6vw,28px);color:white;text-shadow:0 2px 4px #1239;transform:translate(-50%,-50%);display:none;box-shadow:0 5px 12px #163c6077';
  root.append(el);
}
let target=0.5, accumulator=0, elapsed=0, lastEventId:string|null=null, showUntil=0;
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
  camera.camera!.fov=window.innerWidth/window.innerHeight<.75?67:58;
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
    if(e?.kind==='gate')showFeedback('MASS × / +');
    else if(e?.kind==='orb')showFeedback('+ COINS');
    else if(e?.kind==='hazard')showFeedback('OUCH!');
    lastEventId=s.lastEventId;
  }
  if(showUntil<elapsed)hud.feedback.classList.remove('show');
  player.setPosition((s.playerNormX-.5)*6.6,0,2.5);
  const stride=s.phase==='running'?1:0;
  const bounce=Math.abs(Math.sin(elapsed*12))*stride*.17;
  if(avatar){
    avatar.setLocalPosition(0,.06+bounce,0);
    avatar.setEulerAngles(0,180,Math.sin(elapsed*9)*2.5*stride);
    const step=Math.sin(elapsed*12)*22*stride;
    avatar.findByName('leg-left')?.setLocalEulerAngles(step,0,0);
    avatar.findByName('leg-right')?.setLocalEulerAngles(-step,0,0);
    avatar.findByName('arm-left')?.setLocalEulerAngles(-step*.7,0,0);
    avatar.findByName('arm-right')?.setLocalEulerAngles(step*.7,0,0);
  }
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
      item.left!.render!.material=betterLeft?mats.cyan:mats.red;
      item.right!.render!.material=betterLeft?mats.red:mats.cyan;
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
        const targetPosition=new Vec3(i===0?-1.93:1.93,3.2,z);
        const world=camera.camera!.worldToScreen(targetPosition);
        const cssX=world.x/(device.maxPixelRatio||1);
        const cssY=world.y/(device.maxPixelRatio||1);
        const element=gateLabels[i]!;
        element.textContent=opLabel(op[i]!,s.mass);
        element.style.background=i===0?'#1a9ca5':'#dc426a';
        element.style.left=cssX+'px';element.style.top=cssY+'px';
        element.style.display=cssX>0&&cssX<window.innerWidth&&cssY>100&&cssY<window.innerHeight?'block':'none';
      }
    }
  }
  if(s.phase==='complete'||s.phase==='level-clear'||s.phase==='level-fail'){
    hud.dialog.classList.remove('hidden');
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
      modelAttached:Boolean(avatar),
      fullViewport:canvas.clientWidth>=window.innerWidth-2&&canvas.clientHeight>=window.innerHeight-2
    })
  }
});
