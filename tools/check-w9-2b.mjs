import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.W9_2B_BASE_SHA;
if (!base) throw new Error('W9_2B_BASE_SHA required');
const changed = execFileSync('git', ['diff', '--name-only', base + '...HEAD'], {
  encoding: 'utf8'
}).trim().split(/\r?\n/u).filter(Boolean);
const forbidden = changed.filter(name =>
  name.startsWith('src/') &&
  !name.startsWith('src/games/mass-runner/')
);
const frozen = changed.filter(name =>
  [
    'src/games/mass-runner/MassRunnerLevels.ts',
    'src/games/mass-runner/MassRunnerPresentation.ts',
    'src/games/mass-runner/MassRunnerFeelRoute.ts'
  ].includes(name)
);
const missing = [
  'src/games/mass-runner/MassRunnerExperiment.ts',
  'src/games/mass-runner/MassRunner3DRenderer.ts',
  'tests/spike/w9-2b-3d.spec.mjs',
  'evidence/w9-2b/A-original.png',
  'evidence/w9-2b/B-fluid-2d.png',
  'evidence/w9-2b/C-real-webgl3d-portrait.png',
  'evidence/w9-2b/C-real-webgl3d-landscape.png'
].filter(name => !fs.existsSync(path.resolve(name)));
const game = fs.readFileSync('src/games/mass-runner/MassRunnerGame.ts', 'utf8');
const model = fs.readFileSync('src/games/mass-runner/MassRunnerModel.ts', 'utf8');
const three = fs.readFileSync('src/games/mass-runner/MassRunner3DRenderer.ts', 'utf8');
const failures = [];
if (forbidden.length) failures.push('shared factory churn: ' + forbidden.join(', '));
if (frozen.length) failures.push('frozen level/presentation semantics changed: ' + frozen.join(', '));
if (missing.length) failures.push('missing A/B/C build and evidence: ' + missing.join(', '));
if (!game.includes("this.experiment === 'a' ? 'original' : 'fluid'")) failures.push('A model path is not frozen');
if (!model.includes("steering: 'original' | 'fluid' = 'original'")) failures.push('original step API changed');
if (!three.includes("getContext('webgl2'") || !three.includes('gl.DEPTH_TEST')) failures.push('C must be real depth-tested WebGL2');
if (three.includes('https://') || three.includes('fetch(')) failures.push('3D must not need remote assets');
const report = {
  marker: failures.length ? 'W9_2B_3D_FEEL_SPIKE_CONTRACT_FAIL' : 'W9_2B_3D_FEEL_SPIKE_CONTRACT_PASS',
  frozenBase: base,
  changed, forbidden, frozen, missing, failures
};
fs.mkdirSync('evidence/w9-2b', { recursive: true });
fs.writeFileSync('evidence/w9-2b/contract.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (failures.length) throw new Error(failures.join('; '));
console.log(report.marker);
