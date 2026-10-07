import {
  drawRect,
  drawTextScreen,
  engineInit,
  mouseIsDown,
  mousePos,
  mouseWasPressed,
  rgb,
  vec2
} from 'littlejsengine';
import { SeededRng } from './core/random/SeededRng';
import { WebPlatform } from './platform/WebPlatform';
import { LifecycleRuntime } from './runtime/LifecycleRuntime';
import { ViewportRuntime } from './runtime/ViewportRuntime';
import { installTestBridge } from './testing/TestBridge';

const FOUNDATION_SEED = 0x5eed1234;
const FOUNDATION_SEED_LABEL = '5eed1234';
const PLAYER_SIZE = 0.9;
const PROBE_SIZE = 0.55;

const platform = new WebPlatform();
const lifecycle = new LifecycleRuntime(platform);
const viewport = new ViewportRuntime(10);

let rng = new SeededRng(FOUNDATION_SEED);
let ready = false;
let pointerEvents = 0;
let pointerNormX = 0.5;
let restartCount = 0;
let probeNormX = 0.5;

function resetFoundation(incrementRestart = false): void {
  if (incrementRestart) {
    restartCount += 1;
  }

  rng = new SeededRng(FOUNDATION_SEED);
  pointerEvents = 0;
  pointerNormX = 0.5;
  probeNormX = rng.range(0.2, 0.8);
}

function gameInit(): void {
  viewport.sync();
  resetFoundation(false);
  lifecycle.attach();
  platform.ready();
  ready = true;
}

function gameUpdate(): void {
  const pointerPressed = mouseWasPressed(0);
  const pointerDown = mouseIsDown(0);

  if (pointerPressed) {
    pointerEvents += 1;
  }

  if (pointerPressed || pointerDown) {
    pointerNormX = viewport.worldXToNormalized(mousePos.x);
  }
}

function gameUpdatePost(): void {
  viewport.sync();
}

function gameRender(): void {
  const pointerX = viewport.normalizedXToWorld(pointerNormX);
  const probeX = viewport.normalizedXToWorld(probeNormX);

  drawRect(vec2(pointerX, 0), vec2(PLAYER_SIZE), rgb(0.22, 0.74, 0.97));
  drawRect(vec2(probeX, 1.4), vec2(PROBE_SIZE), rgb(0.98, 0.75, 0.14));
}

function gameRenderPost(): void {
  drawTextScreen('GAME FACTORY / W1 FOUNDATION', vec2(195, 34), 20, rgb(1, 1, 1));
  drawTextScreen(`input events: ${pointerEvents}`, vec2(110, 66), 16, rgb(0.75, 0.82, 0.92));
}

function restartFoundation(): void {
  resetFoundation(true);
}

installTestBridge({
  getState: () => {
    const currentViewport = viewport.snapshot();

    return {
      ready,
      paused: lifecycle.isPaused(),
      seed: FOUNDATION_SEED_LABEL,
      pointerEvents,
      pointerNormX,
      restartCount,
      probeNormX,
      viewport: {
        width: currentViewport.width,
        height: currentViewport.height
      }
    };
  },
  restart: restartFoundation,
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
