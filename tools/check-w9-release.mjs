import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.W9_BASE_SHA;
if (!base) throw new Error('Set W9_BASE_SHA to accepted W8.3 main head');
const changes = execFileSync(
  'git', ['diff', '--name-only', `${base}...HEAD`],
  { encoding: 'utf8' }
).split(/\r?\n/u).map(s => s.trim()).filter(Boolean);

const productionChanges = changes.filter(p =>
  p.startsWith('src/') || p === 'index.html'
);
const pathToHtml = path.resolve('playtest-dist/index.html');
const pathToFeedback = path.resolve('playtest-dist/feedback.html');
const required = [
  pathToHtml,
  pathToFeedback,
  path.resolve('playtest-manifest.json')
];
const missing = required.filter(p => !fs.existsSync(p));
const failures = [];
if (productionChanges.length) failures.push(
  `W9.1 must not change accepted game production code: ${productionChanges.join(', ')}`
);
if (missing.length) failures.push(
  `missing W9 package file(s): ${missing.join(', ')}`
);

if (!missing.length) {
  const html = fs.readFileSync(pathToHtml, 'utf8');
  const feedback = fs.readFileSync(pathToFeedback, 'utf8');
  const modulePos = html.indexOf('<script type="module"');
  const selectorPos = html.indexOf('url.searchParams.set("game", "mass-runner")');
  if (
    selectorPos < 0 ||
    modulePos < 0 ||
    selectorPos >= modulePos
  ) failures.push('playtest must pick Mass Runner before game module loads');
  if (html.indexOf('window.__GAME_FACTORY_PLATFORM__="web"') < 0) {
    failures.push('W9 package must explicitly use the accepted web platform');
  }
  if (/(?:src|href)=["']\/assets\//u.test(html)) {
    failures.push('absolute asset paths would break GitHub Pages/itch embeds');
  }
  if (!html.includes('<title>Mass Runner — W9 Playtest</title>')) {
    failures.push('game title must identify the user-facing release');
  }
  if (/<(?:script|img)[^>]+src=["']https?:\/\//iu.test(html)) {
    failures.push('playtest must have no external runtime scripts');
  }
  if (/fetch\(|XMLHttpRequest|sendBeacon|localStorage|gtag\(|fbq\(|<form[^>]+action=/iu.test(feedback)) {
    failures.push('feedback must stay manual, local and untracked');
  }
  if (!feedback.includes('navigator.clipboard')) {
    failures.push('feedback must be copyable without backend');
  }
}
const report = {
  marker: failures.length
    ? 'W9_1_PLAYTEST_RELEASE_CONTRACT_FAIL'
    : 'W9_1_PLAYTEST_RELEASE_CONTRACT_PASS',
  base,
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  productionChurnCount: productionChanges.length,
  changedFiles: changes,
  failures
};
const dir = path.resolve('evidence/w9');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  path.join(dir, 'w9-1-release-contract.json'),
  JSON.stringify(report, null, 2) + '\n'
);
console.log(JSON.stringify(report, null, 2));
if (failures.length) throw new Error(failures.join('; '));
console.log(report.marker);
