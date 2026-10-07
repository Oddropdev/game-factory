import {
  drawRect,
  drawTextScreen,
  rgb,
  vec2
} from 'littlejsengine';
import type { ViewportRuntime } from '../../runtime/ViewportRuntime';
import {
  createRunnerCourse,
  runnerCourseSignature,
  RUNNER_SEED,
  type RunnerCourseEvent
} from './RunnerCourse';
import { RunnerModel, type RunnerSnapshot } from './RunnerModel';

const TRACK_WIDTH = 8;

export type RunnerGameTestState = RunnerSnapshot & {
  ready: boolean;
  targetNormX: number;
  pointerEvents: number;
  restartCount: number;
  courseSignature: string;
  playerRenderY: number;
  visibleHalfHeight: number;
};

export class RunnerGame {
  private readonly course = createRunnerCourse(RUNNER_SEED);
  private readonly model = new RunnerModel(this.course);
  private targetNormX = 0.5;
  private pointerEvents = 0;
  private restartCount = 0;
  private ready = false;

  constructor(private readonly viewport: ViewportRuntime) {}

  init(): void {
    this.model.reset();
    this.targetNormX = 0.5;
    this.pointerEvents = 0;
    this.ready = true;
  }

  update(pointerPressed: boolean, pointerDown: boolean, pointerWorldX: number): void {
    if (pointerPressed) {
      this.pointerEvents += 1;
    }

    if (pointerPressed || pointerDown) {
      this.targetNormX = this.viewport.worldXToNormalized(pointerWorldX);
    }

    this.model.step(this.targetNormX);
  }

  restart(): void {
    this.restartCount += 1;
    this.model.reset();
    this.targetNormX = 0.5;
    this.pointerEvents = 0;
  }

  render(): void {
    const snapshot = this.model.snapshot();
    const layout = this.layout();

    drawRect(
      vec2(0, 0),
      vec2(TRACK_WIDTH, layout.trackHeight),
      rgb(0.08, 0.11, 0.16)
    );
    drawRect(
      vec2(-4.1, 0),
      vec2(0.12, layout.trackHeight),
      rgb(0.28, 0.34, 0.42)
    );
    drawRect(
      vec2(4.1, 0),
      vec2(0.12, layout.trackHeight),
      rgb(0.28, 0.34, 0.42)
    );
    drawRect(
      vec2(-1.33, 0),
      vec2(0.04, layout.trackHeight),
      rgb(0.16, 0.2, 0.27)
    );
    drawRect(
      vec2(1.33, 0),
      vec2(0.04, layout.trackHeight),
      rgb(0.16, 0.2, 0.27)
    );

    for (const event of this.course.events) {
      this.renderEvent(
        event,
        snapshot.distance,
        layout.playerY,
        layout.eventDistanceScale,
        layout.visibleHalfHeight
      );
    }

    const finishY =
      layout.playerY +
      (this.course.finishDistance - snapshot.distance) * layout.eventDistanceScale;
    if (
      finishY > -layout.visibleHalfHeight - 1 &&
      finishY < layout.visibleHalfHeight + 1
    ) {
      drawRect(vec2(0, finishY), vec2(TRACK_WIDTH, 0.18), rgb(0.95, 0.95, 0.95));
    }

    const playerX = this.viewport.normalizedXToWorld(snapshot.playerNormX);
    drawRect(
      vec2(playerX, layout.playerY),
      vec2(0.72, 0.9),
      rgb(0.22, 0.74, 0.97)
    );
  }

  renderHud(): void {
    const snapshot = this.model.snapshot();
    const percent = Math.round(snapshot.progress * 100);

    drawTextScreen('W2 / RUNNER PROOF', vec2(120, 30), 20, rgb(1, 1, 1));
    drawTextScreen(`score ${snapshot.score}`, vec2(72, 60), 18, rgb(0.98, 0.83, 0.3));
    drawTextScreen(`${percent}%`, vec2(48, 88), 16, rgb(0.72, 0.8, 0.9));

    if (snapshot.status === 'finished') {
      drawTextScreen('FINISH', vec2(195, 132), 36, rgb(0.3, 0.95, 0.55));
    }
  }

  testState(): RunnerGameTestState {
    return {
      ...this.model.snapshot(),
      ready: this.ready,
      targetNormX: this.targetNormX,
      pointerEvents: this.pointerEvents,
      restartCount: this.restartCount,
      courseSignature: runnerCourseSignature(this.course),
      playerRenderY: this.layout().playerY,
      visibleHalfHeight: this.layout().visibleHalfHeight
    };
  }

  private layout(): {
    playerY: number;
    eventDistanceScale: number;
    visibleHalfHeight: number;
    trackHeight: number;
  } {
    const viewport = this.viewport.snapshot();
    const visibleWorldHeight =
      (viewport.height * viewport.worldWidth) / Math.max(1, viewport.width);
    const visibleHalfHeight = visibleWorldHeight * 0.5;

    return {
      playerY: Math.max(-4.2, -visibleHalfHeight * 0.7),
      eventDistanceScale: Math.min(0.14, visibleWorldHeight / 45),
      visibleHalfHeight,
      trackHeight: Math.max(12, visibleWorldHeight * 1.05)
    };
  }

  private renderEvent(
    event: RunnerCourseEvent,
    distance: number,
    playerY: number,
    eventDistanceScale: number,
    visibleHalfHeight: number
  ): void {
    const y = playerY + (event.distance - distance) * eventDistanceScale;

    if (y < -visibleHalfHeight - 1 || y > visibleHalfHeight + 1) {
      return;
    }

    if (event.kind === 'gate') {
      const leftPositive = event.leftDelta >= event.rightDelta;
      const leftColor = leftPositive ? rgb(0.2, 0.82, 0.45) : rgb(0.9, 0.25, 0.28);
      const rightColor = leftPositive ? rgb(0.9, 0.25, 0.28) : rgb(0.2, 0.82, 0.45);
      drawRect(vec2(-2.05, y), vec2(3.8, 0.42), leftColor);
      drawRect(vec2(2.05, y), vec2(3.8, 0.42), rightColor);
      return;
    }

    const x = this.viewport.normalizedXToWorld(event.x);

    if (event.kind === 'pickup') {
      drawRect(vec2(x, y), vec2(0.52), rgb(0.98, 0.75, 0.14));
      return;
    }

    drawRect(
      vec2(x, y),
      vec2(Math.max(0.7, event.width * 10), 0.72),
      rgb(0.92, 0.24, 0.28)
    );
  }
}
