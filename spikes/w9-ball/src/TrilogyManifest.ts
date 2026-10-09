// Fetched content contract; geometry/scenery are supplied per-world, never bundled upfront.
import {longCenter} from './LongJumpCourse';
import {secondCenter} from './SecondSkyLevel';
import {endlessCenter,type GeneratedFeatures} from './EndlessWorlds';
// One active PlayCanvas run per page; configured once before any world is staged.
let richEndlessRoute=false;
export function setRichEndlessRoute(enabled:boolean){richEndlessRoute=enabled;}
export function richRouteEnabled(){return richEndlessRoute;}
export type WorldId='crystal'|'candy'|'rainbow'|`endless-${number}`;
export type RoadSample={d:number;x:number;bank:number;width:number;y:number};
export type WorldManifest={version:1;id:WorldId;title:string;start:number;end:number;
  geometry:string;scenerySeed:number;sky:string;fog:string;water:string;
  colors:string[];trim:string;island:string;gems:number[];hazards:number[];arches:number[];
  privateModels:string[];biome?:string;tier?:number;worldNumber?:number;
  features?:GeneratedFeatures};
export const WORLD_URLS=['crystal','candy','rainbow'].map(id=>'./levels/'+id+'.json');
export const WORLD_BOUNDS=[[0,428],[590,770],[940,1160]] as const;
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function trilogyCenter(d:number):number{
 if(d>1164)return endlessCenter(d,trilogyCenter(1160),richEndlessRoute);
 if(d<590)return longCenter(d);
 if(d<940)return secondCenter(550+(d-590)*150/180);
 const t=d-940;return secondCenter(700)+14*smooth(15,72,t)-25*smooth(83,150,t)+11*smooth(163,207,t);
}
export function trilogyTangent(d:number){
 const dx=(trilogyCenter(d+.05)-trilogyCenter(d-.05))/.1;
 const l=Math.hypot(dx,1);return {x:dx/l,z:-1/l,yaw:-Math.atan(dx)*180/Math.PI,dx};
}
export function parseWorld(input:unknown,index:number):WorldManifest{
 const m=input as WorldManifest,b=WORLD_BOUNDS[index];
 if(!m||m.version!==1||m.id!==['crystal','candy','rainbow'][index]||!b||m.start!==b[0]||m.end!==b[1]||
  m.geometry!==`./levels/${m.id}-road.json`||!Number.isSafeInteger(m.scenerySeed)||
  !Array.isArray(m.colors)||m.colors.length<3||m.colors.length>6||
  ![...m.colors,m.trim,m.sky,m.fog,m.water,m.island].every(v=>/^#[0-9a-f]{6}$/i.test(v))||
  ![m.gems,m.hazards,m.arches].every(a=>Array.isArray(a)&&a.length<=100&&
   a.every(n=>Number.isFinite(n)&&n>=m.start&&n<=m.end))||
  !Array.isArray(m.privateModels)||m.privateModels.some(n=>!['ball','bumper','roller','tree','checkpoint','arch','balloon','coin'].includes(n)))
  throw Error('Invalid trilogy world manifest '+index);
 return m;
}
export function parseRoad(input:unknown,m:WorldManifest):RoadSample[]{
 if(!Array.isArray(input)||input.length<60||input.length>1200)throw Error('Invalid road geometry');
 const rows=input as RoadSample[];
 for(const [i,p] of rows.entries()){
  if(![p.d,p.x,p.bank,p.width,p.y].every(Number.isFinite)||p.width<8||p.width>14||
   Math.abs(p.bank)>18||Math.abs(p.y)>3||Math.abs(p.x-trilogyCenter(p.d))>.002||
   (i>0&&(p.d<=rows[i-1]!.d||p.d-rows[i-1]!.d>2.01)))throw Error('Unsafe road sample '+i);
 }
 if(rows[0]!.d!==m.start-2||rows.at(-1)!.d!==m.end+4)throw Error('Road port bounds');
 return rows;
}
