import {describe,it,expect} from 'vitest';
import {adaptiveCamera,turnIntensity} from '../../spikes/w9-ball/src/AdaptiveCourseCamera';
import {buildMacroCourse,validateMacroCourse} from '../../spikes/w9-ball/src/MacroCourse';
import {choiceWall,choiceLaneWidth,hasPhysicalEscape,sideDecision}
 from '../../spikes/w9-ball/src/ChoiceWall';
describe('W10.6 camera mastering',()=>{
 it('portrait FOV and stand-off enlarge in steep climbs, descents and hairpins',()=>{
  const flat=adaptiveCamera({ball:{x:0,y:0,z:0},forward:{x:0,y:0,z:-1},
   roadAhead:{x:0,y:0,z:-24},speed:32,turn:0,aspect:390/844});
  for(const y of [-.75,.75]){
   const p=adaptiveCamera({ball:{x:10,y:-55,z:7},
    forward:{x:0,y,z:-.66},roadAhead:{x:12,y:-90,z:-14},
    speed:74,turn:.8,aspect:390/844});
   expect(p.fov).toBeGreaterThan(flat.fov);
   expect(p.distance).toBeGreaterThan(flat.distance+10);
   expect(p.position.y).toBeGreaterThan(-55);
   expect(p.fov).toBeLessThanOrEqual(90);
   expect(p.target.y-(-55)).toBeLessThanOrEqual(9);
  }
  expect(turnIntensity({x:0,y:0,z:-1},{x:1,y:0,z:0})).toBe(1);
 });
 it('never generates an invalid view or huge empty-sky target',()=>{
  for(let i=0;i<500;i++){
   const angle=i/500*Math.PI*2,speed=i/500*115,turn=(i%17)/16;
   const p=adaptiveCamera({ball:{x:30,y:-90,z:-400},
    forward:{x:Math.sin(angle),y:Math.cos(angle)*.9,z:-Math.cos(angle)},
    roadAhead:{x:42,y:500*Math.sin(angle),z:-420},
    speed,turn,aspect:.462});
   expect(Object.values({...p.position,...p.target}).every(Number.isFinite)).toBe(true);
   expect(p.fov).toBeGreaterThanOrEqual(70);
   expect(p.fov).toBeLessThanOrEqual(90);
   expect(Math.abs(p.targetHeight)).toBeLessThanOrEqual(9);
  }
 });
});
describe('W10.6 downward variations and real physical choice walls',()=>{
 it('1000 worlds randomize eight huge families, include deep negative valleys and exact ports',()=>{
  const kinds=new Set<string>(),signatures=new Set<string>();let deep=0;
  for(let index=3;index<1003;index++){
   const start=1340+(index-3)*700,end=start+520,axis=(index%7)*9;
   const course=buildMacroCourse(index,17,start,end,axis,'extreme');
   const v=validateMacroCourse(course);
   expect(v.valid,JSON.stringify({index,...v})).toBe(true);
   kinds.add(course.kind);signatures.add(course.signature);
   if(v.valley< -30)deep++;
   expect(v.ports).toBeLessThan(.001);
   expect(course.road).toHaveLength(537);
  }
  expect(kinds.size).toBe(8);expect(deep).toBeGreaterThan(200);
  expect(signatures.size).toBe(1000);
 },30000);
 it('all eight families recur once per seeded eight-world shuffle',()=>{
  for(const seed of [0,17,92931]){
   const kinds=new Set(Array.from({length:8},(_,n)=>
    buildMacroCourse(n+4,seed,2040+n*700,2560+n*700,0,'extreme').kind));
   expect(kinds.size).toBe(8);
  }
 });
 it('physical stop wall leaves actual adequate left/right passages',()=>{
  const wall=choiceWall(2040,4)!;
  expect(wall.d).toBe(2114);
  expect(hasPhysicalEscape(wall)).toBe(true);
  expect(choiceLaneWidth(wall.d,wall,10.8)).toBe(19);
  expect(choiceLaneWidth(wall.sectionStart,wall,10.8)).toBe(10.8);
  expect(choiceLaneWidth(wall.sectionEnd,wall,10.8)).toBe(10.8);
  expect(sideDecision(-6.4,wall)).toBe('left');
  expect(sideDecision(6.4,wall)).toBe('right');
  expect(sideDecision(0,wall)).toBeNull();
  expect(choiceWall(2740,5)).toBeNull();
 });
});
