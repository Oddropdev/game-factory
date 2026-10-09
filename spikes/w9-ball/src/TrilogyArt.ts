import {Color,Entity,Mesh,MeshInstance,StandardMaterial,Vec3,Quat,
 type GraphicsDevice} from 'playcanvas';
import {seededRandom} from './SeededTransit';
import {trilogyTangent,type WorldManifest,type RoadSample} from './TrilogyManifest';
type V=[number,number,number];
export function tint(hex:string){return new Color(...[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as V);}
export function polished(hex:string,glow=0){
 const m=new StandardMaterial();m.diffuse=tint(hex);m.gloss=.68;m.useMetalness=true;m.metalness=.14;
 m.emissive=tint(hex);m.emissiveIntensity=glow;m.update();return m;
}
// Bake repeated scenery into per-material meshes: rounded forms without hundreds of draw calls.
class Batch{
 buckets=new Map<StandardMaterial,{p:number[];n:number[];i:number[]}>();
 add(mat:StandardMaterial,p:number[],n:number[],indices:number[],at:V=[0,0,0],scale:V=[1,1,1],rot:V=[0,0,0]){
  let b=this.buckets.get(mat);if(!b){b={p:[],n:[],i:[]};this.buckets.set(mat,b);}
  const base=b.p.length/3,q=new Quat().setFromEulerAngles(...rot),v=new Vec3(),nv=new Vec3();
  for(let j=0;j<p.length;j+=3){q.transformVector(v.set(p[j]!*scale[0],p[j+1]!*scale[1],p[j+2]!*scale[2]),v);
   b.p.push(v.x+at[0],v.y+at[1],v.z+at[2]);
   q.transformVector(nv.set(n[j]!/scale[0],n[j+1]!/scale[1],n[j+2]!/scale[2]),nv);nv.normalize();b.n.push(nv.x,nv.y,nv.z);}
  b.i.push(...indices.map(i=>i+base));
 }
 sphere(m:StandardMaterial,at:V,scale:V){this.add(m,sphere.p,sphere.n,sphere.i,at,scale);}
 ring(m:StandardMaterial,at:V,radius:number,tube:number,rot:V=[0,0,0]){
  const p:number[]=[],n:number[]=[],indices:number[]=[];
  for(let a=0;a<=48;a++)for(let b=0;b<=8;b++){
   const u=a/48*Math.PI*2,v=b/8*Math.PI*2;
   const nx=Math.cos(u)*Math.cos(v),ny=Math.sin(u)*Math.cos(v),nz=Math.sin(v);
   p.push(Math.cos(u)*(radius+tube*Math.cos(v)),Math.sin(u)*(radius+tube*Math.cos(v)),tube*nz);
   n.push(nx,ny,nz);if(a<48&&b<8){const i=a*9+b;indices.push(i,i+9,i+1,i+1,i+9,i+10);}
  }
  this.add(m,p,n,indices,at,[1,1,1],rot);
 }
 crystal(m:StandardMaterial,at:V,scale:V,rot:V){
  const p:number[]=[],n:number[]=[],ix:number[]=[];
  const push=(a:V,b:V,c:V)=>{
   const ab=new Vec3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),ac=new Vec3(c[0]-a[0],c[1]-a[1],c[2]-a[2]);
   const normal=new Vec3().cross(ab,ac).normalize(),base=p.length/3;
   p.push(...a,...b,...c);for(let i=0;i<3;i++)n.push(normal.x,normal.y,normal.z);ix.push(base,base+1,base+2);
  };
  for(let j=0;j<6;j++){
   const a=j/6*Math.PI*2,b=(j+1)/6*Math.PI*2;
   const x:V=[Math.cos(a)*.5,0,Math.sin(a)*.5],y:V=[Math.cos(b)*.5,0,Math.sin(b)*.5];
   const xx:V=[x[0],.72,x[2]],yy:V=[y[0],.72,y[2]];
   push(x,xx,y);push(y,xx,yy);push(xx,[0,1,0],yy);
  }
  this.add(m,p,n,ix,at,scale,rot);
 }
 flush(device:GraphicsDevice,root:Entity){
  let count=0;for(const [mat,b] of this.buckets){
   const mesh=new Mesh(device);mesh.setPositions(b.p);mesh.setNormals(b.n);mesh.setIndices(b.i);mesh.update();
   const node=new Entity('world-baked-scenery-'+count++);
   node.addComponent('render',{meshInstances:[new MeshInstance(mesh,mat)],castShadows:true,receiveShadows:true});root.addChild(node);
  }return count;
 }
}
const sphere=(()=>{
 const p:number[]=[],n:number[]=[],i:number[]=[];
 for(let y=0;y<=12;y++)for(let x=0;x<=20;x++){
  const a=y/12*Math.PI,b=x/20*Math.PI*2,xx=Math.sin(a)*Math.cos(b),yy=Math.cos(a),zz=Math.sin(a)*Math.sin(b);
  p.push(xx*.5,yy*.5,zz*.5);n.push(xx,yy,zz);
  if(y<12&&x<20){const a=y*21+x;i.push(a,a+1,a+21,a+1,a+22,a+21);}
 }return {p,n,i};
})();
export function buildWorldArt(device:GraphicsDevice,root:Entity,m:WorldManifest,road:RoadSample[],minimalist=false){
 const biome=m.biome??m.id;
 const crystalStyle=biome==='crystal'||/Aurora|Frost|Storm/.test(biome);
 const candyStyle=biome==='candy'||/Coral|Neon|Solar/.test(biome);
 const mats={road:m.colors.map(c=>polished(c)),trim:polished(m.trim,.22),white:polished('#fff8f0'),
  island:polished(m.island),water:polished(m.water,.03),leaf:polished(crystalStyle?'#54dcd8':m.island),
  gold:polished('#ffe180',.3),dark:polished(m.id==='rainbow'?'#66479d':'#897ac6')};
 const all=[...mats.road,mats.trim,mats.white,mats.island,mats.water,mats.leaf,mats.gold,mats.dark];
 const batch=new Batch(),rand=seededRandom(m.scenerySeed);
 const pose=(p:RoadSample,offset:number,y:number):V=>{
  const t=trilogyTangent(p.d),b=p.bank*Math.PI/180;
  return [p.x+(-t.z)*offset*Math.cos(b),p.y+y+offset*Math.sin(b),7-p.d+t.x*offset*Math.cos(b)];
 };
 let trackQuads=0;
 for(let i=0;i<road.length-1;i++){
  const a=road[i]!,b=road[i+1]!;
  if(m.id==='crystal'&&((a.d>=231&&a.d<330)||(a.d>=196&&a.d<219)))continue;
  const band=Math.floor((a.d-m.start)/(m.id==='rainbow'?5:m.id==='crystal'?9:22));
  const roadMat=mats.road[((band%mats.road.length)+mats.road.length)%mats.road.length]!;
  const quad=(left:number,right:number,height:number,mat:StandardMaterial)=>{
   const p=[...pose(a,left,height),...pose(a,right,height),...pose(b,left,height),...pose(b,right,height)];
   const ba=a.bank*Math.PI/180,bb=b.bank*Math.PI/180;
   const n=[-Math.sin(ba),Math.cos(ba),0,-Math.sin(ba),Math.cos(ba),0,-Math.sin(bb),Math.cos(bb),0,-Math.sin(bb),Math.cos(bb),0];
   batch.add(mat,p,n,[0,1,2,1,3,2]);trackQuads++;
  };
  const w=a.width/2;quad(-w,w,.02,roadMat);quad(-w,-w+.22,.055,mats.trim);quad(w-.22,w,.055,mats.trim);
  // Track-first production profile draws only the road and two fine
  // edge strips; suppress costly rounded undersides and silhouettes.
  if(minimalist)continue;
  // Rounded outer lips and substantial visible undersides along the exact curve.
  for(const side of [-1,1]){
   for(let j=0;j<4;j++){
    const u=j/4*Math.PI/2,v=(j+1)/4*Math.PI/2;
    const off=(t:number)=>side*(w-.22+.22*Math.cos(t)),y=(t:number)=>-.22+.22*Math.sin(t);
    batch.add(mats.trim,[...pose(a,off(u),y(u)),...pose(a,off(v),y(v)),...pose(b,off(u),y(u)),...pose(b,off(v),y(v))],
     [side,0,0,side,0,0,side,0,0,side,0,0],side<0?[0,2,1,1,2,3]:[0,1,2,1,3,2]);
   }
   batch.add(mats.dark,[...pose(a,side*w,-.22),...pose(a,side*w,-.65),...pose(b,side*w,-.22),...pose(b,side*w,-.65)],
    [side,0,0,side,0,0,side,0,0,side,0,0],side<0?[0,1,2,1,3,2]:[0,2,1,1,2,3]);
  }
 }
 // W9.8: zero islands, zero clouds, zero environment rings, zero water
 // meshes. Only physically relevant course geometry survives this branch.
 const middle=(m.start+m.end)/2;
 if(minimalist){
  const meshes=batch.flush(device,root);
  return {materials:all,mats,meshCount:meshes,trackQuads,islandCount:0,middle};
 }
 // A water plane, island reflections and layered islands make depth readable from the chase camera.
 batch.add(mats.water,[-240,-12,70-m.start,240,-12,70-m.start,-240,-12,-m.end-190,240,-12,-m.end-190],
  [0,1,0,0,1,0,0,1,0,0,1,0],[0,1,2,1,3,2]);
 let islandCount=0;
 for(let d=m.start-15;d<m.end+70;d+=22){
  const row=road[Math.max(0,Math.min(road.length-1,Math.round(d-m.start+2)))]!;
  for(const side of [-1,1]){
   const x=row.x+side*(16+rand()*22),z=7-d+(rand()-.5)*10,y=-4-rand()*2,w=6+rand()*6;
   batch.sphere(mats.island,[x,y-1.9,z],[w,5,w*.86]);
   batch.sphere(mats.trim,[x,y,z],[w*.98,1.3,w*.87]);
   if(crystalStyle){
    for(let j=0;j<5;j++)batch.crystal(mats.road[j%4]!,[x+(rand()-.5)*w*.55,y+.45,z+(rand()-.5)*w*.5],
     [1.2+rand()*1.6,3+rand()*7,1.2+rand()],[(rand()-.5)*22,rand()*180,(rand()-.5)*25]);
    batch.ring(mats.leaf,[x,-11.85,z],w*.72,.06,[90,0,0]);
   }else if(candyStyle){
    for(let j=0;j<4;j++){
     const xx=x+(rand()-.5)*w*.7,zz=z+(rand()-.5)*w*.6;
     batch.sphere(mats.white,[xx,y+1.3,zz],[1,4,1]);
     batch.sphere(mats.road[j%4]!,[xx,y+3.3,zz],[3,3.4,3]);
    }
    batch.ring(mats.road[0]!,[x,y+6,z],2.2,.65,[18,25,0]);
   }else{
    for(let j=0;j<3;j++){
     const xx=x+(j-1)*2.5;
     batch.sphere(mats.gold,[xx,y+1.6,z],[.6,3,.6]);
     batch.sphere(mats.leaf,[xx,y+3,z],[3.7,2,2.8]);
    }
    batch.ring(mats.road[bandIndex(islandCount,mats.road.length)]!,[x,y+6,z],3,.3,[0,15,0]);
   }
   // Extra biome-specific silhouettes make generated worlds materially
   // different in topology, not merely a recolored replay of Rainbow.
   if(m.biome&&/Volcanic|Golden|Mosslight|Moonlight/.test(m.biome)){
    const size=/Volcanic/.test(m.biome)?8:/Mosslight/.test(m.biome)?5:3.5;
    for(let j=0;j<3;j++){
     const h=size*(.6+j*.22);
     batch.crystal(mats.road[(j+islandCount)%mats.road.length]!,
      [x+(j-1)*w*.36,y+1.4,z+(j-1)*1.5],[2.1,h,2.1],[12+j*17,j*29,0]);
    }
    if(/Moonlight|Golden/.test(m.biome))batch.ring(mats.trim,[x,y+7,z],w*.65,.18,[66,23,12]);
   }
   // Cloud silhouettes at several depths, never a wall behind the course.
   if(islandCount%2===0){
    for(let j=0;j<4;j++)batch.sphere(mats.white,[x+side*12+j*2.1,7+rand()*9, z-12], [7,2.6+(j%2)*2,5]);
   }
   islandCount++;
  }
 }
 for(const [i,d] of m.arches.entries()){
  const a=road[Math.round(d-m.start+2)]!,t=trilogyTangent(d);
  batch.ring(mats.road[(i+1)%mats.road.length]!,[a.x,4.6,7-d],5.9,.29,[0,t.yaw,0]);
  batch.ring(mats.trim,[a.x,4.6,6.55-d],6.3,.075,[0,t.yaw,0]);
 }
 // Distant luminous constellation rings form the themed skyline.
 for(let i=0;i<3;i++){
  const d=m.start+(m.end-m.start)*(.22+i*.3);
  batch.ring(mats.trim,[i%2?30:-32,23+i*4,7-d],12+i*2,.12,[0,12,0]);
 }
 if(m.id==='rainbow'){
  const end=road.find(p=>p.d===m.end)!;
  for(let z=0;z<3;z++)for(let x=0;x<10;x++){
   const a={...end,d:end.d+z*.8},b={...end,d:end.d+(z+1)*.8};
   batch.add((x+z)%2?mats.dark:mats.white,[...pose(a,x-5,.045),...pose(a,x-4,.045),...pose(b,x-5,.045),...pose(b,x-4,.045)],
    [0,1,0,0,1,0,0,1,0,0,1,0],[0,1,2,1,3,2]);
  }
  batch.ring(mats.gold,[end.x,4.9,7-end.d],6.1,.42);
 }
 const meshes=batch.flush(device,root);
 return {materials:all,mats,meshCount:meshes,trackQuads,islandCount,middle};
}
function bandIndex(i:number,n:number){return i%n;}
export function coinMesh(device:GraphicsDevice,material:StandardMaterial):MeshInstance{
 const p:number[]=[],n:number[]=[],indices:number[]=[];
 for(const sign of [-1,1]){
  const base=p.length/3;p.push(0,0,sign*.14);n.push(0,0,sign);
  for(let j=0;j<10;j++){
   const a=j/10*Math.PI*2+Math.PI/2,r=j%2?.31:.68;p.push(Math.cos(a)*r,Math.sin(a)*r,sign*.14);n.push(0,0,sign);
  }
  for(let j=0;j<10;j++){const a=base+1+j,b=base+1+(j+1)%10;indices.push(...(sign>0?[base,a,b]:[base,b,a]));}
 }
 for(let j=0;j<10;j++){const a=1+j,b=1+(j+1)%10;indices.push(a,b,a+11,b,b+11,a+11);}
 const mesh=new Mesh(device);mesh.setPositions(p);mesh.setNormals(n);mesh.setIndices(indices);mesh.update();return new MeshInstance(mesh,material);
}
