import { describe, expect, it } from 'vitest';
import {
  MASS_RUNNER_LEVELS,
  type MassRunnerEvent
} from '../../src/games/mass-runner/MassRunnerLevels';
import { massRunnerHeroTarget } from '../../src/games/mass-runner/MassRunnerFeelRoute';
import { MassRunnerModel } from '../../src/games/mass-runner/MassRunnerModel';

function runHeroLevel(model: MassRunnerModel): void {
  model.startOrAdvance();

  let guard = 0;
  while (model.snapshot().phase === 'running' && guard < 1_000) {
    model.step(
      massRunnerHeroTarget(
        model.snapshot(),
        model.getCurrentLevel()
      )
    );
    guard += 1;
  }

  if (guard >= 1_000) {
    throw new Error('hero route did not finish');
  }
}

describe('MassRunnerFeelRoute', () => {
  it('chooses pickup, avoidance and better-gate targets deterministically', () => {
    const level = MASS_RUNNER_LEVELS[0];
    if (!level) {
      throw new Error('hero level missing');
    }

    const model = new MassRunnerModel([level]);
    model.startOrAdvance();

    const first = level.events[0] as MassRunnerEvent;
    expect(first.kind).toBe('orb');
    expect(
      massRunnerHeroTarget(
        model.snapshot(),
        model.getCurrentLevel()
      )
    ).toBe(0.25);
  });

  it('finishes the hero level with the canonical optimal outcome', () => {
    const level = MASS_RUNNER_LEVELS[0];
    if (!level) {
      throw new Error('hero level missing');
    }

    const model = new MassRunnerModel([level]);

    runHeroLevel(model);

    const state = model.snapshot();

    expect(state.phase).toBe('complete');
    expect(state.mass).toBe(17);
    expect(state.totalScore).toBe(185);
    expect(state.pickups).toBe(3);
    expect(state.hits).toBe(0);
  });
});
