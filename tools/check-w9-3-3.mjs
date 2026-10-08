import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.W9_3_3_BASE_SHA;
if (!base) throw new Error('W9.3-3 requires frozen accepted W9.3-2 base SHA');
const changed = execFileSync('git', ['diff', '--name-only', base + '...HEAD'], {
  encoding: 'utf8'
}).trim().split(/\r?\n/u).filter(Boolean);
const allow = [
  'spikes/w9-playcanvas/',
  'tests/playcanvas/w9-3-soft-environment.spec.mjs',
  'tools/check-w9-3-3.mjs',
  'docs/evidence/W9.3-3-ENVIRONMENT-JUICE-CLOSEOUT.md',
  '.github/workflows/w9-3-environment-juice.yml'
];
const forbidden = changed.filter(p => !allow.some(prefix => p.startsWith(prefix)));
const source = fs.readFileSync('spikes/w9-playcanvas/src/main.ts', 'utf8');
const scenery = fs.readFileSync('spikes/w9-playcanvas/src/SoftEnvironment.ts', 'utf8');
const juice = fs.readFileSync('spikes/w9-playcanvas/src/SoftJuice.ts', 'utf8');
const out = 'evidence/w9-3-3';
const screenshots = ['portrait-390x844','small-android-360x800','landscape-844x390']
  .flatMap(size => ['ready','running','approach','post-gate','result']
    .map(phase => path.join(out, size + '-' + phase + '.png')));
const missing = screenshots.filter(p => !fs.existsSync(p));
const assets = 'playtest-dist/3d/assets';
const bundles = fs.existsSync(assets) ? fs.readdirSync(assets)
  .filter(f => f.endsWith('.js'))
  .map(f => ({ file: f, bytes: fs.statSync(path.join(assets, f)).size })) : [];
const errors = [];
if (forbidden.length) errors.push('Frozen Factory/gameplay/public-churn: ' + forbidden.join(', '));
if (missing.length) errors.push('Missing browser screenshots: ' + missing.join(', '));
if (!source.includes('createSoftEnvironment(app.root)') || !source.includes('juice.update('))
  errors.push('Soft environment or presentation effect absent');
if (!scenery.includes("type: 'sphere'") || scenery.includes("type: 'box'"))
  errors.push('Environment must use genuinely curved geometry');
if (!juice.includes('group.enabled = false') || !juice.includes('Math.max(0.001'))
  errors.push('Feedback must be bounded and reused, never an unbounded emitter');
if (source.includes("clone('tree'") || source.includes("clone('flag'"))
  errors.push('Unwanted angular Kenney props remain visible');
if (!fs.existsSync('playtest-dist/3d/index.html')) errors.push('Isolated 3D build absent');
const report = {
  marker: errors.length ? 'W9_3_3_SOFT_ENVIRONMENT_CONTRACT_FAIL' : 'W9_3_3_SOFT_ENVIRONMENT_CONTRACT_PASS',
  base, changed, screenshots: screenshots.length - missing.length, bundleJs: bundles, errors,
  humanAndroidReview: 'PENDING', visualReview: 'PENDING'
};
fs.mkdirSync(out, {recursive:true});
fs.writeFileSync(path.join(out,'contract.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if (errors.length) throw new Error(errors.join('; '));
console.log(report.marker);
