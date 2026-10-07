import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGame } from './create-game.mjs';

const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'game-factory-create-game-')
);

try {
  const factoryDir = path.join(tempRoot, 'src/factory');
  fs.mkdirSync(factoryDir, { recursive: true });
  fs.copyFileSync(
    path.resolve('src/factory/GameRegistry.ts'),
    path.join(factoryDir, 'GameRegistry.ts')
  );

  const result = createGame({
    root: tempRoot,
    id: 'smoke-prototype'
  });

  assert.equal(result.baseName, 'SmokePrototype');
  assert.equal(result.gameClassName, 'SmokePrototypeGame');
  assert.deepEqual(result.files, [
    'src/games/smoke-prototype/SmokePrototypeGame.ts',
    'src/games/smoke-prototype/SmokePrototypeTestBridge.ts',
    'tests/e2e/smoke-prototype.spec.ts'
  ]);

  for (const relativePath of result.files) {
    assert.equal(
      fs.existsSync(path.join(tempRoot, relativePath)),
      true,
      `generated file missing: ${relativePath}`
    );
  }

  const registry = fs.readFileSync(
    path.join(factoryDir, 'GameRegistry.ts'),
    'utf8'
  );

  assert.match(registry, /'smoke-prototype'/u);
  assert.match(registry, /SmokePrototypeGame/u);
  assert.match(registry, /installSmokePrototypeTestBridge/u);

  assert.throws(
    () =>
      createGame({
        root: tempRoot,
        id: 'smoke-prototype'
      }),
    /refusing to overwrite|already registered/u
  );

  const cli = spawnSync(
    process.execPath,
    [
      path.resolve('tools/create-game.mjs'),
      '--id',
      'cli-prototype',
      '--root',
      tempRoot,
      '--dry-run'
    ],
    {
      encoding: 'utf8'
    }
  );

  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /W5_CREATE_GAME_DRY_RUN_PASS/u);
  assert.match(cli.stdout, /"gameClassName": "CliPrototypeGame"/u);
  assert.equal(
    fs.existsSync(
      path.join(
        tempRoot,
        'src/games/cli-prototype/CliPrototypeGame.ts'
      )
    ),
    false
  );

  console.log('W5_CREATE_GAME_AUTOMATION_PASS');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
