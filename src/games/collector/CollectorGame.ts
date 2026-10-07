import {
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
import {
  COLLECTOR_SEED,
  collectorCourseSignature,
  createCollectorCourse
} from './CollectorCourse';
import {
  CollectorModel,
  type CollectorSnapshot
} from './CollectorModel';

export type CollectorGameTestState = CollectorSnapshot & {
  ready: boolean;
  pointerEvents: number;
  restartCount: number;
  courseSignature: string;
  buildZone: {
    x: number;
    y: number;
  };
  visibleWorldHeight: number;
};

export class CollectorGame implements GameModule {
  private readonly course = createCollectorCourse(COLLECTOR_SEED);
  private readonly model = new CollectorModel(this.course);
  private pointerEvents = 0;
  private restartCount = 0;
  private ready = false;

  constructor(private readonly viewport: ViewportRuntime) {}

  init(): void {
    this.model.reset();
    this.pointerEvents = 0;
    this.ready = true;
  }

  update(input: GameInputFrame): void {
    const snapshot = this.model.snapshot();

    let targetNormX = snapshot.targetNormX;
    let targetNormY = snapshot.targetNormY;

    if (input.pointerPressed) {
      this.pointerEvents += 1;
    }

    if (input.pointerPressed || input.pointerDown) {
      targetNormX = this.viewport.worldXToNormalized(
        input.pointerWorldX
      );
      targetNormY = this.viewport.worldYToNormalized(
        input.pointerWorldY
      );
    }

    this.model.step(targetNormX, targetNormY);
  }

  restart(): void {
    this.restartCount += 1;
    this.pointerEvents = 0;
    this.model.reset();
  }

  render(): void {
    const snapshot = this.model.snapshot();
    const visibleWorldHeight = this.viewport.visibleWorldHeight();

    drawRect(
      vec2(0, 0),
      vec2(10, visibleWorldHeight),
      rgb(0.07, 0.14, 0.11)
    );

    const buildX = this.viewport.normalizedXToWorld(
      this.course.buildZone.x
    );
    const buildY = this.viewport.normalizedYToWorld(
      this.course.buildZone.y
    );
    const buildColor =
      snapshot.status === 'complete'
        ? rgb(0.25, 0.9, 0.52)
        : rgb(0.18, 0.48, 0.72);

    drawRect(
      vec2(buildX, buildY),
      vec2(1.55, 1.05),
      buildColor
    );

    const stageHeight = 0.2 + snapshot.buildStage * 0.34;
    drawRect(
      vec2(buildX, buildY + 0.18),
      vec2(0.75, stageHeight),
      rgb(0.78, 0.86, 0.94)
    );

    for (const resource of snapshot.resources) {
      if (!resource.active) {
        continue;
      }

      drawRect(
        vec2(
          this.viewport.normalizedXToWorld(resource.x),
          this.viewport.normalizedYToWorld(resource.y)
        ),
        vec2(0.48),
        rgb(0.98, 0.75, 0.14)
      );
    }

    const playerX = this.viewport.normalizedXToWorld(
      snapshot.playerNormX
    );
    const playerY = this.viewport.normalizedYToWorld(
      snapshot.playerNormY
    );

    drawRect(
      vec2(playerX, playerY),
      vec2(0.68),
      rgb(0.22, 0.74, 0.97)
    );

    for (let index = 0; index < snapshot.carrying; index += 1) {
      drawRect(
        vec2(
          playerX - 0.24 + index * 0.24,
          playerY + 0.56
        ),
        vec2(0.18),
        rgb(0.98, 0.75, 0.14)
      );
    }
  }

  renderHud(): void {
    const snapshot = this.model.snapshot();

    drawTextScreen(
      'W3 / COLLECTOR BUILDER',
      vec2(145, 30),
      20,
      rgb(1, 1, 1)
    );
    drawTextScreen(
      `carry ${snapshot.carrying}/${this.course.carryCapacity}`,
      vec2(76, 60),
      17,
      rgb(0.92, 0.95, 1)
    );
    drawTextScreen(
      `build ${snapshot.deposited}/${this.course.buildCost}`,
      vec2(78, 86),
      17,
      rgb(0.98, 0.82, 0.3)
    );

    if (snapshot.status === 'complete') {
      drawTextScreen(
        'BUILT',
        vec2(195, 128),
        36,
        rgb(0.3, 0.95, 0.55)
      );
    }
  }

  foundationState(): FoundationGameState {
    const snapshot = this.model.snapshot();

    return {
      pointerEvents: this.pointerEvents,
      pointerNormX: snapshot.targetNormX,
      restartCount: this.restartCount
    };
  }

  testState(): CollectorGameTestState {
    return {
      ...this.model.snapshot(),
      ready: this.ready,
      pointerEvents: this.pointerEvents,
      restartCount: this.restartCount,
      courseSignature: collectorCourseSignature(this.course),
      buildZone: {
        x: this.course.buildZone.x,
        y: this.course.buildZone.y
      },
      visibleWorldHeight: this.viewport.visibleWorldHeight()
    };
  }
}
