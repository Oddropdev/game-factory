import { describe, expect, it } from 'vitest';
import {
  applyMassOperation,
  MASS_RUNNER_LEVELS,
  massRunnerLevelSignature,
  type MassRunnerEvent
} from '../../src/games/mass-runner/MassRunnerLevels';
import { MassRunnerModel } from '../../src/games/mass-runner/MassRunnerModel';

function targetForEvent(
  event: MassRunnerEvent,
  mass: number
): number {
  if (event.kind === 'orb') {
    return event.x;
  }

  if (event.kind === 'hazard') {
    return event.x < 0.5 ? 0.85 : 0.15;
  }

  const left = applyMassOperation(mass, event.left);
  const right = applyMassOperation(mass, event.right);

  return left >= right ? 0.25 : 0.75;
}

function playOptimalCurrentLevel(
  model: MassRunnerModel
): void {
  const level = model.getCurrentLevel();

  for (const event of level.events) {
    const processedBefore = model.snapshot().eventsProcessed;
    const target = targetForEvent(
      event,
      model.snapshot().mass
    );

    let guard = 0;
    while (
      model.snapshot().eventsProcessed === processedBefore &&
      guard < 1_000
    ) {
      model.step(target);
      guard += 1;
    }

    if (guard >= 1_000) {
      throw new Error(`event did not process: ${event.id}`);
    }
  }

  let guard = 0;
  while (
    model.snapshot().phase === 'running' &&
    guard < 1_000
  ) {
    model.step(model.snapshot().playerNormX);
    guard += 1;
  }

  if (guard >= 1_000) {
    throw new Error('level did not finish');
  }
}

describe('MassRunnerModel', () => {
  it('has five deterministic authored levels', () => {
    expect(MASS_RUNNER_LEVELS).toHaveLength(5);
    expect(massRunnerLevelSignature()).toBe(
      massRunnerLevelSignature(MASS_RUNNER_LEVELS)
    );
  });

  it('optimal route clears all five levels and completes the session', () => {
    const model = new MassRunnerModel();

    model.startOrAdvance();

    for (let index = 0; index < MASS_RUNNER_LEVELS.length; index += 1) {
      playOptimalCurrentLevel(model);

      const state = model.snapshot();

      if (index === MASS_RUNNER_LEVELS.length - 1) {
        expect(state.phase).toBe('complete');
      } else {
        expect(state.phase).toBe('level-clear');
        model.startOrAdvance();
        expect(model.snapshot().phase).toBe('running');
      }
    }

    const complete = model.snapshot();

    expect(complete.levelsCleared).toBe(5);
    expect(complete.totalScore).toBeGreaterThan(500);
    expect(complete.mass).toBeGreaterThanOrEqual(
      complete.targetMass
    );
  });

  it('bad choices can fail and retry the same level', () => {
    const model = new MassRunnerModel();

    model.startOrAdvance();

    const level = model.getCurrentLevel();

    for (const event of level.events) {
      const before = model.snapshot().eventsProcessed;
      let target = 0.5;

      if (event.kind === 'gate') {
        const left = applyMassOperation(
          model.snapshot().mass,
          event.left
        );
        const right = applyMassOperation(
          model.snapshot().mass,
          event.right
        );
        target = left <= right ? 0.25 : 0.75;
      } else if (event.kind === 'hazard') {
        target = event.x;
      } else {
        target = event.x < 0.5 ? 0.9 : 0.1;
      }

      while (
        model.snapshot().eventsProcessed === before &&
        model.snapshot().phase === 'running'
      ) {
        model.step(target);
      }
    }

    while (model.snapshot().phase === 'running') {
      model.step(0.5);
    }

    expect(model.snapshot().phase).toBe('level-fail');

    model.startOrAdvance();

    expect(model.snapshot().phase).toBe('running');
    expect(model.snapshot().levelIndex).toBe(0);
    expect(model.snapshot().mass).toBe(level.startMass);
    expect(model.snapshot().eventsProcessed).toBe(0);
  });

  it('mass operations clamp to the playable range', () => {
    expect(
      applyMassOperation(8, { op: 'multiply', value: 2 })
    ).toBe(16);
    expect(
      applyMassOperation(2, { op: 'add', value: -10 })
    ).toBe(1);
    expect(
      applyMassOperation(80, { op: 'multiply', value: 2 })
    ).toBe(99);
  });

  it('session reset restores the exact opening state', () => {
    const model = new MassRunnerModel();

    model.startOrAdvance();
    model.step(0.25);
    model.step(0.25);
    model.resetSession();

    const state = model.snapshot();

    expect(state.phase).toBe('ready');
    expect(state.levelIndex).toBe(0);
    expect(state.levelId).toBe(MASS_RUNNER_LEVELS[0]?.id);
    expect(state.distance).toBe(0);
    expect(state.playerNormX).toBe(0.5);
    expect(state.mass).toBe(
      MASS_RUNNER_LEVELS[0]?.startMass
    );
    expect(state.totalScore).toBe(0);
    expect(state.levelsCleared).toBe(0);
  });
});
