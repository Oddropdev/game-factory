import { applyMassOperation, type MassRunnerLevelSpec } from './MassRunnerLevels';
import type { MassRunnerSnapshot } from './MassRunnerModel';

type V = [number, number, number];
type Mesh = { buffer: WebGLBuffer; count: number };
const vertex = `#version 300 es
precision highp float;
in vec3 p; in vec3 n;
uniform vec3 pos, size, tint;
uniform float aspect, roll;
out vec3 lightColor;
void main() {
  vec3 q=p*size; float c=cos(roll),s=sin(roll);
  q=vec3(q.x*c-q.y*s,q.x*s+q.y*c,q.z)+pos;
  vec3 normal=vec3(n.x*c-n.y*s,n.x*s+n.y*c,n.z);
  lightColor=tint*(0.48+0.52*max(dot(normalize(normal),normalize(vec3(-0.4,0.85,0.5))),0.0));
  float dy=q.y-5.0, dz=q.z-12.0;
  // World-to-camera pitch: point the camera DOWN at the track, not up.
  // The previous +dz/-dy signs pushed the entire course below the viewport.
  float ey=dy*0.958-dz*0.287, ez=dy*0.287+dz*0.958;
  // Let the GPU clip geometry behind the camera instead of clamping it into view.
  float w=-ez;
  gl_Position=vec4(q.x*1.4/max(0.4,aspect),ey*1.4,w*0.996-0.16,w);
}`;
const fragment = `#version 300 es
precision mediump float;
in vec3 lightColor;
out vec4 outColor;
void main(){outColor=vec4(lightColor,1.0);}
`;
function cube(): number[] {
  const out: number[]=[];
  const faces: Array<[V,V,V,V,V]>=[
    [[0,0,1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
    [[0,0,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
    [[1,0,0],[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
    [[-1,0,0],[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],
    [[0,1,0],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],
    [[0,-1,0],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]
  ];
  for(const [n,a,b,c,d] of faces) for(const v of [a,b,c,a,c,d])
    out.push(v[0]*0.5,v[1]*0.5,v[2]*0.5,...n);
  return out;
}
function gem(): number[] {
  const out: number[]=[];
  const top:V=[0,1,0],bottom:V=[0,-1,0];
  const ring:V[]=[[1,0,0],[0,0,1],[-1,0,0],[0,0,-1]];
  for(let i=0;i<4;i++) for(const tri of [[top,ring[i],ring[(i+1)%4]], [bottom,ring[(i+1)%4],ring[i]]]) {
    const a=tri[0]!,b=tri[1]!,c=tri[2]!;
    const u:V=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
    const v:V=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const n:V=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    for(const p of tri) out.push(...p,...n);
  }
  return out;
}
function shader(gl:WebGL2RenderingContext,type:number,source:string):WebGLShader {
  const s=gl.createShader(type);
  if(!s) throw new Error('WebGL allocation failed');
  gl.shaderSource(s,source); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)??'WebGL shader failed');
  return s;
}

// Strictly game-local, real WebGL2: depth buffer, lighted 3D meshes and perspective.
// The accepted LittleJS canvas still owns all touch gestures underneath the overlay.
export class MassRunner3DRenderer {
  readonly supported:boolean;
  private readonly canvas=document.createElement('canvas');
  private readonly hud=document.createElement('canvas');
  private readonly gl:WebGL2RenderingContext|null;
  private readonly ctx:CanvasRenderingContext2D|null;
  private program:WebGLProgram|null=null;
  private box:Mesh|null=null;
  private jewel:Mesh|null=null;
  private frame=0;
  constructor(){
    this.canvas.dataset.massRunner3d='true';
    this.hud.dataset.massRunner3dHud='true';
    for(const [i,el] of [this.canvas,this.hud].entries()){
      Object.assign(el.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:String(11+i)});
    }
    this.gl=this.canvas.getContext('webgl2',{alpha:false,depth:true,antialias:true,powerPreference:'low-power'});
    this.ctx=this.hud.getContext('2d');
    const gl=this.gl;
    if(!gl||!this.ctx){this.supported=false;return;}
    try {
      const program=gl.createProgram();
      if(!program) throw new Error('WebGL program unavailable');
      const v=shader(gl,gl.VERTEX_SHADER,vertex),f=shader(gl,gl.FRAGMENT_SHADER,fragment);
      gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
      gl.deleteShader(v);gl.deleteShader(f);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('WebGL link failed');
      this.program=program;this.box=this.makeMesh(cube());this.jewel=this.makeMesh(gem());
      gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
      document.body.append(this.canvas,this.hud);
      this.supported=true;
    }catch{this.supported=false;this.canvas.remove();this.hud.remove();}
  }
  private makeMesh(data:number[]):Mesh{
    const gl=this.gl!;
    const buffer=gl.createBuffer();
    if(!buffer) throw new Error('WebGL buffer allocation failed');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
    return {buffer,count:data.length/6};
  }
  private draw(mesh:Mesh|null,position:V,size:V,color:V,roll=0):void {
    const gl=this.gl,p=this.program;if(!mesh||!gl||!p)return;
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
    for(const [name,offset] of [['p',0],['n',12]] as const){
      const a=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,offset);
    }
    gl.uniform3fv(gl.getUniformLocation(p,'pos'),position);
    gl.uniform3fv(gl.getUniformLocation(p,'size'),size);
    gl.uniform3fv(gl.getUniformLocation(p,'tint'),color);
    gl.uniform1f(gl.getUniformLocation(p,'roll'),roll);
    gl.drawArrays(gl.TRIANGLES,0,mesh.count);
  }
  render(state:MassRunnerSnapshot,level:MassRunnerLevelSpec):void{
    const gl=this.gl,p=this.program;
    if(!this.supported||!gl||!p)return;
    const dpr=Math.min(1.5,window.devicePixelRatio||1);
    const w=Math.max(1,Math.floor(window.innerWidth*dpr)),h=Math.max(1,Math.floor(window.innerHeight*dpr));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    this.frame++;
    gl.viewport(0,0,w,h);gl.clearColor(0.06,0.09,0.2,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(p);gl.uniform1f(gl.getUniformLocation(p,'aspect'),w/h);
    this.draw(this.box,[0,-0.4,-38],[72,0.2,84],[0.1,0.17,0.29]);
    this.draw(this.box,[0,-0.2,-38],[8.4,0.13,84],[0.24,0.26,0.4]);
    this.draw(this.box,[-4.2,0.07,-38],[0.15,0.5,84],[0.1,0.9,0.92]);
    this.draw(this.box,[4.2,0.07,-38],[0.15,0.5,84],[0.9,0.32,0.93]);
    for(let i=0;i<22;i++){
      const z=3-((i*3.6+state.distance*0.7)%76);
      for(const x of [-1.4,1.4])this.draw(this.box,[x,-0.11,z],[0.05,0.04,1.2],[0.57,0.69,0.82]);
      if(i%4===0)for(const x of [-7.5,7.5]){
        this.draw(this.box,[x,0.5,z],[0.7,1.0,0.7],[0.3,0.45,0.62]);
        this.draw(this.box,[x,1.07,z],[0.85,0.16,0.8],[0.72,0.82,1.0]);
      }
    }
    if(state.phase!=='ready')for(const event of level.events){
      const remaining=event.distance-state.distance;
      if(remaining < -3 || remaining > 95)continue;
      const z=-0.5-remaining*0.72;
      if(event.kind==='orb'){
        this.draw(this.jewel,[(event.x-0.5)*8,0.95,z],[0.54,0.66,0.54],[1,0.76,0.1],this.frame*0.015);
      }else if(event.kind==='hazard'){
        this.draw(this.box,[(event.x-0.5)*8,0.6,z],[event.width*8,1.2,0.9],[1,0.13,0.27]);
      }else{
        const leftBetter=applyMassOperation(state.mass,event.left)>=applyMassOperation(state.mass,event.right);
        for(const [x,good] of [[-2,leftBetter],[2,!leftBetter]] as Array<[number,boolean]>){
          const color:V=good?[0.13,0.96,0.5]:[1,0.18,0.38];
          this.draw(this.box,[x,2.1,z],[3.8,0.35,0.32],color);
          this.draw(this.box,[x-1.75,0.98,z],[0.17,2.15,0.3],color);
          this.draw(this.box,[x+1.75,0.98,z],[0.17,2.15,0.3],color);
        }
      }
    }
    const finish=level.finishDistance-state.distance;
    if(finish>=-3&&finish<95)this.draw(this.box,[0,0,-0.5-finish*0.72],[8,0.1,0.45],[1,0.9,0.35]);
    const x=(state.playerNormX-0.5)*8,scale=Math.min(1.5,0.53+state.mass*0.022);
    const moving=state.phase==='running'?1:0;
    this.draw(this.jewel,[x,0.01,0],[scale*1.2,0.05,scale],[0.05,0.07,0.13]);
    this.draw(this.jewel,[x,scale*0.88+Math.sin(this.frame*0.14)*0.07*moving,0],
      [scale,scale*(1-0.04*moving),scale],
      state.mass>=state.targetMass?[0.19,1,0.6]:[0.17,0.64,1],
      Math.sin(this.frame*0.08)*0.04*moving);
  }
  renderHud(state:MassRunnerSnapshot,level:MassRunnerLevelSpec):void{
    const ctx=this.ctx;if(!this.supported||!ctx)return;
    const dpr=Math.min(1.5,window.devicePixelRatio||1);
    const w=window.innerWidth,h=window.innerHeight;
    if(this.hud.width!==Math.floor(w*dpr)||this.hud.height!==Math.floor(h*dpr)){
      this.hud.width=Math.floor(w*dpr);this.hud.height=Math.floor(h*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const print=(s:string,x:number,y:number,size:number,color:string,align:CanvasTextAlign='left')=>{
      ctx.font=`800 ${size}px system-ui`;ctx.textAlign=align;ctx.fillStyle=color;
      ctx.shadowColor='#081222';ctx.shadowBlur=7;ctx.fillText(s,x,y);ctx.shadowBlur=0;
    };
    print('MASS RUNNER · 3D SPIKE',16,31,15,'#d4fbff');
    print(`LEVEL ${state.levelNumber}/${state.totalLevels} · ${level.name}`,16,54,12,'#a9ecf8');
    print(`${state.mass} / ${state.targetMass} MASS`,16,86,22,'#acffc4');
    print(`${Math.round(state.progress*100)}%`,w-17,31,16,'#b9efff','right');
    if(state.phase==='ready'){
      print('TAP TO RUN',w/2,h*0.37,30,'#ffe082','center');
      print('STEER · GROW · CHOOSE',w/2,h*0.37+29,13,'#ecf4ff','center');
    }else if(state.phase!=='running'){
      print(state.phase==='level-clear'?'LEVEL CLEAR':state.phase==='level-fail'?'TRY AGAIN':'MASSIVE!',
        w/2,h*0.36,31,'#a9ffaf','center');
      print(state.phase==='level-clear'?'TAP FOR NEXT':state.phase==='level-fail'?'TAP TO RETRY':'TAP TO RUN AGAIN',
        w/2,h*0.36+31,17,'#f7f9ff','center');
    }else{
      const next=level.events.find(e=>e.kind==='gate'&&e.distance>state.distance);
      if(next&&next.kind==='gate'){
        const label=(op:typeof next.left)=>op.op==='multiply'?'×'+op.value:
          String((applyMassOperation(state.mass,op)-state.mass)>=0?'+':'')+
          String(applyMassOperation(state.mass,op)-state.mass);
        print(`NEXT    ${label(next.left)}  |  ${label(next.right)}`,w/2,125,19,'#fff6dc','center');
      }
    }
  }
}
