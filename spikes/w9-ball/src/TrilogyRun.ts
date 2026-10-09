import {Entity,Vec3,Quat,Texture,Color,type AppBase,type GraphicsDevice,type RigidBodyComponent,type StandardMaterial} from 'playcanvas';
import {WorldAssets} from './TrilogyAssets';
import {TrilogyWorld,fetchWorld} from './TrilogyWorld';
import {WORLD_BOUNDS,trilogyCenter,trilogyTangent,setRichEndlessRoute} from './TrilogyManifest';
import {endlessBounds,generateEndlessWorld,generateWorldFeatures,setLongCoasterProfile,setChaosProfile} from './EndlessWorlds';
import {generateTransit,generateSpectacleTransit,generateExtremeTransit,type SeededTransit} from './SeededTransit';
import {buildTubeMesh,TUBE_OFFSET} from './TubeTransit';
import {polished,tint} from './TrilogyArt';
import {spiralSpec,generateSpiralRoad,spiralMetrics} from './SpiralCourse';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
type Event={event:string;world:number;at:number;bodies?:number;url?:string};
export class TrilogyRun{
 worldIndex=0;current!:TrilogyWorld;next:TrilogyWorld|null=null;
 transit:SeededTransit|null=null;tubeRoot:Entity|null=null;tubeMaterials:StandardMaterial[]=[];
 state:'world'|'transit'|'holding'|'complete'='world';
 loadState:'idle'|'loading'|'ready'|'failed'='idle';loadError='';loadMs=0;
 distance=0;angle=0;entries=0;exits=0;holdSeconds=0;maxRadiusError=0;invertedFrames=0;
 runTime=0;gems=0;falls=0;privateCount=0;worldFrames=[0,0,0];worldContacts=[0,0,0];
 history:Event[]=[];retired:ReturnType<TrilogyWorld['snapshot']>[]=[];
 journeys:{seed:number;fingerprint:string;kind:string;fallback:boolean;inversions:number;validation:SeededTransit['validation']}[]=[];
 private seed:number;private body:RigidBodyComponent;private loadAbort:AbortController|null=null;
 private sparkPool:Entity[]=[];private ballTexture:Texture;private camUp=new Vec3(0,1,0);
 private persistentAssets:WorldAssets;
 private lastCameraRotation=new Quat();private wasConstrained=false;
 maxCameraTurn=0;cameraFinite=true;cameraMinClearance=Infinity;
 private inputLocked=false;private retryAt=0;private introUntil=2;private lastWorld=-1;
 readonly richMode:boolean;readonly extremeCoasters:boolean;readonly trackFirstMode:boolean;
 readonly chaosMode:boolean;readonly spiralMode:boolean;
 private spiralHint=12;private spiralProgress=0;
 spiralInputFrames=0;spiralFalls=0;spiralMetric:null|ReturnType<typeof spiralMetrics>=null;
 gripFrames=0;maxSurfaceGap=0;edgeBounces=0;maxCurve=0;motifSignature='';
 themeFade=0;
 private fadeFrom:{sky:Color;fog:Color;ambient:Color}|null=null;
 private fadeTo:{sky:Color;fog:Color;ambient:Color}|null=null;
 private guardContacts=new Set<string>();private grindTopContacts=new Set<string>();
 private grindSideContacts=new Set<string>();private guardCooldownUntil=0;
 guardBoostFrames=0;grindBoostFrames=0;guardReleases=0;
 generatedMinSpeed=Infinity;generatedMaxSpeed=0;
 readonly runSeed:number;
 constructor(private app:AppBase,private device:GraphicsDevice,private ball:Entity,
  private camera:Entity,private ui:{level:HTMLElement;gemLabel:HTMLElement;status:HTMLElement;
   coins:HTMLElement;progress:HTMLElement;message:HTMLElement},
  private onFinish:()=>void,private ballMaterial:StandardMaterial,readonly endless=false){
  const p=new URL(location.href).searchParams,requested=Number(p.get('seed'));
  this.spiralMode=this.endless&&p.get('edition')==='w10';
  this.chaosMode=this.endless&&p.get('edition')==='w99';
  this.trackFirstMode=this.endless&&(p.get('edition')==='w98'||this.chaosMode||this.spiralMode);
  this.richMode=this.endless&&(p.get('edition')==='w97'||this.trackFirstMode);
  this.extremeCoasters=this.richMode&&p.get('coaster')==='extreme';
  setRichEndlessRoute(this.richMode);setLongCoasterProfile(this.trackFirstMode);
  this.seed=p.has('seed')&&Number.isSafeInteger(requested)?requested>>>0:crypto.getRandomValues(new Uint32Array(1))[0]!;
  setChaosProfile(this.chaosMode,this.seed);
  this.runSeed=this.seed;this.body=ball.rigidbody!;this.persistentAssets=new WorldAssets(app);
  this.ballTexture=this.makeBallTexture();this.ballMaterial.diffuseMap=this.ballTexture;
  this.ballMaterial.diffuse=tint('#ffffff');this.ballMaterial.useMetalness=true;this.ballMaterial.metalness=.48;this.ballMaterial.gloss=.93;this.ballMaterial.update();
  for(let i=0;i<18;i++){
   const e=new Entity('pooled-speed-spark-'+i);e.addComponent('render',{type:'sphere',material:polished(i%2?'#fff1a9':'#7bf5f7',.65),castShadows:false});
   e.setLocalScale(.07,.07,.7);e.enabled=false;app.root.addChild(e);this.sparkPool.push(e);
  }
  ball.collision!.on('collisionstart',(e:{other:Entity})=>{
   if(e.other.name.startsWith('trilogy-road-'))this.worldContacts[this.worldIndex]=(this.worldContacts[this.worldIndex]??0)+1;
   const name=e.other.name;
   if(this.richMode){
    if(name.startsWith('w97-guard-'))this.guardContacts.add(name);
    if(name.startsWith('w97-grind-top-'))this.grindTopContacts.add(name);
    if(name.startsWith('w97-grind-side-'))this.grindSideContacts.add(name);
   }
  });
  ball.collision!.on('collisionend',(e:Entity|{other?:Entity}|undefined)=>{
   // PlayCanvas emits collisionstart with {other}, but collisionend may
   // deliver the other Entity directly (or no payload during disposal).
   const candidate=e as {other?:Entity;name?:string}|undefined;
   const name=candidate?.other?.name??candidate?.name;
   if(typeof name!=='string')return;
   this.guardContacts.delete(name);this.grindTopContacts.delete(name);
   this.grindSideContacts.delete(name);
  });
 }
 private makeBallTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d')!;
  for(let y=0;y<8;y++)for(let x=0;x<16;x++){
   ctx.fillStyle=['#fbecfa','#59d0e2','#788cd5','#d4acdf'][(x+y)%4]!;ctx.fillRect(x*16,y*16,16,16);
   ctx.strokeStyle='#fff5e9';ctx.lineWidth=.8;ctx.strokeRect(x*16,y*16,16,16);
  }
  const t=new Texture(this.device,{name:'original-prism-ball',mipmaps:true});t.setSource(c);return t;
 }
 async initialize(root:Entity){
  const {manifest,road}=await fetchWorld(0);
  await this.persistentAssets.load(['ball']);
  if(this.persistentAssets.attach('ball',this.ball,new Vec3(1.24,1.24,1.24))){
   this.ball.findByName(this.ball.name+'-visual')!.enabled=false;this.privateCount++;
  }
  if(this.spiralMode&&new URL(location.href).searchParams.get('start')==='spiral'){
   const index=3,content=generateEndlessWorld(index,this.seed,true);
   const axis=content.road.find(r=>r.d===content.manifest.start)!.x;
   const spec=spiralSpec(index,this.seed,content.manifest.start,content.manifest.end,axis);
   content.manifest.geometry='spiral';
   content.manifest.spiralCoilStart=spec.coilStart;
   content.manifest.spiralCoilEnd=spec.coilEnd;
   this.spiralMetric=spiralMetrics(spec);
   this.worldIndex=index;root.enabled=false;
   this.current=new TrilogyWorld(this.app,content.manifest,generateSpiralRoad(spec),
    undefined,this.richMode,true,false,true);
   await this.current.prepare(this.device);this.current.activate();
   const entry=this.current.roadPoint(content.manifest.start);
   this.body.teleport(entry.x,entry.y+1.6,entry.z);
   this.body.linearVelocity=new Vec3(0,0,-24);
   this.spiralHint=12;this.spiralProgress=content.manifest.start;
  }else{
   this.current=new TrilogyWorld(this.app,manifest,road,root,this.richMode,this.trackFirstMode,this.chaosMode);
   await this.current.prepare(this.device,true);this.current.activate();
  }
  this.privateCount+=this.current.privateMeshes;this.history.push({event:'activated',world:0,at:0});this.applyTheme();this.prepareTube();
 }
 private prepareTube(){
  if(!this.endless&&this.worldIndex>=2)return;
  const start=this.current.manifest.end;
  const end=this.worldIndex<2?WORLD_BOUNDS[this.worldIndex+1]![0]:endlessBounds(this.worldIndex+1)[0];
  const entry={progress:start,x:trilogyCenter(start),dx:trilogyTangent(start).dx};
  const exit={progress:end,x:trilogyCenter(end),dx:0};
  let nextSeed=(this.seed+Math.imul(this.worldIndex,0x85ebca6b))>>>0;
  let transit=this.extremeCoasters?generateExtremeTransit(nextSeed,entry,exit):
   this.endless?generateSpectacleTransit(nextSeed,entry,exit):generateTransit(nextSeed,entry,exit);
  if(this.journeys.some(j=>j.fingerprint===transit.fingerprint)){nextSeed=(nextSeed+1)>>>0;transit=this.extremeCoasters?generateExtremeTransit(nextSeed,entry,exit):
   this.endless?generateSpectacleTransit(nextSeed,entry,exit):generateTransit(nextSeed,entry,exit);}
  this.transit=transit;this.tubeRoot=new Entity('journey-'+this.worldIndex);this.app.root.addChild(this.tubeRoot);
  this.tubeMaterials=[polished(this.worldIndex%3?'#f078b6':'#4183b9',.06),polished(this.worldIndex%3?'#fff0b6':'#86ffee',.55)];
  buildTubeMesh(this.device,this.tubeRoot,transit.path,this.tubeMaterials[0]!,this.tubeMaterials[1]!);
  this.distance=0;this.angle=0;
 }
 private preload(){
  if(this.loadState==='loading'||this.loadState==='ready')return;
  this.loadState='loading';this.loadError='';this.loadAbort=new AbortController();
  const index=this.worldIndex+1,started=performance.now(),controller=this.loadAbort;
  const timeout=setTimeout(()=>controller.abort(),12000);
  this.history.push({event:'fetch-start',world:index,at:this.runTime,url:this.endless&&index>=3?'generated://world-'+(index+1):'levels/'+['crystal','candy','rainbow'][index]+'.json'});
  void(async()=>{
   let staged:TrilogyWorld|null=null;
   try{
    const content=this.endless&&index>=3?generateEndlessWorld(index,this.seed,this.richMode):await fetchWorld(index,controller.signal);
    if(this.richMode&&index<3)
     content.manifest.features=generateWorldFeatures(index,content.manifest.start,content.manifest.end,this.seed);
    let stagedRoad=content.road;
     if(this.trackFirstMode&&index<3){
      // Render and collide the incoming track under the last 12m of tube.
      // From that aligned narrow lip, it widens gently to its full width.
      const start=content.manifest.start;
      const taper=(d:number)=>{const u=clamp((d-(start-12))/36,0,1);
       return 3.1+7.9*u*u*(3-2*u);};
      const lip=Array.from({length:10},(_,i)=>({
       ...content.road[0]!,d:start-12+i,x:trilogyCenter(start),
       y:0,bank:0,width:taper(start-12+i)
      }));
      stagedRoad=[...lip,...content.road.map(p=>({
       ...p,width:p.d<start+24?taper(p.d):p.width
      }))];
     }
     if(this.spiralMode&&index>=3){
      const axis=content.road.find(r=>r.d===content.manifest.start)!.x;
      const spec=spiralSpec(index,this.seed,content.manifest.start,content.manifest.end,axis);
      stagedRoad=generateSpiralRoad(spec);
      content.manifest.geometry='spiral';
      content.manifest.spiralCoilStart=spec.coilStart;
      content.manifest.spiralCoilEnd=spec.coilEnd;
     }
     staged=new TrilogyWorld(this.app,content.manifest,stagedRoad,undefined,
      this.richMode,this.trackFirstMode,this.chaosMode,this.spiralMode&&index>=3);
     await staged.prepare(this.device);
     if(this.trackFirstMode)
      this.fadeTo={sky:tint(content.manifest.sky),fog:tint(content.manifest.fog),
       ambient:tint('#a5bfd3')};
    this.next=staged;this.loadState='ready';this.loadMs=performance.now()-started;
    this.history.push({event:'prepared-disabled',world:index,at:this.runTime,bodies:staged.roadBodies+staged.hazardBodies});
   }catch(error){staged?.dispose();this.loadState='failed';this.loadError=String(error);this.retryAt=this.runTime+2;}finally{clearTimeout(timeout);}
  })();
 }
 private applyTheme(){
  const m=this.current.manifest;
  if(this.trackFirstMode){
   this.fadeFrom={sky:tint(m.sky),fog:tint(m.fog),ambient:tint('#a5bfd3')};
   this.fadeTo=null;this.themeFade=0;
  }
  this.camera.camera!.clearColor.copy(tint(m.sky));this.app.scene.fog.type='linear';
  this.app.scene.fog.color.copy(tint(m.fog));this.app.scene.fog.start=72;this.app.scene.fog.end=235;
  this.app.scene.ambientLight.copy(tint(m.id==='candy'?'#d1bfdf':'#a5bfd3'));
  const game=document.getElementById('game')!;game.dataset.world=m.id;
  this.ui.level.textContent=this.endless?`WORLD ${this.worldIndex+1} · ${m.title.toUpperCase()}`:`0${this.worldIndex+1} / 03 · ${m.title}`;
  this.ui.gemLabel.textContent=' STARS';this.introUntil=this.runTime+2.3;
 }
 rotate(delta:number){if(!this.inputLocked||this.distance>(this.transit?.path.length??0)-24)return;this.angle+=clamp(delta,-.3,.3);}
 get constrained(){return this.state==='transit'||this.state==='holding';}
 update(dt:number,running:boolean,targetX:number):boolean{
  if(!running)return false;this.runTime+=dt;
  const p=this.ball.getPosition();
  if(this.spiralMode&&this.worldIndex>=3&&this.state==='world')
   return this.updateSpiral(dt,targetX);
  const progress=7-p.z;
  if(this.state==='world'){
   this.worldFrames[this.worldIndex]=(this.worldFrames[this.worldIndex]??0)+1;
   const picked=this.current.collect(p,this.runTime);if(picked){this.gems+=picked;this.ui.message.textContent='✦ +'+picked;this.ui.message.classList.add('show');}
   if((this.endless||this.worldIndex<2)&&progress>=this.current.manifest.end-1.05&&Math.abs(p.x-trilogyCenter(this.current.manifest.end))<3&&p.y<2.4){
    this.entries++;this.state='transit';this.inputLocked=true;this.body.type='kinematic';
    this.body.teleport(...this.transit!.path.position(0));
    this.history.push({event:'transit-enter',world:this.worldIndex,at:this.runTime});
    const t=this.transit!;this.journeys.push({seed:t.seed,fingerprint:t.fingerprint,kind:t.kind,fallback:t.fallback,inversions:t.validation.invertedSamples,validation:t.validation});
    this.preload();return true;
   }
   if(!this.endless&&this.worldIndex===2&&progress>=this.current.manifest.end){
    this.state='complete';this.history.push({event:'finish',world:2,at:this.runTime});this.onFinish();return true;
   }
   if(this.worldIndex>0){
    // Same force-driven Bullet sphere and lane guidance as the accepted course.
    const v=this.body.linearVelocity,t=trilogyTangent(progress);
    const hill=this.trackFirstMode&&this.worldIndex>=3?
     (this.current.roadHeight(progress+1)-this.current.roadHeight(progress-1))/2:0;
    const full=Math.hypot(t.x,t.z,hill),alongX=t.x/full,alongZ=t.z/full,alongY=hill/full;
    const forward=v.x*alongX+v.y*alongY+v.z*alongZ;
    const lateral=v.x*(-t.z)+v.z*t.x,error=p.x-trilogyCenter(progress)-targetX;
    let goalSpeed=this.richMode?48:26;
    const left=trilogyCenter(progress-1),middle=trilogyCenter(progress),right=trilogyCenter(progress+1);
    const curve=Math.abs(right-2*middle+left)/Math.pow(1+t.dx*t.dx,1.5);
    if(this.chaosMode&&this.worldIndex>=3){
     this.maxCurve=Math.max(this.maxCurve,curve);
     goalSpeed=clamp(51-95*curve,39,51);
    }
    let magnetSide:-1|1|null=null;
    if(this.richMode&&this.worldIndex>0){
     const active=[...this.guardContacts][0];
     const match=active?/^w97-guard-(-?1)-/.exec(active):null;
     if(match)magnetSide=Number(match[1]) as -1|1;
     if(magnetSide!==null&&magnetSide*targetX < -1.05&&this.runTime>=this.guardCooldownUntil){
      this.guardCooldownUntil=this.runTime+.75;this.guardReleases++;
      this.guardContacts.clear();magnetSide=null;
     }
     if(magnetSide!==null&&this.runTime>=this.guardCooldownUntil){
      goalSpeed=55;this.guardBoostFrames++;
     }
     const grind=[...this.grindTopContacts][0];
     // TOP contact plus true ball height. Side-only contact never boosts.
     if(grind&&p.y>=1.52&&this.grindSideContacts.size===0){
      const trackId=/^w97-grind-top-(\d+)-/.exec(grind);
      const track=trackId?this.current.manifest.features?.grinds[Number(trackId[1])]:null;
      const offset=(p.x-trilogyCenter(progress))*(-t.z);
      if(track&&Math.abs(offset-track.side*2.9)<.78){goalSpeed=57;this.grindBoostFrames++;}
     }
     const measured=Math.max(0,forward);
     this.generatedMinSpeed=Math.min(this.generatedMinSpeed,measured);
     this.generatedMaxSpeed=Math.max(this.generatedMaxSpeed,measured);
    }
    let side=clamp(-error*(this.chaosMode?225:this.richMode?126:88)-
      lateral*(this.chaosMode?58:this.richMode?26:16),
      this.chaosMode?-1200:this.richMode?-670:-300,
      this.chaosMode?1200:this.richMode?670:300);
    if(this.spiralMode)side=targetX*105; // No center-seeking force on Worlds 2-3.
    if(this.chaosMode&&this.worldIndex>=3){
     // Feed-forward centrifugal compensation leaves steering interactive.
     const signed=(right-2*middle+left)/Math.pow(1+t.dx*t.dx,1.5);
     side=clamp(side+signed*forward*forward*this.body.mass*.72,-1500,1500);
    }
    if(magnetSide!==null&&this.runTime>=this.guardCooldownUntil){
     const railX=magnetSide*3.65,along=(p.x-trilogyCenter(progress))*(-t.z);
     side+=clamp((railX-along)*95-lateral*15,-190,190);
    }
    const drive=clamp((goalSpeed-forward)*(this.richMode?36:24),
     this.richMode?-260:-140,this.richMode?500:220);
    this.body.applyForce(new Vec3(alongX*drive-t.z*side,
     (magnetSide!==null?-100:-8)+alongY*drive+(this.trackFirstMode&&this.worldIndex>=3?29:0),
     alongZ*drive+t.x*side));
    if(this.chaosMode&&this.worldIndex>=3){
     // Surface-normal adhesion, 90% additional gravity relative to the
     // original 22 m/s². Only active near and above the playable road;
     // unlike an invisible kinematic lock it cannot bridge a missing deck.
     const frame=this.current.roadFrame(progress),slope=(this.current.roadHeight(progress+1)-
       this.current.roadHeight(progress-1))*.5;
     const bank=frame.bank*Math.PI/180;
     const normal=new Vec3(-t.x*slope+(-t.z)*Math.sin(bank)*.25,1,
       -t.z*slope+t.x*Math.sin(bank)*.25).normalize();
     const surfaceY=frame.y+.62;
     const gap=(p.y-surfaceY)*normal.y;
     const lateralError=Math.abs(p.x-middle);
     this.maxSurfaceGap=Math.max(this.maxSurfaceGap,Math.max(0,gap));
     if(gap>-.8&&gap<4.8&&lateralError<frame.width/2+1.1){
      const separationVelocity=v.dot(normal);
      const extraG=22*.90;
      const spring=clamp(Math.max(0,gap)*60+Math.max(0,separationVelocity)*28,0,235);
      this.body.applyForce(normal.clone().mulScalar(-this.body.mass*(extraG+spring)));
      if(separationVelocity>4.2&&gap<3){
       // A bounded real Bullet impulse removes catastrophic ramp launches
       // without teleporting the sphere or faking a contact event.
       const cancel=clamp((separationVelocity-4.2)*.68,0,20);
       this.body.applyImpulse(normal.clone().mulScalar(-this.body.mass*cancel));
       this.edgeBounces++;
      }
      this.gripFrames++;
     }
    }
    this.body.applyTorque(new Vec3(-7*t.z,0,7*t.x));
    if(p.y<(this.trackFirstMode?this.current.roadHeight(progress)-8:-5)||Math.abs(p.x-trilogyCenter(progress))>14){
     this.falls++;const d=this.current.manifest.start+4;
     this.body.teleport(trilogyCenter(d),this.current.roadHeight(d)+2,7-d);
     this.body.linearVelocity=new Vec3(0,0,-12);this.body.angularVelocity=new Vec3();
    }
    return true;
   }
   return false;
  }
  if(this.constrained){
   const t=this.transit!,path=t.path;
   if(this.state==='transit')this.distance=Math.min(path.length,this.distance+(this.richMode?62:38)*dt);
   if(this.distance>path.length-24){this.angle*=Math.exp(-dt*9);this.inputLocked=false;}
   const f=path.at(this.distance),position=path.position(this.distance,this.angle);this.body.teleport(...position);
   this.maxRadiusError=Math.max(this.maxRadiusError,Math.abs(Math.hypot(...position.map((v,i)=>v-f.center[i]!))-TUBE_OFFSET));
   if(f.tangent[2]>.1||f.normal[1]>.1)this.invertedFrames++;
   if(this.distance>=path.length-.001){
    this.state='holding';this.holdSeconds+=dt;
    if(this.loadState==='failed'&&this.runTime>=this.retryAt)this.preload();
    if(this.loadState==='ready'&&this.next){
     const old=this.current;this.next.activate();this.current=this.next;this.next=null;this.worldIndex++;this.exits++;
     this.history.push({event:'activated',world:this.worldIndex,at:this.runTime});
     const exit=path.position(path.length,0),direction=path.at(path.length).tangent;
     this.body.type='dynamic';this.body.teleport(...exit);this.body.linearVelocity=new Vec3(...direction).mulScalar(this.richMode?50:26);this.body.angularVelocity=new Vec3();
     old.dispose();this.retired.push(old.snapshot());
     if(this.spiralMode&&this.current.spiral){
      this.spiralHint=12;this.spiralProgress=this.current.manifest.start;
      const m=this.current.manifest,axis=this.current.roadPoint(m.start).x;
      this.spiralMetric=spiralMetrics(spiralSpec(this.worldIndex,this.seed,m.start,m.end,axis));
     }
     if(this.retired.length>24)this.retired.shift();
     this.history.push({event:'disposed',world:this.worldIndex-1,at:this.runTime});
     if(this.history.length>180)this.history.splice(0,this.history.length-180);
     if(this.journeys.length>48)this.journeys.splice(0,this.journeys.length-48);
     this.guardContacts.clear();this.grindTopContacts.clear();this.grindSideContacts.clear();
     this.tubeRoot!.destroy();this.tubeMaterials.forEach(m=>m.destroy());this.tubeMaterials=[];this.tubeRoot=null;this.transit=null;
     this.state='world';this.loadState='idle';this.privateCount+=this.current.privateMeshes;this.applyTheme();this.prepareTube();
    }
   }
   return true;
  }
  return true;
 }

 private updateSpiral(dt:number,input:number):boolean{
  const p=this.ball.getPosition(),v=this.body.linearVelocity;
  const proj=this.current.project(p,this.spiralHint);
  this.spiralHint=proj.index;this.spiralProgress=proj.d;
  this.worldFrames[this.worldIndex]=(this.worldFrames[this.worldIndex]??0)+1;
  const picked=this.current.collect(p,this.runTime);
  if(picked){this.gems+=picked;this.ui.message.textContent='✦ +'+picked;this.ui.message.classList.add('show');}
  // Progress is nearest point along the course — NEVER "7 - ball.z".
  // A complete turn can travel toward +Z for half of its circumference.
  if(proj.d>=this.current.manifest.end-1.5&&Math.abs(proj.lateral)<2.6&&
   proj.surfaceGap>-1.0&&proj.surfaceGap<3.5){
   this.entries++;this.state='transit';this.inputLocked=true;this.body.type='kinematic';
   this.body.teleport(...this.transit!.path.position(0));
   this.history.push({event:'transit-enter',world:this.worldIndex,at:this.runTime});
   const t=this.transit!;
   this.journeys.push({seed:t.seed,fingerprint:t.fingerprint,kind:t.kind,
    fallback:t.fallback,inversions:t.validation.invertedSamples,validation:t.validation});
   this.preload();return true;
  }
  const t=proj.tangent,right=proj.right;
  const forward=v.x*t.x+v.y*t.y+v.z*t.z;
  // Speed assistance does not set a path-heading or centerline target.
  // In the absence of steering, the ball maintains its inertial heading;
  // the helix MUST be navigated with swipes (or collisions with real guards).
  const horizontal=Math.hypot(v.x,v.z),hx=horizontal>3?v.x/horizontal:t.x,
   hz=horizontal>3?v.z/horizontal:t.z;
  const drive=clamp((44-forward)*20,-85,240);
  const steering=clamp(input/3.3,-1,1);
  if(dt>0&&Math.abs(steering)>.08)this.spiralInputFrames++;
  const lateral=steering*230;
  this.body.applyForce(new Vec3(hx*drive+right.x*lateral,0,
   hz*drive+right.z*lateral));
  // Only the real deck area supplies adhesion. No invisible walls or
  // restoring force based on lateral position. Gravity still governs falls.
  const onDeck=Math.abs(proj.lateral)<proj.width/2+.65&&
   proj.surfaceGap>-.7&&proj.surfaceGap<4.5;
  if(onDeck){
   const th=Math.hypot(t.x,t.z)||1;
   const normal=new Vec3(-t.x*t.y/th,th,-t.z*t.y/th).normalize();
   const gap=proj.surfaceGap-.62;
   const speedAway=v.dot(normal);
   const adhesion=this.body.mass*(22*.9+
    clamp(Math.max(0,gap)*45+Math.max(0,speedAway)*25,0,140));
   this.body.applyForce(normal.mulScalar(-adhesion));
   this.gripFrames++;
  }
  this.generatedMinSpeed=Math.min(this.generatedMinSpeed,Math.max(0,forward));
  this.generatedMaxSpeed=Math.max(this.generatedMaxSpeed,Math.max(0,forward));
  // Falling is real: reset behind the last physical checkpoint, without
  // auto-advancing the player to the next section or steering for them.
  if(proj.distance>11||proj.surfaceGap< -9||p.y< -18){
   this.falls++;this.spiralFalls++;
   const safe=this.current.manifest.start+Math.max(4,
    Math.floor(Math.max(0,proj.d-this.current.manifest.start-22)/105)*105);
   const route=this.current.roadPoint(safe),direction=this.current.spiralTangent(safe);
   this.body.teleport(route.x,route.y+1.6,route.z);
   this.body.linearVelocity=new Vec3(direction.x,direction.y,direction.z).mulScalar(20);
   this.body.angularVelocity=new Vec3();
   this.spiralProgress=safe;this.spiralHint=Math.max(0,Math.floor(safe-this.current.road[0]!.d));
  }
  return true;
 }
 present(dt:number,running:boolean){
  const pos=this.ball.getPosition(),v=this.body.linearVelocity;
  let progress=this.spiralMode&&this.worldIndex>=3&&!this.constrained?
   this.spiralProgress:7-pos.z;
  if(this.constrained&&this.transit){
   const path=this.transit.path,f=path.at(this.distance);
   if(this.trackFirstMode&&this.fadeFrom&&this.fadeTo){
    const u=clamp((this.distance/path.length-.36)/.59,0,1);
    this.themeFade=u*u*(3-2*u);
    this.camera.camera!.clearColor.lerp(this.fadeFrom.sky,this.fadeTo.sky,this.themeFade);
    this.app.scene.fog.color.lerp(this.fadeFrom.fog,this.fadeTo.fog,this.themeFade);
    this.app.scene.ambientLight.lerp(this.fadeFrom.ambient,this.fadeTo.ambient,this.themeFade);
   }
   const radial=new Vec3(...f.normal).mulScalar(Math.cos(this.angle)).add(new Vec3(...f.binormal).mulScalar(Math.sin(this.angle)));
   const up=radial.clone().mulScalar(-1);
   this.camUp.lerp(this.camUp,up,1-Math.exp(-dt*7)).normalize();
   // Chase from the SAME exposed side as the ball. The opposite radial side
   // looks through the opaque pipe and can fill the screen during inversion.
   const behind=path.at(Math.max(0,this.distance-10));
   const chaseRadial=new Vec3(...behind.normal).mulScalar(Math.cos(this.angle)).add(new Vec3(...behind.binormal).mulScalar(Math.sin(this.angle)));
   const desired=new Vec3(...behind.center).add(chaseRadial.mulScalar(8)).add(new Vec3(...behind.binormal).mulScalar(3));
   if(this.distance<10)desired.add(new Vec3(...f.tangent).mulScalar(-(10-this.distance)));
   const now=this.camera.getPosition().clone().lerp(this.camera.getPosition(),desired,1-Math.exp(-dt*8));
   // Protect the camera's near plane while its smoothing cuts across bends.
   let closest=new Vec3(),nearest=Infinity;
   for(let i=1;i<path.frames.length;i++){
    const a=path.frames[i-1]!.center,b=path.frames[i]!.center;
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
    const t=clamp(((now.x-a[0])*dx+(now.y-a[1])*dy+(now.z-a[2])*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);
    const x=a[0]+dx*t,y=a[1]+dy*t,z=a[2]+dz*t,d=Math.hypot(now.x-x,now.y-y,now.z-z);
    if(d<nearest){nearest=d;closest.set(x,y,z);}
   }
   if(nearest<3){now.sub(closest).normalize().mulScalar(3).add(closest);nearest=3;}
   this.cameraMinClearance=Math.min(this.cameraMinClearance,nearest);
   this.camera.setPosition(now);
   const previousRotation=this.camera.getRotation().clone();
   this.camera.lookAt(new Vec3(pos.x+f.tangent[0]*4,pos.y+f.tangent[1]*4,pos.z+f.tangent[2]*4),this.camUp);
   const desiredRotation=this.camera.getRotation().clone();
   this.camera.setRotation(previousRotation.slerp(previousRotation,desiredRotation,1-Math.exp(-dt*7)));
   const rotation=this.camera.getRotation();
   this.cameraFinite&&=[rotation.x,rotation.y,rotation.z,rotation.w].every(Number.isFinite);
   if(this.wasConstrained){const q=this.lastCameraRotation,dot=Math.abs(q.x*rotation.x+q.y*rotation.y+q.z*rotation.z+q.w*rotation.w);this.maxCameraTurn=Math.max(this.maxCameraTurn,2*Math.acos(Math.min(1,dot)));}
   this.lastCameraRotation.copy(rotation);this.wasConstrained=true;
   this.camera.camera!.fov=72;
   progress=this.transit.entry.progress+(this.transit.exit.progress-this.transit.entry.progress)*this.distance/this.transit.path.length;
   this.ui.level.textContent=`MAGNETIC JOURNEY ${this.worldIndex+1} · ${this.transit.kind.toUpperCase()}`;
   this.ui.status.textContent=this.state==='holding'?(this.loadState==='failed'?'RECONNECTING · SAFE AT THE EXIT':'PREPARING YOUR NEXT WORLD…'):'SWIPE TO ORBIT · '+Math.round(this.distance/this.transit.path.length*100)+'%';
  }else{
   this.wasConstrained=false;this.camUp.set(0,1,0);const t=trilogyTangent(progress),height=Math.max(.62,pos.y);
   if(this.spiralMode&&this.worldIndex>=3){
    const t3=this.current.spiralTangent(progress),look=this.current.roadPoint(progress+24);
    const desired=new Vec3(pos.x-t3.x*19,pos.y+10,pos.z-t3.z*19);
    this.camera.setPosition(this.camera.getPosition().clone().lerp(
     this.camera.getPosition(),desired,1-Math.exp(-dt*5)));
    this.camera.lookAt(look.x,look.y+2.5,look.z);
   }else if(this.trackFirstMode&&this.worldIndex>=3){
    const look=clamp(progress+22,this.current.manifest.start,this.current.manifest.end);
    this.camera.setPosition(pos.x-t.x*11,height+8.6,pos.z-t.z*16);
    this.camera.lookAt(trilogyCenter(look),this.current.roadHeight(look)+2.2,7-look);
   }else{
    this.camera.setPosition(pos.x-t.x*11,height+7.4,pos.z-t.z*16);
    this.camera.lookAt(pos.x+t.x*17,height*.5,pos.z+t.z*24);
   }
   this.camera.camera!.fov=window.innerWidth/window.innerHeight<.78?62:55;
   this.ui.status.textContent=this.spiralMode&&this.current.spiral?'STEER TO STAY ON THE SPIRAL · NO AUTOPILOT':this.state==='complete'?'TRILOGY COMPLETE':running?`${Math.round(Math.hypot(v.x,v.z)*3.6)} km/h · SWIPE TO STEER`:this.endless?'ENDLESS WORLDS · MAGNETIC JOURNEYS':'THREE WORLDS · TWO MAGNETIC JOURNEYS';
  }
  if(this.lastWorld!==this.worldIndex){document.getElementById('world-flash')?.remove();const e=document.createElement('div');e.id='world-flash';e.textContent=this.current.manifest.title;document.getElementById('game')!.append(e);this.lastWorld=this.worldIndex;}
  const flash=document.getElementById('world-flash');if(flash)flash.classList.toggle('visible',running&&this.runTime<this.introUntil);
  this.ui.coins.textContent=String(this.gems);
  const activeProgress=this.endless?clamp((progress-this.current.manifest.start)/(this.current.manifest.end-this.current.manifest.start),0,1):clamp(progress/1160,0,1);
  this.ui.progress.style.width=(activeProgress*100).toFixed(1)+'%';
  const moving=running&&(this.constrained||Math.hypot(v.x,v.z)>22);
  document.getElementById('game')!.classList.toggle('at-speed',moving);
  for(const [i,e] of this.sparkPool.entries()){
   e.enabled=moving;
   if(moving){const t=trilogyTangent(progress),age=((this.runTime*5+i/18)%1);
    e.setPosition(pos.x-t.x*age*5+Math.sin(i*17)*.7,pos.y+.05+Math.sin(i*8)*.3,pos.z-t.z*age*5);
    e.setLocalScale(.045*(1-age),.045*(1-age),.6*(1-age));}
  }
 }
 snapshot(){return {seed:this.runSeed,state:this.state,worldIndex:this.worldIndex+1,
  richMode:this.richMode,extremeCoasters:this.extremeCoasters,
  trackFirstMode:this.trackFirstMode,themeFade:this.themeFade,
  chaosMode:this.chaosMode,gripFrames:this.gripFrames,
  spiralMode:this.spiralMode,spiralProgress:this.spiralProgress,
  spiralInputFrames:this.spiralInputFrames,spiralFalls:this.spiralFalls,
  spiralMetric:this.spiralMetric,
  edgeBounces:this.edgeBounces,maxSurfaceGap:this.maxSurfaceGap,maxCurve:this.maxCurve,
  guardBoostFrames:this.guardBoostFrames,grindBoostFrames:this.grindBoostFrames,
  guardReleases:this.guardReleases,
  generatedMinSpeed:Number.isFinite(this.generatedMinSpeed)?this.generatedMinSpeed:null,
  generatedMaxSpeed:this.generatedMaxSpeed,loadState:this.loadState,loadError:this.loadError,loadMs:this.loadMs,
  cameraFinite:this.cameraFinite,maxCameraTurn:this.maxCameraTurn,cameraMinClearance:this.cameraMinClearance,
  entries:this.entries,exits:this.exits,gems:this.gems,falls:this.falls,holdSeconds:this.holdSeconds,angle:this.angle,maxRadiusError:this.maxRadiusError,invertedFrames:this.invertedFrames,
  worldFrames:this.worldFrames,worldContacts:this.worldContacts,active:this.current.snapshot(),staged:this.next?.snapshot()??null,
  retired:this.retired,history:this.history,journeys:this.journeys,privateMeshes:this.privateCount,runTime:this.runTime,
  endless:this.endless,biome:this.current.manifest.biome??this.current.manifest.id,
  activeWorldRoots:this.app.root.children.filter(e=>e.name.startsWith('world-')&&e.enabled).length};}
}
