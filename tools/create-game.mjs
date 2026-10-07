import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MARKERS = {
  imports: '// @factory:imports',
  ids: '  // @factory:ids',
  constructors: '  // @factory:constructors',
  entries: '    // @factory:entries'
};

function pascalCase(id) {
  return id
    .split(/[-_]/u)
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join('');
}

function camelCase(name) {
  return name[0].toLowerCase() + name.slice(1);
}

function assertGameId(id) {
  if (!/^[a-z][a-z0-9-]{1,39}$/u.test(id)) {
    throw new Error(
      'game id must be 2-40 chars: lowercase letters, numbers and hyphens'
    );
  }
}

function requireMarker(registry, marker) {
  if (!registry.includes(marker)) {
    throw new Error(`GameRegistry marker missing: ${marker}`);
  }
}

function insertBefore(text, marker, insertion) {
  requireMarker(text, marker);
  return text.replace(marker, `${insertion}\n${marker}`);
}

function gameTemplate(id, className) {
  return `import {
  drawRect,
  drawTextScreen,
  rgb,
  vec2
} from 'littlejsengine';
import type {
  FoundationGameState,
  GameInputFrame,
  GameModule
} from '../../factory/GameModule';
import type { ViewportRuntime } from '../../runtime/ViewportRuntime';

export type ${className}GameTestState = {
  ready: boolean;
  pointerEvents: number;
  restartCount: number;
  targetNormX: number;
  targetNormY: number;
};

export class ${className}Game implements GameModule {
  private ready = false;
  private pointerEvents = 0;
  private restartCount = 0;
  private targetNormX = 0.5;
  private targetNormY = 0.5;

  constructor(private readonly viewport: ViewportRuntime) {}

  init(): void {
    this.ready = true;
    this.pointerEvents = 0;
    this.targetNormX = 0.5;
    this.targetNormY = 0.5;
  }

  update(input: GameInputFrame): void {
    if (input.pointerPressed) {
      this.pointerEvents += 1;
    }

    if (input.pointerPressed || input.pointerDown) {
      this.targetNormX = this.viewport.worldXToNormalized(
        input.pointerWorldX
      );
      this.targetNormY = this.viewport.worldYToNormalized(
        input.pointerWorldY
      );
    }
  }

  render(): void {
    const height = this.viewport.visibleWorldHeight();
    const x = this.viewport.normalizedXToWorld(this.targetNormX);
    const y = this.viewport.normalizedYToWorld(this.targetNormY);

    drawRect(vec2(0, 0), vec2(10, height), rgb(0.07, 0.09, 0.13));
    drawRect(vec2(x, y), vec2(0.7), rgb(0.22, 0.74, 0.97));
  }

  renderHud(): void {
    drawTextScreen(
      '${id.toUpperCase()}',
      vec2(100, 30),
      20,
      rgb(1, 1, 1)
    );
  }

  restart(): void {
    this.restartCount += 1;
    this.pointerEvents = 0;
    this.targetNormX = 0.5;
    this.targetNormY = 0.5;
  }

  foundationState(): FoundationGameState {
    return {
      pointerEvents: this.pointerEvents,
      pointerNormX: this.targetNormX,
      restartCount: this.restartCount
    };
  }

  testState(): ${className}GameTestState {
    return {
      ready: this.ready,
      pointerEvents: this.pointerEvents,
      restartCount: this.restartCount,
      targetNormX: this.targetNormX,
      targetNormY: this.targetNormY
    };
  }
}
`;
}

function bridgeTemplate(id, className, globalName) {
  return `import type { ${className}GameTestState } from './${className}Game';

export type ${className}TestBridge = {
  getState(): ${className}GameTestState;
};

declare global {
  interface Window {
    ${globalName}: ${className}TestBridge;
  }
}

export function install${className}TestBridge(
  bridge: ${className}TestBridge
): void {
  window.${globalName} = bridge;
}
`;
}

function e2eTemplate(id, className, globalName) {
  return `import { expect, test } from '@playwright/test';
import type { ${className}TestBridge } from '../../src/games/${id}/${className}TestBridge';
import type { FoundationTestBridge } from '../../src/testing/TestBridge';

async function gameState(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          ${globalName}: ${className}TestBridge;
        }
      ).${globalName}.getState()
  );
}

test('${id} generated game contract', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?game=${id}');

  await expect.poll(async () => (await gameState(page)).ready).toBe(true);

  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();

  if (!box) {
    throw new Error('Canvas has no bounding box');
  }

  await page.mouse.click(
    box.x + box.width * 0.7,
    box.y + box.height * 0.35
  );

  await expect.poll(async () => (await gameState(page)).pointerEvents).toBe(1);

  await page.evaluate(() => {
    (
      window as unknown as {
        __GAME_FACTORY_TEST__: FoundationTestBridge;
      }
    ).__GAME_FACTORY_TEST__.restart();
  });

  await expect.poll(async () => (await gameState(page)).restartCount).toBe(1);

  const reset = await gameState(page);
  expect(reset.pointerEvents).toBe(0);
  expect(reset.targetNormX).toBe(0.5);
  expect(reset.targetNormY).toBe(0.5);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
`;
}

