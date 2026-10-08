import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.W9_3_4_BASE_SHA;
if (!base) throw new Error('W9.3-4 requires frozen accepted W9.3-3 base');
const changed = execFileSync('git',['diff','--name-only',base+'...HEAD'],{encoding:'utf8'})
  .trim().split(/\r?\n/u).filter(Boolean);
const allowed = [
  'spikes/w9-playcanvas/src/main.ts',
  'tests/playcanvas/w9-3-visual-acceptance.spec.mjs',
  'tools/check-w9-3-4.mjs',
  'docs/evidence/W9.3-4-VISUAL-ACCEPTANCE-CLOSEOUT.md',
  'docs/playtest/W9.3-4-ANDROID-HANDOFF.md',
  '.github/workflows/w9-3-visual-acceptance.yml'
];
const forbidden = changed.filter(p=>!allowed.includes(p));
const src = fs.readFileSync('spikes/w9-playcanvas/src/main.ts','utf8');
const error = [];
if (forbidden.length) error.push('Non-acceptance or frozen code changes: '+forbidden.join(', '));
if (!src.includes("hud.feedback.classList.remove('show');") ||
    !src.includes('createSoftEnvironment') || !src.includes("MassRunnerModel([level])"))
  error.push('Expected stable W9.3 scene/gameplay and result message cleanup');
const expected = ['portrait-390x844','small-android-360x800','landscape-844x390']
  .flatMap(device=>['ready','gate-decision','result'].map(phase=>device+'-'+phase+'.png'))
  .concat('portrait-390x844-dpr2-gate.png');
const out='evidence/w9-3-4';
const missing=[];
function validPng(file) {
  if (!fs.existsSync(file)) return false;
  const buf=fs.readFileSync(file);
  return buf.length>5000 && buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
}
for(const file of expected) if(!validPng(path.join(out,file))) missing.push(file);
if(missing.length) error.push('Missing or invalid screenshots: '+missing.join(', '));
const audits=['portrait-390x844','small-android-360x800','landscape-844x390']
  .map(d=>path.join(out,d+'-audit.json'));
for(const f of audits)if(!fs.existsSync(f))error.push('Missing audit: '+f);
const release='playtest-dist/3d';
if(!fs.existsSync(path.join(release,'index.html')))error.push('Missing production /3d/ release build');
const jsDir=path.join(release,'assets');
const js=fs.existsSync(jsDir)?fs.readdirSync(jsDir).filter(n=>n.endsWith('.js'))
  .map(n=>({name:n,bytes:fs.statSync(path.join(jsDir,n)).size})):[];
const bytes=js.reduce((sum,item)=>sum+item.bytes,0);
const baselineJsBytes=1155810;
const growth=(bytes-baselineJsBytes)/baselineJsBytes;
if(!bytes)error.push('Missing JavaScript bundle');
if(growth>.25)error.push('Unexpected JS growth over 25% baseline: '+(growth*100).toFixed(2)+'%');
const report={
  marker:error.length?'W9_3_4_BROWSER_ACCEPTANCE_FAIL':'W9_3_4_BROWSER_ACCEPTANCE_PASS',
  base,changed,expectedScreenshots:expected.length,missing,
  js,baselineJsBytes,jsGrowthPercent:Number((growth*100).toFixed(2)),
  realAndroid:'NOT_RUN_IN_CI',ownerVisualGo:'PENDING',publishing:'MANUAL_ONLY',
  errors:error
};
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'acceptance.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(error.length)throw new Error(error.join('; '));
console.log(report.marker);
