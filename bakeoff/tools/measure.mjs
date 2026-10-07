import fs from 'node:fs';
import path from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const candidate = process.argv[2];
if (!candidate || !['phaser', 'littlejs'].includes(candidate)) {
  throw new Error('Usage: node bakeoff/tools/measure.mjs <phaser|littlejs>');
}

const root = path.resolve('bakeoff', candidate);
const started = performance.now();
const build = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env
});
const buildMs = Math.round(performance.now() - started);
if (build.status !== 0) process.exit(build.status ?? 1);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const distFiles = walk(path.join(root, 'dist'));
const sourceFiles = walk(path.join(root, 'src')).filter(file => /\.(ts|tsx|js|mjs)$/.test(file));
const jsFiles = distFiles.filter(file => /\.m?js$/.test(file));
const mainJs = jsFiles.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0] ?? null;
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const loc = sourceFiles.reduce((sum, file) => {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(line => line.trim().length > 0);
  return sum + lines.length;
}, 0);

const metrics = {
  candidate,
  engineVersion: packageJson.dependencies,
  buildMs,
  productionSourceFiles: sourceFiles.length,
  productionNonBlankLoc: loc,
  directProductionDependencies: Object.keys(packageJson.dependencies ?? {}).length,
  artifactBytes: distFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0),
  mainJsBytes: mainJs ? fs.statSync(mainJs).size : 0,
  mainJsGzipBytes: mainJs ? gzipSync(fs.readFileSync(mainJs)).length : 0,
  mainJsBrotliBytes: mainJs ? brotliCompressSync(fs.readFileSync(mainJs)).length : 0
};

const outDir = path.resolve('bakeoff/results');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${candidate}.json`), JSON.stringify(metrics, null, 2) + '\n');
console.log('BAKEOFF_METRICS=' + JSON.stringify(metrics));
