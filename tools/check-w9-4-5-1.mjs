import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const baseline=process.env.W9_4_5_1_BASE_SHA;
if(!baseline)throw new Error('Accepted W9.4-5 main baseline missing');
const changed=execFileSync('git',['diff','--name-only',baseline+'...HEAD'],
  {encoding:'utf8'}).trim().split(/\r?\n/u).filter(Boolean);
const allowed=new Set([
  'spikes/w9-ball/src/main.ts',
  'spikes/w9-ball/src/MagneticRails.ts',
  'spikes/w9-ball/src/SpeedCourse.ts',
  'spikes/w9-ball/src/LongJumpCourse.ts',
  'tests/ball/w9-4-rail-priority.spec.mjs',
  '.github/workflows/w9-4-rail-priority.yml',
  'tools/check-w9-4-5-1.mjs',
  'docs/evidence/W9.4-5.1-RAIL-PRIORITY.md'
]);
const errors=[];
const bad=changed.filter(name=>!allowed.has(name));
if(bad.length)errors.push('Frozen/source boundary changed: '+bad.join(', '));
if(changed.some(name=>/\.(glb|zip|fbx|unitypackage)$/i.test(name)))
  errors.push('Proprietary binary committed');
const main=fs.readFileSync('spikes/w9-ball/src/main.ts','utf8');
const rail=fs.readFileSync('spikes/w9-ball/src/MagneticRails.ts','utf8');
const speed=fs.readFileSync('spikes/w9-ball/src/SpeedCourse.ts','utf8');
const long=fs.readFileSync('spikes/w9-ball/src/LongJumpCourse.ts','utf8');
if(!main.includes('legacySafetyAllowed=railSection===null') ||
   !main.includes('railMode?4.18:3.3') || !main.includes('railEntrySteeringFrames++'))
  errors.push('Explicit magnetic section priority or steering range missing');
if(!rail.includes('export function railSectionAt(') ||
   !main.includes('railMode?railSectionAt(progress):null'))
  errors.push('Safety priority must use whole section even at field threshold');
if(!speed.includes('suppressLegacyEdge(d,side)') ||
   !long.includes('suppressLegacyEdge(d,side)'))
  errors.push('Old visual safety rails overlap physical curved green rail');
for(const label of ['portrait-390x844','small-android-360x800','landscape-844x390']){
  for(const phase of ['priority-ready','contact-engaged']){
    const file='evidence/w9-4-5-1/'+label+'-'+phase+'.png';
    if(!fs.existsSync(file)||fs.statSync(file).size<2500)
      errors.push('Missing actual Playwright photo: '+file);
  }
}
const report={marker:errors.length?'W9_4_5_1_RAIL_PRIORITY_FAIL':
  'W9_4_5_1_RAIL_PRIORITY_BROWSER_PASS',baseline,changed,errors,
  licensedAssetsPublished:false,physicalAndroid:'PENDING'};
fs.mkdirSync('evidence/w9-4-5-1',{recursive:true});
fs.writeFileSync('evidence/w9-4-5-1/contract.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)throw new Error(errors.join('; '));
console.log(report.marker);
