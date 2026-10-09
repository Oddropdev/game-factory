import {describe,it,expect} from 'vitest';
import {trackFrame,guardDownforce,surfaceContact,dot,unit,magnitude} from
 '../../spikes/w9-ball/src/TrackSurfaceFrame';
import {spiralSpec,generateSpiralRoad} from '../../spikes/w9-ball/src/SpiralCourse';
const near=(a:number,b:number,eps=.000001)=>expect(Math.abs(a-b)).toBeLessThan(eps);
describe('W10.3 visible, Bullet and downforce share exact banked frame',()=>{
 it('1000 diverse coils preserve a valid right-handed orthonormal 3D deck',()=>{
  for(let index=3;index<1003;index++){
   const start=1340+(index-3)*700,s=spiralSpec(index,17,start,start+520,12);
   const road=generateSpiralRoad(s);
   for(let k=12;k<road.length-3;k+=11){
    const p=road[k]!,a=road[k-1]!,b=road[k+1]!;
    const f=trackFrame({x:b.x-a.x,y:b.y-a.y,z:b.z!-a.z!},p.bank);
    near(dot(f.up,f.forward),0);near(dot(f.right,f.forward),0);
    near(dot(f.right,f.up),0);
    near(magnitude(f.up),1);near(magnitude(f.right),1);
    const ctr={x:p.x,y:p.y,z:p.z!};
    const point=f.position(ctr,p.width*.42,.67);
    const contact=surfaceContact(f,ctr,point,p.width);
    near(contact.clearance,.67);near(contact.lateral,p.width*.42);
    expect(contact.inside).toBe(true);
   }
  }
 },30000);
 it('strong rail hold pushes into the real tilted surface, not global center',()=>{
  const f=trackFrame({x:.5,y:.5,z:-.707},27);
  const down=guardDownforce({frame:f,mass:1.4,verticalFromDeck:1.8,
   normalVelocity:15,nearGuard:true,magnetActive:true});
  expect(dot(down,f.up)).toBeLessThan(-90);
  expect(down.y).toBeLessThan(-40);
  const blocked=guardDownforce({frame:f,mass:1.4,verticalFromDeck:2,
   normalVelocity:15,nearGuard:false,magnetActive:true});
  expect(magnitude(blocked)).toBe(0);
  expect(magnitude(guardDownforce({frame:f,mass:1.4,verticalFromDeck:2,
   normalVelocity:15,nearGuard:true,magnetActive:false}))).toBe(0);
 });
 it('banked surface has positive normal clearance even where world-Y is lower',()=>{
  const f=trackFrame({x:0,y:.3,z:-.953},30),center={x:0,y:15,z:-300};
  const left=f.position(center,-4,.67);
  near(f.clearance(center,left),.67);
  near(f.lateral(center,left),-4);
  expect(left.y).toBeLessThan(center.y);
 });
});
