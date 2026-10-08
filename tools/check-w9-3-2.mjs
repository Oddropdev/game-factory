import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.W9_3_2_BASE_SHA;
if (!base) throw new Error('W9.3-2 requires accepted main SHA');
const paths = execFileSync('git', ['diff', '--name-only', base + '...HEAD'], {
  encoding: 'utf8'
}).trim().split(/\r?\n/u).filter(Boolean);
const forbidden = paths.filter(p =>
  p.startsWith('src/') || p === 'package.json' ||
  p.startsWith('src/factory/') || p.startsWith('src/core/') ||
  p.startsWith('spikes/w9-playcanvas/asset-manifest.json') ||
  p.startsWith('.github/workflows/w9-playtest-publish.yml')
);
const out = 'evidence/w9-3-2';
const missing = [];
for (const size of ['portrait-390x844', 'small-android-360x800', 'landscape-844x390']) {
  for (const state of ['ready', 'approach', 'post-gate']) {
    const file = path.join(out, size + '-' + state + '.png');
    if (!fs.existsSync(file)) missing.push(file);
  }
}
const main = fs.readFileSync('spikes/w9-playcanvas/src/main.ts', 'utf8');
const shapes = fs.readFileSync('spikes/w9-playcanvas/src/SoftCourse.ts', 'utf8');
const errors = [];
if (forbidden.length) errors.push('Protected gameplay/platform churn: ' + forbidden.join(', '));
if (missing.length) errors.push('Missing real viewport images: ' + missing.join(', '));
if (!main.includes('createSoftPortal') || !main.includes('setBestLeft'))
  errors.push('Scene must use the real rounded gate and benefit colors');
if (!main.includes('createSoftTrack') || !main.includes('createSoftHazard'))
  errors.push('Track and hazards must use rounded geometry');
if (!shapes.includes("type: shape") || !shapes.includes("'capsule'"))
  errors.push('No real 3D capsule geometry found');
if (shapes.includes("type: 'box'"))
  errors.push('SoftCourse must not substitute hard boxes');
if (!fs.existsSync('playtest-dist/3d/index.html'))
  errors.push('Missing isolated PlayCanvas production build');

const assetsDir = path.join('playtest-dist/3d/assets');
const bundles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir)
  .filter(x => x.endsWith('.js'))
  .map(x => ({ name: x, bytes: fs.statSync(path.join(assetsDir, x)).size })) : [];
const report = {
  marker: errors.length ? 'W9_3_2_ROUNDED_COURSE_CONTRACT_FAIL'
    : 'W9_3_2_ROUNDED_COURSE_CONTRACT_PASS',
  base, changedFiles: paths, screenshotCount: 9 - missing.length, bundleJs: bundles, errors
};
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'contract.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (errors.length) throw new Error(errors.join('; '));
console.log(report.marker);
