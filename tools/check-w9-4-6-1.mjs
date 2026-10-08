import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const base=process.env.W9_4_6_1_BASE_SHA;
if(!base)throw Error('Accepted W9.4-6 main baseline is required');
const changed=execFileSync('git',['diff','--name-only',base+'...HEAD'],
  {encoding:'utf8'}).trim().split(/\r?\n/u).filter(Boolean);
const allowed=new Set([
  'spikes/w9-ball/src/main.ts',
  'spikes/w9-ball/src/RailModes.ts',
  'spikes/w9-ball/src/GrindTrack.ts',
  'tests/ball/w9-4-6-1-secret-route.spec.mjs',
  '.github/workflows/w9-4-6-1-secret-route.yml',
  'tools/check-w9-4-6-1.mjs',
  'docs/evidence/W9.4-6.1-SECRET-RAIL.md'
]);
const errors=[];
const excluded=changed.filter(p=>!allowed.has(p));
if(excluded.length)errors.push('Frozen source modified: '+excluded.join(','));
if(changed.some(f=>/\.(glb|zip|fbx|unitypackage)$/i.test(f)))
  errors.push('No owner-licensed binary may enter public repo');
const main=fs.readFileSync('spikes/w9-ball/src/main.ts','utf8');
const rails=fs.readFileSync('spikes/w9-ball/src/RailModes.ts','utf8');
const geometry=fs.readFileSync('spikes/w9-ball/src/GrindTrack.ts','utf8');
const acceptance=fs.readFileSync('tests/ball/w9-4-6-1-secret-route.spec.mjs','utf8');
if(!main.includes("targetX< -2.4")||
   !main.includes("grindTopQualifies(p.y,p.x,routePoint.x,routePoint.y,true)"))
  errors.push('Intentional entry or genuine top-collider-only authority missing');
if(!rails.includes('entryLane=-3.0*')||
   !geometry.includes("'real-secret-rail-entry-ramp'"))
  errors.push('Centerline-free left-side physical secret rail entry missing');
if(!acceptance.includes("end.grindSecretFrames")||
   !acceptance.includes("expect(descended).toBe(true)"))
  errors.push('Prospective real secret ride and optional bypass acceptance absent');
const names=['portrait-390x844','small-android-360x800','landscape-844x390']
  .flatMap(size=>[size+'-secret-crest.png',size+'-secret-descent.png',size+'-secret-end.png']);
for(const name of names){
  const p='evidence/w9-4-6-1/'+name;
  if(!fs.existsSync(p)||fs.statSync(p).size<2500)errors.push('Missing actual screenshot: '+p);
}
const result={marker:errors.length?'W9_4_6_1_SECRET_ROUTE_FAIL':
  'W9_4_6_1_SECRET_ROUTE_BROWSER_PASS',base,changed,
  screenshots:names.length,paidAssetsCommitted:false,
  physicalAndroid:'PENDING',errors};
fs.mkdirSync('evidence/w9-4-6-1',{recursive:true});
fs.writeFileSync('evidence/w9-4-6-1/contract.json',
  JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(errors.length)throw Error(errors.join('; '));
console.log(result.marker);
