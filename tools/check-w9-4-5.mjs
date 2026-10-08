import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const base=process.env.W9_4_5_BASE_SHA;
if(!base)throw new Error('W9.4-5 main baseline missing');
const changed=execFileSync('git',['diff','--name-only',base+'...HEAD'],{encoding:'utf8'})
  .trim().split(/\r?\n/u).filter(Boolean);
const allowed=new Set(['spikes/w9-ball/src/main.ts',
  'spikes/w9-ball/src/MagneticRails.ts',
  'tests/ball/w9-4-magnetic-rails.spec.mjs',
  '.github/workflows/w9-4-magnetic-rails.yml',
  'tools/check-w9-4-5.mjs',
  'docs/evidence/W9.4-5-MAGNETIC-RAILS.md']);
const errors=[];
const bad=changed.filter(f=>!allowed.has(f));
if(bad.length)errors.push('W9.4-4 or other frozen file modified: '+bad.join(','));
if(changed.some(f=>/\.(glb|fbx|zip|unitypackage)$/i.test(f)))
  errors.push('Licensed asset must not appear in public diff');
const main=fs.readFileSync('spikes/w9-ball/src/main.ts','utf8');
const magnet=fs.readFileSync('spikes/w9-ball/src/MagneticRails.ts','utf8');
if(!main.includes("gameMode==='rail'")||!main.includes('body.applyForce(new Vec3')||
  !main.includes('touchingRails.add(event.other.name)'))
  errors.push('Explicit rail-mode physics/contact integration absent');
if(!magnet.includes("'static',tangent.yaw")||
  !magnet.includes('RAIL_CONTACT_FORCE=155')||
  !magnet.includes('LONG_CURVE_RAILS:readonly RailSection[]'))
  errors.push('Long curved Bullet colliders and bounded rail force absent');
const names=['portrait-390x844','small-android-360x800','landscape-844x390']
  .flatMap(x=>[x+'-idle-green-rail.png',x+'-contact-sparks.png'])
  .concat('portrait-rail-full-finish.png');
for(const name of names){
  const file='evidence/w9-4-5/'+name;
  if(!fs.existsSync(file)||fs.statSync(file).size<2500)
    errors.push('Missing authentic browser screenshot: '+file);
}
const report={marker:errors.length?'W9_4_5_MAGNETIC_RAIL_FAIL':
  'W9_4_5_MAGNETIC_RAIL_BROWSER_PASS',base,changed,screenshots:names.length,
  privateLicensedFilesPublished:false,android:'PENDING',errors};
fs.mkdirSync('evidence/w9-4-5',{recursive:true});
fs.writeFileSync('evidence/w9-4-5/contract.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)throw new Error(errors.join('; '));
console.log(report.marker);
