import assert from 'node:assert/strict';
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
    id: 'smoke-game'
  });

  assert.equal(result.className, 'SmokeGame');
  assert.equal(result.files.length, 3);

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

  assert.match(registry, /'smoke-game'/u);
  assert.match(registry, /SmokeGame/u);
  assert.match(registry, /installSmokeGameTestBridge/u);

  assert.throws(
    () =>
      createGame({
        root: tempRoot,
        id: 'smoke-game'
      }),
    /refusing to overwrite|already registered/u
  );

  const dryRun = createGame({
    root: tempRoot,
    id: 'dry-run-game',
    dryRun: true
  });

  assert.equal(dryRun.className, 'DryRunGame');
  assert.equal(
    fs.existsSync(
      path.join(
        tempRoot,
        'src/games/dry-run-game/DryRunGameGame.ts'
      )
    ),
    false
  );

  console.log('W5_CREATE_GAME_AUTOMATION_PASS');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
