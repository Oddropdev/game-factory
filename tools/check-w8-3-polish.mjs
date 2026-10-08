import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const baseSha = process.env.W8_BASE_SHA;
if (!baseSha) throw new Error('W8_BASE_SHA required');
const changed = execFileSync(
  'git', ['diff', '--name-only', `${baseSha}...HEAD`],
  { encoding: 'utf8' }
).split(/\r?\n/u).map(x => x.trim()).filter(Boolean);

const violations = changed.filter(file =>
  file.startsWith('src/') &&
  !file.startsWith('src/games/mass-runner/')
);
const forbiddenGameplay = changed.filter(file =>
  ['MassRunnerModel.ts', 'MassRunnerLevels.ts',
    'MassRunnerFeelRoute.ts', 'MassRunnerAudio.ts']
    .some(name => file.endsWith('/' + name))
);
const required = [
  'src/games/mass-runner/MassRunnerLevelVisuals.ts',
  'tests/unit/massRunnerLevelVisuals.test.ts',
  'tests/feel/w8-3-full-session.spec.mjs',
  'docs/architecture/W8.3-RELEASE-POLISH-CONTRACT.md'
];
const missing = required.filter(file => !fs.existsSync(file));
const failures = [];
if (violations.length) failures.push(
  `protected production churn: ${violations.join(', ')}`
);
if (forbiddenGameplay.length) failures.push(
  `frozen gameplay/audio route changed: ${forbiddenGameplay.join(', ')}`
);
if (missing.length) failures.push(
  `missing deliverables: ${missing.join(', ')}`
);
const report = {
  marker: failures.length
    ? 'W8_3_FULL_SESSION_CONTRACT_FAIL'
    : 'W8_3_FULL_SESSION_CONTRACT_PASS',
  baseSha, changedFiles: changed,
  protectedProductionChurn: violations.length,
  gameplaySemanticsChanged: forbiddenGameplay.length,
  failures
};
const out = path.resolve('evidence/w8-3');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, 'w8-3-contract.json'),
  JSON.stringify(report, null, 2) + '\n'
);
console.log(JSON.stringify(report, null, 2));
if (failures.length) throw new Error(failures.join('; '));
console.log(report.marker);
