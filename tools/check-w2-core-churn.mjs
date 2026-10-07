import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const baseSha = process.env.W2_BASE_SHA;
if (!baseSha) {
  throw new Error('W2_BASE_SHA is required');
}

const output = execFileSync(
  'git',
  ['diff', '--name-only', `${baseSha}...HEAD`],
  { encoding: 'utf8' }
);

const changedFiles = output
  .split(/\r?\n/u)
  .map(file => file.trim())
  .filter(Boolean);

const protectedPrefixes = [
  'src/core/',
  'src/platform/',
  'src/runtime/',
  'src/testing/'
];

const foundationChurn = changedFiles.filter(file =>
  protectedPrefixes.some(prefix => file.startsWith(prefix))
);

const runnerFiles = changedFiles.filter(file => file.startsWith('src/games/runner/'));

const report = {
  marker:
    foundationChurn.length === 0
      ? 'W2_NEW_GAME_CORE_CHURN_PASS'
      : 'W2_NEW_GAME_CORE_CHURN_FAIL',
  baseSha,
  headSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  changedFileCount: changedFiles.length,
  runnerFileCount: runnerFiles.length,
  foundationChurnCount: foundationChurn.length,
  foundationChurn,
  changedFiles
};

const evidenceDir = path.resolve('evidence/w2');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(
  path.join(evidenceDir, 'core-churn.json'),
  JSON.stringify(report, null, 2) + '\n'
);
fs.writeFileSync(
  path.join(evidenceDir, 'core-churn.md'),
  [
    '# W2 New Game Core Churn',
    '',
    `Status: **${foundationChurn.length === 0 ? 'PASS' : 'FAIL'}**`,
    '',
    `- changed files: ${changedFiles.length}`,
    `- runner-specific production files: ${runnerFiles.length}`,
    `- shared foundation files changed: ${foundationChurn.length}`,
    '',
    report.marker,
    '',
    foundationChurn.length
      ? foundationChurn.map(file => `- ${file}`).join('\n')
      : 'No changes under src/core, src/platform, src/runtime, or src/testing.',
    ''
  ].join('\n')
);

console.log(JSON.stringify(report, null, 2));

if (foundationChurn.length > 0) {
  throw new Error(
    `W2 core churn gate failed: ${foundationChurn.join(', ')}`
  );
}

console.log('W2_NEW_GAME_CORE_CHURN_PASS');
