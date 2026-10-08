import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const base=process.env.W9_4_2_BASE_SHA;
if(!base)throw new Error('W9.4-2 missing frozen accepted base SHA');
const changed=execFileSync('git',['diff','--name-only',base+'...HEAD'],{encoding:'utf8'})
  .trim().split(/\r?\n/u).filter(Boolean);
const allowed=[
  '.gitignore','spikes/w9-ball/src/main.ts','spikes/w9-ball/src/LicensedArt.ts',
  'tools/install-w9-4-ithappy.ps1','tests/ball/w9-4-private-art.spec.mjs',
  'tools/check-w9-4-2.mjs','.github/workflows/w9-4-private-art.yml',
  'docs/evidence/W9.4-2-ITHAPPY-PRIVATE-ART.md'
];
const bad=changed.filter(f=>!allowed.includes(f));
const publicAssets=changed.filter(f=>/\.glb$|\.zip$|\.fbx$|\.unitypackage$|\.env\.local$/i.test(f));
const ball=fs.readFileSync('spikes/w9-ball/src/main.ts','utf8');
const art=fs.readFileSync('spikes/w9-ball/src/LicensedArt.ts','utf8');
const ps=fs.readFileSync('tools/install-w9-4-ithappy.ps1','utf8');
const ignores=fs.readFileSync('.gitignore','utf8');
const errors=[];
if(bad.length)errors.push('Frozen model/Factory/public-game churn: '+bad.join(', '));
if(publicAssets.length)errors.push('Licensed binary or private setting in public repo: '+publicAssets.join(', '));
if(!ball.includes('loadPrivateArt(app,')||!ball.includes('new AmmoPhysicsWorld()'))
  errors.push('Original Bullet backend or opt-in overlay missing');
if(!art.includes("VITE_ITHAPPY_ASSETS==='1'")||!art.includes('dynamicBallStillPhysics'))
  errors.push('Licensed assets must remain optional and presentation-only');
if(!ps.includes('Get-FileHash')||!ps.includes('W9_4_2_LICENSED_ART_INSTALLED_PASS'))
  errors.push('SHA256 verified private ZIP installer absent');
if(!ignores.includes('spikes/w9-ball/public/licensed/')||!ignores.includes('spikes/w9-ball/.env.local'))
  errors.push('Private binaries or private build flags may be tracked');
const installed=fs.existsSync('spikes/w9-ball/public/licensed');
const output=path.resolve('playtest-dist/ball/index.html');
if(!fs.existsSync(output))errors.push('Isolated /ball build absent');
const report={marker:errors.length?'W9_4_2_PRIVATE_ART_CONTRACT_FAIL':'W9_4_2_PRIVATE_ART_CONTRACT_PASS',
 base,changed,privateAssetsInstalled:installed,publicLicenseBinaries:publicAssets,errors,
 physics:'PRESERVED',publicDeploy:'NOT_STARTED',ownerArtReview:'PENDING'};
fs.mkdirSync('evidence/w9-4-2',{recursive:true});
fs.writeFileSync('evidence/w9-4-2/art-contract.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)throw new Error(errors.join('; '));
console.log(report.marker);
