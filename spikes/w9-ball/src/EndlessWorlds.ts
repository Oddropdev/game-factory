// W9.6 deterministic, finite-memory worlds. World indices are zero based;
// the first three remain authored and immutable.
import {seededRandom} from './SeededTransit';
import {secondCenter} from './SecondSkyLevel';
import type {WorldManifest,RoadSample} from './TrilogyManifest';

export const ENDLESS_START=1340;
export const ENDLESS_STRIDE=400;
export const ENDLESS_ROAD=220;
export const FIRST_ENDLESS_INDEX=3;
export const MAX_TEST_WORLDS=1000;

type Biome={name:string;sky:string;fog:string;water:string;island:string;
  colors:[string,string,string,string];trim:string};
const BIOMES:readonly Biome[]=[
 {name:'Aurora Gardens',sky:'#c6e6fb',fog:'#c6e6fb',water:'#5bb4de',island:'#66c9aa',colors:['#7bdbcb','#ade8ff','#b8a3ec','#4fb8b1'],trim:'#edfff2'},
 {name:'Volcanic Sunset',sky:'#e5b5ba',fog:'#e9afb0',water:'#88426f',island:'#a66166',colors:['#ff7e64','#eab176','#ffcd91','#ad69a2'],trim:'#fff0cc'},
 {name:'Moonlight Lagoon',sky:'#7f93c0',fog:'#9da9cc',water:'#547dbc',island:'#7287ad',colors:['#88cdf1','#99b7f3','#dbc5f9','#78e3d3'],trim:'#eefaff'},
 {name:'Neon Circuit',sky:'#6967aa',fog:'#7a8cc5',water:'#4a64aa',island:'#7867aa',colors:['#ff81bb','#64e8e4','#caa9ff','#f2e66c'],trim:'#fff6fc'},
 {name:'Golden Dunes',sky:'#f3d7ac',fog:'#efcfa2',water:'#b2cbd3',island:'#d7a976',colors:['#ffd77d','#e9b58c','#f3cfad','#a4d7cb'],trim:'#fff6dd'},
 {name:'Mosslight Forest',sky:'#a5d9c3',fog:'#b4e9d8',water:'#67bca5',island:'#629b73',colors:['#8fdd8d','#c3f2a6','#8cdacb','#f2e4a0'],trim:'#f8ffcf'},
 {name:'Frosted Orbit',sky:'#c6d9ef',fog:'#d7e7f4',water:'#91add9',island:'#a4b9e0',colors:['#bfeaff','#98cff9','#e3d2ff','#92d2d8'],trim:'#ffffff'},
 {name:'Coral Kingdom',sky:'#f9cfca',fog:'#f9ded0',water:'#7fc9cf',island:'#e9a99e',colors:['#fc9fb3','#ffbf97','#f2df9a','#8fdfdf'],trim:'#fff8e9'},
 {name:'Storm Cathedral',sky:'#a0a8c4',fog:'#b4b6ce',water:'#686c9f',island:'#888bb4',colors:['#9b96e4','#c5b4e9','#78bbc9','#f0c9db'],trim:'#f7ebff'},
 {name:'Solar Bloom',sky:'#f9e2b4',fog:'#ffe5c7',water:'#a9d9ca',island:'#d3b98a',colors:['#f8c76b','#ffc5a7','#deafd6','#8fd8b7'],trim:'#fffce2'}
] as const;

export function endlessBounds(index:number):[number,number]{
 if(!Number.isSafeInteger(index)||index<FIRST_ENDLESS_INDEX||index>1_000_000)
  throw Error('Invalid endless world index');
 const start=ENDLESS_START+(index-FIRST_ENDLESS_INDEX)*ENDLESS_STRIDE;
 return [start,start+ENDLESS_ROAD];
}
const smooth=(u:number)=>{const t=Math.max(0,Math.min(1,u));return t*t*(3-2*t);};
const hash=(index:number,seed:number)=>(seed^Math.imul(index+1,0x9e3779b1))>>>0;
// A broad, deterministic landing coordinate: a real new destination rather
// than every transit returning to the same narrow center corridor.
const axis=(index:number,extreme=false)=>extreme?
  (seededRandom(Math.imul(index+1,0x9e3779b1)^0x5f1d36b7)()-.5)*72:
  Math.sin(index*2.399963229728653)*11;
