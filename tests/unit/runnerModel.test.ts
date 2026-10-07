import { describe, expect, it } from 'vitest';
import {
  createRunnerCourse,
  runnerCourseSignature,
  RUNNER_SEED,
  type RunnerCourseEvent
} from '../../src/games/runner/RunnerCourse';
import { RunnerModel } from '../../src/games/runner/RunnerModel';

function safeControl(event: RunnerCourseEvent): number {
  if (event.kind === 'pickup') {
    return event.x;
  }

  if (event.kind === 'obstacle') {
    return event.x < 0.5 ? 0.9 : 0.1;
  }

  return event.leftDelta >= event.rightDelta ? 0.25 : 0.75;
}

function runUntilDistance(
  model: RunnerModel,
  distance: number,
  controlNormX: number
): void {
  let guard = 0;

  while (model.snapshot().distance < distance && guard < 1_000) {
    model.step(controlNormX);
    guard += 1;
  }

  if (guard >= 1_000) {
    throw new Error('Runner did not reach requested distance');
  }
}

describe('RunnerModel', () => {
  it('creates the same course for the same seed', () => {
    const a = createRunnerCourse(RUNNER_SEED);
    const b = createRunnerCourse(RUNNER_SEED);

    expect(runnerCourseSignature(a)).toBe(runnerCourseSignature(b));
    expect(a.events).toEqual(b.events);
  });

  it('supports a clean route through pickups, gates, obstacles and finish', () => {
    const course = createRunnerCourse(RUNNER_SEED);
    const model = new RunnerModel(course);

    for (const event of course.events) {
      runUntilDistance(model, event.distance, safeControl(event));
    }

    runUntilDistance(model, course.finishDistance, 0.5);

    const state = model.snapshot();

    expect(state.status).toBe('finished');
    expect(state.distance).toBe(course.finishDistance);
    expect(state.progress).toBe(1);
    expect(state.pickups).toBe(3);
    expect(state.hits).toBe(0);
    expect(state.gatesPassed).toBe(2);
    expect(state.eventsProcessed).toBe(course.events.length);
    expect(state.score).toBe(8);
  });

  it('resets all gameplay state deterministically', () => {
    const course = createRunnerCourse(RUNNER_SEED);
    const model = new RunnerModel(course);

    for (let tick = 0; tick < 80; tick += 1) {
      model.step(0.8);
    }

    expect(model.snapshot().distance).toBeGreaterThan(0);

    model.reset();

    expect(model.snapshot()).toEqual({
      status: 'running',
      distance: 0,
      progress: 0,
      playerNormX: 0.5,
      score: 0,
      pickups: 0,
      hits: 0,
      gatesPassed: 0,
      eventsProcessed: 0,
      lastEventId: null
    });
  });
});
