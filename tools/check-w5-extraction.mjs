import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('src');
const mainPath = path.join(source, 'main.ts');
const viewportPath = path.join(source, 'runtime/ViewportRuntime.ts');
const modulePath = path.join(source, 'factory/GameModule.ts');
const registryPath = path.join(source, 'factory/GameRegistry.ts');

const gamePaths = [
  path.join(source, 'games/runner/RunnerGame.ts'),
  path.join(source, 'games/collector/CollectorGame.ts'),
  path.join(source, 'games/physics/PhysicsGame.ts')
];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function nonEmptyLoc(text) {
  return text
    .split(/\r?\n/u)
    .filter(line => line.trim().length > 0).length;
}

function matches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

const main = read(mainPath);
const viewport = read(viewportPath);
const gameModule = read(modulePath);
const registry = read(registryPath);
const games = gamePaths.map(read);

const actual = {
  mainLoc: nonEmptyLoc(main),
  mainGameModeBranches:
    matches(main, /gameMode\s*===/gu) +
    matches(main, /requestedGame\s*===/gu),
  mainConcreteGameImports: matches(
    main,
    /\.\/games\/(?:runner|collector|physics)\//gu
  ),
  gameModuleImplementations: games.reduce(
    (sum, text) => sum + matches(text, /implements\s+GameModule/gu),
    0
  ),
  duplicateNormalizedYHelpers: games.reduce(
    (sum, text) =>
      sum +
      matches(text, /private\s+normalizedYToWorld/gu) +
      matches(text, /private\s+worldYToNormalized/gu),
    0
  ),
  duplicateVisibleHeightFormulae: games.reduce(
    (sum, text) =>
      sum + matches(text, /viewport\.height\s*\*\s*viewport\.worldWidth/gu),
    0
  ),
  registryIds: matches(
    registry,
    /['"](?:runner|collector|physics)['"]/gu
  )
};

const baseline = {
  mainLoc: 185,
  mainGameModeBranches: 12,
  mainConcreteGameImports: 6,
  gameModuleImplementations: 0,
  duplicateNormalizedYHelpers: 4,
  duplicateVisibleHeightFormulae: 3
};

const requiredViewportMethods = [
  'visibleWorldHeight(): number',
  'normalizedYToWorld(normalizedY: number): number',
  'worldYToNormalized(worldY: number): number'
];

const failures = [];

if (actual.mainLoc >= 120) {
  failures.push(`src/main.ts LOC ${actual.mainLoc} >= 120`);
}

if (actual.mainGameModeBranches !== 0) {
  failures.push(
    `src/main.ts still has ${actual.mainGameModeBranches} game-selection branches`
  );
}

if (actual.mainConcreteGameImports !== 0) {
  failures.push(
    `src/main.ts still imports ${actual.mainConcreteGameImports} concrete game modules`
  );
}

if (actual.gameModuleImplementations !== 3) {
  failures.push(
    `expected 3 GameModule implementations, found ${actual.gameModuleImplementations}`
  );
}

if (actual.duplicateNormalizedYHelpers !== 0) {
  failures.push(
    `game folders still contain ${actual.duplicateNormalizedYHelpers} duplicated Y projection helpers`
  );
}

if (actual.duplicateVisibleHeightFormulae !== 0) {
  failures.push(
    `game folders still contain ${actual.duplicateVisibleHeightFormulae} duplicated visible-height formulae`
  );
}

for (const method of requiredViewportMethods) {
  if (!viewport.includes(method)) {
    failures.push(`ViewportRuntime missing extracted method: ${method}`);
  }
}

if (!gameModule.includes('export interface GameModule')) {
  failures.push('GameModule contract missing');
}

if (!registry.includes("export const GAME_IDS = ['runner', 'collector', 'physics'] as const")) {
  failures.push('GameRegistry does not expose the accepted three-family registry');
}

const forbidden = [
  'src/mechanics',
  'src/ecs',
  'src/GameSpec.ts',
  'src/LevelSpec.ts'
].filter(candidate => fs.existsSync(path.resolve(candidate)));

if (forbidden.length > 0) {
  failures.push(`premature abstraction paths found: ${forbidden.join(', ')}`);
}

const report = {
  marker:
    failures.length === 0
      ? 'W5_FACTORY_EXTRACTION_CONTRACT_PASS'
      : 'W5_FACTORY_EXTRACTION_CONTRACT_FAIL',
  baseline,
  actual,
  reductions: {
    mainLoc: baseline.mainLoc - actual.mainLoc,
    mainGameModeBranches:
      baseline.mainGameModeBranches - actual.mainGameModeBranches,
    duplicateNormalizedYHelpers:
      baseline.duplicateNormalizedYHelpers -
      actual.duplicateNormalizedYHelpers,
    duplicateVisibleHeightFormulae:
      baseline.duplicateVisibleHeightFormulae -
      actual.duplicateVisibleHeightFormulae
  },
  failures
};

const evidenceDir = path.resolve('evidence/w5');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(
  path.join(evidenceDir, 'extraction.json'),
  JSON.stringify(report, null, 2) + '\n'
);
fs.writeFileSync(
  path.join(evidenceDir, 'extraction.md'),
  [
    '# W5 Factory Extraction Evidence',
    '',
    `Status: **${failures.length === 0 ? 'PASS' : 'FAIL'}**`,
    '',
    `- main.ts LOC: ${baseline.mainLoc} → ${actual.mainLoc}`,
    `- main game-selection branches: ${baseline.mainGameModeBranches} → ${actual.mainGameModeBranches}`,
    `- concrete game imports in main: ${baseline.mainConcreteGameImports} → ${actual.mainConcreteGameImports}`,
    `- GameModule implementations: ${actual.gameModuleImplementations}`,
    `- duplicated Y helpers: ${baseline.duplicateNormalizedYHelpers} → ${actual.duplicateNormalizedYHelpers}`,
    `- duplicated visible-height formulae: ${baseline.duplicateVisibleHeightFormulae} → ${actual.duplicateVisibleHeightFormulae}`,
    '',
    failures.length === 0
      ? 'W5_FACTORY_EXTRACTION_CONTRACT_PASS'
      : failures.map(failure => `- ${failure}`).join('\n'),
    ''
  ].join('\n')
);

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  throw new Error(
    `W5 extraction gate failed: ${failures.join('; ')}`
  );
}

console.log('W5_FACTORY_EXTRACTION_CONTRACT_PASS');
