import fs from 'node:fs';
import path from 'node:path';

const manifest = JSON.parse(fs.readFileSync(
  new URL('../spikes/w9-playcanvas/asset-manifest.json', import.meta.url), 'utf8'
));
const root = path.resolve('spikes/w9-playcanvas/public/models');
fs.mkdirSync(root, { recursive: true });
const report = [];
for (const file of manifest.files) {
  const destination = path.join(root, file.id + '.glb');
  let bytes;
  if (fs.existsSync(destination)) {
    bytes = fs.readFileSync(destination);
  } else {
    const url = `https://raw.githubusercontent.com/${manifest.upstream}/${manifest.commit}/${file.path}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error(`Pinned CC0 download failed: ${file.id} HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (bytes.toString('ascii', 0, 4) !== 'glTF') {
    throw new Error(`Not a binary glTF: ${file.id}`);
  }
  if (bytes.length !== file.size || bytes.length < 1000 || bytes.length > 1_000_000) {
    throw new Error(`Unexpected CC0 model size: ${file.id} ${bytes.length}`);
  }
  if (bytes.readUInt32LE(8) !== bytes.length) {
    throw new Error(`GLB byte length mismatch: ${file.id}`);
  }
  fs.writeFileSync(destination, bytes);
  report.push({ file: file.id + '.glb', bytes: bytes.length, pinnedCommit: manifest.commit });
}
console.log(JSON.stringify({ marker: 'W9_2D_PINNED_CC0_ASSETS_PASS', files: report }, null, 2));
