import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist-platforms');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const failures = [];
const platforms = ['web', 'youtube', 'playable-ad'];

for (const platform of platforms) {
  const indexPath = path.join(DIST, platform, 'index.html');

  if (!fs.existsSync(indexPath)) {
    failures.push(`missing distribution wrapper: ${platform}/index.html`);
    continue;
  }

  const html = read(indexPath);
  const moduleIndex = html.indexOf('<script type="module"');
  const platformMarker =
    `window.__GAME_FACTORY_PLATFORM__="${platform}"`;
  const platformIndex = html.indexOf(platformMarker);

  if (moduleIndex < 0) {
    failures.push(`${platform}: module script missing`);
  }

  if (platformIndex < 0 || platformIndex > moduleIndex) {
    failures.push(
      `${platform}: platform marker must load before game module`
    );
  }

  if (/=["']\/assets\//u.test(html)) {
    failures.push(`${platform}: root-absolute asset path found`);
  }

  const externalScripts = [
    ...html.matchAll(/<script[^>]+src=["'](https?:\/\/[^"']+)["']/giu)
  ].map(match => match[1]);

  if (platform === 'youtube') {
    const sdkUrl = 'https://www.youtube.com/game_api/v1';
    const sdkIndex = html.indexOf(sdkUrl);

    if (sdkIndex < 0 || sdkIndex > moduleIndex) {
      failures.push(
        'youtube: official Playables SDK must load before game module'
      );
    }

    if (
      externalScripts.length !== 1 ||
      externalScripts[0] !== sdkUrl
    ) {
      failures.push(
        `youtube: unexpected external scripts: ${externalScripts.join(', ')}`
      );
    }
  } else if (externalScripts.length > 0) {
    failures.push(
      `${platform}: external runtime scripts are not allowed: ${externalScripts.join(', ')}`
    );
  }
}

const gameFiles = walk(path.join(SOURCE, 'games')).filter(
  file => file.endsWith('.ts')
);
const forbiddenGameTokens =
  /ytgame|youtube|game_api|mraid|playable-ad|PlatformBridge/iu;

for (const file of gameFiles) {
  const text = read(file);

  if (forbiddenGameTokens.test(text)) {
    failures.push(
      `platform SDK/detail leaked into gameplay: ${path.relative(ROOT, file)}`
    );
  }
}

const lifecycle = read(
  path.join(SOURCE, 'runtime/LifecycleRuntime.ts')
);

if (/visibilitychange|document\.hidden/u.test(lifecycle)) {
  failures.push(
    'LifecycleRuntime must not own Page Visibility API after W6'
  );
}

const webPlatform = read(
  path.join(SOURCE, 'platform/WebPlatform.ts')
);

if (
  !webPlatform.includes('visibilitychange') ||
  !webPlatform.includes('document.hidden')
) {
  failures.push(
    'WebPlatform must own standalone Page Visibility lifecycle'
  );
}

const youtubePlatform = read(
  path.join(SOURCE, 'platform/youtube/YouTubePlatform.ts')
);

for (const required of [
  'firstFrameReady',
  'gameReady',
  'onPause',
  'onResume',
  'isAudioEnabled',
  'onAudioEnabledChange'
]) {
  if (!youtubePlatform.includes(required)) {
    failures.push(
      `YouTubePlatform missing required SDK boundary: ${required}`
    );
  }
}

if (/visibilitychange|document\.hidden/u.test(youtubePlatform)) {
  failures.push(
    'YouTubePlatform must not use Page Visibility API'
  );
}

const platformSourceFiles = walk(
  path.join(SOURCE, 'platform')
).filter(file => file.endsWith('.ts'));

for (const file of walk(SOURCE).filter(file => file.endsWith('.ts'))) {
  const relative = path.relative(ROOT, file);

  if (
    /ytgame|game_api/iu.test(read(file)) &&
    !platformSourceFiles.includes(file)
  ) {
    failures.push(
      `YouTube SDK reference escaped src/platform: ${relative}`
    );
  }
}

const report = {
  marker:
    failures.length === 0
      ? 'W6_DISTRIBUTION_ADAPTERS_CONTRACT_PASS'
      : 'W6_DISTRIBUTION_ADAPTERS_CONTRACT_FAIL',
  platforms,
  gameFilesChecked: gameFiles.length,
  failures
};

const evidenceDir = path.join(ROOT, 'evidence/w6');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(
  path.join(evidenceDir, 'distribution.json'),
  JSON.stringify(report, null, 2) + '\n'
);
fs.writeFileSync(
  path.join(evidenceDir, 'distribution.md'),
  [
    '# W6 Distribution Adapter Evidence',
    '',
    `Status: **${failures.length === 0 ? 'PASS' : 'FAIL'}**`,
    '',
    '- standalone Web wrapper checked',
    '- YouTube Playables wrapper checked',
    '- generic playable-ad wrapper checked',
    `- gameplay source files checked for SDK leakage: ${gameFiles.length}`,
    '',
    failures.length === 0
      ? 'W6_DISTRIBUTION_ADAPTERS_CONTRACT_PASS'
      : failures.map(failure => `- ${failure}`).join('\n'),
    ''
  ].join('\n')
);

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  throw new Error(
    `W6 distribution gate failed: ${failures.join('; ')}`
  );
}

console.log('W6_DISTRIBUTION_ADAPTERS_CONTRACT_PASS');
