import {
  drawCircle,
  drawRect,
  drawTextScreen,
  rgb,
  vec2
} from 'littlejsengine';
import type { ViewportRuntime } from '../../runtime/ViewportRuntime';
import {
  createPhysicsCourse,
  PHYSICS_SEED,
  physicsCourseSignature
} from './PhysicsCourse';
import {
  PhysicsModel,
  type PhysicsSnapshot
} from './PhysicsModel';

export type PhysicsGameTestState = PhysicsSnapshot & {
  ready: boolean;
  pointerEvents: number;
  restartCount: number;
  courseSignature: string;
  solutionAim: {
    x: number;
    y: number;
  };
  visibleWorldHeight: number;
};

export class PhysicsGame {
  private readonly course = createPhysicsCourse(PHYSICS_SEED);
  private readonly model = new PhysicsModel(this.course);
  private pointerEvents = 0;
  private restartCount = 0;
  private ready = false;

  constructor(private readonly viewport: ViewportRuntime) {}

  init(): void {
    this.model.reset();
    this.pointerEvents = 0;
    this.ready = true;
  }

  update(
    pointerPressed: boolean,
    pointerWorldX: number,
    pointerWorldY: number
  ): void {
    if (pointerPressed) {
      this.pointerEvents += 1;
      this.model.launch(
        this.viewport.worldXToNormalized(pointerWorldX),
        this.worldYToNormalized(pointerWorldY)
      );
    }

    this.model.step();
  }

  restart(): void {
    this.restartCount += 1;
    this.pointerEvents = 0;
    this.model.reset();
  }

  render(): void {
    const state = this.model.snapshot();
    const visibleWorldHeight = this.layout().visibleWorldHeight;

    drawRect(
      vec2(0, 0),
      vec2(10, visibleWorldHeight),
      rgb(0.055, 0.075, 0.12)
    );

    const floorY = this.normalizedYToWorld(this.course.bounds.floor);
    drawRect(
      vec2(0, floorY),
      vec2(9.2, 0.12),
      rgb(0.35, 0.4, 0.5)
    );

    const obstacle = this.course.obstacle;
    const obstacleCenterX =
      this.viewport.normalizedXToWorld((obstacle.xMin + obstacle.xMax) * 0.5);
    const obstacleCenterY =
      this.normalizedYToWorld((obstacle.yMin + obstacle.yMax) * 0.5);
    const obstacleWidth = (obstacle.xMax - obstacle.xMin) * 10;
    const obstacleHeight =
      (obstacle.yMax - obstacle.yMin) * visibleWorldHeight;

    drawRect(
      vec2(obstacleCenterX, obstacleCenterY),
      vec2(obstacleWidth, obstacleHeight),
      rgb(0.78, 0.24, 0.28)
    );

    const goalX = this.viewport.normalizedXToWorld(this.course.goal.x);
    const goalY = this.normalizedYToWorld(this.course.goal.y);
    drawCircle(
      vec2(goalX, goalY),
      Math.max(0.75, this.course.goal.radius * 20),
      rgb(0.25, 0.9, 0.52)
    );
    drawCircle(
      vec2(goalX, goalY),
      Math.max(0.34, this.course.goal.radius * 9),
      rgb(0.055, 0.075, 0.12)
    );

    const ballX = this.viewport.normalizedXToWorld(state.ballX);
    const ballY = this.normalizedYToWorld(state.ballY);
    drawCircle(vec2(ballX, ballY), 0.58, rgb(0.22, 0.74, 0.97));

    if (state.status === 'ready') {
      const aimX = this.viewport.normalizedXToWorld(state.aimX);
      const aimY = this.normalizedYToWorld(state.aimY);
      drawCircle(vec2(aimX, aimY), 0.22, rgb(0.98, 0.75, 0.14));
    }
  }

  renderHud(): void {
    const state = this.model.snapshot();

    drawTextScreen('W4 / PHYSICS PUZZLE', vec2(138, 30), 20, rgb(1, 1, 1));
    drawTextScreen(
      `shots ${state.shots}  hits ${state.collisions}`,
      vec2(92, 60),
      17,
      rgb(0.9, 0.94, 1)
    );

    if (state.status === 'ready') {
      drawTextScreen('TAP THE ARC', vec2(195, 100), 22, rgb(0.98, 0.82, 0.3));
    } else if (state.status === 'solved') {
      drawTextScreen('SOLVED', vec2(195, 112), 36, rgb(0.3, 0.95, 0.55));
    }
  }

  testState(): PhysicsGameTestState {
    return {
      ...this.model.snapshot(),
      ready: this.ready,
      pointerEvents: this.pointerEvents,
      restartCount: this.restartCount,
      courseSignature: physicsCourseSignature(this.course),
      solutionAim: {
        x: this.course.solutionAim.x,
        y: this.course.solutionAim.y
      },
      visibleWorldHeight: this.layout().visibleWorldHeight
    };
  }

  private layout(): { visibleWorldHeight: number } {
    const viewport = this.viewport.snapshot();

    return {
      visibleWorldHeight:
        (viewport.height * viewport.worldWidth) / Math.max(1, viewport.width)
    };
  }

  private normalizedYToWorld(normalizedY: number): number {
    const visibleWorldHeight = this.layout().visibleWorldHeight;
    return (0.5 - normalizedY) * visibleWorldHeight;
  }

  private worldYToNormalized(worldY: number): number {
    const visibleWorldHeight = this.layout().visibleWorldHeight;
    return Math.min(
      1,
      Math.max(0, 0.5 - worldY / Math.max(0.001, visibleWorldHeight))
    );
  }
}
