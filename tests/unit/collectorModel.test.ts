import { describe, expect, it } from 'vitest';
import {
  COLLECTOR_SEED,
  collectorCourseSignature,
  createCollectorCourse
} from '../../src/games/collector/CollectorCourse';
import { CollectorModel } from '../../src/games/collector/CollectorModel';

function driveUntil(
  model: CollectorModel,
  predicate: () => boolean,
  targetX: number,
  targetY: number
): void {
  let guard = 0;

  while (!predicate() && guard < 1_000) {
    model.step(targetX, targetY);
    guard += 1;
  }

  if (guard >= 1_000) {
    throw new Error('Collector did not reach requested state');
  }
}

describe('CollectorModel', () => {
  it('creates the same resource layout for the same seed', () => {
    const a = createCollectorCourse(COLLECTOR_SEED);
    const b = createCollectorCourse(COLLECTOR_SEED);

    expect(collectorCourseSignature(a)).toBe(collectorCourseSignature(b));
    expect(a.resources).toEqual(b.resources);
  });

  it('collects, deposits and completes a three-stage build in two trips', () => {
    const course = createCollectorCourse(COLLECTOR_SEED);
    const model = new CollectorModel(course);

    for (const resource of course.resources) {
      driveUntil(
        model,
        () => {
          const state = model.snapshot();
          return !state.resources.find(item => item.id === resource.id)?.active;
        },
        resource.x,
        resource.y
      );

      if (model.snapshot().carrying === course.carryCapacity) {
        driveUntil(
          model,
          () => model.snapshot().carrying === 0,
          course.buildZone.x,
          course.buildZone.y
        );
      }
    }

    const state = model.snapshot();

    expect(state.status).toBe('complete');
    expect(state.collected).toBe(6);
    expect(state.deposited).toBe(6);
    expect(state.carrying).toBe(0);
    expect(state.buildStage).toBe(3);
    expect(state.depositTrips).toBe(2);
    expect(state.resourcesRemaining).toBe(0);
  });

  it('enforces carry capacity until resources are deposited', () => {
    const course = createCollectorCourse(COLLECTOR_SEED);
    const model = new CollectorModel(course);

    for (const resource of course.resources.slice(0, 4)) {
      driveUntil(
        model,
        () => {
          const state = model.snapshot();
          const resourceState = state.resources.find(item => item.id === resource.id);
          return !resourceState?.active || state.carrying === course.carryCapacity;
        },
        resource.x,
        resource.y
      );
    }

    const state = model.snapshot();

    expect(state.carrying).toBe(course.carryCapacity);
    expect(state.collected).toBe(course.carryCapacity);
    expect(state.resourcesRemaining).toBe(3);
  });

  it('resets player, resources and build state exactly', () => {
    const course = createCollectorCourse(COLLECTOR_SEED);
    const model = new CollectorModel(course);
    const first = course.resources[0];

    if (!first) {
      throw new Error('Expected at least one collector resource');
    }

    driveUntil(
      model,
      () => model.snapshot().collected > 0,
      first.x,
      first.y
    );

    model.reset();

    const reset = model.snapshot();

    expect(reset.status).toBe('collecting');
    expect(reset.playerNormX).toBe(0.5);
    expect(reset.playerNormY).toBe(0.72);
    expect(reset.targetNormX).toBe(0.5);
    expect(reset.targetNormY).toBe(0.72);
    expect(reset.carrying).toBe(0);
    expect(reset.collected).toBe(0);
    expect(reset.deposited).toBe(0);
    expect(reset.buildStage).toBe(0);
    expect(reset.depositTrips).toBe(0);
    expect(reset.resourcesRemaining).toBe(6);
    expect(reset.resources.every(resource => resource.active)).toBe(true);
  });
});
