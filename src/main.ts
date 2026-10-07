import {
  engineInit,
  mouseIsDown,
  mousePos,
  mouseWasPressed
} from 'littlejsengine';
import { SeededRng } from './core/random/SeededRng';
import { RunnerGame } from './games/runner/RunnerGame';
import { installRunnerTestBridge } from './games/runner/RunnerTestBridge';
import { WebPlatform } from './platform/WebPlatform';
import { LifecycleRuntime } from './runtime/LifecycleRuntime';
import { ViewportRuntime } from './runtime/ViewportRuntime';
import { installTestBridge } from './testing/TestBridge';

const FOUNDATION_SEED = 0x5eed1234;
const FOUNDATION_SEED_LABEL = '5eed1234';

const platform = new WebPlatform();
const lifecycle = new LifecycleRuntime(platform);
const viewport = new ViewportRuntime(10);
const runner = new RunnerGame(viewport);

let ready = false;
let foundationProbeNormX = 0.5;

function resetFoundationProbe(): void {
  const rng = new SeededRng(FOUNDATION_SEED);
  foundationProbeNormX = rng.range(0.2, 0.8);
}

function gameInit(): void {
  viewport.sync();
  resetFoundationProbe();
  runner.init();
  lifecycle.attach();
  platform.ready();
  ready = true;
}

function gameUpdate(): void {
  runner.update(mouseWasPressed(0), mouseIsDown(0), mousePos.x);
}

function gameUpdatePost(): void {
  viewport.sync();
}

function gameRender(): void {
  runner.render();
}

function gameRenderPost(): void {
  runner.renderHud();
}

function restartRuntime(): void {
  resetFoundationProbe();
  runner.restart();
}

installTestBridge({
  getState: () => {
    const currentViewport = viewport.snapshot();
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
