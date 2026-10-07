import { describe, expect, it } from 'vitest';
import {
  MASS_RUNNER_LEVELS,
  type MassRunnerEvent
} from '../../src/games/mass-runner/MassRunnerLevels';
import { MassRunnerModel } from '../../src/games/mass-runner/MassRunnerModel';
import {
  MassRunnerPresentation,
  resolveMassRunnerPresentationMode
} from '../../src/games/mass-runner/MassRunnerPresentation';

function advanceToEvent(
  model: MassRunnerModel,
  presentation: MassRunnerPresentation,
  event: MassRunnerEvent,
  target: number
): void {
  const before = model.snapshot().eventsProcessed;

  let guard = 0;
  while (
    model.snapshot().eventsProcessed === before &&
    guard < 500
  ) {
    model.step(target);
    presentation.update(
      model.snapshot(),
      model.getCurrentLevel(),
      target
    );
    guard += 1;
  }

  if (guard >= 500) {
    throw new Error(`event did not process: ${event.id}`);
  }
}

describe('MassRunnerPresentation', () => {
  it('defaults to polished and preserves a baseline A/B mode', () => {
    expect(
      resolveMassRunnerPresentationMode('')
    ).toBe('polished');
    expect(
      resolveMassRunnerPresentationMode(
        '?presentation=baseline'
      )
    ).toBe('baseline');
  });

  it('turns successful gameplay events into deterministic juice cues', () => {
    const model = new MassRunnerModel();
    const presentation =
      new MassRunnerPresentation('polished');

    presentation.reset(model.snapshot());
    model.startOrAdvance();

    const firstLevel = MASS_RUNNER_LEVELS[0];
    if (!firstLevel) {
      throw new Error('first level missing');
    }

    const orb = firstLevel.events[0];
    if (!orb || orb.kind !== 'orb') {
      throw new Error('first event must be orb');
    }

    advanceToEvent(model, presentation, orb, orb.x);

    const pickup = presentation.snapshot(model.snapshot());

    expect(pickup.lastCue).toBe('pickup');
    expect(pickup.effects.at(-1)?.label).toBe('+2');
    expect(pickup.massPulse).toBeGreaterThan(0);

    const hazard = firstLevel.events[1];
    if (!hazard || hazard.kind !== 'hazard') {
      throw new Error('second event must be hazard');
    }

    advanceToEvent(model, presentation, hazard, hazard.x);

    const hit = presentation.snapshot(model.snapshot());

    expect(hit.lastCue).toBe('hazard');
    expect(hit.negativeFlash).toBeGreaterThan(0);
    expect(
      Math.abs(hit.shakeX) + Math.abs(hit.shakeY)
    ).toBeGreaterThan(0);

    const gate = firstLevel.events[2];
    if (!gate || gate.kind !== 'gate') {
      throw new Error('third event must be gate');
    }

    advanceToEvent(model, presentation, gate, 0.25);

    const positiveGate =
      presentation.snapshot(model.snapshot());

    expect(positiveGate.lastCue).toBe('gate-positive');
    expect(positiveGate.positiveFlash).toBeGreaterThan(0);
  });

  it('keeps baseline mode presentation-neutral', () => {
    const model = new MassRunnerModel();
    const presentation =
      new MassRunnerPresentation('baseline');

    presentation.reset(model.snapshot());
    model.startOrAdvance();

    for (let tick = 0; tick < 40; tick += 1) {
      model.step(0.25);
      presentation.update(
        model.snapshot(),
        model.getCurrentLevel(),
        0.25
      );
    }

    const state = presentation.snapshot(model.snapshot());

    expect(state.mode).toBe('baseline');
    expect(state.effects).toEqual([]);
    expect(state.lastCue).toBeNull();
    expect(state.positiveFlash).toBe(0);
    expect(state.negativeFlash).toBe(0);
  });
});
