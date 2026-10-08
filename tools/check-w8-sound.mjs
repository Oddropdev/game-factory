import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const baseSha = process.env.W8_BASE_SHA;
if (!baseSha) throw new Error('W8_BASE_SHA is required');

const changed = execFileSync(
  'git', ['diff', '--name-only', `${baseSha}...HEAD`],
  { encoding: 'utf8' }
).split(/\r?\n/u).map(x => x.trim()).filter(Boolean);

const allowedProduction = new Set([
  'src/main.ts',
  'src/factory/GameModule.ts'
]);
const forbidden = changed.filter(file =>
  file.startsWith('src/') &&
  !file.startsWith('src/games/mass-runner/') &&
  !allowedProduction.has(file)
);
const required = [
  'src/games/mass-runner/MassRunnerAudio.ts',
  'tests/unit/massRunnerAudio.test.ts',
  'tests/feel/w8-sound.spec.mjs',
  'docs/architecture/W8.2-SOUND-CONTRACT.md'
];
const missing = required.filter(file => !fs.existsSync(file));
const source = fs.readFileSync(
  'src/games/mass-runner/MassRunnerAudio.ts', 'utf8'
);
const main = fs.readFileSync('src/main.ts', 'utf8');
const capture = fs.readFileSync(
  'tests/feel/w8-hero-slice.spec.mjs', 'utf8'
);
const failures = [];
if (forbidden.length) failures.push(
  `unexpected protected production churn: ${forbidden.join(', ')}`
);
if (missing.length) failures.push(
  `missing evidence: ${missing.join(', ')}`
);
if (!main.includes('activeGame.setAudioEnabled?.(enabled)')) {
  failures.push('platform mute must be forwarded to game');
}
if (!source.includes('this.master.gain.setValueAtTime(')) {
  failures.push('existing sound tails must be muted immediately');
}
if (!source.includes('this.lastEffectId = effect.id;')) {
  failures.push('muted cues must advance identity cursor');
}
if (!capture.includes('&audio=off')) {
  failures.push('visual capture must explicitly opt out of audio');
}
if (/\.(?:mp3|wav|ogg)\b|fetch\(/iu.test(source)) {
  failures.push('external or copied audio files not allowed');
}

const report = {
  marker: failures.length
    ? 'W8_2_SOUND_IMPACT_CONTRACT_FAIL'
    : 'W8_2_SOUND_IMPACT_CONTRACT_PASS',
  baseSha,
  headSha: execFileSync(
    'git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }
  ).trim(),
  changedFileCount: changed.length,
  protectedProductionChanges: changed.filter(
    file => allowedProduction.has(file)
  ),
  otherProtectedChanges: forbidden,
  failures
};
const directory = path.resolve('evidence/w8');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(
  path.join(directory, 'w8-2-sound-contract.json'),
  JSON.stringify(report, null, 2) + '\n'
);
console.log(JSON.stringify(report, null, 2));
if (failures.length) throw new Error(failures.join('; '));
console.log(report.marker);
