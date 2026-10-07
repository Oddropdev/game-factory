import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const OUTPUT = path.join(ROOT, 'dist-platforms');

const platforms = [
  {
    id: 'web',
    scripts: [
      '<script>window.__GAME_FACTORY_PLATFORM__="web";</script>'
    ]
  },
  {
    id: 'youtube',
    scripts: [
      '<script src="https://www.youtube.com/game_api/v1"></script>',
      '<script>window.__GAME_FACTORY_PLATFORM__="youtube";</script>'
    ]
  },
  {
    id: 'playable-ad',
    scripts: [
      '<script>window.__GAME_FACTORY_PLATFORM__="playable-ad";</script>'
    ]
  }
];

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  throw new Error('dist/index.html missing; run npm run build first');
}

fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT, { recursive: true });

for (const platform of platforms) {
  const target = path.join(OUTPUT, platform.id);
  fs.cpSync(DIST, target, { recursive: true });

  const indexPath = path.join(target, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  html = html
    .replaceAll('src="/assets/', 'src="./assets/')
    .replaceAll('href="/assets/', 'href="./assets/');

  const moduleIndex = html.indexOf('<script type="module"');

  if (moduleIndex < 0) {
    throw new Error(
      `module script missing in built index for ${platform.id}`
    );
  }

  const prefix = platform.scripts.map(script => `    ${script}\n`).join('');
  html =
    html.slice(0, moduleIndex) +
    prefix +
    html.slice(moduleIndex);

  fs.writeFileSync(indexPath, html);
}

console.log('W6_DISTRIBUTION_PACKAGES_BUILT');
