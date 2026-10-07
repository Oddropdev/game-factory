import fs from 'node:fs';
import path from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const DIST = path.resolve('dist');
const EVIDENCE = path.resolve('evidence/w1');
const TOTAL_BUDGET = 500 * 1024;
const MAIN_JS_GZIP_BUDGET = 150 * 1024;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

if (!fs.existsSync(DIST)) {
  throw new Error('dist/ does not exist; run npm run build first');
}

const files = walk(DIST);
const jsFiles = files.filter(file => /\.m?js$/u.test(file));
const mainJs = [...jsFiles].sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];

if (!mainJs) {
  throw new Error('No JavaScript artifact found in dist/');
}

const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const mainBytes = fs.readFileSync(mainJs);
const mainJsBytes = mainBytes.length;
const mainJsGzipBytes = gzipSync(mainBytes).length;
const mainJsBrotliBytes = brotliCompressSync(mainBytes).length;

const externalRuntimeReferences = [];

for (const file of files.filter(file => /\.(?:html|css|m?js)$/u.test(file))) {
  const text = fs.readFileSync(file, 'utf8');

  const patterns = [
    /(?:src|href)\s*=\s*["']https?:\/\/[^"']+["']/giu,
    /url\(\s*["']?https?:\/\/[^)"']+/giu,
    /(?:fetch|import)\s*\(\s*["']https?:\/\//giu
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      externalRuntimeReferences.push({
        file: path.relative(DIST, file),
        match: match[0]
      });
    }
  }
}

const report = {
  marker: 'W1_ARTIFACT_BUDGET_PASS',
  generatedAt: new Date().toISOString(),
  budgets: {
    totalBytes: TOTAL_BUDGET,
    mainJsGzipBytes: MAIN_JS_GZIP_BUDGET
  },
  actual: {
    totalBytes,
    mainJsBytes,
    mainJsGzipBytes,
    mainJsBrotliBytes,
    mainJs: path.relative(DIST, mainJs),
    fileCount: files.length
  },
  externalRuntimeReferences
};

const failures = [];

if (totalBytes >= TOTAL_BUDGET) {
  failures.push(`artifact total ${totalBytes} >= ${TOTAL_BUDGET}`);
}

if (mainJsGzipBytes >= MAIN_JS_GZIP_BUDGET) {
  failures.push(`main JS gzip ${mainJsGzipBytes} >= ${MAIN_JS_GZIP_BUDGET}`);
}

if (externalRuntimeReferences.length > 0) {
  failures.push(`found ${externalRuntimeReferences.length} external runtime reference(s)`);
}

fs.mkdirSync(EVIDENCE, { recursive: true });
fs.writeFileSync(
  path.join(EVIDENCE, 'artifact.json'),
  JSON.stringify({ ...report, marker: failures.length === 0 ? report.marker : 'W1_ARTIFACT_BUDGET_FAIL', failures }, null, 2) + '\n'
);

fs.writeFileSync(
  path.join(EVIDENCE, 'artifact.md'),
  [
    '# W1 Artifact Evidence',
    '',
    `Status: **${failures.length === 0 ? 'PASS' : 'FAIL'}**`,
    '',
    `- total artifact: ${totalBytes} bytes / budget < ${TOTAL_BUDGET}`,
    `- main JS: ${mainJsBytes} bytes`,
    `- main JS gzip: ${mainJsGzipBytes} bytes / budget < ${MAIN_JS_GZIP_BUDGET}`,
    `- main JS Brotli: ${mainJsBrotliBytes} bytes`,
    `- files: ${files.length}`,
    `- external runtime references: ${externalRuntimeReferences.length}`,
    '',
    failures.length === 0 ? 'W1_ARTIFACT_BUDGET_PASS' : failures.map(failure => `- ${failure}`).join('\n'),
    ''
  ].join('\n')
);

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  throw new Error(`W1 artifact gate failed: ${failures.join('; ')}`);
}

console.log('W1_ARTIFACT_BUDGET_PASS');
