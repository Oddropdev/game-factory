import {
  drawCircle,
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
  applyMassOperation,
  MASS_RUNNER_LEVELS,
  massRunnerLevelSignature,
  type MassOperation,
  type MassRunnerEvent
} from './MassRunnerLevels';
import {
  MassRunnerModel,
  type MassRunnerSnapshot
} from './MassRunnerModel';

const TRACK_WIDTH = 8;

export type MassRunnerGameTestState = MassRunnerSnapshot & {
  ready: boolean;
  pointerEvents: number;
  restartCount: number;
  targetNormX: number;
  levelSignature: string;
  playerRenderY: number;
  visibleHalfHeight: number;
};

export class MassRunnerGame implements GameModule {
  private readonly model = new MassRunnerModel(
    MASS_RUNNER_LEVELS
  );
  private targetNormX = 0.5;
  private pointerEvents = 0;
  private restartCount = 0;
  private ready = false;

  constructor(private readonly viewport: ViewportRuntime) {}

  init(): void {
    this.model.resetSession();
    this.targetNormX = 0.5;
    this.pointerEvents = 0;
    this.ready = true;
  }

  update(input: GameInputFrame): void {
    if (input.pointerPressed) {
      this.pointerEvents += 1;
    }

    if (input.pointerPressed || input.pointerDown) {
      this.targetNormX = this.viewport.worldXToNormalized(
        input.pointerWorldX
      );
    }

    if (
      input.pointerPressed &&
      this.model.snapshot().phase !== 'running'
    ) {
      this.model.startOrAdvance();
    }

    this.model.step(this.targetNormX);
  }

  restart(): void {
    this.restartCount += 1;
    this.pointerEvents = 0;
    this.targetNormX = 0.5;
    this.model.resetSession();
  }

  render(): void {
    const snapshot = this.model.snapshot();
    const level = this.model.getCurrentLevel();
    const layout = this.layout();

    drawRect(
      vec2(0, 0),
      vec2(10, layout.trackHeight),
      rgb(0.035, 0.055, 0.09)
    );

    drawRect(
      vec2(0, 0),
      vec2(TRACK_WIDTH, layout.trackHeight),
      rgb(0.08, 0.11, 0.17)
    );

    for (const x of [-4.08, -1.33, 1.33, 4.08]) {
      drawRect(
        vec2(x, 0),
        vec2(x === -4.08 || x === 4.08 ? 0.12 : 0.04, layout.trackHeight),
        x === -4.08 || x === 4.08
          ? rgb(0.28, 0.35, 0.48)
          : rgb(0.15, 0.2, 0.3)
      );
    }

    for (const event of level.events) {
      this.renderEvent(
        event,
        snapshot,
        layout.playerY,
        layout.eventDistanceScale,
        layout.visibleHalfHeight
      );
    }

    const finishY =
      layout.playerY +
      (level.finishDistance - snapshot.distance) *
        layout.eventDistanceScale;

    if (
      finishY > -layout.visibleHalfHeight - 1 &&
      finishY < layout.visibleHalfHeight + 1
    ) {
      drawRect(
        vec2(0, finishY),
        vec2(TRACK_WIDTH, 0.2),
        rgb(0.92, 0.96, 1)
      );
    }

    const playerX = this.viewport.normalizedXToWorld(
      snapshot.playerNormX
    );
    const pulse =
      1 + Math.sin(snapshot.distance * 0.22) * 0.035;
    const radius =
      Math.min(1.18, 0.46 + snapshot.mass * 0.025) * pulse;

    drawCircle(
      vec2(playerX, layout.playerY),
      radius,
      snapshot.mass >= snapshot.targetMass
        ? rgb(0.3, 0.92, 0.55)
        : rgb(0.25, 0.68, 1)
    );
    drawCircle(
      vec2(playerX - radius * 0.22, layout.playerY + radius * 0.18),
      radius * 0.11,
      rgb(0.95, 0.98, 1)
    );
  }

