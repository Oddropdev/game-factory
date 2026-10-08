import { describe, expect, it } from 'vitest';
import {
  MASS_RUNNER_LEVEL_ACCENTS,
  massRunnerLevelAccent
} from '../../src/games/mass-runner/MassRunnerLevelVisuals';
import { MASS_RUNNER_LEVELS } from '../../src/games/mass-runner/MassRunnerLevels';

describe('W8.3 Mass Runner level identity', () => {
  it('assigns exactly one distinct palette to each authored level', () => {
    expect(MASS_RUNNER_LEVEL_ACCENTS).toHaveLength(MASS_RUNNER_LEVELS.length);
    const colors = MASS_RUNNER_LEVELS.map((_, index) =>
      massRunnerLevelAccent(index).join(':')
    );
    expect(new Set(colors).size).toBe(MASS_RUNNER_LEVELS.length);
  });

  it('keeps palette values valid and safely falls back', () => {
    for (const palette of MASS_RUNNER_LEVEL_ACCENTS) {
      expect(palette).toHaveLength(3);
      for (const component of palette) {
        expect(component).toBeGreaterThanOrEqual(0);
        expect(component).toBeLessThanOrEqual(1);
      }
    }
    expect(massRunnerLevelAccent(999)).toEqual(
      massRunnerLevelAccent(0)
    );
  });
});