const sway=(index:number)=>7+((index*37)%9)*.6;
// First gap blends from the exact authored Rainbow exit. Generated road endpoints
// and the 180m transit gaps use smoothstep for zero derivative at both ports.
export function endlessCenter(d:number,authoredExit:number,extreme=false):number{
 if(d<ENDLESS_START)return authoredExit+(axis(3,extreme)-authoredExit)*smooth((d-1160)/180);
 const index=FIRST_ENDLESS_INDEX+Math.floor((d-ENDLESS_START)/ENDLESS_STRIDE);
 const [start,end]=endlessBounds(index),local=d-start;
 if(local<=ENDLESS_ROAD){
  const t=Math.max(0,Math.min(1,local/ENDLESS_ROAD)),envelope=Math.sin(Math.PI*t)**2;
  return axis(index,extreme)+sway(index)*envelope*Math.sin(t*Math.PI*2+(index%3)*.5);
 }
 return axis(index,extreme)+(axis(index+1,extreme)-axis(index,extreme))*smooth((d-end)/(ENDLESS_STRIDE-ENDLESS_ROAD));
}
function shade(hex:string,shift:number){
 const n=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 return '#'+n.map((v,i)=>Math.max(0,Math.min(255,Math.round(v+shift*(i===0?.8:i===1?.4:-.5))))
  .toString(16).padStart(2,'0')).join('');
}
export function worldDesign(index:number,seed:number){
 const rand=seededRandom(hash(index,seed));
 const biomeIndex=(index+Math.floor(index/10)*3+Math.floor(rand()*BIOMES.length))%BIOMES.length;
 const b=BIOMES[biomeIndex]!,shift=Math.round((rand()-.5)*38);
 const tier=Math.min(10,1+Math.floor((index-3)/13));
 return {biome:b.name,biomeIndex,tier,shift,colors:b.colors.map(c=>shade(c,shift)),sky:shade(b.sky,shift*.4),
  fog:shade(b.fog,shift*.4),water:shade(b.water,shift*.5),island:shade(b.island,shift*.5),
  trim:shade(b.trim,shift*.4)};
}
export function generateEndlessWorld(index:number,runSeed:number,rich=false):{manifest:WorldManifest;road:RoadSample[]}{
 const [start,end]=endlessBounds(index),design=worldDesign(index,runSeed);
 const rand=seededRandom(hash(index,runSeed)^0xa5a5a5a5);
 const gems:number[]=[],hazards:number[]=[],arches:number[]=[];
 const step=(end-start-28)/(15+Math.floor(rand()*6));
 for(let d=start+12;d<end-8;d+=step)gems.push(Math.round(d));
 for(let i=0;i<Math.min(12,2+design.tier);i++)hazards.push(Math.round(start+31+i*(ENDLESS_ROAD-64)/Math.min(12,2+design.tier)+(rand()-.5)*5));
 for(let i=0;i<3+index%4;i++)arches.push(Math.round(start+28+i*29));
 const road:RoadSample[]=[];
 // Samples include overhang at both tube ports, as required by W9.5 Bullet staging.
 for(let d=start-2;d<=end+4;d++){
  const t=Math.max(0,Math.min(1,(d-start)/(end-start))),window=Math.sin(Math.PI*t)**2;
  road.push({d,x:endlessCenter(d,secondCenter(700),rich),y:window*(.38+.14*Math.sin(t*Math.PI*(2+index%3))),
   bank:window*Math.sin(t*Math.PI*(2+index%3))*(9+design.tier*.55),
   width:10.8+Math.sin(t*Math.PI*2+index)*.7});
 }
 const manifest:WorldManifest={version:1,id:`endless-${index+1}`,title:design.biome,
  start,end,geometry:'generated',scenerySeed:hash(index,runSeed),sky:design.sky,fog:design.fog,
  water:design.water,island:design.island,colors:design.colors,trim:design.trim,
  gems,hazards,arches,privateModels:['tree','arch','balloon','coin'],biome:design.biome,
  tier:design.tier,worldNumber:index+1,
  features:rich?generateWorldFeatures(index,start,end,runSeed):undefined};
 return {manifest,road};
}
export function simulateEndlessCatalog(seed:number,count=MAX_TEST_WORLDS){
 if(!Number.isSafeInteger(count)||count<1||count>10000)throw Error('Invalid simulation size');
 const types=new Set<string>();let lastEnd=1160,monotonic=true,minGap=Infinity,maxTier=0;
 let minDistinctWindow=Infinity;
 const rolling:string[]=[];
 for(let i=3;i<count;i++){
  const d=generateEndlessWorld(i,seed),[start,end]=endlessBounds(i);
  const gap=start-lastEnd;monotonic&&=gap>=100&&end>start;
  minGap=Math.min(minGap,gap);lastEnd=end;
  const variant=`${d.manifest.biome}/${d.manifest.colors[0]}/${Math.round(d.road[90]!.x*10)}/${d.manifest.hazards.length}`;
  types.add(variant);rolling.push(variant);
  if(rolling.length>25)rolling.shift();
  if(rolling.length===25)minDistinctWindow=Math.min(minDistinctWindow,new Set(rolling).size);
  maxTier=Math.max(maxTier,d.manifest.tier??0);
  if(d.road.length!==227||d.road.some(p=>!Number.isFinite(p.x)||p.width<8||Math.abs(p.bank)>18))
   throw Error('Invalid generated road '+i);
 }
 return {worlds:count,generated:count-3,variants:types.size,minDistinctWindow,
  minGap,maxTier,monotonic};
}

export type GeneratedGuard={start:number;end:number;side:-1|1};
export type GeneratedGrind={start:number;end:number;side:-1|1};
export type GeneratedFeatures={guards:GeneratedGuard[];grinds:GeneratedGrind[]};
// Avoid blocking the center lane or overlapping the arrival/departure ports.
export function generateWorldFeatures(index:number,start:number,end:number,seed:number):GeneratedFeatures{
 const r=seededRandom(hash(index,seed)^0x4b1d629a);
 const side=r()>.5?1 as const:-1 as const;
 const first=Math.round(start+25+14*r()),second=Math.round(Math.min(end-41,start+153+10*r()));
 const grind=Math.round(start+60+12*r());
 return {guards:[{start:first,end:first+32,side},{start:second,end:second+28,side:side===1?-1:1}],
  grinds:[{start:grind,end:grind+39,side:side===1?-1:1}]};
}
