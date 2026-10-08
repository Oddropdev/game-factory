import { describe, expect, it } from 'vitest';
import {
  fluidSteeringStep,
  resolveMassRunnerExperiment
} from '../../src/games/mass-runner/MassRunnerExperiment';
import { MassRunnerModel } from '../../src/games/mass-runner/MassRunnerModel';

describe('W9.2B isolated feel variants', () => {
  it('defaults unknown or absent variants to the frozen A baseline', () => {
    for (const search of ['', '?variant=a', '?variant=z', '?variant=3d']) {
      expect(resolveMassRunnerExperiment(search)).toBe('a');
    }
    expect(resolveMassRunnerExperiment('?variant=b')).toBe('b');
    expect(resolveMassRunnerExperiment('?variant=c')).toBe('c');
  });

  it('original game model trajectory remains identical in implicit and explicit A', () => {
    const left = new MassRunnerModel();
    const right = new MassRunnerModel();
    left.startOrAdvance();
    right.startOrAdvance();
    for (let i = 0; i < 45; i += 1) {
      const target = i < 10 ? 0.95 : i < 25 ? 0.05 : 0.48;
      left.step(target);
      right.step(target, 'original');
      expect(right.snapshot()).toEqual(left.snapshot());
    }
  });

  it('fluid steering ramps without teleporting or leaving the track', () => {
    const a = fluidSteeringStep(0.5, 0, 1);
    expect(a.position).toBeGreaterThan(0.5);
    expect(a.position).toBeLessThan(0.58);
    let p = a.position, v = a.velocity;
    for (let i = 0; i < 70; i += 1) {
      const next = fluidSteeringStep(p, v, 1);
      p = next.position; v = next.velocity;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
    expect(p).toBeGreaterThan(0.97);
    const reversed = fluidSteeringStep(p, v, 0);
    expect(reversed.position).toBeLessThanOrEqual(1);
  });

  it('fluid model retains canonical level progression and restart', () => {
    const model = new MassRunnerModel();
    model.startOrAdvance();
    for (let i = 0; i < 30; i += 1) model.step(0.9, 'fluid');
    expect(model.snapshot().playerNormX).toBeGreaterThan(0.65);
    model.resetSession();
    expect(model.snapshot().playerNormX).toBe(0.5);
    model.startOrAdvance();
    model.step(0.1, 'fluid');
    expect(model.snapshot().playerNormX).toBeLessThan(0.5);
  });
});
