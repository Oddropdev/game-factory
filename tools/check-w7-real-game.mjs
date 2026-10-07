import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const baseSha = process.env.W7_BASE_SHA;
if (!baseSha) {
  throw new Error('W7_BASE_SHA is required');
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

const massRunnerText = massRunnerProduction
  .filter(file => fs.existsSync(file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');

const failures = [];

if (protectedChurn.length > 0) {
  failures.push(
    `protected production churn: ${protectedChurn.join(', ')}`
  );
}

if (massRunnerProduction.length < 4) {
  failures.push(
    `expected at least 4 Mass Runner production files, found ${massRunnerProduction.length}`
  );
}

if (!fs.existsSync('src/games/mass-runner/MassRunnerLevels.ts')) {
  failures.push('MassRunnerLevels.ts missing');
}

if (!/MASS_RUNNER_LEVELS[\s\S]*bulk-up[\s\S]*massive-finish/u.test(massRunnerText)) {
  failures.push('five-level authored Mass Runner content not detected');
}

if (/W7\s*\/|PROOF/i.test(massRunnerText)) {
  failures.push('proof/debug labeling leaked into real-game production source');
}

if (/ytgame|game_api|mraid|PlatformBridge/iu.test(massRunnerText)) {
  failures.push('distribution detail leaked into Mass Runner gameplay');
}

const report = {
  marker:
    failures.length === 0
      ? 'W7_FIRST_REAL_GAME_CONTRACT_PASS'
      : 'W7_FIRST_REAL_GAME_CONTRACT_FAIL',
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

const evidenceDir = path.resolve('evidence/w7');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(
  path.join(evidenceDir, 'real-game-contract.json'),
  JSON.stringify(report, null, 2) + '\n'
);
fs.writeFileSync(
  path.join(evidenceDir, 'real-game-contract.md'),
  [
    '# W7 First Real Game Contract',
    '',
    `Status: **${failures.length === 0 ? 'PASS' : 'FAIL'}**`,
    '',
    `- changed files: ${changedFiles.length}`,
    `- Mass Runner production files: ${massRunnerProduction.length}`,
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
    `W7 real-game gate failed: ${failures.join('; ')}`
  );
}

console.log('W7_FIRST_REAL_GAME_CONTRACT_PASS');
