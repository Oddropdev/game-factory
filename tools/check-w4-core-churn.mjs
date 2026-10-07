import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const baseSha = process.env.W4_BASE_SHA;
if (!baseSha) {
  throw new Error('W4_BASE_SHA is required');
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

const foundationPrefixes = [
  'src/core/',
  'src/platform/',
  'src/runtime/',
  'src/testing/'
];

const priorGamePrefixes = [
  'src/games/runner/',
  'src/games/collector/'
];

const foundationChurn = changedFiles.filter(file =>
  foundationPrefixes.some(prefix => file.startsWith(prefix))
);

const priorGameChurn = changedFiles.filter(file =>
  priorGamePrefixes.some(prefix => file.startsWith(prefix))
);

const physicsFiles = changedFiles.filter(file =>
  file.startsWith('src/games/physics/')
);

const failed = foundationChurn.length > 0 || priorGameChurn.length > 0;

const report = {
  marker: failed
    ? 'W4_NEW_GAME_CORE_CHURN_FAIL'
    : 'W4_NEW_GAME_CORE_CHURN_PASS',
  baseSha,
  headSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  changedFileCount: changedFiles.length,
  physicsFileCount: physicsFiles.length,
  foundationChurnCount: foundationChurn.length,
  priorGameChurnCount: priorGameChurn.length,
  foundationChurn,
  priorGameChurn,
  changedFiles
};

const evidenceDir = path.resolve('evidence/w4');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(
  path.join(evidenceDir, 'core-churn.json'),
  JSON.stringify(report, null, 2) + '\n'
);
fs.writeFileSync(
  path.join(evidenceDir, 'core-churn.md'),
  [
    '# W4 New Game Core Churn',
    '',
    `Status: **${failed ? 'FAIL' : 'PASS'}**`,
    '',
    `- changed files: ${changedFiles.length}`,
    `- physics-specific production files: ${physicsFiles.length}`,
    `- shared foundation files changed: ${foundationChurn.length}`,
    `- prior game production files changed: ${priorGameChurn.length}`,
    '',
    report.marker,
    '',
    foundationChurn.length
      ? foundationChurn.map(file => `- shared: ${file}`).join('\n')
      : 'No changes under src/core, src/platform, src/runtime, or src/testing.',
    priorGameChurn.length
      ? priorGameChurn.map(file => `- prior game: ${file}`).join('\n')
      : 'No changes under src/games/runner or src/games/collector.',
    ''
  ].join('\n')
);

console.log(JSON.stringify(report, null, 2));

if (failed) {
  throw new Error(
    `W4 churn gate failed: shared=[${foundationChurn.join(', ')}] prior=[${priorGameChurn.join(', ')}]`
  );
}

console.log('W4_NEW_GAME_CORE_CHURN_PASS');
