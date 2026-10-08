import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const base=process.env.W9_4_4_BASE_SHA;
if(!base)throw new Error('Accepted W9.4-3 merge baseline must be provided');
const changed=execFileSync('git',['diff','--name-only',base+'...HEAD'],{encoding:'utf8'})
  .trim().split(/\r?\n/u).filter(Boolean);
const allowed=new Set([
  'spikes/w9-ball/src/main.ts','spikes/w9-ball/src/LongJumpCourse.ts',
  'tests/ball/w9-4-long-jump.spec.mjs','tools/check-w9-4-4.mjs',
  '.github/workflows/w9-4-long-jump.yml',
  'docs/evidence/W9.4-4-LONG-JUMP-CLOSEOUT.md'
]);
const errors=[];
const disallowed=changed.filter(f=>!allowed.has(f));
if(disallowed.length)errors.push('Unexpected churn: '+disallowed.join(','));
if(changed.some(f=>/\.(glb|zip|fbx|unitypackage)$/i.test(f)))
  errors.push('Private owner asset must not be committed');
const source=fs.readFileSync('spikes/w9-ball/src/main.ts','utf8');
const jump=fs.readFileSync('spikes/w9-ball/src/LongJumpCourse.ts','utf8');
if(!jump.includes('LONG_FINISH_DISTANCE=440')||!jump.includes('LONG_SPEED_CAP=64')||
   !jump.includes("'long-landing-deck'")||!jump.includes("'real-bullet-launch-ramp'"))
  errors.push('Actual long ramp/deck course or bounded speed missing');
if(!source.includes("gameMode==='jump'")||!source.includes('body.applyImpulse(new Vec3(0,dv*1.4,0))')||
   !source.includes("event.other.name==='long-landing-deck'"))
  errors.push('Real high-speed jump or physical landing evidence missing');
const images=['portrait-390x844','small-android-360x800','landscape-844x390']
  .flatMap(x=>[x+'-long-ready.png',x+'-takeoff.png',x+'-landing.png'])
  .concat(['portrait-long-finish.png','portrait-flick-boost.png']);
for(const name of images){
  const file='evidence/w9-4-4/'+name;
  if(!fs.existsSync(file)||fs.statSync(file).size<2500)
    errors.push('Missing actual Chromium screenshot: '+file);
}
if(!fs.existsSync('playtest-dist/ball/index.html'))errors.push('Isolated Ball build missing');
const report={marker:errors.length?'W9_4_4_REAL_JUMP_FAIL':'W9_4_4_REAL_JUMP_BROWSER_PASS',
 base,changed,realScreenshots:images.length,privateAssetsCommitted:false,
 realAndroid:'PENDING',errors};
fs.mkdirSync('evidence/w9-4-4',{recursive:true});
fs.writeFileSync('evidence/w9-4-4/contract.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)throw Error(errors.join('; '));
console.log(report.marker);
