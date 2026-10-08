import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base=process.env.W9_3_3_BASE_SHA;
if(!base)throw new Error('W9.3-3 requires accepted W9.3-2 merge SHA');
const changed=execFileSync('git',['diff','--name-only',base+'...HEAD'],{
  encoding:'utf8'
}).trim().split(/\r?\n/u).filter(Boolean);
const forbidden=changed.filter(x =>
  x.startsWith('src/') || x==='package.json' ||
  x.startsWith('.github/workflows/w9-playtest-publish') ||
  x.startsWith('spikes/w9-playcanvas/asset-manifest') ||
  x.startsWith('tools/fetch-w9-2d-assets')
);
const folder='evidence/w9-3-3';
const missing=[];
for(const name of ['portrait-390x844','small-android-360x800','landscape-844x390']){
  for(const stage of ['ready','running','gate-approach']){
    const file=path.join(folder,name+'-'+stage+'.png');
    if(!fs.existsSync(file))missing.push(file);
  }
}
if(!fs.existsSync(path.join(folder,'portrait-reward-juice.png')))
  missing.push('portrait-reward-juice.png');
if(!fs.existsSync(path.join(folder,'portrait-confirmed-hit-juice.png')))
  missing.push('portrait-confirmed-hit-juice.png');
if(!fs.existsSync(path.join(folder,'portrait-no-false-gate-reward.png')))
  missing.push('portrait-no-false-gate-reward.png');
const world=fs.readFileSync('spikes/w9-playcanvas/src/SoftWorld.ts','utf8');
const main=fs.readFileSync('spikes/w9-playcanvas/src/main.ts','utf8');
const errors=[];
if(forbidden.length) errors.push('Frozen gameplay / publication changes: '+forbidden.join(', '));
if(missing.length) errors.push('Missing real screenshots: '+missing.join(', '));
if(world.includes("type: 'box'") || !world.includes("'sphere'") || !world.includes("'capsule'"))
  errors.push('SoftWorld must contain actual rounded meshes only');
if(!world.includes('particleCapacity: glows.length'))
  errors.push('Event visuals need bounded preallocated pool');
if(!main.includes('softWorld.trigger(visualKind') ||
   !main.includes('s.pickups > previousPickups') ||
   !main.includes('s.hits > previousHits') ||
   !main.includes('s.gatesPassed > previousGates') ||
   !main.includes('softWorld.update(dt'))
  errors.push('Missing confirmed model-counter-driven presentation');
if(!main.includes('applyMassOperation') || !main.includes('createSoftPortal'))
  errors.push('Existing authoritative gate presentation lost');
const root=path.join('playtest-dist','3d');
if(!fs.existsSync(path.join(root,'index.html'))) errors.push('No isolated production 3D build');
const assets=path.join(root,'assets');
const js=fs.existsSync(assets)?fs.readdirSync(assets)
 .filter(s=>s.endsWith('.js'))
 .map(file=>({name:file,bytes:fs.statSync(path.join(assets,file)).size})):[];
const marker=errors.length?'W9_3_3_SOFT_WORLD_CONTRACT_FAIL':'W9_3_3_SOFT_WORLD_CONTRACT_PASS';
fs.mkdirSync(folder,{recursive:true});
fs.writeFileSync(path.join(folder,'contract.json'),JSON.stringify({
  marker,base,changed,screenshotCount:12-missing.length,js,errors
},null,2)+'\n');
console.log(JSON.stringify({marker,changed,screenshotCount:12-missing.length,js,errors},null,2));
if(errors.length)throw new Error(errors.join('; '));
console.log(marker);
