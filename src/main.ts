import {
  engineInit,
  mouseIsDown,
  mousePos,
  mouseWasPressed
} from 'littlejsengine';
import { SeededRng } from './core/random/SeededRng';
import { CollectorGame } from './games/collector/CollectorGame';
import { installCollectorTestBridge } from './games/collector/CollectorTestBridge';
import { PhysicsGame } from './games/physics/PhysicsGame';
import { installPhysicsTestBridge } from './games/physics/PhysicsTestBridge';
import { RunnerGame } from './games/runner/RunnerGame';
import { installRunnerTestBridge } from './games/runner/RunnerTestBridge';
import { WebPlatform } from './platform/WebPlatform';
import { LifecycleRuntime } from './runtime/LifecycleRuntime';
import { ViewportRuntime } from './runtime/ViewportRuntime';
import { installTestBridge } from './testing/TestBridge';

type GameMode = 'runner' | 'collector' | 'physics';

const FOUNDATION_SEED = 0x5eed1234;
const FOUNDATION_SEED_LABEL = '5eed1234';

const requestedGame = new URLSearchParams(window.location.search).get('game');
const gameMode: GameMode =
  requestedGame === 'collector'
    ? 'collector'
    : requestedGame === 'physics'
      ? 'physics'
      : 'runner';

const platform = new WebPlatform();
const lifecycle = new LifecycleRuntime(platform);
const viewport = new ViewportRuntime(10);
const runner = new RunnerGame(viewport);
const collector = new CollectorGame(viewport);
const physics = new PhysicsGame(viewport);

let ready = false;
let foundationProbeNormX = 0.5;

function resetFoundationProbe(): void {
  const rng = new SeededRng(FOUNDATION_SEED);
  foundationProbeNormX = rng.range(0.2, 0.8);
}

function gameInit(): void {
  viewport.sync();
  resetFoundationProbe();

  if (gameMode === 'collector') {
    collector.init();
  } else if (gameMode === 'physics') {
    physics.init();
  } else {
    runner.init();
  }

  lifecycle.attach();
  platform.ready();
  ready = true;
}

function gameUpdate(): void {
  const pointerPressed = mouseWasPressed(0);
  const pointerDown = mouseIsDown(0);

  if (gameMode === 'collector') {
    collector.update(
      pointerPressed,
      pointerDown,
      mousePos.x,
      mousePos.y
    );
    return;
  }

  if (gameMode === 'physics') {
    physics.update(pointerPressed, mousePos.x, mousePos.y);
    return;
  }

  runner.update(pointerPressed, pointerDown, mousePos.x);
}

function gameUpdatePost(): void {
  viewport.sync();
}

function gameRender(): void {
  if (gameMode === 'collector') {
    collector.render();
    return;
  }

  if (gameMode === 'physics') {
    physics.render();
    return;
  }

  runner.render();
}

function gameRenderPost(): void {
  if (gameMode === 'collector') {
    collector.renderHud();
    return;
  }

  if (gameMode === 'physics') {
    physics.renderHud();
    return;
  }

  runner.renderHud();
}

function restartRuntime(): void {
  resetFoundationProbe();

  if (gameMode === 'collector') {
    collector.restart();
    return;
  }

  if (gameMode === 'physics') {
    physics.restart();
    return;
  }

  runner.restart();
}

installTestBridge({
  getState: () => {
    const currentViewport = viewport.snapshot();

    if (gameMode === 'collector') {
      const collectorState = collector.testState();

      return {
        ready,
        paused: lifecycle.isPaused(),
        seed: FOUNDATION_SEED_LABEL,
        pointerEvents: collectorState.pointerEvents,
        pointerNormX: collectorState.targetNormX,
        restartCount: collectorState.restartCount,
        probeNormX: foundationProbeNormX,
        viewport: {
          width: currentViewport.width,
          height: currentViewport.height
        }
      };
    }

    if (gameMode === 'physics') {
      const physicsState = physics.testState();

      return {
        ready,
        paused: lifecycle.isPaused(),
        seed: FOUNDATION_SEED_LABEL,
        pointerEvents: physicsState.pointerEvents,
        pointerNormX: physicsState.aimX,
        restartCount: physicsState.restartCount,
        probeNormX: foundationProbeNormX,
        viewport: {
          width: currentViewport.width,
          height: currentViewport.height
        }
      };
    }

    const runnerState = runner.testState();

    return {
      ready,
      paused: lifecycle.isPaused(),
      seed: FOUNDATION_SEED_LABEL,
      pointerEvents: runnerState.pointerEvents,
      pointerNormX: runnerState.targetNormX,
      restartCount: runnerState.restartCount,
      probeNormX: foundationProbeNormX,
      viewport: {
        width: currentViewport.width,
        height: currentViewport.height
      }
    };
  },
  restart: restartRuntime,
  pause: () => lifecycle.pause(),
  resume: () => lifecycle.resume()
});

installRunnerTestBridge({
  getState: () => runner.testState()
});

installCollectorTestBridge({
  getState: () => collector.testState()
});

installPhysicsTestBridge({
  getState: () => physics.testState()
});

platform.init();

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('Missing #app root element');
}

await engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
  [],
  root
);
