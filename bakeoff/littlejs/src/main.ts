import {
  drawRect,
  drawTextScreen,
  engineInit,
  mainCanvasSize,
  mouseIsDown,
  mousePos,
  mouseWasPressed,
  rgb,
  setCameraPos,
  setCameraScale,
  setPaused,
  vec2
} from 'littlejsengine';
import { SeededRng } from './SeededRng';

const SEED = 0x5eed1234;
const WORLD_WIDTH = 10;
const PLAYER_SIZE = 0.9;
const TARGET_SIZE = 0.8;

type BakeoffState = {
  engine: 'littlejs';
  ready: boolean;
  paused: boolean;
  score: number;
  pointerEvents: number;
  restartCount: number;
  targetNormX: number;
};

declare global {
  interface Window {
    __BAKEOFF__: {
      engine: 'littlejs';
      getState(): BakeoffState;
      restart(): void;
      pause(): void;
      resume(): void;
    };
  }
}

let rng = new SeededRng(SEED);
let playerX = 0;
let targetNormX = 0.5;
let targetX = 0;
let score = 0;
let pointerEvents = 0;
let restartCount = 0;
let pausedState = false;
let ready = false;

function applyCamera(): void {
  setCameraPos(vec2(0, 0));
  setCameraScale(window.innerWidth / WORLD_WIDTH);
}

function normToWorldX(normX: number): number {
  return (normX - 0.5) * WORLD_WIDTH;
}

function resetFoundation(incrementRestart = false): void {
  if (incrementRestart) restartCount += 1;
  rng = new SeededRng(SEED);
  score = 0;
  pointerEvents = 0;
  playerX = 0;
  targetNormX = rng.range(0.15, 0.85);
  targetX = normToWorldX(targetNormX);
}

function collectIfOverlapping(): void {
  if (Math.abs(playerX - targetX) > (PLAYER_SIZE + TARGET_SIZE) * 0.5) return;
  score += 1;
  targetNormX = rng.range(0.15, 0.85);
  targetX = normToWorldX(targetNormX);
}

function gameInit(): void {
  applyCamera();
  resetFoundation(false);
  window.addEventListener('resize', applyCamera);
  ready = true;
}

function gameUpdate(): void {
  if (mouseWasPressed(0) || mouseIsDown(0)) {
    pointerEvents += 1;
    playerX = Math.max(-WORLD_WIDTH * 0.5 + PLAYER_SIZE * 0.5,
      Math.min(WORLD_WIDTH * 0.5 - PLAYER_SIZE * 0.5, mousePos.x));
    collectIfOverlapping();
  }
}

function gameUpdatePost(): void {}

function gameRender(): void {
  drawRect(vec2(playerX, 0), vec2(PLAYER_SIZE), rgb(0.22, 0.74, 0.97));
  drawRect(vec2(targetX, 0), vec2(TARGET_SIZE), rgb(0.98, 0.75, 0.14));
}

function gameRenderPost(): void {
  drawTextScreen(`Score: ${score}`, vec2(90, 42), 28, rgb(1, 1, 1));
}

await engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);

window.__BAKEOFF__ = {
  engine: 'littlejs',
  getState: () => ({
    engine: 'littlejs',
    ready,
    paused: pausedState,
    score,
    pointerEvents,
    restartCount,
    targetNormX
  }),
  restart: () => resetFoundation(true),
  pause: () => {
    pausedState = true;
    setPaused(true);
  },
  resume: () => {
    setPaused(false);
    pausedState = false;
  }
};

// Keep TypeScript aware that the imported live canvas size is intentionally part
// of the runtime contract; it also ensures the engine canvas initialized.
void mainCanvasSize;
