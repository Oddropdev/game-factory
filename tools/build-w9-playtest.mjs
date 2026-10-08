import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'dist-platforms', 'web');
const output = path.join(root, 'playtest-dist');
const entry = path.join(source, 'index.html');
if (!fs.existsSync(entry)) {
  throw new Error(
    'W9 requires the accepted Web distribution. Run npm run build && npm run package:distributions.'
  );
}

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });

const htmlPath = path.join(output, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const originalTitle = '<title>Game Factory Foundation</title>';
if (!html.includes(originalTitle)) {
  throw new Error('Unexpected Web index: cannot safely set W9 identity');
}
html = html.replace(
  originalTitle,
  [
    '<title>Mass Runner — W9 Playtest</title>',
    '    <meta name="description" content="Mass Runner — early mobile browser playtest.">',
    '    <meta name="robots" content="noindex,nofollow">'
  ].join('\n')
);

const moduleTag = '<script type="module"';
if (!html.includes(moduleTag)) {
  throw new Error('Expected Web bundle module script is absent');
}
// Dedicated exported entry only: main factory default remains the runner proof.
const selector = [
  '    <script>',
  '      (() => {',
  '        const url = new URL(window.location.href);',
  '        if (url.searchParams.get("game") !== "mass-runner") {',
  '          url.searchParams.set("game", "mass-runner");',
  '          window.history.replaceState(null, "", url);',
  '        }',
  '      })();',
  '    </script>',
  '    '
].join('\n');
html = html.replace(moduleTag, selector + moduleTag);
if (/\b(?:src|href)="\/assets\//u.test(html)) {
  throw new Error('Absolute asset paths would break subpath hosting');
}
fs.writeFileSync(htmlPath, html, 'utf8');

const template = path.join(root, 'tools', 'templates', 'w9-feedback.html');
if (!fs.existsSync(template)) {
  throw new Error('Missing W9 static feedback template');
}
fs.copyFileSync(template, path.join(output, 'feedback.html'));

const report = {
  marker: 'W9_1_PLAYTEST_PACKAGE_PASS',
  entry: 'playtest-dist/index.html',
  feedback: 'playtest-dist/feedback.html',
  requiresBackend: false,
  trackedUserEvents: false,
  publicDeploymentPerformed: false
};
fs.writeFileSync(
  path.join(root, 'playtest-manifest.json'),
  JSON.stringify(report, null, 2) + '\n'
);
console.log(JSON.stringify(report, null, 2));
