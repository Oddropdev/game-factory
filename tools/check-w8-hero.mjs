import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const baseSha = process.env.W8_BASE_SHA;
if (!baseSha) {
  throw new Error('W8_BASE_SHA is required');
}

const changedFiles = execFileSync(
  'git',
  ['diff', '--name-only', `${baseSha}...HEAD`],
  { encoding: 'utf8' }
)
  .split(/\r?\n/u)
  .map(file => file.trim())
  .filter(Boolean);

const protectedPrefixes = [
  'src/core/',
  'src/platform/',
  'src/runtime/',
  'src/testing/',
  'src/factory/',
  'src/games/runner/',
  'src/games/collector/',
  'src/games/physics/'
];

const protectedChurn = changedFiles.filter(file =>
  protectedPrefixes.some(prefix => file.startsWith(prefix))
);

const massRunnerProduction = changedFiles.filter(file =>
  file.startsWith('src/games/mass-runner/')
);

const failures = [];

if (protectedChurn.length > 0) {
  failures.push(
    `protected production churn: ${protectedChurn.join(', ')}`
  );
}

for (const required of [
  'src/games/mass-runner/MassRunnerPresentation.ts',
  'tests/unit/massRunnerPresentation.test.ts',
  'tests/feel/w8-hero-slice.spec.ts',
  'docs/research/W8.1-REFERENCE-MINING.md'
]) {
  if (!fs.existsSync(path.resolve(required))) {
    failures.push(`missing W8.1 artifact: ${required}`);
  }
}

const massRunnerText = massRunnerProduction
  .filter(file => fs.existsSync(file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');

if (/AudioContext|webkitAudioContext|\.mp3|\.wav|\.ogg/iu.test(massRunnerText)) {
  failures.push(
    'W8.1 visual hero slice must not introduce production audio before W8.2 audio boundary work'
  );
}

if (!massRunnerText.includes("presentationMode")) {
  failures.push('baseline/polished presentation A/B mode missing');
}

const report = {
  marker:
    failures.length === 0
      ? 'W8_1_HERO_SLICE_CONTRACT_PASS'
      : 'W8_1_HERO_SLICE_CONTRACT_FAIL',
  baseSha,
  headSha: execFileSync(
    'git',
    ['rev-parse', 'HEAD'],
    { encoding: 'utf8' }
  ).trim(),
  changedFileCount: changedFiles.length,
  massRunnerProductionFileCount: massRunnerProduction.length,
  protectedProductionChurnCount: protectedChurn.length,
  protectedChurn,
  failures
};

const evidenceDir = path.resolve('evidence/w8');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(
  path.join(evidenceDir, 'hero-contract.json'),
  JSON.stringify(report, null, 2) + '\n'
);
fs.writeFileSync(
  path.join(evidenceDir, 'hero-contract.md'),
  [
    '# W8.1 Hero Slice Contract',
    '',
    `Status: **${failures.length === 0 ? 'PASS' : 'FAIL'}**`,
    '',
    `- changed files: ${changedFiles.length}`,
    `- Mass Runner production files touched: ${massRunnerProduction.length}`,
    `- protected production churn: ${protectedChurn.length}`,
    '',
    report.marker,
    '',
    ...failures.map(failure => `- ${failure}`),
    ''
  ].join('\n')
);

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  throw new Error(
    `W8.1 hero gate failed: ${failures.join('; ')}`
  );
}

console.log('W8_1_HERO_SLICE_CONTRACT_PASS');
