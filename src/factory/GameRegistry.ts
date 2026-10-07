import { CollectorGame } from '../games/collector/CollectorGame';
import { installCollectorTestBridge } from '../games/collector/CollectorTestBridge';
import { PhysicsGame } from '../games/physics/PhysicsGame';
import { installPhysicsTestBridge } from '../games/physics/PhysicsTestBridge';
import { RunnerGame } from '../games/runner/RunnerGame';
import { installRunnerTestBridge } from '../games/runner/RunnerTestBridge';
import type { ViewportRuntime } from '../runtime/ViewportRuntime';
import type { GameModule } from './GameModule';

export const GAME_IDS = ['runner', 'collector', 'physics'] as const;

export type GameId = (typeof GAME_IDS)[number];
export type GameRegistry = Readonly<Record<GameId, GameModule>>;

export function resolveGameId(requested: string | null): GameId {
  return GAME_IDS.includes(requested as GameId)
    ? (requested as GameId)
    : 'runner';
}

export function createGameRegistry(
  viewport: ViewportRuntime
): GameRegistry {
  const runner = new RunnerGame(viewport);
  const collector = new CollectorGame(viewport);
  const physics = new PhysicsGame(viewport);

  installRunnerTestBridge({
    getState: () => runner.testState()
  });
  installCollectorTestBridge({
    getState: () => collector.testState()
  });
  installPhysicsTestBridge({
    getState: () => physics.testState()
  });

  return {
    runner,
    collector,
    physics
  };
}
