import {
  engineInit,
  mouseIsDown,
  mousePos,
  mouseWasPressed
} from 'littlejsengine';
import { SeededRng } from './core/random/SeededRng';
import {
  createGameRegistry,
  resolveGameId
} from './factory/GameRegistry';
import type { GameInputFrame } from './factory/GameModule';
import { WebPlatform } from './platform/WebPlatform';
import { LifecycleRuntime } from './runtime/LifecycleRuntime';
import { ViewportRuntime } from './runtime/ViewportRuntime';
import { installTestBridge } from './testing/TestBridge';

const FOUNDATION_SEED = 0x5eed1234;
const FOUNDATION_SEED_LABEL = '5eed1234';

const platform = new WebPlatform();
const lifecycle = new LifecycleRuntime(platform);
const viewport = new ViewportRuntime(10);
const games = createGameRegistry(viewport);
const requestedGame = new URLSearchParams(window.location.search).get(
  'game'
);
const activeGame = games[resolveGameId(requestedGame)];

let ready = false;
let foundationProbeNormX = 0.5;

function resetFoundationProbe(): void {
  const rng = new SeededRng(FOUNDATION_SEED);
  foundationProbeNormX = rng.range(0.2, 0.8);
}

function gameInit(): void {
  viewport.sync();
  resetFoundationProbe();
  activeGame.init();
  lifecycle.attach();
  platform.ready();
  ready = true;
}

function gameUpdate(): void {
  const input: GameInputFrame = {
    pointerPressed: mouseWasPressed(0),
    pointerDown: mouseIsDown(0),
    pointerWorldX: mousePos.x,
    pointerWorldY: mousePos.y
  };

  activeGame.update(input);
}

function gameUpdatePost(): void {
  viewport.sync();
}

function gameRender(): void {
  activeGame.render();
}

function gameRenderPost(): void {
  activeGame.renderHud();
}

function restartRuntime(): void {
  resetFoundationProbe();
  activeGame.restart();
}

installTestBridge({
  getState: () => {
    const currentViewport = viewport.snapshot();
    const gameState = activeGame.foundationState();

    return {
      ready,
      paused: lifecycle.isPaused(),
      seed: FOUNDATION_SEED_LABEL,
      pointerEvents: gameState.pointerEvents,
      pointerNormX: gameState.pointerNormX,
      restartCount: gameState.restartCount,
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
