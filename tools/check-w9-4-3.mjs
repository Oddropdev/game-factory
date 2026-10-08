import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const base=process.env.W9_4_3_BASE_SHA;
if(!base)throw new Error('W9.4-3 accepted main baseline is required');
const changed=execFileSync('git',['diff','--name-only',base+'...HEAD'],{encoding:'utf8'})
  .trim().split(/\r?\n/u).filter(Boolean);
const allow=new Set([
  'spikes/w9-ball/src/main.ts','spikes/w9-ball/src/SpeedCourse.ts',
  'spikes/w9-ball/index.html','spikes/w9-ball/src/style.css',
  'tests/ball/w9-4-sky-speed.spec.mjs','tools/check-w9-4-3.mjs',
  '.github/workflows/w9-4-sky-speed.yml',
  'docs/evidence/W9.4-3-SKY-SPEED-PASS.md'
]);
const errors=[];
const frozen=changed.filter(p=>!allow.has(p));
if(frozen.length)errors.push('Frozen core or private asset churn: '+frozen.join(','));
if(changed.some(p=>/\.(glb|fbx|zip|unitypackage)$/i.test(p)))
  errors.push('No owner-licensed binary may be committed');
const speed=fs.readFileSync('spikes/w9-ball/src/SpeedCourse.ts','utf8');
const main=fs.readFileSync('spikes/w9-ball/src/main.ts','utf8');
if(!speed.includes("SPEED_CAP=52")||!speed.includes('SPEED_SAFETY_ARCS')||
  !speed.includes('trackCenter(progress)'))errors.push('Speed geometry or bounded cap missing');
if(!main.includes('body.applyImpulse(new Vec3')||!main.includes('magnetActivations++'))
  errors.push('Flick and magnetic safety must use physical forces/impulses');
if(!main.includes("get('mode')==='speed'")||!main.includes('if(!speedMode)'))
  errors.push('Legacy /ball must remain an unchanged opt-out');
const screenshots=['portrait-390x844','small-android-360x800','landscape-844x390']
  .flatMap(x=>[x+'-sky-ready.png',x+'-boosted.png'])
  .concat(['portrait-swipe-speed.png','portrait-magnetic-safety.png',
    'portrait-speed-complete.png']);
for(const name of screenshots){
  const path='evidence/w9-4-3/'+name;
  if(!fs.existsSync(path)||fs.statSync(path).size<3000)errors.push('Screenshot missing: '+path);
}
if(!fs.existsSync('playtest-dist/ball/index.html'))errors.push('Isolated Ball build missing');
const report={marker:errors.length?'W9_4_3_SKY_SPEED_CONTRACT_FAIL':
  'W9_4_3_SKY_SPEED_CONTRACT_PASS',base,changed,
  screenshots:screenshots.length,licensedAssetsPublished:false,
  androidRealDevice:'PENDING',errors};
fs.mkdirSync('evidence/w9-4-3',{recursive:true});
fs.writeFileSync('evidence/w9-4-3/contract.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)throw new Error(errors.join('; '));
console.log(report.marker);
