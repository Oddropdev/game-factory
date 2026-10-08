// W9.4-6.2 — one continuous render mesh for the rising secret monorail.
// Physics remains in separately named static Bullet TOP and SIDE colliders.
import {Entity,Mesh,MeshInstance,type GraphicsDevice,type StandardMaterial} from 'playcanvas';
import {longCenter,longTangent} from './LongJumpCourse';
import {SPEED_START_Z} from './SpeedCourse';
import {GRIND_HALF_WIDTH,GRIND_TOP_Y,SECRET_START,SECRET_END,grindPath} from './RailModes';

type Surface='top'|'side';
const RAMP_START=SECRET_START-31;
const SAMPLE_STEP=.5;

// Exact same route math as the authoritative physics path, without box-panel
// approximations in the visible surface. Ramp stays straight to match Bullet.
function point(progress:number){
  if(progress<SECRET_START){
    const end=grindPath(SECRET_START,longCenter(SECRET_START),'secret');
    const t=(progress-RAMP_START)/(SECRET_START-RAMP_START);
    return {x:end.x,y:.13+(GRIND_TOP_Y-.13)*t};
  }
  return grindPath(progress,longCenter(progress),'secret');
}

export function buildSmoothSecretGrind(
  device:GraphicsDevice,root:Entity,
  steel:StandardMaterial,stripe:StandardMaterial,sideMaterial:StandardMaterial
){
  const makeSurface=(name:string,material:StandardMaterial,
    halfWidth:number,heightOffset:number,kind:Surface,sign=1)=>{
    const positions:number[]=[],normals:number[]=[],indices:number[]=[];
    let count=0;
    for(let d=RAMP_START;d<=SECRET_END+.0001;
      d=Math.min(d+SAMPLE_STEP,SECRET_END)){
      const p=point(d),t=longTangent(d);
      const acrossX=-t.z,acrossZ=t.x;
      const offsets=kind==='top'?[-halfWidth,halfWidth]:
        [sign*(GRIND_HALF_WIDTH+.09),sign*(GRIND_HALF_WIDTH+.09)];
      for(let side=0;side<2;side++){
        const x=p.x+acrossX*offsets[side]!;
        const z=SPEED_START_Z-d+acrossZ*offsets[side]!;
        const y=kind==='top'?p.y+heightOffset:
          p.y+(side===0?-.035:-.80);
        positions.push(x,y,z);
        normals.push(kind==='top'?0:sign,kind==='top'?1:0,0);
      }
      if(count>0){
        const a=(count-1)*2,b=a+1,c=count*2,e=c+1;
        indices.push(a,b,c,b,e,c);
        if(kind==='side')indices.push(c,b,a,c,e,b);
      }
      count++;
      if(d>=SECRET_END)break;
    }
    const mesh=new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setIndices(indices);
    mesh.update();
    const entity=new Entity(name);
    entity.addComponent('render',{meshInstances:[new MeshInstance(mesh,material)],
      castShadows:false});
    root.addChild(entity);
    return count-1;
  };
  const segments=makeSurface('secret-smooth-continuous-top',steel,
    GRIND_HALF_WIDTH,0,'top');
  makeSurface('secret-smooth-continuous-spine',stripe,.105,.032,'top');
  makeSurface('secret-smooth-continuous-left',sideMaterial,0,0,'side',-1);
  makeSurface('secret-smooth-continuous-right',sideMaterial,0,0,'side',1);
  return {meshCount:4,visualSegments:segments};
}