export function createGame({
  root = process.cwd(),
  id,
  dryRun = false
}) {
  assertGameId(id);

  const className = pascalCase(id);
  const variableName = camelCase(className);
  const globalName =
    `__GAME_FACTORY_${id.replace(/-/gu, '_').toUpperCase()}_TEST__`;

  const registryPath = path.join(
    root,
    'src/factory/GameRegistry.ts'
  );
  const gameDir = path.join(root, 'src/games', id);
  const gamePath = path.join(gameDir, `${className}Game.ts`);
  const bridgePath = path.join(
    gameDir,
    `${className}TestBridge.ts`
  );
  const e2ePath = path.join(root, 'tests/e2e', `${id}.spec.ts`);

  if (!fs.existsSync(registryPath)) {
    throw new Error(`GameRegistry not found: ${registryPath}`);
  }

  const outputs = [gamePath, bridgePath, e2ePath];

  for (const output of outputs) {
    if (fs.existsSync(output)) {
      throw new Error(`refusing to overwrite existing file: ${output}`);
    }
  }

  let registry = fs.readFileSync(registryPath, 'utf8');

  if (
    registry.includes(`'${id}'`) ||
    registry.includes(`"${id}"`)
  ) {
    throw new Error(`game id already registered: ${id}`);
  }

  for (const marker of Object.values(MARKERS)) {
    requireMarker(registry, marker);
  }

  registry = insertBefore(
    registry,
    MARKERS.imports,
    [
      `import { ${className}Game } from '../games/${id}/${className}Game';`,
      `import { install${className}TestBridge } from '../games/${id}/${className}TestBridge';`
    ].join('\n')
  );
  registry = insertBefore(
    registry,
    MARKERS.ids,
    `  '${id}',`
  );
  registry = insertBefore(
    registry,
    MARKERS.constructors,
    [
      `  const ${variableName} = new ${className}Game(viewport);`,
      `  install${className}TestBridge({`,
      `    getState: () => ${variableName}.testState()`,
      '  });'
    ].join('\n')
  );
  registry = insertBefore(
    registry,
    MARKERS.entries,
    `    '${id}': ${variableName},`
  );

  const generated = {
    id,
    className,
    variableName,
    globalName,
    files: [
      path.relative(root, gamePath),
      path.relative(root, bridgePath),
      path.relative(root, e2ePath)
    ],
    registry: path.relative(root, registryPath)
  };

  if (dryRun) {
    return generated;
  }

  fs.mkdirSync(gameDir, { recursive: true });
  fs.mkdirSync(path.dirname(e2ePath), { recursive: true });

  fs.writeFileSync(gamePath, gameTemplate(id, className));
  fs.writeFileSync(
    bridgePath,
    bridgeTemplate(id, className, globalName)
  );
  fs.writeFileSync(
    e2ePath,
    e2eTemplate(id, className, globalName)
  );
  fs.writeFileSync(registryPath, registry);

  return generated;
}

function parseArgs(argv) {
  const args = {
    id: '',
    root: process.cwd(),
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--id') {
      args.id = argv[index + 1] ?? '';
      index += 1;
    } else if (token === '--root') {
      args.root = path.resolve(argv[index + 1] ?? '');
      index += 1;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--help') {
      args.help = true;
    } else {
      throw new Error(`unknown argument: ${token}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(
    [
      'Usage:',
      '  npm run create-game -- --id my-game',
      '',
      'Options:',
      '  --id <slug>   lowercase game id, e.g. mass-runner',
      '  --root <dir>  alternate repository root',
      '  --dry-run     validate and print the generation plan',
      '  --help        show this help'
    ].join('\n')
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.id) {
    throw new Error('--id is required');
  }

  const result = createGame(args);
  console.log(JSON.stringify(result, null, 2));
  console.log(
    args.dryRun
      ? 'W5_CREATE_GAME_DRY_RUN_PASS'
      : 'W5_CREATE_GAME_GENERATED'
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