  renderHud(): void {
    const snapshot = this.model.snapshot();

    drawTextScreen(
      'MASS RUNNER',
      vec2(110, 28),
      24,
      rgb(1, 1, 1)
    );
    drawTextScreen(
      `LEVEL ${snapshot.levelNumber}/${snapshot.totalLevels}  ${snapshot.levelName}`,
      vec2(150, 56),
      16,
      rgb(0.72, 0.82, 0.96)
    );
    drawTextScreen(
      `MASS ${snapshot.mass} / ${snapshot.targetMass}`,
      vec2(88, 84),
      20,
      snapshot.mass >= snapshot.targetMass
        ? rgb(0.35, 0.95, 0.58)
        : rgb(0.98, 0.78, 0.25)
    );
    drawTextScreen(
      `SCORE ${snapshot.totalScore}`,
      vec2(72, 110),
      16,
      rgb(0.9, 0.94, 1)
    );

    if (snapshot.phase === 'ready') {
      drawTextScreen(
        'TAP TO RUN',
        vec2(195, 154),
        32,
        rgb(1, 0.88, 0.32)
      );
    } else if (snapshot.phase === 'level-clear') {
      drawTextScreen(
        'LEVEL CLEAR',
        vec2(195, 154),
        32,
        rgb(0.35, 0.95, 0.58)
      );
      drawTextScreen(
        'TAP FOR NEXT',
        vec2(195, 184),
        18,
        rgb(0.9, 0.95, 1)
      );
    } else if (snapshot.phase === 'level-fail') {
      drawTextScreen(
        'NOT ENOUGH MASS',
        vec2(195, 154),
        28,
        rgb(0.98, 0.36, 0.35)
      );
      drawTextScreen(
        'TAP TO RETRY',
        vec2(195, 184),
        18,
        rgb(0.9, 0.95, 1)
      );
    } else if (snapshot.phase === 'complete') {
      drawTextScreen(
        'MASSIVE!',
        vec2(195, 154),
        38,
        rgb(0.35, 0.95, 0.58)
      );
      drawTextScreen(
        `FINAL SCORE ${snapshot.totalScore}`,
        vec2(195, 190),
        20,
        rgb(1, 0.88, 0.32)
      );
      drawTextScreen(
        'TAP TO RUN AGAIN',
        vec2(195, 218),
        16,
        rgb(0.9, 0.95, 1)
      );
    } else {
      const nextGate = this.nextGate(snapshot);

      if (nextGate) {
        const left = this.operationLabel(
          nextGate.left,
          snapshot.mass
        );
        const right = this.operationLabel(
          nextGate.right,
          snapshot.mass
        );

        drawTextScreen(
          `NEXT  ${left}  |  ${right}`,
          vec2(195, 146),
          18,
          rgb(0.88, 0.92, 1)
        );
      }
    }
  }

  foundationState(): FoundationGameState {
    return {
      pointerEvents: this.pointerEvents,
      pointerNormX: this.targetNormX,
      restartCount: this.restartCount
    };
  }

  testState(): MassRunnerGameTestState {
    const layout = this.layout();

    return {
      ...this.model.snapshot(),
      ready: this.ready,
      pointerEvents: this.pointerEvents,
      restartCount: this.restartCount,
      targetNormX: this.targetNormX,
      levelSignature: massRunnerLevelSignature(),
      playerRenderY: layout.playerY,
      visibleHalfHeight: layout.visibleHalfHeight
    };
  }

  private layout(): {
    playerY: number;
    eventDistanceScale: number;
    visibleHalfHeight: number;
    trackHeight: number;
  } {
    const visibleWorldHeight = this.viewport.visibleWorldHeight();
    const visibleHalfHeight = visibleWorldHeight * 0.5;

    return {
      playerY: Math.max(-4.2, -visibleHalfHeight * 0.7),
      eventDistanceScale: Math.min(0.13, visibleWorldHeight / 52),
      visibleHalfHeight,
      trackHeight: Math.max(12, visibleWorldHeight * 1.05)
    };
  }

  private renderEvent(
    event: MassRunnerEvent,
    snapshot: MassRunnerSnapshot,
    playerY: number,
    eventDistanceScale: number,
    visibleHalfHeight: number
  ): void {
    if (event.distance <= snapshot.distance) {
      return;
    }

    const y =
      playerY +
      (event.distance - snapshot.distance) *
        eventDistanceScale;

    if (y < -visibleHalfHeight - 1 || y > visibleHalfHeight + 1) {
      return;
    }

    if (event.kind === 'gate') {
      const leftMass = applyMassOperation(
        snapshot.mass,
        event.left
      );
      const rightMass = applyMassOperation(
        snapshot.mass,
        event.right
      );
      const leftBetter = leftMass >= rightMass;

      drawRect(
        vec2(-2.05, y),
        vec2(3.8, 0.48),
        leftBetter
          ? rgb(0.2, 0.82, 0.46)
          : rgb(0.9, 0.24, 0.28)
      );
      drawRect(
        vec2(2.05, y),
        vec2(3.8, 0.48),
        leftBetter
          ? rgb(0.9, 0.24, 0.28)
          : rgb(0.2, 0.82, 0.46)
      );
      return;
    }

    const x = this.viewport.normalizedXToWorld(event.x);

    if (event.kind === 'orb') {
      drawCircle(
        vec2(x, y),
        0.34 + event.amount * 0.04,
        rgb(1, 0.74, 0.16)
      );
      return;
    }

    drawRect(
      vec2(x, y),
      vec2(Math.max(0.7, event.width * 10), 0.72),
      rgb(0.95, 0.25, 0.3)
    );
  }

  private nextGate(
    snapshot: MassRunnerSnapshot
  ) {
    return this.model
      .getCurrentLevel()
      .events.find(
        event =>
          event.kind === 'gate' &&
          event.distance > snapshot.distance
      );
  }

  private operationLabel(
    operation: MassOperation,
    mass: number
  ): string {
    const next = applyMassOperation(mass, operation);
    const delta = next - mass;

    if (operation.op === 'multiply') {
      return `×${operation.value}`;
    }

    return delta >= 0 ? `+${delta}` : `${delta}`;
  }
}
