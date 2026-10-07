import { describe, expect, it } from 'vitest';
import {
  createPhysicsCourse,
  PHYSICS_SEED,
  physicsCourseSignature
} from '../../src/games/physics/PhysicsCourse';
import { PhysicsModel } from '../../src/games/physics/PhysicsModel';

function advance(
  model: PhysicsModel,
  ticks: number
): void {
  for (let index = 0; index < ticks; index += 1) {
    model.step();
  }
}

describe('PhysicsModel', () => {
  it('creates the same puzzle geometry for the same seed', () => {
    const a = createPhysicsCourse(PHYSICS_SEED);
    const b = createPhysicsCourse(PHYSICS_SEED);

    expect(physicsCourseSignature(a)).toBe(physicsCourseSignature(b));
    expect(a).toEqual(b);
  });

  it('solves the puzzle with the deterministic arc shot', () => {
    const course = createPhysicsCourse(PHYSICS_SEED);
    const model = new PhysicsModel(course);

    expect(model.launch(course.solutionAim.x, course.solutionAim.y)).toBe(true);

    let guard = 0;
    while (model.snapshot().status !== 'solved' && guard < 180) {
      model.step();
      guard += 1;
    }

    const solved = model.snapshot();

    expect(solved.status).toBe('solved');
    expect(solved.shots).toBe(1);
    expect(solved.collisions).toBe(0);
    expect(solved.ticks).toBeGreaterThan(20);
    expect(solved.ticks).toBeLessThan(100);
  });

  it('turns a low direct shot into an obstacle collision instead of a solve', () => {
    const course = createPhysicsCourse(PHYSICS_SEED);
    const model = new PhysicsModel(course);

    expect(model.launch(0.82, 0.68)).toBe(true);
    advance(model, 80);

    const state = model.snapshot();

    expect(state.collisions).toBeGreaterThan(0);
    expect(state.status).not.toBe('solved');
  });

  it('ignores additional launch input while the ball is flying', () => {
    const course = createPhysicsCourse(PHYSICS_SEED);
    const model = new PhysicsModel(course);

    expect(model.launch(course.solutionAim.x, course.solutionAim.y)).toBe(true);
    expect(model.launch(0.2, 0.9)).toBe(false);
    expect(model.snapshot().shots).toBe(1);
  });

  it('reset restores exact initial puzzle state', () => {
    const course = createPhysicsCourse(PHYSICS_SEED);
    const model = new PhysicsModel(course);

    model.launch(0.82, 0.68);
    advance(model, 25);
    expect(model.snapshot().ticks).toBeGreaterThan(0);

    model.reset();

    expect(model.snapshot()).toEqual({
      status: 'ready',
      ballX: course.start.x,
      ballY: course.start.y,
      velocityX: 0,
      velocityY: 0,
      aimX: course.solutionAim.x,
      aimY: course.solutionAim.y,
      shots: 0,
      collisions: 0,
      ticks: 0,
      lastCollision: null
    });
  });
});
