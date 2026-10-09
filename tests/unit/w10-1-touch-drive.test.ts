import {describe,it,expect} from 'vitest';
import {TouchDriveInput} from '../../spikes/w9-ball/src/TouchDriveInput';
describe('W10.1 touch-to-drive (no autopilot)',()=>{
 it('stays motionless and produces zero boosts until actual swipe',()=>{
  const c=new TouchDriveInput();expect(c.active).toBe(false);
  expect(c.throttle).toBe(0);expect(c.consumeBoost()).toBeNull();
  c.down(1,150,500);expect(c.armed).toBe(true);expect(c.throttle).toBe(0);
  c.move(1,155,498);expect(c.consumeBoost()).toBeNull();
  c.up(1);expect(c.throttle).toBe(0);expect(c.boosts).toBe(0);
 });
 it('upward swipe gives exactly one initial boost and continuous held thrust',()=>{
  const c=new TouchDriveInput();c.down(1,170,600);c.move(1,170,555);
  expect(c.consumeBoost()).toMatchObject({forward:1,steer:0});
  expect(c.consumeBoost()).toBeNull();
  c.move(1,170,420);
  expect(c.throttle).toBe(1);expect(c.holding).toBe(true);
  expect(c.boosts).toBe(1);
  c.up(1);expect(c.throttle).toBe(0);expect(c.active).toBe(false);
 });
 it('fresh touch after release provides another impulse, not repeats while holding',()=>{
  const c=new TouchDriveInput();c.down(4,100,500);c.move(4,100,425);
  c.consumeBoost();c.move(4,110,380);expect(c.consumeBoost()).toBeNull();
  c.up(4);c.down(9,200,500);c.move(9,200,410);
  expect(c.consumeBoost()?.forward).toBeCloseTo(1);
  expect(c.boosts).toBe(2);expect(c.releases).toBe(1);
 });
 it('left, right, down and diagonals are all legitimate directions',()=>{
  const c=new TouchDriveInput();
  const cases=[[-100,0,-1,0],[100,0,1,0],[0,100,0,-1],[85,-85,.7,.7]];
  for(let i=0;i<cases.length;i++){
   const [dx,dy,side,forward]=cases[i]!;
   c.down(i,140,450);c.move(i,140+dx,450+dy);
   const b=c.consumeBoost()!;
   expect(Math.sign(b.steer)).toBe(Math.sign(side));
   expect(Math.sign(b.forward)).toBe(Math.sign(forward));
   c.up(i);
  }
 });
 it('finger can steer sideways while maintaining prior forward hold',()=>{
  const c=new TouchDriveInput();c.down(1,100,400);
  c.move(1,100,290);c.consumeBoost();
  c.move(1,195,290);
  expect(c.throttle).toBe(1);expect(c.lateral).toBeGreaterThan(.8);
  c.move(1,25,290);expect(c.lateral).toBeLessThan(-.6);
  expect(c.throttle).toBe(1);
 });
 it('second pointer cannot steal primary and cancel clears motor',()=>{
  const c=new TouchDriveInput();expect(c.down(1,100,100)).toBe(true);
  expect(c.down(2,200,200)).toBe(false);expect(c.move(2,300,100)).toBe(false);
  c.move(1,100,50);expect(c.holding).toBe(true);
  c.cancel();expect(c.active).toBe(false);
  expect(c.throttle).toBe(0);expect(c.consumeBoost()).toBeNull();
 });
});
